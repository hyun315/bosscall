import "server-only";
import type { Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  ACTIVE_STATUSES,
  PENDING_STATUSES,
  driverStatusAfter,
  evaluateTransition,
  timestampFieldsFor,
  type CallAction,
} from "@/lib/callStateMachine";
import { track, type AnalyticsEvent } from "@/lib/server/analytics";
import { conflict, forbidden, notFound, ApiError } from "@/lib/server/http";
import { notifyUsers } from "@/lib/server/push";
import { runAfterResponse } from "@/lib/server/defer";
import { acceptableFix, geoExpiryFor } from "@/lib/tripData";
import { recordCompletedTrip } from "@/services/server/tripData";
import type {
  ActualFix,
  CallDoc,
  CallEventDoc,
  CallStatus,
  DriverDoc,
  MemberDoc,
  MemberRole,
  PlaceInput,
} from "@/types/domain";

/** 명세 §5 C04: 기본 60~90초, 운영 데이터로 조정 → 환경변수 */
function callTimeoutMs(): number {
  const sec = Number(process.env.CALL_TIMEOUT_SECONDS ?? "90");
  return (Number.isFinite(sec) && sec >= 30 && sec <= 600 ? sec : 90) * 1000;
}

function eventRef(groupId: string, callId: string) {
  return adminDb().collection(`groups/${groupId}/calls/${callId}/events`).doc();
}

function appendEvent(
  tx: Transaction,
  call: { groupId: string; id: string },
  e: Omit<CallEventDoc, "id" | "callId" | "groupId">,
): void {
  const ref = eventRef(call.groupId, call.id);
  const doc: CallEventDoc = { id: ref.id, callId: call.id, groupId: call.groupId, ...e };
  tx.create(ref, doc); // create: 기존 이벤트 덮어쓰기 불가 (append-only)
}

/**
 * 만료된 대기 호출을 TIMEOUT 처리 (지연 처리 방식).
 * Vercel 무료 플랜에는 초 단위 스케줄러가 없으므로, 호출 화면의 카운트다운 종료·새 호출 생성·퇴근 시점에
 * 서버가 만료 여부를 다시 검증해 전이한다. 판단 기준은 항상 서버 시각이다.
 */
async function expireStaleCalls(groupId: string, driverId: string): Promise<void> {
  const db = adminDb();
  const now = Date.now();
  // status 단일 필드 쿼리(복합 색인 불필요) 후 기사 필터 — 그룹의 진행 중 호출은 소수다
  const snap = await db
    .collection(`groups/${groupId}/calls`)
    .where("status", "in", [...PENDING_STATUSES])
    .get();
  for (const d of snap.docs) {
    const c = d.data() as CallDoc;
    if (c.driverId === driverId && c.expiresAt <= now) {
      try {
        await transitionCall(groupId, c.id, "TIMEOUT", { userId: "system", role: "SYSTEM", driverId: null });
      } catch (e) {
        if (!(e instanceof ApiError)) throw e; // 이미 다른 요청이 처리한 경우 무시
      }
    }
  }
}

export interface CreateCallInput {
  driverId: string;
  pickup: PlaceInput;
  destination: PlaceInput;
}

