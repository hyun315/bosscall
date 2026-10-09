import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { sourceOf } from "@/lib/tripData";
import type { CallDoc, FavoriteLocationDoc } from "@/types/domain";

const BATCH = 300;

/**
 * 구글 좌표 보관 기한(30일) 정리 — 매일 1회 (vercel.json cron).
 * 구글에서 받은 좌표만 0으로 지우고 coordsCleared=true 로 표시한다.
 * Place ID 는 계속 보관할 수 있으므로 남겨 두고, 다시 쓸 때 Place ID 로 좌표를 새로 받는다.
 * 기기 GPS·지도 핀·기사 GPS 좌표(자체 데이터)는 건드리지 않는다.
 */
export async function clearExpiredGoogleCoords(now = Date.now()): Promise<{ calls: number; favorites: number }> {
  const db = adminDb();
  const calls = await sweep("calls", now, (snap) => {
    const c = snap.data() as CallDoc;
    const patch: Record<string, unknown> = { geoExpiresAt: null, coordsCleared: true };
    if (sourceOf(c.pickupSource) === "google") Object.assign(patch, { pickupLat: 0, pickupLng: 0 });
    if (sourceOf(c.destinationSource) === "google") Object.assign(patch, { destinationLat: 0, destinationLng: 0 });
    return patch;
  });
  const favorites = await sweep("favorites", now, (snap) => {
    const f = snap.data() as FavoriteLocationDoc;
    const patch: Record<string, unknown> = { geoExpiresAt: null };
    if (sourceOf(f.source) === "google") Object.assign(patch, { latitude: 0, longitude: 0, coordsCleared: true });
    return patch;
  });
  return { calls, favorites };

  async function sweep(
    group: "calls" | "favorites",
    at: number,
    patchFor: (s: DocumentSnapshot) => Record<string, unknown>,
  ): Promise<number> {
    let total = 0;
    // 한 번에 최대 10묶음 (함수 실행 시간 제한 대비) — 남은 건 다음 날 처리
    for (let i = 0; i < 10; i++) {
      const snap = await db.collectionGroup(group).where("geoExpiresAt", "<=", at).limit(BATCH).get();
      if (snap.empty) break;
      const batch = db.batch();
      for (const d of snap.docs) batch.update(d.ref, patchFor(d));
      await batch.commit();
      total += snap.size;
      if (snap.size < BATCH) break;
    }
    return total;
  }
}
