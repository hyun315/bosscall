import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateTransition,
  driverStatusAfter,
  timestampFieldsFor,
  TRANSITIONS,
  CALL_ACTIONS,
  type TransitionActor,
  type TransitionCallView,
} from "../src/lib/callStateMachine";
import { CALL_STATUSES } from "../src/types/domain";

const NOW = 1_800_000_000_000;
const call = (status: TransitionCallView["status"], over: Partial<TransitionCallView> = {}): TransitionCallView => ({
  status,
  driverId: "d1",
  callerId: "u-caller",
  expiresAt: NOW + 60_000,
  ...over,
});
const driver: TransitionActor = { userId: "u-driver", role: "DRIVER", driverId: "d1" };
const otherDriver: TransitionActor = { userId: "u-d2", role: "DRIVER", driverId: "d2" };
const caller: TransitionActor = { userId: "u-caller", role: "MEMBER", driverId: null };
const otherMember: TransitionActor = { userId: "u-m2", role: "MEMBER", driverId: null };
const owner: TransitionActor = { userId: "u-owner", role: "OWNER", driverId: null };

test("정상 흐름 CALLING → … → COMPLETED 가 순서대로만 진행된다", () => {
  const path: Array<[Parameters<typeof evaluateTransition>[1], string, string]> = [
    ["RECEIVE", "CALLING", "RECEIVED"],
    ["ACCEPT", "RECEIVED", "ACCEPTED"],
    ["DEPART", "ACCEPTED", "ON_THE_WAY"],
    ["ARRIVE", "ON_THE_WAY", "ARRIVED"],
    ["START_TRIP", "ARRIVED", "TRIP_STARTED"],
    ["COMPLETE", "TRIP_STARTED", "COMPLETED"],
  ];
  for (const [action, from, to] of path) {
    const r = evaluateTransition(call(from as TransitionCallView["status"]), action, driver, NOW);
    assert.deepEqual(r, { ok: true, from, to }, `${action}`);
  }
});

test("단계 건너뛰기 금지: CALLING에서 바로 ACCEPT, ACCEPTED에서 바로 COMPLETE 불가", () => {
  assert.equal(evaluateTransition(call("CALLING"), "ACCEPT", driver, NOW).ok, false);
  assert.equal(evaluateTransition(call("ACCEPTED"), "COMPLETE", driver, NOW).ok, false);
  assert.equal(evaluateTransition(call("CREATED"), "RECEIVE", driver, NOW).ok, false);
});

test("종료 상태에서는 어떤 동작도 불가", () => {
  for (const s of ["COMPLETED", "DECLINED", "TIMEOUT", "CANCELLED"] as const) {
    for (const a of CALL_ACTIONS) {
      const actor = a === "CANCEL" ? owner : driver;
      const r = evaluateTransition(call(s, { expiresAt: 0 }), a, actor, NOW);
      assert.equal(r.ok, false, `${s} + ${a}`);
    }
  }
});

test("기사 동작은 배정된 기사만 가능 (다른 기사·가족·관리자 불가)", () => {
  for (const actor of [otherDriver, caller, owner]) {
    const r = evaluateTransition(call("RECEIVED"), "ACCEPT", actor, NOW);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, "FORBIDDEN");
  }
});

test("예외 전이: CALLING → DECLINED / CANCELLED / TIMEOUT, ACCEPTED → CANCELLED", () => {
  assert.equal(evaluateTransition(call("CALLING"), "DECLINE", driver, NOW).ok, true);
  assert.equal(evaluateTransition(call("CALLING"), "CANCEL", caller, NOW).ok, true);
  assert.equal(evaluateTransition(call("ACCEPTED"), "CANCEL", caller, NOW).ok, true);
  assert.equal(evaluateTransition(call("CALLING", { expiresAt: NOW - 1 }), "TIMEOUT", otherMember, NOW).ok, true);
});

test("이동 시작 이후(ON_THE_WAY~)에는 취소 불가 — 명세 예외 목록에 없음", () => {
  for (const s of ["ON_THE_WAY", "ARRIVED", "TRIP_STARTED"] as const) {
    assert.equal(evaluateTransition(call(s), "CANCEL", owner, NOW).ok, false, s);
  }
});

test("취소는 호출자 본인 또는 OWNER만", () => {
  assert.equal(evaluateTransition(call("CALLING"), "CANCEL", owner, NOW).ok, true);
  const r = evaluateTransition(call("CALLING"), "CANCEL", otherMember, NOW);
  assert.equal(r.ok, false);
  assert.equal(evaluateTransition(call("CALLING"), "CANCEL", driver, NOW).ok, false);
});

test("TIMEOUT은 만료 시각 이전에는 거부", () => {
  const r = evaluateTransition(call("CALLING"), "TIMEOUT", owner, NOW);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, "NOT_EXPIRED");
  assert.equal(evaluateTransition(call("RECEIVED", { expiresAt: NOW }), "TIMEOUT", owner, NOW).ok, true);
});

test("모든 전이 규칙의 from/to 가 정의된 상태값이다", () => {
  for (const rule of Object.values(TRANSITIONS)) {
    assert.ok((CALL_STATUSES as readonly string[]).includes(rule.to));
    for (const f of rule.from) assert.ok((CALL_STATUSES as readonly string[]).includes(f));
  }
});

test("기사 상태: 수락 시 BUSY, 종료 시 ON_DUTY 복귀, 퇴근 상태는 유지", () => {
  assert.equal(driverStatusAfter("ACCEPTED", "ON_DUTY"), "BUSY");
  assert.equal(driverStatusAfter("COMPLETED", "BUSY"), "ON_DUTY");
  assert.equal(driverStatusAfter("CANCELLED", "BUSY"), "ON_DUTY");
  assert.equal(driverStatusAfter("RECEIVED", "ON_DUTY"), "ON_DUTY");
  assert.equal(driverStatusAfter("COMPLETED", "OFF_DUTY"), "OFF_DUTY");
});

test("타임스탬프 필드: accepted/completed/cancelled/endedAt", () => {
  assert.deepEqual(timestampFieldsFor("ACCEPTED", NOW), { updatedAt: NOW, acceptedAt: NOW });
  assert.deepEqual(timestampFieldsFor("COMPLETED", NOW), { updatedAt: NOW, completedAt: NOW, endedAt: NOW });
  assert.deepEqual(timestampFieldsFor("TIMEOUT", NOW), { updatedAt: NOW, endedAt: NOW });
  assert.deepEqual(timestampFieldsFor("TRIP_STARTED", NOW), { updatedAt: NOW, tripStartedAt: NOW });
});