export async function createCall(
  groupId: string,
  caller: MemberDoc,
  input: CreateCallInput,
): Promise<{ callId: string }> {
  const db = adminDb();
  // 만료된 대기 호출은 아래 트랜잭션에서 '진행 중'으로 보지 않고, 응답 뒤에 TIMEOUT 처리한다 (호출이 빨라지도록)
  const callRef = db.collection(`groups/${groupId}/calls`).doc();
  const driverRef = db.doc(`groups/${groupId}/drivers/${input.driverId}`);
  const now = Date.now();

  const { driver } = await db.runTransaction(async (tx) => {
    // 기사 문서와 진행 중 호출을 동시에 읽는다 (왕복 1번)
    const [dSnap, activeSnap] = await Promise.all([
      tx.get(driverRef),
      tx.get(db.collection(`groups/${groupId}/calls`).where("status", "in", [...ACTIVE_STATUSES])),
    ]);
    if (!dSnap.exists) throw notFound("err.driverNotFound");
    const driver = dSnap.data() as DriverDoc;
    if (!driver.userId) throw conflict("err.driverNotConnected", "DRIVER_NOT_CONNECTED");
    if (driver.status === "OFF_DUTY" || driver.status === "INACTIVE") {
      throw conflict("err.driverOffDuty", "DRIVER_OFF_DUTY");
    }
    const active = activeSnap.docs
      .map((d) => d.data() as CallDoc)
      .filter((c) => c.driverId === input.driverId && !(PENDING_STATUSES.includes(c.status) && c.expiresAt <= now));
    if (active.length > 0) {
      const existing = active[0];
      throw existing
        ? new ApiError(409, "DRIVER_BUSY", "err.driverBusyWith", { name: existing.callerName })
        : new ApiError(409, "DRIVER_BUSY", "err.driverBusy");
    }

    const call: CallDoc = {
      id: callRef.id,
      groupId,
      driverId: input.driverId,
      driverName: driver.displayName,
      callerId: caller.userId,
      callerName: caller.displayName,
      pickupLat: input.pickup.lat,
      pickupLng: input.pickup.lng,
      pickupAddress: input.pickup.address,
      pickupName: input.pickup.name,
      pickupPlaceId: input.pickup.placeId,
      destinationLat: input.destination.lat,
      destinationLng: input.destination.lng,
      destinationAddress: input.destination.address,
      destinationName: input.destination.name,
      destinationPlaceId: input.destination.placeId,
      pickupSource: input.pickup.source ?? "google",
      destinationSource: input.destination.source ?? "google",
      pickupCategory: input.pickup.category ?? null,
      destinationCategory: input.destination.category ?? null,
      geoExpiresAt: geoExpiryFor([input.pickup, input.destination], now),
      coordsCleared: false,
      actualPickup: null,
      actualDropoff: null,
      tripStartedAt: null,
      status: "CALLING",
      createdAt: now,
      expiresAt: now + callTimeoutMs(),
      receivedAt: null,
      acceptedAt: null,
      completedAt: null,
      cancelledAt: null,
      endedAt: null,
      updatedAt: now,
    };
    tx.create(callRef, call);
    // CREATED → CALLING 을 모두 이벤트로 남긴다 (명세 §7)
    appendEvent(tx, call, {
      eventType: "CREATED",
      fromStatus: null,
      actorId: caller.userId,
      actorRole: caller.role,
      createdAt: now,
      metadata: { pickupPlaceId: input.pickup.placeId, destinationPlaceId: input.destination.placeId },
    });
    appendEvent(tx, call, {
      eventType: "CALLING",
      fromStatus: "CREATED",
      actorId: "system",
      actorRole: "SYSTEM",
      createdAt: now,
      metadata: { timeoutMs: callTimeoutMs() },
    });
    return { driver };
  });

  // 응답을 먼저 돌려주고 기사 알림·기록·만료 정리는 바로 이어서 처리
  await runAfterResponse(async () => {
    await notifyUsers([driver.userId as string], {
      type: "CALL_CREATED",
      groupId,
      callId: callRef.id,
      titleKey: "push.callCreated.title",
      bodyKey: "push.callCreated.body",
      params: { caller: caller.displayName },
      path: `/calls/${callRef.id}?g=${groupId}`,
      urgent: true,
    });
    await Promise.all([
      track("call_created", caller.userId, groupId, { callId: callRef.id }),
      expireStaleCalls(groupId, input.driverId),
    ]);
  });
  return { callId: callRef.id };
}

export interface ActorContext {
  userId: string;
  role: MemberRole | "SYSTEM";
  driverId: string | null;
}

const ANALYTICS_FOR: Partial<Record<CallStatus, AnalyticsEvent>> = {
  ACCEPTED: "call_accepted",
  DECLINED: "call_declined",
  TIMEOUT: "call_timeout",
  CANCELLED: "call_cancelled",
  COMPLETED: "call_completed",
};

/**
 * 모든 상태 변경의 유일한 진입점. 서버가 전이를 검증하고(코딩규칙 6·7),
 * call 문서·기사 상태·call_events 를 하나의 트랜잭션으로 기록한다(코딩규칙 8).
 */
