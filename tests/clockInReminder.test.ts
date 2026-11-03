import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHM, reminderDue } from "../src/lib/clockInReminder";

const TZ = "Asia/Jakarta"; // UTC+7
// 2026-11-03 (화) 자카르타 07:00 = UTC 00:00
const day = Date.UTC(2026, 10, 3, 0, 0) - 7 * 3600_000; // 자카르타 0시
const at = (h: number, m = 0) => day + (h * 60 + m) * 60_000;
const rem = { time: "07:30", days: [1, 2, 3, 4, 5, 6] };

test("parseHM", () => {
  assert.equal(parseHM("07:30"), 450);
  assert.equal(parseHM("24:00"), null);
  assert.equal(parseHM("7:30"), null);
});

test("정한 시각 전에는 안 보냄, 지나면 보냄, 3시간 지나면 안 보냄", () => {
  assert.equal(reminderDue(rem, null, at(7, 29), TZ), null);
  assert.equal(reminderDue(rem, null, at(7, 30), TZ), day);
  assert.equal(reminderDue(rem, null, at(10, 29), TZ), day);
  assert.equal(reminderDue(rem, null, at(10, 31), TZ), null);
});

test("하루 한 번만, 쉬는 요일엔 안 보냄", () => {
  assert.equal(reminderDue(rem, day, at(8), TZ), null);
  assert.equal(reminderDue({ ...rem, days: [0] }, null, at(8), TZ), null);
});
