import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requirePlace, requireRecord } from "@/lib/validation";
import { createCall } from "@/services/server/calls";

/** 호출 생성 — OWNER/MEMBER. 기사는 호출할 수 없다. */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "call_create", 6, 60);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  const { member } = await requireMember(groupId, user.uid, ["OWNER", "MEMBER"]);
  return createCall(groupId, member, {
    driverId: requireId(body.driverId, "field.driver"),
    pickup: requirePlace(body.pickup, "field.pickup"),
    destination: requirePlace(body.destination, "field.destination"),
  });
});