export async function transitionCall(
  groupId: string,
  callId: string,
  action: CallAction,
  actor: ActorContext,
  /** 기사 기기 GPS — 탑승 시작·운행 완료 때만 저장 (실제 출발·도착 지점, 자체 데이터) */
  fix: ActualFix | null = null,
): Promise<{ status: CallStatus }> {
  const db = adminDb();
  const callRef = db.doc(`groups/${groupId}/calls/${callId}`);

  const outcome = await db.runTransaction(async (tx) => {
    // 기사가 누른 경우 기사 문서 경로를 이미 알므로 호출·기사를 한 번에 읽는다 (왕복 1번 절약)
    const knownDriverRef = actor.driverId ? db.doc(`groups/${groupId}/drivers/${actor.driverId}`) : null;
    const [cSnap, preDriverSnap] = await Promise.all([tx.get(callRef), knownDriverRef ? tx.get(knownDriverRef) : null]);
    if (!cSnap.exists) throw notFound("err.callNotFound");
    const original = cSnap.data() as CallDoc;
    const driverRef = db.doc(`groups/${groupId}/drivers/${original.driverId}`);
    const dSnap =
      preDriverSnap && knownDriverRef && knownDriverRef.path === driverRef.path ? preDriverSnap : await tx.get(driverRef);
    const now = Date.now();

    // SYSTEM(만료 처리)은 역할 검사를 거치지 않지만 만료 시각 검사는 동일하게 거친다
    const evalActor =
      actor.role === "SYSTEM"
        ? { userId: "system", role: "OWNER" as const, driverId: null }
        : { userId: actor.userId, role: actor.role, driverId: actor.driverId };
    if (actor.role === "SYSTEM" && action !== "TIMEOUT") throw forbidden();

    // 기사 화면이 '전달됨'을 보내기 전에 바로 수락하면, 같은 트랜잭션에서 전달됨 → 수락 순서를 모두 기록한다
    // (상태머신 순서 CALLING→RECEIVED→ACCEPTED 유지, 서버 왕복은 1번)
    let call = original;
    let receivedFields: Record<string, unknown> = {};
    if (action === "ACCEPT" && original.status === "CALLING") {
      const r0 = evaluateTransition(original, "RECEIVE", evalActor, now);
      if (r0.ok) {
        receivedFields = timestampFieldsFor(r0.to, now);
        appendEvent(tx, original, {
          eventType: r0.to,
          fromStatus: r0.from,
          actorId: actor.userId,
          actorRole: actor.role,
          createdAt: now - 1,
          metadata: { action: "RECEIVE" },
        });
        call = { ...original, status: r0.to };
      }
    }

    const r = evaluateTransition(call, action, evalActor, now);
    if (!r.ok) {
      const status = r.code === "FORBIDDEN" ? 403 : 409;
      throw new ApiError(status, r.code, r.messageKey, r.params);
    }

    const fields: Record<string, unknown> = { status: r.to, ...receivedFields, ...timestampFieldsFor(r.to, now) };
    // 배정된 기사 본인이 보낸 품질 좋은 GPS만 실제 지점으로 인정
    const fixOk = fix !== null && actor.role === "DRIVER" && actor.driverId === call.driverId && acceptableFix(fix, now);
    if (fixOk && r.to === "TRIP_STARTED") fields.actualPickup = fix;
    if (fixOk && r.to === "COMPLETED") fields.actualDropoff = fix;
    // 기사가 아닌 사람이 취소 → 기사가 [확인]할 때까지 기사 앱에서 알람
    if (r.to === "CANCELLED" && actor.role !== "DRIVER") fields.cancelAlertFor = call.driverId;
    tx.update(callRef, fields);
    appendEvent(tx, call, {
      eventType: r.to,
      fromStatus: r.from,
      actorId: actor.userId,
      actorRole: actor.role,
      createdAt: now,
      metadata: { action },
    });

    if (dSnap.exists) {
      const driver = dSnap.data() as DriverDoc;
      const nextStatus = driverStatusAfter(r.to, driver.status);
      if (nextStatus !== driver.status) tx.update(driverRef, { status: nextStatus, updatedAt: now });
    }
    return {
      call: { ...call, ...fields } as CallDoc,
      to: r.to,
      driverUserId: dSnap.exists ? (dSnap.data() as DriverDoc).userId : null,
    };
  });

  const { call, to, driverUserId } = outcome;
  // 알림·통계는 응답을 돌려준 뒤 처리 — 버튼을 누른 사람은 바로 다음 화면으로
  await runAfterResponse(async () => {
    const analyticsEvent = ANALYTICS_FOR[to];
    const tasks: Promise<unknown>[] = [];
    if (analyticsEvent) {
      const props: Record<string, number | string> = { callId };
      if (to === "ACCEPTED") props.responseMs = Date.now() - call.createdAt;
      tasks.push(track(analyticsEvent, actor.userId === "system" ? null : actor.userId, groupId, props));
    }

    const path = `/calls/${callId}?g=${groupId}`;
    const driverName = call.driverName;
    // 호출자(와 관리자)에게 결과 알림
    const ownerIds = await groupOwnerIds(groupId);
    const toCaller = [call.callerId, ...ownerIds].filter((id) => id !== actor.userId);
    switch (to) {
      case "ACCEPTED":
        tasks.push(
          notifyUsers(toCaller, {
            type: "CALL_ACCEPTED",
            groupId,
            callId,
            titleKey: "push.accepted.title",
            bodyKey: "push.accepted.body",
            params: { driver: driverName, caller: call.callerName },
            path,
          }),
        );
        break;
      case "DECLINED":
        tasks.push(
          notifyUsers(toCaller, {
            type: "CALL_DECLINED",
            groupId,
            callId,
            titleKey: "push.declined.title",
            bodyKey: "push.declined.body",
            params: { driver: driverName },
            path,
          }),
        );
        break;
      case "CANCELLED": {
        tasks.push(
          notifyUsers(toCaller, {
            type: "CALL_CANCELLED",
            groupId,
            callId,
            titleKey: "push.cancelled.title",
            bodyKey: "push.cancelled.body",
            params: { caller: call.callerName },
            path,
          }),
        );
        // 기사: 호출 알람처럼 소리·진동, 확인할 때까지 다시 보낸다
        if (driverUserId && driverUserId !== actor.userId && call.cancelAlertFor) {
          tasks.push(sendCancelAlert(driverUserId, groupId, callId, call.callerName, true));
          tasks.push(repeatCancelAlerts(groupId, callId, driverUserId, call.callerName));
        }
        break;
      }
      case "COMPLETED":
        // 익명 통계·관심 분류 — 동의한 호출자만. 실패해도 운행 완료에는 영향 없음
        tasks.push(recordCompletedTrip(call).catch((e) => console.error("tripData", e)));
        tasks.push(
          notifyUsers(toCaller, {
            type: "CALL_COMPLETED",
            groupId,
            callId,
            titleKey: "push.completed.title",
            bodyKey: "push.completed.body",
            params: { caller: call.callerName },
            path,
          }),
        );
        break;
      default:
        break;
    }
    await Promise.all(tasks);
  });
  return { status: to };
}

