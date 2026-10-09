import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requireRecord, requireTimestamp } from "@/lib/validation";
import { addManualWorkSession } from "@/services/server/payroll";

/** 근무기록 수동 추가 — Owner 전용 (감사 로그) */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "work_manual", 30, 60);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  const { group } = await requireMember(groupId, user.uid, ["OWNER"]);
  const now = Date.now();
  const id = await addManualWorkSession(
    group,
    requireId(body.driverId, "field.driver"),
    user.uid,
    requireTimestamp(body.clockInAt, "field.clockIn", now),
    requireTimestamp(body.clockOutAt, "field.clockOut", now),
  );
  return { id };
});
