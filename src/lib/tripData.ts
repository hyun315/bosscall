/**
 * 출발지·목적지 데이터 활용 기초 — 순수 함수 (단위 테스트 대상)
 *
 * 원칙
 *  1) 구글에서 받은 좌표는 30일까지만 보관하고, 사용자 사이에 섞어 쓰지 않는다 (Google Maps Platform 약관).
 *     → 익명 통계·장소 분류에는 기기 GPS·지도 핀·기사 GPS(자체 데이터)만 쓴다.
 *  2) 익명 통계(tripStats)에는 그룹·사용자·호출 id, 정확한 좌표·시각을 넣지 않는다 (약 1.1km 격자 + 시 단위).
 *  3) 리포트는 같은 묶음이 K건 미만이면 내보내지 않는다 (소수 가구가 드러나지 않게).
 */
import type {
  ActualFix,
  CallDoc,
  CoordSource,
  PlaceCategory,
  PoiDoc,
  TripStatDoc,
} from "@/types/domain";

/** 동의 문구를 바꾸면 버전을 올린다 → 이전 버전 동의자에게 다시 묻는다 */
export const CONSENT_VERSION = "2026-10";

/** 구글 좌표 보관 한도 (약관: 30일) — 여유를 두고 29일 */
export const GOOGLE_GEO_TTL_MS = 29 * 24 * 3600 * 1000;

/** 실제 위치로 인정할 GPS 정확도 한도 / 측정 후 허용 시간 */
export const ACTUAL_FIX_MAX_ACCURACY_M = 150;
export const ACTUAL_FIX_MAX_AGE_MS = 3 * 60 * 1000;

/** 리포트 최소 묶음 건수 */
export const REPORT_MIN_COUNT = 5;

/** 격자 크기 (도). 0.01° ≈ 1.1km (자카르타 위도 기준) */
export const GRID_DEG = 0.01;

export function sourceOf(s: CoordSource | undefined): CoordSource {
  return s ?? "google";
}

export function isOwnSource(s: CoordSource | undefined): boolean {
  const v = sourceOf(s);
  return v === "gps" || v === "map";
}

/**
 * 구글 좌표가 하나라도 있으면 만료 시각, 없으면 null.
 * 좌표를 받은 시각(fetchedAt)부터 센다 — 즐겨찾기·최근 장소를 다시 써도 기한이 늘어나지 않는다.
 * 이미 지난 값이면 1시간 뒤로 둔다 (다음 정리 때 지워짐).
 */
export function geoExpiryFor(
  sides: { source?: CoordSource; fetchedAt?: number | null }[],
  now: number,
): number | null {
  let exp: number | null = null;
  for (const s of sides) {
    if (sourceOf(s.source) !== "google") continue;
    const fetched = s.fetchedAt && s.fetchedAt <= now ? s.fetchedAt : now;
    const e = Math.max(fetched + GOOGLE_GEO_TTL_MS, now + 3600_000);
    exp = exp === null ? e : Math.min(exp, e);
  }
  return exp;
}

/** 저장된 만료 시각 → 좌표를 받은 시각 */
export function fetchedAtFromExpiry(geoExpiresAt: number | null | undefined): number | null {
  return geoExpiresAt ? geoExpiresAt - GOOGLE_GEO_TTL_MS : null;
}

/** 해당 쪽 좌표가 약관 때문에 지워졌는지 */
export function coordsGone(call: Pick<CallDoc, "coordsCleared">, source: CoordSource | undefined): boolean {
  return call.coordsCleared === true && sourceOf(source) === "google";
}

/** 약 1.1km 격자 이름 — 예: "-621:10682" */
export function gridCell(lat: number, lng: number): string {
  return `${Math.floor(lat / GRID_DEG)}:${Math.floor(lng / GRID_DEG)}`;
}

/** 격자 중심 좌표 (리포트 지도 표시용) */
export function cellCenter(cell: string): { lat: number; lng: number } | null {
  const m = /^(-?\d+):(-?\d+)$/.exec(cell);
  if (!m) return null;
  return { lat: (Number(m[1]) + 0.5) * GRID_DEG, lng: (Number(m[2]) + 0.5) * GRID_DEG };
}

/** 두 좌표 사이 거리 (m) */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 기사 GPS 값이 실제 위치로 쓸 만한지 */
export function acceptableFix(fix: ActualFix, now: number): boolean {
  return (
    Number.isFinite(fix.lat) &&
    Number.isFinite(fix.lng) &&
    Math.abs(fix.lat) <= 90 &&
    Math.abs(fix.lng) <= 180 &&
    fix.accuracy > 0 &&
    fix.accuracy <= ACTUAL_FIX_MAX_ACCURACY_M &&
    fix.at <= now + 60_000 &&
    now - fix.at <= ACTUAL_FIX_MAX_AGE_MS
  );
}

