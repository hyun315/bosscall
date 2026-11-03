import { parseHM } from "@/lib/clockInReminder";
import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, routeWithParams } from "@/lib/server/http";
import { ValidationError, requireId, requireRecord } from "@/lib/validation";
import { setClockInReminder } from "@/services/server/driverNudges";

/** 출근 깜빡 알림 설정 — Owner 전용. body: { groupId, time: "HH:MM" | null, days: number[] } */
export const POST = routeWithParams<{ driverId: string }>(async (req, params) => {
  const [user, raw] = await Promise.all([requireUser(req), readJson(req)]);
  const body = requireRecord(raw);
  const groupId = requireId(body.groupId, "field.group");
  const driverId = requireId(params.driverId, "field.driver");
  await requireMember(groupId, user.uid, ["OWNER"]);
  if (body.time === null) {
    await setClockInReminder(groupId, driverId, null);
    return { ok: true };
  }
  const time = typeof body.time === "string" && parseHM(body.time) !== null ? body.time : null;
  const days = Array.isArray(body.days)
    ? [...new Set(body.days.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
    : [];
  if (!time || days.length === 0) throw new ValidationError("val.invalid", { field: "@field.reminder" });
  await setClockInReminder(groupId, driverId, { time, days });
  return { ok: true };
});
