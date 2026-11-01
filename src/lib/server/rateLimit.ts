import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { tooMany } from "@/lib/server/http";

/**
 * 고정 윈도 레이트 리밋 (명세 §24). 서버리스 인스턴스 간 공유를 위해 Firestore에 카운터를 둔다.
 * rateLimits/{uid}_{key}_{window} — TTL 정책(expireAt)으로 자동 삭제되도록 README에 안내.
 */
export async function rateLimit(uid: string, key: string, limit: number, windowSec: number): Promise<void> {
  const now = Date.now();
  const windowId = Math.floor(now / (windowSec * 1000));
  const ref = adminDb().doc(`rateLimits/${uid}_${key}_${windowId}`);
  // 트랜잭션(왕복 3번) 대신 읽기·증가를 동시에 1번 왕복으로. 동시 요청 몇 건의 오차는 남용 방지에 문제없다.
  const [snap] = await Promise.all([
    ref.get(),
    ref.set({ count: FieldValue.increment(1), expireAt: new Date((windowId + 2) * windowSec * 1000) }, { merge: true }),
  ]);
  const count = (snap.exists ? Number(snap.data()?.count ?? 0) : 0) + 1;
  if (count > limit) throw tooMany();
}

/** 일별 API 사용량 카운터 (명세 §34.5 비용·사용량 모니터링) */
export async function incrementUsage(metric: string, by = 1): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  await adminDb()
    .doc(`usageDaily/${day}`)
    .set({ [metric]: FieldValue.increment(by), day }, { merge: true });
}
