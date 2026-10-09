import { test } from "node:test";
import assert from "node:assert/strict";
import {
  startOfDay,
  startOfMonth,
  formatTime,
  workDurationMs,
  formatDuration,
  fromDateTimeInputValue,
  toDateTimeInputValue,
} from "../src/lib/time";
import {
  requirePlace,
  optionalPhone,
  requireId,
  requireTimestamp,
  ValidationError,
} from "../src/lib/validation";
import { toWhatsAppNumber, shortPlace } from "../src/lib/format";
import { canCreateCall, canDeleteFavorite, isOwner } from "../src/lib/permissions";

const JKT = "Asia/Jakarta"; // UTC+7

test("자카르타 기준 하루 시작/월 시작", () => {
  // 2026-09-29 01:30 UTC = 08:30 WIB
  const t = Date.UTC(2026, 8, 29, 1, 30);
  assert.equal(startOfDay(t, JKT), Date.UTC(2026, 8, 28, 17, 0));
  assert.equal(startOfMonth(t, JKT), Date.UTC(2026, 7, 31, 17, 0));
  assert.equal(formatTime(t, JKT), "08:30");
  // 자정 직전(UTC 16:59 = 23:59 WIB)은 같은 날
  const late = Date.UTC(2026, 8, 29, 16, 59);
  assert.equal(startOfDay(late, JKT), Date.UTC(2026, 8, 28, 17, 0));
});

test("datetime-local 왕복 변환", () => {
  const t = Date.UTC(2026, 8, 29, 1, 52);
  const v = toDateTimeInputValue(t, JKT);
  assert.equal(v, "2026-09-29T08:52");
  assert.equal(fromDateTimeInputValue(v, JKT), t);
  assert.equal(fromDateTimeInputValue("bad", JKT), null);
});

test("총 근무시간 = 퇴근 - 출근, 진행 중이면 현재 기준", () => {
  const inAt = Date.UTC(2026, 8, 29, 1, 52);
  assert.equal(workDurationMs(inAt, inAt + 8 * 3600e3 + 12 * 60e3, 0), 8 * 3600e3 + 12 * 60e3);
  assert.equal(workDurationMs(inAt, null, inAt + 60e3), 60e3);
  assert.equal(workDurationMs(inAt, inAt - 1000, 0), 0);
  assert.equal(formatDuration(8 * 3600e3 + 12 * 60e3), "8시간 12분");
  assert.equal(formatDuration(45 * 60e3), "45분");
});

test("장소 검증: 좌표 범위·주소 필수·placeId nullable", () => {
  const ok = requirePlace({ lat: -6.2088, lng: 106.8456, address: "Jl. Jend. Sudirman No.28" }, "픽업");
  assert.equal(ok.placeId, null);
  assert.equal(ok.name, null);
  assert.throws(() => requirePlace({ lat: 91, lng: 0, address: "x" }, "픽업"), ValidationError);
  assert.throws(() => requirePlace({ lat: 0, lng: 0, address: "" }, "픽업"), ValidationError);
  assert.throws(() => requirePlace({ lat: "1", lng: 0, address: "x" }, "픽업"), ValidationError);
  assert.throws(() => requirePlace(null, "픽업"), ValidationError);
});

test("전화번호/ID/시각 검증", () => {
  assert.equal(optionalPhone("0812-3456-7890"), "081234567890");
  assert.equal(optionalPhone(""), null);
  assert.throws(() => optionalPhone("abc"), ValidationError);
  assert.throws(() => requireId("../etc", "id"), ValidationError);
  assert.equal(requireId("abc_DEF-1", "id"), "abc_DEF-1");
  assert.throws(() => requireTimestamp(Date.now() + 3 * 86400e3, "t", Date.now()), ValidationError);
});

test("WhatsApp 번호 변환 (인도네시아 0 → 62)", () => {
  assert.equal(toWhatsAppNumber("0812-3456-7890"), "6281234567890");
  assert.equal(toWhatsAppNumber("+62 812 3456 7890"), "6281234567890");
  assert.equal(shortPlace(null, "Jl. Sudirman No.28, Jakarta"), "Jl. Sudirman No.28");
  assert.equal(shortPlace("SCBD", "whatever"), "SCBD");
});

test("권한: 기사는 호출 불가, 즐겨찾기 삭제는 작성자 또는 OWNER", () => {
  assert.equal(canCreateCall("DRIVER"), false);
  assert.equal(canCreateCall("MEMBER"), true);
  assert.equal(isOwner("MEMBER"), false);
  assert.equal(canDeleteFavorite("MEMBER", "u1", "u2"), false);
  assert.equal(canDeleteFavorite("MEMBER", "u1", "u1"), true);
  assert.equal(canDeleteFavorite("OWNER", "u1", "u2"), true);
  assert.equal(canDeleteFavorite("DRIVER", "u1", "u1"), false);
});
