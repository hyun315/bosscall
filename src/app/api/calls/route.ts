import { after } from "next/server";
import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requirePlace, requireRecord } from "@/lib/validation";
import { createCall, repeatNudges } from "@/services/server/calls";

/** 응답 후에도 45초 동안 기사에게 알림을 다시 보내야 하므로 함수 실행 시간을 늘린다 */
export const maxDuration = 60;

/** 호출 생성 — OWNER/MEMBER. 기사는 호출할 수 없다. */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "call_create", 6, 60);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  const { member } = await requireMember(groupId, user.uid, ["OWNER", "MEMBER"]);
  const result = await createCall(groupId, member, {
    driverId: requireId(body.driverId, "field.driver"),
    pickup: requirePlace(body.pickup, "field.pickup"),
    destination: requirePlace(body.destination, "field.destination"),
  });
  // 응답은 바로 돌려주고, 기사 응답이 없으면 15·30·45초에 알림을 다시 보낸다
  after(() => repeatNudges(groupId, result.callId));
  return result;
});
