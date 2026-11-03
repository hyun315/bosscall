/**
 * 출근 깜빡 알림 — 순수 계산 (테스트 가능).
 * 정한 요일·시각이 지났는데 기사가 아직 출근을 안 눌렀으면 하루 한 번 기사에게 알림.
 */
import { startOfDay, weekdayInTz } from "@/lib/time";

export interface ClockInReminder {
  /** "HH:MM" (그룹 시간대 기준) */
  time: string;
  /** 요일 0=일 … 6=토 */
  days: number[];
}

/** 정한 시각에서 이만큼 지나면 그날은 더 보내지 않는다 (늦게 켠 서버 작업이 엉뚱한 시각에 보내지 않게) */
export const REMINDER_WINDOW_MS = 3 * 3600_000;

export function parseHM(v: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(v);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** 오늘 보낼 차례면 오늘 날짜 키(그날 0시의 ms)를, 아니면 null */
export function reminderDue(
  rem: ClockInReminder,
  lastSentDay: number | null,
  now: number,
  timeZone: string,
): number | null {
  const min = parseHM(rem.time);
  if (min === null) return null;
  const day = startOfDay(now, timeZone);
  if (lastSentDay === day) return null;
  if (!rem.days.includes(weekdayInTz(now, timeZone))) return null;
  const at = day + min * 60_000;
  if (now < at || now - at > REMINDER_WINDOW_MS) return null;
  return day;
}
