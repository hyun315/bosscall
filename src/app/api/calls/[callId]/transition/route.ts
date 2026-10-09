import { CALL_ACTIONS } from "@/lib/callStateMachine";
import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, routeWithParams } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { optionalFix, requireId, requireOneOf, requireRecord } from "@/lib/validation";
import { transitionCall } from "@/services/server/calls";

/** 호출 상태 전이 — 허용 여부는 서버의 상태머신이 판단한다 */
export const POST = routeWithParams<{ callId: string }>(async (req, params) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "call_transition", 30, 60);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  const { member } = await requireMember(groupId, user.uid);
  const action = requireOneOf(body.action, CALL_ACTIONS, "field.action");
  return transitionCall(groupId, requireId(params.callId, "field.call"), action, {
    userId: member.userId,
    role: member.role,
    driverId: member.driverId,
  }, optionalFix(body.fix));
});
