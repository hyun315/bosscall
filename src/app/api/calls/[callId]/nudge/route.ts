import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, routeWithParams } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requireRecord } from "@/lib/validation";
import { nudgeDriver } from "@/services/server/calls";

/** 응답 대기 중인 호출 — 기사에게 알림 다시 보내기 (간격·횟수는 서버가 제한) */
export const POST = routeWithParams<{ callId: string }>(async (req, params) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "call_nudge", 12, 60);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  const { member } = await requireMember(groupId, user.uid, ["OWNER", "MEMBER"]);
  return nudgeDriver(groupId, requireId(params.callId, "field.call"), member);
});
