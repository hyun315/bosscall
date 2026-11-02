import { after } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/server/auth";
import { route } from "@/lib/server/http";
import { notifyUsers } from "@/lib/server/push";
import { rateLimit } from "@/lib/server/rateLimit";
import type { UserDoc } from "@/types/domain";

export const maxDuration = 20;

/**
 * 알림 테스트 — 5초 뒤 이 계정의 모든 기기로 호출과 같은 방식(긴급·소리)의 알림을 보낸다.
 * 버튼을 누르고 화면을 끈 뒤 소리가 나는지 확인하는 용도.
 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "test_push", 20, 600); // 설정을 바꿔 가며 여러 번 시험해 보는 경우가 많다
  const db = adminDb();
  const [uSnap, tokens] = await Promise.all([
    db.doc(`users/${user.uid}`).get(),
    db.collection(`users/${user.uid}/deviceTokens`).get(),
  ]);
  const groupId = (uSnap.data() as UserDoc | undefined)?.activeGroupId ?? "none";
  after(async () => {
    await new Promise((r) => setTimeout(r, 5000));
    const r = await notifyUsers([user.uid], {
      type: "CALL_CREATED",
      groupId,
      callId: null,
      titleKey: "push.test.title",
      bodyKey: "push.test.body",
      path: "/settings/notifications",
      urgent: true,
      inbox: false,
    });
    // 결과를 남겨 테스트 화면이 바로 보여준다 (보냈는지 / 애플·구글이 거절했는지 / 무음 설정인지)
    await db.doc(`users/${user.uid}`).set({ lastTestPush: { at: Date.now(), ...r, errors: r.errors.slice(0, 3) } }, { merge: true });
  });
  return { ok: true, devices: tokens.size };
});
