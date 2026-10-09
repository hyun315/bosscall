import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, routeWithParams } from "@/lib/server/http";
import { requireId, requireRecord, requireTimestamp } from "@/lib/validation";
import { editWorkSession } from "@/services/server/work";

/** 근무기록 수정 — Owner 전용 (감사 로그 기록) */
export const PATCH = routeWithParams<{ sessionId: string }>(async (req, params) => {
  const user = await requireUser(req);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  await requireMember(groupId, user.uid, ["OWNER"]);
  const now = Date.now();
  await editWorkSession(groupId, requireId(params.sessionId, "field.workSession"), user.uid, {
    clockInAt: requireTimestamp(body.clockInAt, "field.clockIn", now),
    clockOutAt: body.clockOutAt === null ? null : requireTimestamp(body.clockOutAt, "field.clockOut", now),
  });
  return { ok: true };
});