/** 반경 안의 가장 가까운 자체 장소 */
export function matchPoi(point: { lat: number; lng: number }, pois: readonly PoiDoc[]): PoiDoc | null {
  let best: PoiDoc | null = null;
  let bestD = Infinity;
  for (const p of pois) {
    const d = distanceM(point, p);
    if (d <= p.radiusM && d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

/** 통계에 쓸 자체 좌표 — 기사 GPS가 우선, 없으면 사용자가 직접 정한 좌표, 구글 좌표는 쓰지 않음 */
export function ownPoint(
  actual: ActualFix | null | undefined,
  planned: { lat: number; lng: number; source: CoordSource | undefined },
): { lat: number; lng: number } | null {
  if (actual) return { lat: actual.lat, lng: actual.lng };
  if (isOwnSource(planned.source)) return { lat: planned.lat, lng: planned.lng };
  return null;
}

/** 분류: 사용자가 고른 분류(즐겨찾기) > 자체 장소 목록 > 없음 */
export function categorize(
  chosen: PlaceCategory | null | undefined,
  point: { lat: number; lng: number } | null,
  pois: readonly PoiDoc[],
): PlaceCategory | null {
  if (chosen) return chosen;
  if (!point) return null;
  return matchPoi(point, pois)?.category ?? null;
}

function localParts(ms: number, timezone: string): { month: string; weekday: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    month: `${get("year")}-${get("month")}`,
    weekday: Math.max(0, WD.indexOf(get("weekday"))),
    hour: Number(get("hour")) % 24,
  };
}

export interface TripClassification {
  pickupCategory: PlaceCategory | null;
  dropoffCategory: PlaceCategory | null;
  pickupPoint: { lat: number; lng: number } | null;
  dropoffPoint: { lat: number; lng: number } | null;
}

export function classifyTrip(
  call: Pick<
    CallDoc,
    | "pickupLat"
    | "pickupLng"
    | "pickupSource"
    | "pickupCategory"
    | "destinationLat"
    | "destinationLng"
    | "destinationSource"
    | "destinationCategory"
    | "actualPickup"
    | "actualDropoff"
  >,
  pois: readonly PoiDoc[],
): TripClassification {
  const pickupPoint = ownPoint(call.actualPickup, {
    lat: call.pickupLat,
    lng: call.pickupLng,
    source: call.pickupSource,
  });
  const dropoffPoint = ownPoint(call.actualDropoff, {
    lat: call.destinationLat,
    lng: call.destinationLng,
    source: call.destinationSource,
  });
  return {
    pickupPoint,
    dropoffPoint,
    pickupCategory: categorize(call.pickupCategory, pickupPoint, pois),
    dropoffCategory: categorize(call.destinationCategory, dropoffPoint, pois),
  };
}

/** 완료된 호출 → 익명 통계 1건 */
export function buildTripStat(
  call: Pick<CallDoc, "createdAt" | "tripStartedAt" | "completedAt">,
  cls: TripClassification,
  timezone: string,
  now: number,
): TripStatDoc {
  const startMs = call.tripStartedAt ?? call.createdAt;
  const { month, weekday, hour } = localParts(startMs, timezone);
  const minutes =
    call.tripStartedAt && call.completedAt && call.completedAt > call.tripStartedAt
      ? Math.round((call.completedAt - call.tripStartedAt) / 60000 / 5) * 5
      : null;
  return {
    v: 1,
    month,
    weekday,
    hour,
    timezone,
    pickupCell: cls.pickupPoint ? gridCell(cls.pickupPoint.lat, cls.pickupPoint.lng) : null,
    dropoffCell: cls.dropoffPoint ? gridCell(cls.dropoffPoint.lat, cls.dropoffPoint.lng) : null,
    pickupCategory: cls.pickupCategory,
    dropoffCategory: cls.dropoffCategory,
    tripMinutes: minutes,
    createdAt: now,
  };
}

// ── 리포트 ─────────────────────────────────────────────

export const REPORT_DIMENSIONS = ["month", "weekday", "timeBand", "dropoffCategory", "dropoffCell", "pickupCell"] as const;
export type ReportDimension = (typeof REPORT_DIMENSIONS)[number];

/** 3시간 단위 시간대 — "06-09" */
export function timeBand(hour: number): string {
  const s = Math.floor(hour / 3) * 3;
  return `${String(s).padStart(2, "0")}-${String(s + 3).padStart(2, "0")}`;
}

function dimValue(s: TripStatDoc, d: ReportDimension): string {
  switch (d) {
    case "month":
      return s.month;
    case "weekday":
      return String(s.weekday);
    case "timeBand":
      return timeBand(s.hour);
    case "dropoffCategory":
      return s.dropoffCategory ?? "UNKNOWN";
    case "dropoffCell":
      return s.dropoffCell ?? "UNKNOWN";
    case "pickupCell":
      return s.pickupCell ?? "UNKNOWN";
  }
}

export interface ReportRow {
  key: Record<ReportDimension, string | undefined>;
  count: number;
  avgTripMinutes: number | null;
}

/**
 * 고른 기준으로 묶어 건수를 센다. minCount 미만 묶음은 빼고, 뺀 건수를 따로 돌려준다.
 */
export function aggregateTrips(
  stats: readonly TripStatDoc[],
  dims: readonly ReportDimension[],
  minCount = REPORT_MIN_COUNT,
): { rows: ReportRow[]; suppressedTrips: number; totalTrips: number } {
  const groups = new Map<string, { key: ReportRow["key"]; count: number; minSum: number; minN: number }>();
  for (const s of stats) {
    const key = {} as ReportRow["key"];
    for (const d of dims) key[d] = dimValue(s, d);
    const id = dims.map((d) => key[d]).join("|");
    const g = groups.get(id) ?? { key, count: 0, minSum: 0, minN: 0 };
    g.count += 1;
    if (s.tripMinutes !== null) {
      g.minSum += s.tripMinutes;
      g.minN += 1;
    }
    groups.set(id, g);
  }
  const rows: ReportRow[] = [];
  let suppressed = 0;
  for (const g of groups.values()) {
    if (g.count < Math.max(1, minCount)) {
      suppressed += g.count;
      continue;
    }
    rows.push({ key: g.key, count: g.count, avgTripMinutes: g.minN ? Math.round(g.minSum / g.minN) : null });
  }
  rows.sort((a, b) => b.count - a.count);
  return { rows, suppressedTrips: suppressed, totalTrips: stats.length };
}

export function reportCsv(dims: readonly ReportDimension[], rows: readonly ReportRow[]): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = [...dims, "cellLat", "cellLng", "count", "avgTripMinutes"];
  const cellDim = dims.includes("dropoffCell") ? "dropoffCell" : dims.includes("pickupCell") ? "pickupCell" : null;
  const lines = rows.map((r) => {
    const c = cellDim ? cellCenter(r.key[cellDim] ?? "") : null;
    return [
      ...dims.map((d) => esc(r.key[d] ?? "")),
      c ? c.lat.toFixed(3) : "",
      c ? c.lng.toFixed(3) : "",
      String(r.count),
      r.avgTripMinutes === null ? "" : String(r.avgTripMinutes),
    ].join(",");
  });
  return [head.join(","), ...lines].join("\n");
}

// ── 자체 장소(POI) CSV ─────────────────────────────────

export interface PoiRow {
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  radiusM: number;
}

/**
 * "이름,분류,위도,경도[,반경m]" 줄 단위 CSV. 첫 줄이 머리글이면 건너뛴다.
 * 좌표는 운영자가 직접 확인한 값(현장 GPS·지도 핀)이어야 한다 — 구글 검색 결과를 옮겨 적지 않는다.
 */
export function parsePoiCsv(
  text: string,
  categories: readonly PlaceCategory[],
): { rows: PoiRow[]; errors: { line: number; reason: string }[] } {
  const rows: PoiRow[] = [];
  const errors: { line: number; reason: string }[] = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const cols = line.split(",").map((c) => c.trim());
    if (i === 0 && cols[2] !== undefined && Number.isNaN(Number(cols[2]))) return; // 머리글
    const [name, cat, latS, lngS, radS] = cols;
    const lat = Number(latS);
    const lng = Number(lngS);
    const radiusM = radS ? Number(radS) : 150;
    const category = (cat ?? "").toUpperCase() as PlaceCategory;
    if (!name) return errors.push({ line: i + 1, reason: "이름 없음" });
    if (!categories.includes(category)) return errors.push({ line: i + 1, reason: `분류 '${cat ?? ""}' 없음` });
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) {
      return errors.push({ line: i + 1, reason: "좌표 오류" });
    }
    if (!Number.isFinite(radiusM) || radiusM < 20 || radiusM > 2000) {
      return errors.push({ line: i + 1, reason: "반경은 20~2000m" });
    }
    rows.push({ name: name.slice(0, 120), category, lat, lng, radiusM });
  });
  return { rows, errors };
}
