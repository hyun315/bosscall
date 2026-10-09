import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requireOneOf, requireRecord } from "@/lib/validation";
import { clock } from "@/services/server/work";

/** 출근/퇴근 — 연결된 기사 본인만 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "clock", 10, 60);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  const { group, member } = await requireMember(groupId, user.uid, ["DRIVER"]);
  const action = requireOneOf(body.action, ["CLOCK_IN", "CLOCK_OUT"] as const, "field.action");
  return clock(group, member, action, body.shareLocation === true);
});
