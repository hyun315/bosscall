import "server-only";
import { randomBytes } from "node:crypto";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { ApiError, conflict, notFound } from "@/lib/server/http";
import { jpegSize } from "@/lib/jpeg";
import {
  BANNER_SPEC,
  DETAIL_SPEC,
  PRODUCT_INFO,
  campaignWindow,
  fullSlots,
  type AdCampaignDoc,
  type AdIndustry,
  type AdMonths,
  type AdProduct,
  type AdRequestDoc,
  type AdSlotId,
} from "@/lib/ads";

/**
 * 광고 신청 → 운영자 검토 → 승인 시 게재.
 *  - adRequests/{id}  신청서 (서버 전용)
 *  - adImages/{id}    이미지 바이트 (Firestore 문서 1개 = 이미지 1장, 1MB 미만). 승인되면 public=true
 *  - adCampaigns/{id} 승인된 광고 — 앱이 읽어 광고 자리에 보여준다
 * Firebase Storage(유료 요금제 필요) 없이 동작하도록 이미지를 Firestore에 둔다.
 */

const MAX_IMAGE_BYTES = 700_000;

export interface AdRequestInput {
  company: string;
  contactName: string;
  whatsapp: string | null;
  kakaoId: string | null;
  email: string;
  industry: AdIndustry;
  linkUrl: string | null;
  product: AdProduct;
  startDate: string;
  months: AdMonths;
  bannerDataUrl: string;
  detailDataUrl: string;
}

const bad = (message: string) => new ApiError(400, "BAD_REQUEST", "val.format", { field: message });

function decodeImage(dataUrl: string, spec: { w: number; h: number; label: string }): Buffer {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m?.[1]) throw bad(spec.label);
  const buf = Buffer.from(m[1], "base64");
  if (buf.length > MAX_IMAGE_BYTES) throw bad(`${spec.label} (용량)`);
  const size = jpegSize(buf);
  // 규격 크기로 자른 이미지만 받는다 — 앱에서 광고가 들쑥날쑥하지 않게
  if (!size || size.w !== spec.w || size.h !== spec.h) throw bad(`${spec.label} (${spec.w}×${spec.h})`);
  return buf;
}

export async function createAdRequest(input: AdRequestInput): Promise<{ id: string }> {
  if (!campaignWindow(input.startDate, input.months)) throw bad("시작일");
  const banner = decodeImage(input.bannerDataUrl, BANNER_SPEC);
  const detail = decodeImage(input.detailDataUrl, DETAIL_SPEC);

  const db = adminDb();
  const reqRef = db.collection("adRequests").doc();
  const bannerRef = db.collection("adImages").doc(randomBytes(12).toString("hex"));
  const detailRef = db.collection("adImages").doc(randomBytes(12).toString("hex"));
  const now = Date.now();
  const doc: AdRequestDoc = {
    id: reqRef.id,
    status: "PENDING",
    company: input.company,
    contactName: input.contactName,
    whatsapp: input.whatsapp,
    kakaoId: input.kakaoId,
    email: input.email,
    industry: input.industry,
    linkUrl: input.linkUrl,
    product: input.product,
    startDate: input.startDate,
    months: input.months,
    bannerImageId: bannerRef.id,
    detailImageId: detailRef.id,
    createdAt: now,
    reviewedAt: null,
    reviewedBy: null,
    rejectReason: null,
    campaignId: null,
  };
  const batch = db.batch();
  batch.create(bannerRef, { requestId: reqRef.id, kind: "banner", contentType: "image/jpeg", data: banner, public: false, createdAt: now });
  batch.create(detailRef, { requestId: reqRef.id, kind: "detail", contentType: "image/jpeg", data: detail, public: false, createdAt: now });
  batch.create(reqRef, doc);
  await batch.commit();
  return { id: reqRef.id };
}

/** 앱에서 쓰는 공개 이미지 (승인된 것만) */
export async function readPublicImage(id: string): Promise<{ data: Buffer; contentType: string } | null> {
  const snap = await adminDb().doc(`adImages/${id}`).get();
  const d = snap.data() as { data?: Buffer; contentType?: string; public?: boolean } | undefined;
  if (!d?.public || !d.data) return null;
  return { data: Buffer.from(d.data), contentType: d.contentType ?? "image/jpeg" };
}

/* ───────── 운영자 ───────── */

