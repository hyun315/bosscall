import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { buildTripStat, classifyTrip, CONSENT_VERSION } from "@/lib/tripData";
import type { CallDoc, GroupDoc, PoiDoc, UserDoc } from "@/types/domain";

/** 자체 장소 목록 — 수백 건 규모라 함수 인스턴스 메모리에 10분 보관 */
let poiCache: { at: number; pois: PoiDoc[] } | null = null;
const POI_CACHE_MS = 10 * 60 * 1000;

export async function loadPois(force = false): Promise<PoiDoc[]> {
  if (!force && poiCache && Date.now() - poiCache.at < POI_CACHE_MS) return poiCache.pois;
  const snap = await adminDb().collection("pois").get();
  const pois = snap.docs.map((d) => d.data() as PoiDoc);
  poiCache = { at: Date.now(), pois };
  return pois;
}

export function clearPoiCache(): void {
  poiCache = null;
}

/** 현재 버전 문구에 동의했는지 */
export function hasConsent(user: UserDoc | undefined, kind: "analytics" | "marketing"): boolean {
  const c = user?.consents?.[kind];
  return c?.granted === true && c.version === CONSENT_VERSION;
}

/**
 * 운행 완료 후 — 호출자의 선택 동의에 따라
 *  · 익명 통계(tripStats) 1건 추가
 *  · 맞춤 혜택용 목적지 분류 횟수(adProfiles) 증가
 */
export async function recordCompletedTrip(call: CallDoc): Promise<void> {
  const db = adminDb();
  const [uSnap, gSnap] = await Promise.all([db.doc(`users/${call.callerId}`).get(), db.doc(`groups/${call.groupId}`).get()]);
  const user = uSnap.data() as UserDoc | undefined;
  const analytics = hasConsent(user, "analytics");
  const marketing = hasConsent(user, "marketing");
  if (!analytics && !marketing) return;

  const pois = await loadPois();
  const cls = classifyTrip(call, pois);
  const now = Date.now();
  const writes: Promise<unknown>[] = [];

  if (analytics) {
    const timezone = (gSnap.data() as GroupDoc | undefined)?.timezone ?? "Asia/Jakarta";
    writes.push(db.collection("tripStats").add(buildTripStat(call, cls, timezone, now)));
  }
  // 집·회사는 광고 관심사가 아니므로 세지 않는다
  if (marketing && cls.dropoffCategory && cls.dropoffCategory !== "HOME" && cls.dropoffCategory !== "OFFICE") {
    writes.push(
      db.doc(`adProfiles/${call.callerId}`).set(
        {
          uid: call.callerId,
          categoryCounts: { [cls.dropoffCategory]: FieldValue.increment(1) },
          updatedAt: now,
        },
        { merge: true },
      ),
    );
  }
  await Promise.all(writes);
}

/** 맞춤 혜택 동의 철회 → 관심 분류 즉시 삭제 */
export async function deleteAdProfile(uid: string): Promise<void> {
  await adminDb().doc(`adProfiles/${uid}`).delete();
}
