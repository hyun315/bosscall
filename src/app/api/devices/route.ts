import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { tokenDocId } from "@/lib/server/push";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireRecord, requireString } from "@/lib/validation";

/** FCM 토큰 등록 (device_tokens) */
export const POST = route(async (req) => {
  const [user, raw] = await Promise.all([requireUser(req), readJson(req)]);
  const body = requireRecord(raw);
  const token = requireString(body.token, "field.token", { max: 4096 });
  const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 300);
  const now = Date.now();
  const ref = adminDb().doc(`users/${user.uid}/deviceTokens/${tokenDocId(token)}`);
  // 읽고 쓰기 대신 바로 덮어쓰기 (lastSeenAt 갱신)
  await Promise.all([
    rateLimit(user.uid, "device_register", 20, 3600),
    ref.set({ token, userAgent, lastSeenAt: now }, { merge: true }),
  ]);
  return { ok: true };
});

/** 로그아웃 시 이 기기 토큰 삭제 */
export const DELETE = route(async (req) => {
  const user = await requireUser(req);
  const body = requireRecord(await readJson(req));
  const token = requireString(body.token, "field.token", { max: 4096 });
  await adminDb().doc(`users/${user.uid}/deviceTokens/${tokenDocId(token)}`).delete();
  return { ok: true };
});
