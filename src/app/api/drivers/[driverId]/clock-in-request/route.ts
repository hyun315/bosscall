import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, routeWithParams } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requireRecord } from "@/lib/validation";
import { requestClockIn } from "@/services/server/driverNudges";

/** 출근 요청 — 사장님·가족이 기사에게 "출근을 눌러 주세요" 알림 */
export const POST = routeWithParams<{ driverId: string }>(async (req, params) => {
  const [user, raw] = await Promise.all([requireUser(req), readJson(req)]);
  const groupId = requireId(requireRecord(raw).groupId, "field.group");
  const driverId = requireId(params.driverId, "field.driver");
  const [, { member }] = await Promise.all([
    rateLimit(user.uid, "clock_in_request", 3, 600),
    requireMember(groupId, user.uid, ["OWNER", "MEMBER"]),
  ]);
  await requestClockIn(groupId, driverId, member);
  return { ok: true };
});
