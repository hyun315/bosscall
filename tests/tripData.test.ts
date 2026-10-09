import { test } from "node:test";
import assert from "node:assert/strict";
import {
  acceptableFix,
  aggregateTrips,
  buildTripStat,
  cellCenter,
  classifyTrip,
  coordsGone,
  fetchedAtFromExpiry,
  geoExpiryFor,
  GOOGLE_GEO_TTL_MS,
  gridCell,
  matchPoi,
  parsePoiCsv,
  reportCsv,
  timeBand,
} from "../src/lib/tripData";
import { PLACE_CATEGORIES, type CallDoc, type PoiDoc, type TripStatDoc } from "../src/types/domain";

const NOW = Date.UTC(2026, 9, 9, 3, 0); // 2026-10-09 10:00 WIB
const DAY = 24 * 3600 * 1000;

const golf: PoiDoc = { id: "p1", name: "Golf A", category: "GOLF", lat: -6.28, lng: 106.78, radiusM: 400, updatedAt: 0 };
const school: PoiDoc = { id: "p2", name: "School B", category: "SCHOOL", lat: -6.2, lng: 106.8, radiusM: 150, updatedAt: 0 };

type TripCall = Parameters<typeof classifyTrip>[0];
const baseCall = (over: Partial<TripCall> = {}): TripCall => ({
  pickupLat: -6.19,
  pickupLng: 106.82,
  pickupSource: "gps",
  pickupCategory: null,
  destinationLat: -6.2801,
  destinationLng: 106.7802,
  destinationSource: "google",
  destinationCategory: null,
  actualPickup: null,
  actualDropoff: null,
  ...over,
});

test("geoExpiryFor: 구글 좌표만 기한, 받은 시각부터 계산, 가장 이른 쪽", () => {
  assert.equal(geoExpiryFor([{ source: "gps" }, { source: "map" }], NOW), null);
  assert.equal(geoExpiryFor([{ source: "google" }], NOW), NOW + GOOGLE_GEO_TTL_MS);
  // 출처 없으면 google 로 본다
  assert.equal(geoExpiryFor([{}], NOW), NOW + GOOGLE_GEO_TTL_MS);
  // 10일 전에 받은 좌표를 다시 써도 기한은 늘지 않는다
  assert.equal(geoExpiryFor([{ source: "google", fetchedAt: NOW - 10 * DAY }], NOW), NOW - 10 * DAY + GOOGLE_GEO_TTL_MS);
  assert.equal(
    geoExpiryFor([{ source: "google", fetchedAt: NOW - 10 * DAY }, { source: "google", fetchedAt: NOW - 2 * DAY }], NOW),
    NOW - 10 * DAY + GOOGLE_GEO_TTL_MS,
  );
  // 이미 지난 값 → 1시간 뒤 (다음 정리 때 삭제)
  assert.equal(geoExpiryFor([{ source: "google", fetchedAt: NOW - 40 * DAY }], NOW), NOW + 3600_000);
  // 미래 시각은 무시하고 지금부터
  assert.equal(geoExpiryFor([{ source: "google", fetchedAt: NOW + DAY }], NOW), NOW + GOOGLE_GEO_TTL_MS);
  assert.equal(fetchedAtFromExpiry(NOW + GOOGLE_GEO_TTL_MS), NOW);
  assert.equal(fetchedAtFromExpiry(null), null);
});

test("coordsGone: 지워진 호출의 구글 쪽만", () => {
  assert.equal(coordsGone({ coordsCleared: true }, "google"), true);
  assert.equal(coordsGone({ coordsCleared: true }, undefined), true);
  assert.equal(coordsGone({ coordsCleared: true }, "gps"), false);
  assert.equal(coordsGone({ coordsCleared: false }, "google"), false);
});

