import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, routeWithParams } from "@/lib/server/http";
import { requireId, requireRecord } from "@/lib/validation";
import { ackCancelAlert } from "@/services/server/calls";

/** 기사가 "호출이 취소되었습니다" 알림을 확인 — 알람 멈춤 */
export const POST = routeWithParams<{ callId: string }>(async (req, params) => {
  const [user, raw] = await Promise.all([requireUser(req), readJson(req)]);
  const groupId = requireId(requireRecord(raw).groupId, "field.group");
  const { member } = await requireMember(groupId, user.uid, ["DRIVER"]);
  await ackCancelAlert(groupId, requireId(params.callId, "field.call"), member.driverId);
  return { ok: true };
});
