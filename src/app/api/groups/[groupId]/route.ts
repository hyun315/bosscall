import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, routeWithParams } from "@/lib/server/http";
import { SUPPORTED_TIMEZONES, requireId, requireOneOf, requireRecord, requireString } from "@/lib/validation";
import { updateGroup } from "@/services/server/groups";

/** 그룹 설정 변경 — Owner 전용 */
export const PATCH = routeWithParams<{ groupId: string }>(async (req, params) => {
  const user = await requireUser(req);
  const groupId = requireId(params.groupId, "field.group");
  await requireMember(groupId, user.uid, ["OWNER"]);
  const body = requireRecord(await readJson(req));
  const patch: { name?: string; timezone?: string } = {};
  if (body.name !== undefined) patch.name = requireString(body.name, "field.groupName", { max: 40 });
  if (body.timezone !== undefined) patch.timezone = requireOneOf(body.timezone, SUPPORTED_TIMEZONES, "field.timezone");
  await updateGroup(groupId, user.uid, patch);
  return { ok: true };
});
