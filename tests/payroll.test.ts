import { test } from "node:test";
import assert from "node:assert/strict";
import { computeMonthlyPayroll, formatIDR, formatMinutes, payslipTextId, type PayrollRules } from "../src/lib/payroll";
import { nextMonthStart, prevMonthStart, startOfMonth, weekdayInTz } from "../src/lib/time";
import type { WorkSessionDoc } from "../src/types/domain";

const TZ = "Asia/Jakarta"; // UTC+7
/** 자카르타 현지 시각 → epoch ms */
const jkt = (y: number, mo: number, d: number, h: number, mi = 0) => Date.UTC(y, mo - 1, d, h - 7, mi);
const sess = (id: string, inAt: number, outAt: number | null): WorkSessionDoc => ({
  id, groupId: "g", driverId: "d1", clockInAt: inAt, clockOutAt: outAt, timezone: TZ, createdAt: inAt, editedBy: null, editedAt: null,
});
const rules: PayrollRules = {
  monthlyBase: 5_000_000,
  regularHoursPerDay: 8,
  overtimeHourlyRate: 25_000,
  workdays: [1, 2, 3, 4, 5, 6], // 월~토
  overtimeRoundingMinutes: 30,
};
const SEP_START = jkt(2026, 9, 1, 0);
const OCT_START = jkt(2026, 10, 1, 0);
const opts = { timeZone: TZ, from: SEP_START, to: OCT_START, now: jkt(2026, 10, 5, 12) };

test("월 경계·요일 계산 (자카르타 기준)", () => {
  assert.equal(startOfMonth(jkt(2026, 9, 29, 10), TZ), SEP_START);
  assert.equal(nextMonthStart(SEP_START, TZ), OCT_START);
  assert.equal(prevMonthStart(OCT_START, TZ), SEP_START);
  assert.equal(weekdayInTz(jkt(2026, 9, 27, 10), TZ), 0); // 2026-09-27 일요일
  assert.equal(weekdayInTz(jkt(2026, 9, 28, 1), TZ), 1); // 월요일 새벽 1시(UTC로는 일요일)
});

test("근무일: 8시간 초과분만 시간외, 30분 단위 내림", () => {
  // 9/28(월) 07:00~17:40 = 10시간 40분 → 시간외 2시간 40분 → 2시간 30분
  const r = computeMonthlyPayroll([sess("a", jkt(2026, 9, 28, 7), jkt(2026, 9, 28, 17, 40))], rules, opts);
  assert.equal(r.days.length, 1);
  assert.equal(r.workedMin, 640);
  assert.equal(r.regularMin, 480);
  assert.equal(r.overtimeMin, 150);
  assert.equal(r.overtimePay, 62_500);
  assert.equal(r.total, 5_062_500);
});

test("8시간 이하 근무는 시간외 없음", () => {
  const r = computeMonthlyPayroll([sess("a", jkt(2026, 9, 28, 8), jkt(2026, 9, 28, 15))], rules, opts);
  assert.equal(r.overtimeMin, 0);
  assert.equal(r.total, 5_000_000);
});

test("휴무일(일요일) 근무는 전부 시간외", () => {
  // 9/27(일) 10:00~13:20 = 3시간 20분 → 3시간
  const r = computeMonthlyPayroll([sess("a", jkt(2026, 9, 27, 10), jkt(2026, 9, 27, 13, 20))], rules, opts);
  assert.equal(r.days[0]?.isWorkday, false);
  assert.equal(r.overtimeMin, 180);
  assert.equal(r.overtimePay, 75_000);
});

test("같은 날 여러 번 출퇴근은 합산 후 계산", () => {
  const r = computeMonthlyPayroll(
    [
      sess("a", jkt(2026, 9, 28, 6), jkt(2026, 9, 28, 11)), // 5h
      sess("b", jkt(2026, 9, 28, 13), jkt(2026, 9, 28, 18)), // 5h
    ],
    rules,
    opts,
  );
  assert.equal(r.days.length, 1);
  assert.equal(r.workedMin, 600);
  assert.equal(r.overtimeMin, 120);
});

test("자정 넘는 근무는 출근일에 포함, 다른 달 근무는 제외", () => {
  const r = computeMonthlyPayroll(
    [
      sess("a", jkt(2026, 9, 30, 18), jkt(2026, 10, 1, 2)), // 9/30(수) 8시간
      sess("b", jkt(2026, 10, 1, 8), jkt(2026, 10, 1, 17)), // 10월 → 제외
      sess("c", jkt(2026, 8, 31, 8), jkt(2026, 8, 31, 17)), // 8월 → 제외
    ],
    rules,
    opts,
  );
  assert.equal(r.days.length, 1);
  assert.equal(r.workedMin, 480);
  assert.equal(r.overtimeMin, 0);
});

test("진행 중 근무는 현재 시각까지, 표시 플래그", () => {
  const now = jkt(2026, 9, 29, 19);
  const r = computeMonthlyPayroll([sess("a", jkt(2026, 9, 29, 8), null)], rules, { ...opts, now });
  assert.equal(r.workedMin, 660);
  assert.equal(r.overtimeMin, 180);
  assert.equal(r.hasOpenSession, true);
});

test("반올림 단위 1분이면 그대로, 기본급 0이어도 계산", () => {
  const r = computeMonthlyPayroll(
    [sess("a", jkt(2026, 9, 28, 7), jkt(2026, 9, 28, 17, 40))],
    { ...rules, monthlyBase: 0, overtimeRoundingMinutes: 1, overtimeHourlyRate: 30_000 },
    opts,
  );
  assert.equal(r.overtimeMin, 160);
  assert.equal(r.overtimePay, 80_000);
  assert.equal(r.total, 80_000);
});

test("표시 형식: 루피아·시간·인니어 명세", () => {
  assert.equal(formatIDR(5_062_500), "Rp 5.062.500");
  assert.equal(formatMinutes(150), "2시간 30분");
  assert.equal(formatMinutes(150, "id"), "2 jam 30 menit");
  const r = computeMonthlyPayroll([sess("a", jkt(2026, 9, 28, 7), jkt(2026, 9, 28, 17, 40))], rules, opts);
  const text = payslipTextId(r, rules, { driverName: "Pak Budi", groupName: "Yang Family", monthStart: SEP_START, timeZone: TZ });
  assert.match(text, /Slip Gaji September 2026/);
  assert.match(text, /Total: Rp 5\.062\.500/);
  assert.match(text, /Lembur: 2 jam 30 menit × Rp 25\.000\/jam = Rp 62\.500/);
});
