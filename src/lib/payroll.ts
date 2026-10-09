/**
 * 급여 계산 — 순수 함수 (명세 §10 "급여는 별도 계산 레이어", 보스첵 요구사항).
 *
 * 규칙
 *  - 급여 = 월 기본급 + 시간외 수당
 *  - 근무일: 하루 근무합계 중 기본 근무시간(regularHoursPerDay) 초과분이 시간외
 *  - 휴무일(workdays 에 없는 요일): 그날 근무 전부가 시간외
 *  - 하루 시간외 합계를 반올림 단위(분)로 내림 (예: 30분 단위 → 1시간 40분 → 1시간 30분)
 *  - 근무는 출근 시각이 속한 날짜(그룹 시간대)로 집계. 자정을 넘는 근무도 출근일에 포함
 *  - 퇴근 기록이 없는 근무(진행 중)는 현재 시각까지로 계산하고 "진행 중"으로 표시
 *  - 금액은 루피아 정수 (반올림)
 */
import type { Locale } from "@/i18n/core";
import { formatHM, startOfDay, weekdayInTz, workDurationMs } from "@/lib/time";
import type { PayrollSettingsDoc, WorkSessionDoc } from "@/types/domain";

export type PayrollRules = Pick<
  PayrollSettingsDoc,
  "monthlyBase" | "regularHoursPerDay" | "overtimeHourlyRate" | "workdays" | "overtimeRoundingMinutes"
>;

export const DEFAULT_PAYROLL_RULES: PayrollRules = {
  monthlyBase: 0,
  regularHoursPerDay: 8,
  overtimeHourlyRate: 0,
  workdays: [1, 2, 3, 4, 5, 6], // 월~토
  overtimeRoundingMinutes: 30,
};

export interface PayrollDay {
  dayStart: number;
  weekday: number;
  isWorkday: boolean;
  sessions: WorkSessionDoc[];
  workedMin: number;
  regularMin: number;
  overtimeMin: number;
  hasOpenSession: boolean;
}

export interface PayrollResult {
  days: PayrollDay[];
  daysWorked: number;
  workedMin: number;
  regularMin: number;
  overtimeMin: number;
  base: number;
  overtimePay: number;
  total: number;
  hasOpenSession: boolean;
}

export function computeMonthlyPayroll(
  sessions: WorkSessionDoc[],
  rules: PayrollRules,
  opts: { timeZone: string; from: number; to: number; now: number },
): PayrollResult {
  const byDay = new Map<number, WorkSessionDoc[]>();
  for (const s of sessions) {
    if (s.clockInAt < opts.from || s.clockInAt >= opts.to) continue;
    const d = startOfDay(s.clockInAt, opts.timeZone);
    byDay.set(d, [...(byDay.get(d) ?? []), s]);
  }

  const regularLimit = Math.max(0, Math.round(rules.regularHoursPerDay * 60));
  const unit = Math.max(1, rules.overtimeRoundingMinutes);

  const days: PayrollDay[] = [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([dayStart, ss]) => {
      const sorted = [...ss].sort((a, b) => a.clockInAt - b.clockInAt);
      const workedMin = Math.floor(
        sorted.reduce((acc, s) => acc + workDurationMs(s.clockInAt, s.clockOutAt, opts.now), 0) / 60000,
      );
      const weekday = weekdayInTz(dayStart + 12 * 3600000, opts.timeZone);
      const isWorkday = rules.workdays.includes(weekday);
      const rawOvertime = isWorkday ? Math.max(0, workedMin - regularLimit) : workedMin;
      const overtimeMin = Math.floor(rawOvertime / unit) * unit;
      return {
        dayStart,
        weekday,
        isWorkday,
        sessions: sorted,
        workedMin,
        regularMin: isWorkday ? Math.min(workedMin, regularLimit) : 0,
        overtimeMin,
        hasOpenSession: sorted.some((s) => s.clockOutAt === null),
      };
    });

  const sum = (f: (d: PayrollDay) => number) => days.reduce((a, d) => a + f(d), 0);
  const overtimeMin = sum((d) => d.overtimeMin);
  const overtimePay = Math.round((overtimeMin / 60) * rules.overtimeHourlyRate);
  const base = Math.round(rules.monthlyBase);
  return {
    days,
    daysWorked: days.filter((d) => d.workedMin > 0).length,
    workedMin: sum((d) => d.workedMin),
    regularMin: sum((d) => d.regularMin),
    overtimeMin,
    base,
    overtimePay,
    total: base + overtimePay,
    hasOpenSession: days.some((d) => d.hasOpenSession),
  };
}

/** "Rp 5.500.000" */
export function formatIDR(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(amount))}`;
}

/** "12시간 30분" / "12 jam 30 menit" / "12h 30m" */
export function formatMinutes(min: number, lang: Locale = "ko"): string {
  return formatHM(min, lang);
}

const ID_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** 기사에게 보낼 급여명세 (인도네시아어) — WhatsApp 공유용 텍스트 */
export function payslipTextId(
  p: PayrollResult,
  rules: PayrollRules,
  info: { driverName: string; groupName: string; monthStart: number; timeZone: string },
): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: info.timeZone, year: "numeric", month: "numeric" })
    .formatToParts(new Date(info.monthStart));
  const year = parts.find((x) => x.type === "year")?.value ?? "";
  const month = Number(parts.find((x) => x.type === "month")?.value ?? "1");
  const lines = [
    `*Slip Gaji ${ID_MONTHS[month - 1] ?? ""} ${year}*`,
    `${info.driverName} — ${info.groupName}`,
    ``,
    `Hari kerja: ${p.daysWorked} hari`,
    `Total jam kerja: ${formatMinutes(p.workedMin, "id")}`,
    ``,
    `Gaji pokok: ${formatIDR(p.base)}`,
    `Lembur: ${formatMinutes(p.overtimeMin, "id")} × ${formatIDR(rules.overtimeHourlyRate)}/jam = ${formatIDR(p.overtimePay)}`,
    `*Total: ${formatIDR(p.total)}*`,
  ];
  if (p.hasOpenSession) lines.push("", "(Masih ada jam kerja yang belum selesai — angka bisa berubah)");
  lines.push("", "— BossCall");
  return lines.join("\n");
}
