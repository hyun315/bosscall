import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requireOneOf, requireRecord } from "@/lib/validation";
import { clock } from "@/services/server/work";

/** 출근/퇴근 — 기사 본인, 또는 관리자(OWNER)가 기사 대신 (body.driverId) */
export const POST = route(async (req) => {
  const [user, raw] = await Promise.all([requireUser(req), readJson(req)]);
  const body = requireRecord(raw);
  const groupId = requireId(body.groupId, "field.group");
  const [, { group, member }] = await Promise.all([
    rateLimit(user.uid, "clock", 10, 60),
    requireMember(groupId, user.uid, ["DRIVER", "OWNER"]),
  ]);
  const action = requireOneOf(body.action, ["CLOCK_IN", "CLOCK_OUT"] as const, "field.action");
  const driverId = member.role === "OWNER" ? requireId(body.driverId, "field.driver") : undefined;
  return clock(group, member, action, body.shareLocation === true, driverId);
});

export const maxDuration = 30;
