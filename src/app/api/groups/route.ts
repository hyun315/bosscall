import { requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import {
  SUPPORTED_TIMEZONES,
  optionalPhone,
  requireOneOf,
  requireRecord,
  requireString,
} from "@/lib/validation";
import { createGroup } from "@/services/server/groups";

/** S03 Create Group */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "group_create", 5, 3600);
  const body = requireRecord(await readJson(req));
  const result = await createGroup(user.uid, {
    name: requireString(body.name, "field.groupName", { max: 40 }),
    driverName: requireString(body.driverName, "field.driverName", { max: 40 }),
    driverPhone: optionalPhone(body.driverPhone),
    timezone: body.timezone === undefined ? "Asia/Jakarta" : requireOneOf(body.timezone, SUPPORTED_TIMEZONES, "field.timezone"),
  });
  return result;
});