async function groupOwnerIds(groupId: string): Promise<string[]> {
  const snap = await adminDb().collection(`groups/${groupId}/members`).where("role", "==", "OWNER").get();
  return snap.docs.map((d) => (d.data() as MemberDoc).userId);
}

/** 응답 재촉 알림: 최소 간격·최대 횟수 (호출 대기 90초 동안 최대 4번) */
const NUDGE_MIN_INTERVAL_MS = 14_000;
const NUDGE_MAX = 4;
/** 서버가 스스로 다시 보내는 간격 — 호출 생성 요청이 끝난 뒤 백그라운드에서 */
const SERVER_NUDGE_DELAYS_MS = [15_000, 30_000, 45_000] as const;

/**
 * 기사가 아직 응답하지 않은 호출에 푸시 알림을 다시 보낸다.
 * 앱이 닫혀 있는 기사 휴대폰은 웹앱이 소리를 계속 낼 수 없으므로, 호출자 화면이 열려 있는 동안
 * 일정 간격으로 알림을 다시 울리게 한다. 간격·횟수는 서버가 강제한다.
 */
async function nudgeDriver(groupId: string, callId: string): Promise<{ sent: boolean }> {
  const db = adminDb();
  const callRef = db.doc(`groups/${groupId}/calls/${callId}`);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(callRef);
    if (!snap.exists) throw notFound("err.callNotFound");
    const call = snap.data() as CallDoc;
    const now = Date.now();
    const waiting = (call.status === "CALLING" || call.status === "RECEIVED") && call.expiresAt > now;
    const count = call.nudgeCount ?? 0;
    const recent = call.lastNudgeAt != null && now - call.lastNudgeAt < NUDGE_MIN_INTERVAL_MS;
    if (!waiting || recent || count >= NUDGE_MAX) return null;
    tx.update(callRef, { lastNudgeAt: now, nudgeCount: count + 1 });
    return call;
  });
  if (!result) return { sent: false };

  const dSnap = await db.doc(`groups/${groupId}/drivers/${result.driverId}`).get();
  const driverUserId = (dSnap.data() as DriverDoc | undefined)?.userId;
  if (!driverUserId) return { sent: false };
  await notifyUsers([driverUserId], {
    type: "CALL_CREATED",
    groupId,
    callId,
    titleKey: "push.callReminder.title",
    bodyKey: "push.callReminder.body",
    params: { caller: result.callerName },
    path: `/calls/${callId}?g=${groupId}`,
    urgent: true,
    inbox: false,
  });
  return { sent: true };
}