test("gridCell / cellCenter: 약 1.1km 격자", () => {
  const c = gridCell(-6.2088, 106.8456);
  assert.equal(c, "-621:10684");
  const center = cellCenter(c);
  assert.ok(center);
  assert.ok(Math.abs(center.lat - -6.205) < 1e-9 && Math.abs(center.lng - 106.845) < 1e-9);
  // 같은 격자
  assert.equal(gridCell(-6.2001, 106.8401), gridCell(-6.2099, 106.8499));
  assert.equal(cellCenter("bad"), null);
});

test("acceptableFix: 정확도·시각 검사", () => {
  const ok = { lat: -6.2, lng: 106.8, accuracy: 30, at: NOW - 10_000 };
  assert.equal(acceptableFix(ok, NOW), true);
  assert.equal(acceptableFix({ ...ok, accuracy: 500 }, NOW), false);
  assert.equal(acceptableFix({ ...ok, at: NOW - 10 * 60_000 }, NOW), false);
  assert.equal(acceptableFix({ ...ok, at: NOW + 5 * 60_000 }, NOW), false);
  assert.equal(acceptableFix({ ...ok, lat: 120 }, NOW), false);
});

test("matchPoi: 반경 안의 가장 가까운 곳", () => {
  assert.equal(matchPoi({ lat: -6.2805, lng: 106.7805 }, [golf, school])?.id, "p1");
  assert.equal(matchPoi({ lat: -6.25, lng: 106.75 }, [golf, school]), null);
  const golf2: PoiDoc = { ...golf, id: "p3", lat: -6.2806, lng: 106.7806 };
  assert.equal(matchPoi({ lat: -6.2806, lng: 106.7806 }, [golf, golf2])?.id, "p3");
});

test("classifyTrip: 구글 좌표는 통계·분류에 쓰지 않는다", () => {
  const r = classifyTrip(baseCall(), [golf]);
  assert.deepEqual(r.pickupPoint, { lat: -6.19, lng: 106.82 }); // gps
  assert.equal(r.dropoffPoint, null); // google → 사용 안 함
  assert.equal(r.dropoffCategory, null);
});

test("classifyTrip: 기사 GPS 도착 지점이 있으면 그걸로 분류", () => {
  const r = classifyTrip(baseCall({ actualDropoff: { lat: -6.2803, lng: 106.7801, accuracy: 20, at: NOW } }), [golf]);
  assert.deepEqual(r.dropoffPoint, { lat: -6.2803, lng: 106.7801 });
  assert.equal(r.dropoffCategory, "GOLF");
});

test("classifyTrip: 즐겨찾기에서 고른 분류가 우선", () => {
  const r = classifyTrip(
    baseCall({ destinationCategory: "HOME", actualDropoff: { lat: -6.2803, lng: 106.7801, accuracy: 20, at: NOW } }),
    [golf],
  );
  assert.equal(r.dropoffCategory, "HOME");
  // 좌표가 없어도 사용자가 고른 분류는 쓴다
  assert.equal(classifyTrip(baseCall({ destinationCategory: "SCHOOL" }), []).dropoffCategory, "SCHOOL");
});

