/**
 * 시간 유틸 — 그룹 timezone(기본 Asia/Jakarta) 기준으로 표시·집계한다.
 * 표시 함수는 화면 언어(ko | id | en)를 받는다.
 */
import { INTL_LOCALE, type Locale } from "@/i18n/core";

function partsInTz(ms: number, timeZone: string): Record<string, string> {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date(ms))) out[p.type] = p.value;
  return out;
}

/** 해당 시각의 timezone offset(ms). 양수 = UTC보다 빠름 */
export function tzOffsetMs(ms: number, timeZone: string): number {
  const p = partsInTz(ms, timeZone);
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** timezone 기준 요일 (0=일 … 6=토) */
export function weekdayInTz(ms: number, timeZone: string): number {
  const p = partsInTz(ms, timeZone);
  return new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day))).getUTCDay();
}

/** timezone 기준 다음 달 1일 0시 (monthStart 는 startOfMonth 결과) */
export function nextMonthStart(monthStart: number, timeZone: string): number {
  return startOfMonth(monthStart + 32 * 86400000, timeZone);
}

/** timezone 기준 이전 달 1일 0시 */
export function prevMonthStart(monthStart: number, timeZone: string): number {
  return startOfMonth(monthStart - 86400000, timeZone);
}

/** "2026년 9월" / "September 2026" */
export function formatMonth(ms: number, timeZone: string, locale: Locale = "ko"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone, year: "numeric", month: "long" }).format(new Date(ms));
}

/** 짧은 요일 이름 (0=일 … 6=토) — "일" / "Min" / "Sun" */
export function weekdayShort(weekday: number, locale: Locale = "ko"): string {
  // 2023-01-01 은 일요일
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2023, 0, 1 + weekday)),
  );
}

/** 분 → "8시간 12분" / "8 jam 12 menit" / "8h 12m" */
export function formatHM(totalMin: number, locale: Locale = "ko"): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (locale === "id") return h === 0 ? `${m} menit` : m === 0 ? `${h} jam` : `${h} jam ${m} menit`;
  if (locale === "en") return h === 0 ? `${m} min` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  return h === 0 ? `${m}분` : m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** timezone 기준 그날 0시의 epoch ms */
export function startOfDay(ms: number, timeZone: string): number {
  const p = partsInTz(ms, timeZone);
  const localMidnightAsUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day));
  return localMidnightAsUtc - tzOffsetMs(ms, timeZone);
}

/** timezone 기준 그달 1일 0시 */
export function startOfMonth(ms: number, timeZone: string): number {
  const p = partsInTz(ms, timeZone);
  const localAsUtc = Date.UTC(Number(p.year), Number(p.month) - 1, 1);
  return localAsUtc - tzOffsetMs(ms, timeZone);
}

/** "08:52" */
export function formatTime(ms: number, timeZone: string): string {
  const p = partsInTz(ms, timeZone);
  return `${p.hour}:${p.minute}`;
}

/** "9월 29일 (화)" / "Sel, 29 Sep" / "Tue, Sep 29" */
export function formatDate(ms: number, timeZone: string, locale: Locale = "ko"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone,
    month: locale === "ko" ? "long" : "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(ms));
}

/** "2026-09-29" (timezone 기준) — date input 값 */
export function toDateInputValue(ms: number, timeZone: string): string {
  const p = partsInTz(ms, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

/** "2026-09-29T08:52" (timezone 기준) — datetime-local 값 */
export function toDateTimeInputValue(ms: number, timeZone: string): string {
  const p = partsInTz(ms, timeZone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** "2026-09-29T08:52" 을 timezone 기준 epoch ms로 */
export function fromDateTimeInputValue(value: string, timeZone: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (!m) return null;
  const asUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0));
  // 1차 추정 후 해당 시점 offset으로 보정 (DST 없는 지역에서는 한 번에 정확)
  const guess = asUtc - tzOffsetMs(asUtc, timeZone);
  return asUtc - tzOffsetMs(guess, timeZone);
}

/** 총 근무시간 = clock_out_at - clock_in_at (명세 §10). 진행 중이면 now 기준 */
export function workDurationMs(clockInAt: number, clockOutAt: number | null, now: number): number {
  return Math.max(0, (clockOutAt ?? now) - clockInAt);
}

/** 밀리초 → "8시간 12분" (언어별) */
export function formatDuration(ms: number, locale: Locale = "ko"): string {
  return formatHM(Math.floor(ms / 60000), locale);
}
