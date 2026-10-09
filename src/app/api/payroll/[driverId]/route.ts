import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, routeWithParams } from "@/lib/server/http";
import { requireId, requireRecord, ValidationError, type FieldKey } from "@/lib/validation";
import { savePayrollSettings } from "@/services/server/payroll";

function money(v: unknown, label: FieldKey, max: number): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > max) {
    throw new ValidationError("val.amount", { field: `@${label}` });
  }
  return Math.round(v);
}

/** 급여 조건 저장 — Owner 전용 */
export const PUT = routeWithParams<{ driverId: string }>(async (req, params) => {
  const user = await requireUser(req);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  await requireMember(groupId, user.uid, ["OWNER"]);

  const hours = body.regularHoursPerDay;
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours < 1 || hours > 16) {
    throw new ValidationError("val.regularHours");
  }
  const workdays = body.workdays;
  if (
    !Array.isArray(workdays) ||
    workdays.length > 7 ||
    !workdays.every((d) => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6)
  ) {
    throw new ValidationError("val.invalid", { field: "@field.workdays" });
  }
  const rounding = body.overtimeRoundingMinutes;
  if (rounding !== 1 && rounding !== 15 && rounding !== 30 && rounding !== 60) {
    throw new ValidationError("val.invalid", { field: "@field.rounding" });
  }
  await savePayrollSettings(groupId, requireId(params.driverId, "field.driver"), user.uid, {
    monthlyBase: money(body.monthlyBase, "field.monthlyBase", 1_000_000_000),
    regularHoursPerDay: Math.round(hours * 2) / 2,
    overtimeHourlyRate: money(body.overtimeHourlyRate, "field.overtimeRate", 10_000_000),
    workdays: [...new Set(workdays as number[])].sort(),
    overtimeRoundingMinutes: rounding,
    shareWithDriver: body.shareWithDriver === true,
  });
  return { ok: true };
});
