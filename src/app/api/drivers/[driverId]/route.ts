import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, routeWithParams } from "@/lib/server/http";
import { optionalPhone, requireId, requireRecord, requireString } from "@/lib/validation";
import { updateDriver } from "@/services/server/groups";

/** 기사 기본정보 수정 — Owner 전용 */
export const PATCH = routeWithParams<{ driverId: string }>(async (req, params) => {
  const user = await requireUser(req);
  const driverId = requireId(params.driverId, "field.driver");
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  await requireMember(groupId, user.uid, ["OWNER"]);
  const patch: { displayName?: string; phone?: string | null } = {};
  if (body.displayName !== undefined) patch.displayName = requireString(body.displayName, "field.driverName", { max: 40 });
  if (body.phone !== undefined) patch.phone = optionalPhone(body.phone);
  await updateDriver(groupId, driverId, user.uid, patch);
  return { ok: true };
});
