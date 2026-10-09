/**
 * 기사 위치 공유 — 순수 로직 (클라이언트 전송 판단 + 화면 표시 판단).
 * 배터리·요금·저장량을 줄이기 위해 "시간 또는 이동 거리" 기준으로만 전송한다.
 */

import type { Locale } from "@/i18n/core";
import { translate } from "@/i18n/index";
import { formatHM } from "@/lib/time";

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** 두 좌표 사이 거리 (미터, haversine) */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const LOCATION_POLICY = {
  /** 이 시간이 지나면 움직이지 않아도 전송 */
  maxIntervalMs: 60_000,
  /** 이 거리 이상 이동하면 전송 */
  minMoveMeters: 100,
  /** 이동해도 이 간격보다 자주 보내지 않음 */
  minIntervalMs: 20_000,
  /** 이보다 부정확한 위치는 보내지 않음 (실내 Wi-Fi 추정 등) */
  maxAccuracyMeters: 1_000,
  /** 이보다 오래된 위치는 "오래됨"으로 표시 */
  staleAfterMs: 5 * 60_000,
} as const;

export interface SentState {
  point: GeoPoint;
  at: number;
}

/** 새 측정값을 서버로 보낼지 판단 */
export function shouldSendLocation(
  last: SentState | null,
  next: GeoPoint & { accuracy: number },
  now: number,
  policy: typeof LOCATION_POLICY = LOCATION_POLICY,
): boolean {
  if (!Number.isFinite(next.accuracy) || next.accuracy > policy.maxAccuracyMeters) return false;
  if (!last) return true;
  const elapsed = now - last.at;
  if (elapsed < policy.minIntervalMs) return false;
  if (elapsed >= policy.maxIntervalMs) return true;
  return distanceMeters(last.point, next) >= policy.minMoveMeters;
}

/** 화면 표시: "방금 전" / "3분 전" / "baru saja" / "3 min ago" */
export function formatAgo(ms: number, now: number, locale: Locale = "ko"): string {
  const sec = Math.max(0, Math.floor((now - ms) / 1000));
  if (sec < 60) return translate(locale, "time.justNow");
  return translate(locale, "time.ago", { t: formatHM(Math.floor(sec / 60), locale) });
}

export function isStale(updatedAt: number, now: number, policy: typeof LOCATION_POLICY = LOCATION_POLICY): boolean {
  return now - updatedAt > policy.staleAfterMs;
}