test("buildTripStat: 식별정보 없음, 그룹 시간대 기준 월·요일·시", () => {
  const call = { createdAt: NOW - 600_000, tripStartedAt: NOW, completedAt: NOW + 47 * 60_000 } as Pick<
    CallDoc,
    "createdAt" | "tripStartedAt" | "completedAt"
  >;
  const cls = classifyTrip(baseCall({ actualDropoff: { lat: -6.2803, lng: 106.7801, accuracy: 20, at: NOW } }), [golf]);
  const s = buildTripStat(call, cls, "Asia/Jakarta", NOW);
  assert.equal(s.month, "2026-10");
  assert.equal(s.weekday, 5); // 금요일
  assert.equal(s.hour, 10);
  assert.equal(s.tripMinutes, 45); // 47분 → 5분 단위
  assert.equal(s.dropoffCategory, "GOLF");
  assert.equal(s.dropoffCell, gridCell(-6.2803, 106.7801));
  assert.equal(s.pickupCell, gridCell(-6.19, 106.82));
  const keys = Object.keys(s).sort();
  for (const forbidden of ["groupId", "callId", "callerId", "uid", "pickupLat", "destinationLat"]) {
    assert.ok(!keys.includes(forbidden), forbidden);
  }
  // 자정 근처: 서울/자카르타 시간대 차이로 날짜가 바뀜
  const lateUtc = Date.UTC(2026, 9, 31, 17, 30); // WIB 11-01 00:30
  assert.equal(buildTripStat({ createdAt: lateUtc, tripStartedAt: null, completedAt: null }, cls, "Asia/Jakarta", NOW).month, "2026-11");
  assert.equal(buildTripStat({ createdAt: lateUtc, tripStartedAt: null, completedAt: null }, cls, "Asia/Jakarta", NOW).tripMinutes, null);
});

const stat = (over: Partial<TripStatDoc>): TripStatDoc => ({
  v: 1,
  month: "2026-10",
  weekday: 5,
  hour: 10,
  timezone: "Asia/Jakarta",
  pickupCell: null,
  dropoffCell: "-629:10678",
  pickupCategory: null,
  dropoffCategory: "GOLF",
  tripMinutes: 40,
  createdAt: NOW,
  ...over,
});

test("aggregateTrips: 최소 건수 미만 묶음은 제외", () => {
  const stats = [
    ...Array.from({ length: 6 }, () => stat({})),
    ...Array.from({ length: 3 }, () => stat({ dropoffCategory: "MALL", tripMinutes: null })),
    stat({ dropoffCategory: null }),
  ];
  const r = aggregateTrips(stats, ["month", "dropoffCategory"], 5);
  assert.equal(r.totalTrips, 10);
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0]?.count, 6);
  assert.equal(r.rows[0]?.avgTripMinutes, 40);
  assert.equal(r.suppressedTrips, 4);
  // 기준을 낮추면 보인다 (서버 API는 5 아래로 내리지 못하게 막는다)
  const r2 = aggregateTrips(stats, ["dropoffCategory"], 1);
  assert.deepEqual(r2.rows.map((x) => x.key.dropoffCategory), ["GOLF", "MALL", "UNKNOWN"]);
  assert.equal(r2.rows[1]?.avgTripMinutes, null);
});

test("timeBand / reportCsv", () => {
  assert.equal(timeBand(0), "00-03");
  assert.equal(timeBand(10), "09-12");
  assert.equal(timeBand(23), "21-24");
  const r = aggregateTrips(Array.from({ length: 5 }, () => stat({})), ["dropoffCell", "timeBand"], 5);
  const csv = reportCsv(["dropoffCell", "timeBand"], r.rows);
  const [head, line] = csv.split("\n");
  assert.equal(head, "dropoffCell,timeBand,cellLat,cellLng,count,avgTripMinutes");
  assert.equal(line, "-629:10678,09-12,-6.285,106.785,5,40");
});

test("parsePoiCsv: 머리글·오류 줄", () => {
  const { rows, errors } = parsePoiCsv(
    "이름,분류,위도,경도,반경m\nGolf A,golf,-6.28,106.78,400\nSchool B,SCHOOL,-6.2,106.8\n\nBad,CHURCH,-6.1,106.7\nNo,MALL,abc,106.7\nBig,MALL,-6.1,106.7,5000",
    PLACE_CATEGORIES,
  );
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { name: "Golf A", category: "GOLF", lat: -6.28, lng: 106.78, radiusM: 400 });
  assert.equal(rows[1]?.radiusM, 150);
  assert.deepEqual(
    errors.map((e) => e.line),
    [5, 6, 7],
  );
  // 민감한 분류는 목록에 없다
  assert.ok(!(PLACE_CATEGORIES as readonly string[]).includes("HOSPITAL"));
});
