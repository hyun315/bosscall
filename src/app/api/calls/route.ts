import { after } from "next/server";
import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requirePlace, requireRecord } from "@/lib/validation";
import { createCall } from "@/services/server/calls";
import { startDriverAlerts } from "@/services/server/driverAlerts";

/** 응답 후에도 기사에게 알림을 계속 다시 보내야 하므로 함수 실행 시간을 늘린다 (48초씩 이어 달리기) */
export const maxDuration = 60;

/** 호출 생성 — OWNER/MEMBER. 기사는 호출할 수 없다. */
export const POST = route(async (req) => {
  const [user, raw] = await Promise.all([requireUser(req), readJson(req)]);
  const body = requireRecord(raw);
  const groupId = requireId(body.groupId, "field.group");
  // 사용량 제한·권한 확인을 동시에 (데이터베이스 왕복을 줄인다)
  const [, { member }] = await Promise.all([
    rateLimit(user.uid, "call_create", 6, 60),
    requireMember(groupId, user.uid, ["OWNER", "MEMBER"]),
  ]);
  const result = await createCall(groupId, member, {
    driverId: requireId(body.driverId, "field.driver"),
    pickup: requirePlace(body.pickup, "field.pickup"),
    destination: requirePlace(body.destination, "field.destination"),
  });
  // 응답은 바로 돌려주고, 기사가 수락·거절할 때까지 5초마다 알림을 다시 보낸다
  after(() => startDriverAlerts(groupId, result.callId));
  return result;
});