/**
 * 기사 앱이 뒤에 있거나 닫혀 있으면 웹앱은 소리를 직접 반복할 수 없다.
 * 그래서 호출을 만든 뒤 서버가 15·30·45초에 아직 응답이 없으면 알림을 다시 보낸다
 * (호출자 화면이 닫혀 있어도). 응답·취소·시간 초과가 되면 nudgeDriver 가 아무것도 보내지 않는다.
 */
function sendCancelAlert(driverUserId: string, groupId: string, callId: string, caller: string, inbox: boolean) {
  return notifyUsers([driverUserId], {
    type: "CALL_CANCELLED",
    groupId,
    callId,
    titleKey: "push.cancelledDriver.title",
    bodyKey: "push.cancelledDriver.body",
    params: { caller },
    path: `/calls/${callId}?g=${groupId}`,
    urgent: true,
    inbox,
  });
}

/** 취소 알림도 호출처럼 — 기사가 [확인]하지 않으면 15·30·45초에 다시 보낸다 */
async function repeatCancelAlerts(groupId: string, callId: string, driverUserId: string, caller: string): Promise<void> {
  const start = Date.now();
  for (const at of SERVER_NUDGE_DELAYS_MS) {
    const wait = start + at - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      const snap = await adminDb().doc(`groups/${groupId}/calls/${callId}`).get();
      if (!(snap.data() as CallDoc | undefined)?.cancelAlertFor) return; // 확인함 → 중단
      await sendCancelAlert(driverUserId, groupId, callId, caller, false);
    } catch (e) {
      console.error("[cancel-alert] repeat failed", e);
      return;
    }
  }
}

/** 기사가 취소 알림을 [확인] — 알람 멈춤 */
export async function ackCancelAlert(groupId: string, callId: string, driverId: string | null): Promise<void> {
  const ref = adminDb().doc(`groups/${groupId}/calls/${callId}`);
  const snap = await ref.get();
  if (!snap.exists) throw notFound("err.callNotFound");
  const call = snap.data() as CallDoc;
  if (!driverId || call.driverId !== driverId) throw forbidden();
  if (call.cancelAlertFor) await ref.update({ cancelAlertFor: null, cancelAckAt: Date.now() });
}

export async function repeatNudges(groupId: string, callId: string): Promise<void> {
  const start = Date.now();
  for (const at of SERVER_NUDGE_DELAYS_MS) {
    const wait = start + at - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      const snap = await adminDb().doc(`groups/${groupId}/calls/${callId}`).get();
      const status = (snap.data() as CallDoc | undefined)?.status;
      if (status !== "CALLING" && status !== "RECEIVED") return; // 응답했거나 끝남 → 중단
      await nudgeDriver(groupId, callId);
    } catch (e) {
      console.error("[nudge] repeat failed", e);
      return;
    }
  }
}


export { expireStaleCalls };
