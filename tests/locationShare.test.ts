import { test } from "node:test";
import assert from "node:assert/strict";
import { distanceMeters, formatAgo, isStale, shouldSendLocation, LOCATION_POLICY } from "../src/lib/locationShare";

const MONAS = { lat: -6.1754, lng: 106.8272 };
const GI = { lat: -6.1951, lng: 106.8209 }; // Grand Indonesia

test("거리 계산: 모나스 ↔ 그랜드 인도네시아 약 2.3km", () => {
  const d = distanceMeters(MONAS, GI);
  assert.ok(d > 2100 && d < 2500, `${d}`);
  assert.equal(Math.round(distanceMeters(MONAS, MONAS)), 0);
});

test("첫 위치는 바로 전송, 부정확한 위치(>1km)는 전송 안 함", () => {
  assert.equal(shouldSendLocation(null, { ...MONAS, accuracy: 20 }, 0), true);
  assert.equal(shouldSendLocation(null, { ...MONAS, accuracy: 5000 }, 0), false);
  assert.equal(shouldSendLocation(null, { ...MONAS, accuracy: Number.NaN }, 0), false);
});

test("정지 상태: 60초마다만 전송", () => {
  const last = { point: MONAS, at: 0 };
  assert.equal(shouldSendLocation(last, { ...MONAS, accuracy: 10 }, 30_000), false);
  assert.equal(shouldSendLocation(last, { ...MONAS, accuracy: 10 }, LOCATION_POLICY.maxIntervalMs), true);
});

test("이동 중: 100m 이상 움직이면 20초 이후 전송, 20초 안에는 안 보냄", () => {
  const last = { point: MONAS, at: 0 };
  const moved = { lat: MONAS.lat - 0.002, lng: MONAS.lng, accuracy: 10 }; // 약 222m
  assert.equal(shouldSendLocation(last, moved, 10_000), false);
  assert.equal(shouldSendLocation(last, moved, 25_000), true);
  const tiny = { lat: MONAS.lat - 0.0003, lng: MONAS.lng, accuracy: 10 }; // 약 33m
  assert.equal(shouldSendLocation(last, tiny, 25_000), false);
});

test("표시: n분 전 / 오래된 위치(5분 초과) 판정", () => {
  const now = 10 * 3600e3;
  assert.equal(formatAgo(now - 30e3, now), "방금 전");
  assert.equal(formatAgo(now - 3 * 60e3, now), "3분 전");
  assert.equal(formatAgo(now - 72 * 60e3, now), "1시간 12분 전");
  assert.equal(isStale(now - 4 * 60e3, now), false);
  assert.equal(isStale(now - 6 * 60e3, now), true);
});
