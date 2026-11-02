import { createHash } from "node:crypto";
import { ApiError, readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { isRecord } from "@/lib/validation";
import { AD_INDUSTRIES, AD_MONTHS, AD_PRODUCTS, type AdMonths } from "@/lib/ads";
import { createAdRequest } from "@/services/server/ads";

/**
 * 광고 신청 (로그인 없음 — 광고주가 링크로 들어와 작성).
 * 남용 방지: IP별 시간당 5건, 전체 하루 200건, 숨은 입력칸(website) 채우면 버림.
 */
const req400 = (field: string) => new ApiError(400, "BAD_REQUEST", "val.required", { field });
const fmt400 = (field: string) => new ApiError(400, "BAD_REQUEST", "val.format", { field });

function text(v: unknown, field: string, max: number, required = true): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) {
    if (required) throw req400(field);
    return null;
  }
  if (s.length > max) throw new ApiError(400, "BAD_REQUEST", "val.tooLong", { field, max });
  return s;
}

export const POST = route(async (req) => {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown";
  const ipKey = `ip_${createHash("sha256").update(ip).digest("hex").slice(0, 24)}`;
  const raw = await readJson(req);
  await Promise.all([rateLimit(ipKey, "ad_request", 5, 3600), rateLimit("global", "ad_request", 200, 86400)]);
  if (!isRecord(raw)) throw fmt400("요청");
  if (typeof raw.website === "string" && raw.website) return { ok: true, id: null }; // 자동 입력 프로그램

  const email = text(raw.email, "이메일", 120)!;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fmt400("이메일");
  const whatsapp = text(raw.whatsapp, "왓츠앱 번호", 30, false);
  if (whatsapp && !/^\+?[0-9 -]{7,20}$/.test(whatsapp)) throw fmt400("왓츠앱 번호");
  const kakaoId = text(raw.kakaoId, "카카오톡 ID", 40, false);
  if (!whatsapp && !kakaoId) throw req400("왓츠앱 번호 또는 카카오톡 ID");
  const linkUrl = text(raw.linkUrl, "연결 링크", 500, false);
  if (linkUrl && !/^https:\/\/[^\s]+$/.test(linkUrl)) throw fmt400("연결 링크 (https:// 로 시작)");

  const industry = AD_INDUSTRIES.find((x) => x === raw.industry);
  if (!industry) throw req400("업종");
  const product = AD_PRODUCTS.find((x) => x === raw.product);
  if (!product) throw req400("광고 상품");
  const months = AD_MONTHS.find((x) => x === raw.months) as AdMonths | undefined;
  if (!months) throw req400("기간");
  const startDate = text(raw.startDate, "시작일", 10)!;
  const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || startDate < today) throw fmt400("시작일");
  if (typeof raw.bannerImage !== "string" || !raw.bannerImage) throw req400("배너 이미지");
  if (typeof raw.detailImage !== "string" || !raw.detailImage) throw req400("상세 이미지");

  return createAdRequest({
    company: text(raw.company, "업체명", 60)!,
    contactName: text(raw.contactName, "담당자", 40)!,
    whatsapp,
    kakaoId,
    email,
    industry,
    linkUrl,
    product,
    startDate,
    months,
    bannerDataUrl: raw.bannerImage,
    detailDataUrl: raw.detailImage,
  });
});

export const maxDuration = 30;
