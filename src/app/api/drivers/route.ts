import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { optionalPhone, requireId, requireRecord, requireString } from "@/lib/validation";
import { addDriver } from "@/services/server/groups";

/** 기사 추가 — Owner 전용, 요금제 한도 적용 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  await requireMember(groupId, user.uid, ["OWNER"]);
  const driverId = await addDriver(groupId, user.uid, {
    displayName: requireString(body.displayName, "field.driverName", { max: 40 }),
    phone: optionalPhone(body.phone),
  });
  return { driverId };
});