export async function listAdRequests(): Promise<{ requests: AdRequestDoc[]; campaigns: AdCampaignDoc[] }> {
  const db = adminDb();
  const [reqs, camps] = await Promise.all([
    db.collection("adRequests").orderBy("createdAt", "desc").limit(100).get(),
    db.collection("adCampaigns").where("endAt", ">", Date.now() - 90 * 86400_000).get(),
  ]);
  return {
    requests: reqs.docs.map((d) => d.data() as AdRequestDoc),
    campaigns: camps.docs.map((d) => d.data() as AdCampaignDoc).sort((a, b) => a.startAt - b.startAt),
  };
}

/** 검토 화면용 — 이미지를 data URL 로 함께 */
export async function getAdRequestWithImages(id: string): Promise<{ request: AdRequestDoc; banner: string | null; detail: string | null }> {
  const db = adminDb();
  const snap = await db.doc(`adRequests/${id}`).get();
  if (!snap.exists) throw notFound();
  const request = snap.data() as AdRequestDoc;
  const [b, d] = await Promise.all([
    db.doc(`adImages/${request.bannerImageId}`).get(),
    db.doc(`adImages/${request.detailImageId}`).get(),
  ]);
  const toUrl = (s: DocumentSnapshot) => {
    const data = s.data()?.data as Buffer | undefined;
    return data ? `data:image/jpeg;base64,${Buffer.from(data).toString("base64")}` : null;
  };
  return { request, banner: toUrl(b), detail: toUrl(d) };
}

export type ApproveResult = { ok: true; campaignId: string } | { ok: false; fullSlots: AdSlotId[] };

export async function approveAdRequest(
  id: string,
  reviewer: string,
  override: { startDate?: string; months?: number },
): Promise<ApproveResult> {
  const db = adminDb();
  const reqRef = db.doc(`adRequests/${id}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(reqRef);
    if (!snap.exists) throw notFound();
    const r = snap.data() as AdRequestDoc;
    if (r.status !== "PENDING") throw conflict("val.invalid", "NOT_PENDING", { field: "상태" });
    const startDate = override.startDate ?? r.startDate;
    const months = override.months ?? r.months;
    const win = campaignWindow(startDate, months);
    if (!win) throw bad("시작일");
    const slots = [...PRODUCT_INFO[r.product].slots];

    const existing = await tx.get(db.collection("adCampaigns").where("endAt", ">", win.startAt));
    const full = fullSlots(existing.docs.map((d) => d.data() as AdCampaignDoc), slots, win.startAt, win.endAt);
    if (full.length > 0) return { ok: false, fullSlots: full };

    const campRef = db.collection("adCampaigns").doc();
    const now = Date.now();
    const campaign: AdCampaignDoc = {
      id: campRef.id,
      requestId: r.id,
      company: r.company,
      slots,
      startAt: win.startAt,
      endAt: win.endAt,
      bannerUrl: `/api/ad-image/${r.bannerImageId}`,
      detailUrl: `/api/ad-image/${r.detailImageId}`,
      linkUrl: r.linkUrl,
      createdAt: now,
    };
    tx.create(campRef, campaign);
    tx.update(db.doc(`adImages/${r.bannerImageId}`), { public: true });
    tx.update(db.doc(`adImages/${r.detailImageId}`), { public: true });
    tx.update(reqRef, {
      status: "APPROVED",
      startDate,
      months,
      reviewedAt: now,
      reviewedBy: reviewer,
      campaignId: campRef.id,
    });
    return { ok: true, campaignId: campRef.id };
  });
}

export async function rejectAdRequest(id: string, reviewer: string, reason: string): Promise<void> {
  const db = adminDb();
  const reqRef = db.doc(`adRequests/${id}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(reqRef);
    if (!snap.exists) throw notFound();
    const r = snap.data() as AdRequestDoc;
    if (r.status !== "PENDING") throw conflict("val.invalid", "NOT_PENDING", { field: "상태" });
    tx.update(reqRef, { status: "REJECTED", rejectReason: reason, reviewedAt: Date.now(), reviewedBy: reviewer });
    // 반려된 신청의 이미지는 보관하지 않는다
    tx.delete(db.doc(`adImages/${r.bannerImageId}`));
    tx.delete(db.doc(`adImages/${r.detailImageId}`));
  });
}

/** 게재 중인 광고를 지금 내린다 */
export async function endCampaign(campaignId: string): Promise<void> {
  const ref = adminDb().doc(`adCampaigns/${campaignId}`);
  const snap = await ref.get();
  if (!snap.exists) throw notFound();
  await ref.update({ endAt: Math.min((snap.data() as AdCampaignDoc).endAt, Date.now()) });
}
