/**
 * Call State Machine — 명세서 §7.
 *
 * 정상 흐름: CREATED → CALLING → RECEIVED → ACCEPTED → ON_THE_WAY → ARRIVED → TRIP_STARTED → COMPLETED
 * 예외:     CALLING → DECLINED | TIMEOUT | CANCELLED,  ACCEPTED → CANCELLED
 *
 * [명세 해석] RECEIVED(기사 화면에 표시됨)는 기사가 아직 응답하지 않은 상태이므로
 * CALLING과 동일하게 DECLINED / TIMEOUT / CANCELLED 로 갈 수 있게 했다.
 * (명세의 예외 목록에 RECEIVED가 없으나, 막으면 기사가 화면을 연 뒤에는 거절·취소가 불가능해진다.)
 *
 * 이 모듈은 순수 함수만 포함한다. 서버(API)가 유일하게 이 모듈로 상태를 바꾸며,
 * 클라이언트는 결과(call.status)를 구독만 한다 — call.status 가 단일 진실 공급원.
 */
import type { MsgKey, MsgParams } from "@/i18n/index";
import type { CallStatus, MemberRole } from "@/types/domain";

export const CALL_ACTIONS = [
  "RECEIVE",
  "ACCEPT",
  "DECLINE",
  "CANCEL",
  "TIMEOUT",
  "DEPART",
  "ARRIVE",
  "START_TRIP",
  "COMPLETE",
] as const;
export type CallAction = (typeof CALL_ACTIONS)[number];

/** 누가 이 액션을 수행할 수 있는가 */
type ActorRule = "ASSIGNED_DRIVER" | "CALLER_OR_OWNER" | "ANY_MEMBER_AFTER_EXPIRY";

interface TransitionRule {
  from: readonly CallStatus[];
  to: CallStatus;
  actor: ActorRule;
}

export const TRANSITIONS: Readonly<Record<CallAction, TransitionRule>> = {
  RECEIVE: { from: ["CALLING"], to: "RECEIVED", actor: "ASSIGNED_DRIVER" },
  ACCEPT: { from: ["RECEIVED"], to: "ACCEPTED", actor: "ASSIGNED_DRIVER" },
  DECLINE: { from: ["CALLING", "RECEIVED"], to: "DECLINED", actor: "ASSIGNED_DRIVER" },
  CANCEL: { from: ["CALLING", "RECEIVED", "ACCEPTED"], to: "CANCELLED", actor: "CALLER_OR_OWNER" },
  TIMEOUT: { from: ["CALLING", "RECEIVED"], to: "TIMEOUT", actor: "ANY_MEMBER_AFTER_EXPIRY" },
  DEPART: { from: ["ACCEPTED"], to: "ON_THE_WAY", actor: "ASSIGNED_DRIVER" },
  ARRIVE: { from: ["ON_THE_WAY"], to: "ARRIVED", actor: "ASSIGNED_DRIVER" },
  START_TRIP: { from: ["ARRIVED"], to: "TRIP_STARTED", actor: "ASSIGNED_DRIVER" },
  COMPLETE: { from: ["TRIP_STARTED"], to: "COMPLETED", actor: "ASSIGNED_DRIVER" },
};

/** 기사 응답을 기다리는 상태 */
export const PENDING_STATUSES: readonly CallStatus[] = ["CREATED", "CALLING", "RECEIVED"];
/** 기사가 수락해 이동/운행 중인 상태 */
export const IN_PROGRESS_STATUSES: readonly CallStatus[] = ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "TRIP_STARTED"];
/** 종료 상태 */
export const TERMINAL_STATUSES: readonly CallStatus[] = ["COMPLETED", "DECLINED", "TIMEOUT", "CANCELLED"];
export const ACTIVE_STATUSES: readonly CallStatus[] = [...PENDING_STATUSES, ...IN_PROGRESS_STATUSES];

export function isTerminal(status: CallStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
export function isActive(status: CallStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}
export function isPending(status: CallStatus): boolean {
  return PENDING_STATUSES.includes(status);
}

export interface TransitionActor {
  userId: string;
  role: MemberRole;
  /** 이 사용자가 연결된 driverId (DRIVER 역할일 때) */
  driverId: string | null;
}

export interface TransitionCallView {
  status: CallStatus;
  driverId: string;
  callerId: string;
  expiresAt: number;
}

export type TransitionErrorCode =
  | "INVALID_ACTION"
  | "INVALID_STATE"
  | "FORBIDDEN"
  | "NOT_EXPIRED";

export type TransitionResult =
  | { ok: true; to: CallStatus; from: CallStatus }
  | { ok: false; code: TransitionErrorCode; messageKey: MsgKey; params?: MsgParams };

export function isCallAction(value: unknown): value is CallAction {
  return typeof value === "string" && (CALL_ACTIONS as readonly string[]).includes(value);
}

/**
 * 상태 전이 가능 여부를 판단한다. 부작용 없음.
 */
export function evaluateTransition(
  call: TransitionCallView,
  action: CallAction,
  actor: TransitionActor,
  now: number,
): TransitionResult {
  const rule = TRANSITIONS[action];
  if (!rule) return { ok: false, code: "INVALID_ACTION", messageKey: "err.call.invalidAction" };

  if (!rule.from.includes(call.status)) {
    return {
      ok: false,
      code: "INVALID_STATE",
      messageKey: "err.call.invalidState",
      params: { status: `@callStatus.${call.status}` },
    };
  }

  switch (rule.actor) {
    case "ASSIGNED_DRIVER":
      if (actor.role !== "DRIVER" || actor.driverId !== call.driverId) {
        return { ok: false, code: "FORBIDDEN", messageKey: "err.call.driverOnly" };
      }
      break;
    case "CALLER_OR_OWNER":
      if (!(actor.userId === call.callerId || actor.role === "OWNER")) {
        return { ok: false, code: "FORBIDDEN", messageKey: "err.call.cancelForbidden" };
      }
      break;
    case "ANY_MEMBER_AFTER_EXPIRY":
      if (now < call.expiresAt) {
        return { ok: false, code: "NOT_EXPIRED", messageKey: "err.call.notExpired" };
      }
      break;
  }

  return { ok: true, from: call.status, to: rule.to };
}

/** 전이 후 기사 상태를 어떻게 바꿔야 하는지 */
export function driverStatusAfter(
  to: CallStatus,
  current: "OFF_DUTY" | "ON_DUTY" | "BUSY" | "INACTIVE",
): "OFF_DUTY" | "ON_DUTY" | "BUSY" | "INACTIVE" {
  if (to === "ACCEPTED" && current === "ON_DUTY") return "BUSY";
  if (isTerminal(to) && current === "BUSY") return "ON_DUTY";
  return current;
}

/** 상태별 타임스탬프 필드 */
export function timestampFieldsFor(to: CallStatus, now: number): Record<string, number> {
  const fields: Record<string, number> = { updatedAt: now };
  if (to === "RECEIVED") fields.receivedAt = now;
  if (to === "ACCEPTED") fields.acceptedAt = now;
  if (to === "TRIP_STARTED") fields.tripStartedAt = now;
  if (to === "COMPLETED") fields.completedAt = now;
  if (to === "CANCELLED") fields.cancelledAt = now;
  if (isTerminal(to)) fields.endedAt = now;
  return fields;
}
