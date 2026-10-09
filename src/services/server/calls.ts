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
import { badRequest, conflict, forbidden, notFound, ApiError } from "@/lib/server/http";
import { notifyUsers } from "@/lib/server/push";
import { acceptableFix, geoExpiryFor } from "@/lib/tripData";
import { recordCompletedTrip } from "@/services/server/tripData";
import type {
  ActualFix,
  CallDoc,
  CallEventDoc,
  CallStatus,
  DriverDoc,
  GroupDoc,
  MemberDoc,
  MemberRole,
  PlaceInput,
} from "@/types/domain";

/** 명세 §5 C04: 기본 60~90초, 운영 데이터로 조정 → 환경변수 */
export function callTimeoutMs(): number {
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
  await expireStaleCalls(groupId, input.driverId);

  const callRef = db.collection(`groups/${groupId}/calls`).doc();
  const driverRef = db.doc(`groups/${groupId}/drivers/${input.driverId}`);
  const now = Date.now();

  const { driver } = await db.runTransaction(async (tx) => {
    const dSnap = await tx.get(driverRef);
    if (!dSnap.exists) throw notFound("err.driverNotFound");
    const driver = dSnap.data() as DriverDoc;
    if (!driver.userId) throw conflict("err.driverNotConnected", "DRIVER_NOT_CONNECTED");
    if (driver.status === "OFF_DUTY" || driver.status === "INACTIVE") {
      throw conflict("err.driverOffDuty", "DRIVER_OFF_DUTY");
    }
    const activeSnap = await tx.get(
      db.collection(`groups/${groupId}/calls`).where("status", "in", [...ACTIVE_STATUSES]),
    );
    const active = activeSnap.docs.map((d) => d.data() as CallDoc).filter((c) => c.driverId === input.driverId);
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

  await Promise.all([
    track("call_created", caller.userId, groupId, { callId: callRef.id }),
    notifyUsers([driver.userId as string], {
      type: "CALL_CREATED",
      groupId,
      callId: callRef.id,
      titleKey: "push.callCreated.title",
      bodyKey: "push.callCreated.body",
      params: { caller: caller.displayName },
      path: `/calls/${callRef.id}?g=${groupId}`,
      urgent: true,
    }),
  ]);
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
    const cSnap = await tx.get(callRef);
    if (!cSnap.exists) throw notFound("err.callNotFound");
    const call = cSnap.data() as CallDoc;
    const driverRef = db.doc(`groups/${groupId}/drivers/${call.driverId}`);
    const dSnap = await tx.get(driverRef);
    const now = Date.now();

    // SYSTEM(만료 처리)은 역할 검사를 거치지 않지만 만료 시각 검사는 동일하게 거친다
    const evalActor =
      actor.role === "SYSTEM"
        ? { userId: "system", role: "OWNER" as const, driverId: null }
        : { userId: actor.userId, role: actor.role, driverId: actor.driverId };
    if (actor.role === "SYSTEM" && action !== "TIMEOUT") throw forbidden();

    const r = evaluateTransition(call, action, evalActor, now);
    if (!r.ok) {
      const status = r.code === "FORBIDDEN" ? 403 : 409;
      throw new ApiError(status, r.code, r.messageKey, r.params);
    }

    const fields: Record<string, unknown> = { status: r.to, ...timestampFieldsFor(r.to, now) };
    // 배정된 기사 본인이 보낸 품질 좋은 GPS만 실제 지점으로 인정
    const fixOk = fix !== null && actor.role === "DRIVER" && actor.driverId === call.driverId && acceptableFix(fix, now);
    if (fixOk && r.to === "TRIP_STARTED") fields.actualPickup = fix;
    if (fixOk && r.to === "COMPLETED") fields.actualDropoff = fix;
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
      const targets = [...toCaller];
      if (driverUserId && driverUserId !== actor.userId) targets.push(driverUserId);
      tasks.push(
        notifyUsers(targets, {
          type: "CALL_CANCELLED",
          groupId,
          callId,
          titleKey: "push.cancelled.title",
          bodyKey: "push.cancelled.body",
          params: { caller: call.callerName },
          path,
        }),
      );
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
  return { status: to };
}

async function groupOwnerIds(groupId: string): Promise<string[]> {
  const snap = await adminDb().collection(`groups/${groupId}/members`).where("role", "==", "OWNER").get();
  return snap.docs.map((d) => (d.data() as MemberDoc).userId);
}

/** 기사 연결 여부 등을 확인할 때 쓰는 헬퍼 */
export async function requireCallInGroup(groupId: string, callId: string): Promise<CallDoc> {
  const snap = await adminDb().doc(`groups/${groupId}/calls/${callId}`).get();
  if (!snap.exists) throw notFound("err.callNotFound");
  return snap.data() as CallDoc;
}

export { expireStaleCalls };
