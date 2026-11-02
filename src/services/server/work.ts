import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { IN_PROGRESS_STATUSES, PENDING_STATUSES } from "@/lib/callStateMachine";
import { track } from "@/lib/server/analytics";
import { writeAudit } from "@/lib/server/audit";
import { badRequest, conflict, notFound } from "@/lib/server/http";
import { notifyUsers } from "@/lib/server/push";
import { runAfterResponse } from "@/lib/server/defer";
import { formatTime } from "@/lib/time";
import { expireStaleCalls } from "@/services/server/calls";
import type { CallDoc, DriverDoc, GroupDoc, MemberDoc, WorkSessionDoc } from "@/types/domain";

/**
 * 명세 §10 — 출근/퇴근은 서버 timestamp 로 기록.
 * 기사 본인, 또는 관리자(OWNER)가 기사 대신 누를 수 있다 (기사가 깜빡한 경우 대비).
 * 관리자가 누르면 근무기록에 누가 눌렀는지 남기고(감사 로그 포함) 기사에게 알림을 보낸다.
 */
export async function clock(
  group: GroupDoc,
  member: MemberDoc,
  action: "CLOCK_IN" | "CLOCK_OUT",
  /** 출근 시 위치 공유 여부 (기사가 안내를 보고 선택 — 관리자가 대신 누르면 항상 꺼짐) */
  shareLocation = false,
  /** 관리자가 대신 누를 때 대상 기사 */
  targetDriverId?: string,
): Promise<{ sessionId: string }> {
  const byOwner = member.role !== "DRIVER";
  const driverId = byOwner ? targetDriverId : member.driverId;
  if (!driverId) throw badRequest(byOwner ? "err.driverNotFound" : "err.driverOnlyClock");
  if (byOwner && member.role !== "OWNER") throw badRequest("err.driverOnlyClock");
  const share = byOwner ? false : shareLocation;
  const db = adminDb();
  const groupId = group.id;
  const driverRef = db.doc(`groups/${groupId}/drivers/${driverId}`);
  const locationRef = db.doc(`groups/${groupId}/driverLocations/${driverId}`);

  const now = Date.now();
  let driverSnapshot: DriverDoc | null = null;
  const sessionId = await db.runTransaction(async (tx) => {
    // 퇴근이면 기사 문서와 진행 중 호출을 한 번에 읽는다
    const [dSnap, activeSnap] = await Promise.all([
      tx.get(driverRef),
      action === "CLOCK_OUT"
        ? tx.get(db.collection(`groups/${groupId}/calls`).where("status", "in", [...PENDING_STATUSES, ...IN_PROGRESS_STATUSES]))
        : Promise.resolve(null),
    ]);
    if (!dSnap.exists || (dSnap.data() as DriverDoc).removedAt) throw notFound("err.driverNotFound");
    const driver = dSnap.data() as DriverDoc;
    driverSnapshot = driver;
    if (!byOwner && driver.userId !== member.userId) throw badRequest("err.notLinkedDriver");

    if (action === "CLOCK_IN") {
      if (driver.currentSessionId) throw conflict("err.alreadyClockedIn", "ALREADY_CLOCKED_IN");
      const ref = db.collection(`groups/${groupId}/workSessions`).doc();
      const session: WorkSessionDoc = {
        id: ref.id,
        groupId,
        driverId: driver.id,
        clockInAt: now,
        clockOutAt: null,
        timezone: group.timezone,
        createdAt: now,
        editedBy: null,
        editedAt: null,
        clockInBy: byOwner ? member.userId : null,
      };
      tx.create(ref, session);
      tx.update(driverRef, {
        status: "ON_DUTY",
        currentSessionId: ref.id,
        lastClockInAt: now,
        locationSharing: share,
        ...(share && !driver.locationConsentAt ? { locationConsentAt: now } : {}),
        updatedAt: now,
      });
      if (byOwner) {
        writeAudit(
          groupId,
          { action: "DRIVER_CLOCK_IN_BY_OWNER", actorId: member.userId, targetType: "workSession", targetId: ref.id, after: { clockInAt: now } },
          tx,
        );
      }
      tx.delete(locationRef); // 이전 근무의 잔여 위치 제거
      return ref.id;
    }

    if (!driver.currentSessionId) throw conflict("err.notClockedIn", "NOT_CLOCKED_IN");
    if (!activeSnap) throw new Error("unreachable");
    // 응답 시간이 지난 대기 호출은 막지 않는다 (응답 뒤 TIMEOUT 처리)
    const active = activeSnap.docs
      .map((d) => d.data() as CallDoc)
      .filter((c) => c.driverId === driver.id && !(PENDING_STATUSES.includes(c.status) && c.expiresAt <= now));
    if (active.length > 0) {
      const c = active[0];
      throw conflict(
        c && IN_PROGRESS_STATUSES.includes(c.status)
          ? "err.finishTripFirst"
          : "err.respondFirst",
        "ACTIVE_CALL",
      );
    }
    const sRef = db.doc(`groups/${groupId}/workSessions/${driver.currentSessionId}`);
    tx.update(sRef, { clockOutAt: now, ...(byOwner ? { clockOutBy: member.userId } : {}) });
    if (byOwner) {
      writeAudit(
        groupId,
        {
          action: "DRIVER_CLOCK_OUT_BY_OWNER",
          actorId: member.userId,
          targetType: "workSession",
          targetId: driver.currentSessionId,
          after: { clockOutAt: now },
        },
        tx,
      );
    }
    tx.update(driverRef, { status: "OFF_DUTY", currentSessionId: null, locationSharing: false, updatedAt: now });
    tx.delete(locationRef); // 퇴근 즉시 위치 삭제 (명세 §24)
    return driver.currentSessionId;
  });

  const driverDoc = driverSnapshot as DriverDoc | null;
  const driverName = driverDoc?.displayName ?? member.displayName;
  // 알림·기록은 응답을 돌려준 뒤 처리 — 버튼 반응이 빨라지도록
  await runAfterResponse(() => notifyClock(group, member, action, now, driverName, driverDoc, byOwner, driverId));
  return { sessionId };
}

async function notifyClock(
  group: GroupDoc,
  member: MemberDoc,
  action: "CLOCK_IN" | "CLOCK_OUT",
  now: number,
  driverName: string,
  driverDoc: DriverDoc | null,
  byOwner: boolean,
  driverId: string,
): Promise<void> {
  const db = adminDb();
  const groupId = group.id;
  if (action === "CLOCK_OUT") await expireStaleCalls(groupId, driverId);
  const owners = await db.collection(`groups/${groupId}/members`).where("role", "in", ["OWNER", "MEMBER"]).get();
  // 누른 사람 본인에게는 알리지 않는다
  const recipients = owners.docs.map((d) => (d.data() as MemberDoc).userId).filter((id) => id !== member.userId);
  const t = formatTime(now, group.timezone);
  const tasks: Promise<unknown>[] = [
    track(action === "CLOCK_IN" ? "clock_in" : "clock_out", member.userId, groupId, { byOwner }),
    notifyUsers(recipients, {
      type: action === "CLOCK_IN" ? "DRIVER_CLOCK_IN" : "DRIVER_CLOCK_OUT",
      groupId,
      callId: null,
      titleKey: action === "CLOCK_IN" ? "push.clockIn.title" : "push.clockOut.title",
      bodyKey: action === "CLOCK_IN" ? "push.clockIn.body" : "push.clockOut.body",
      params: { driver: driverName, time: t },
      path: "/home",
    }),
  ];
  // 관리자가 대신 눌렀으면 기사에게 알린다 (기사 언어로)
  if (byOwner && driverDoc?.userId) {
    tasks.push(
      notifyUsers([driverDoc.userId], {
        type: action === "CLOCK_IN" ? "DRIVER_CLOCK_IN" : "DRIVER_CLOCK_OUT",
        groupId,
        callId: null,
        titleKey: action === "CLOCK_IN" ? "push.clockInByOwner.title" : "push.clockOutByOwner.title",
        bodyKey: action === "CLOCK_IN" ? "push.clockInByOwner.body" : "push.clockOutByOwner.body",
        params: { owner: member.displayName, time: t },
        path: "/home",
      }),
    );
  }
  await Promise.all(tasks);
}

/** 근무기록 수정 — Owner 전용, 감사 로그 필수 (명세 §29 "기록 수정 권한 통제") */
export async function editWorkSession(
  groupId: string,
  sessionId: string,
  actorId: string,
  patch: { clockInAt: number; clockOutAt: number | null },
): Promise<void> {
  if (patch.clockOutAt !== null && patch.clockOutAt <= patch.clockInAt) {
    throw badRequest("err.clockOutBeforeIn");
  }
  if (patch.clockOutAt !== null && patch.clockOutAt - patch.clockInAt > 24 * 3600 * 1000) {
    throw badRequest("err.sessionTooLong");
  }
  const db = adminDb();
  const sRef = db.doc(`groups/${groupId}/workSessions/${sessionId}`);
  await db.runTransaction(async (tx) => {
    const sSnap = await tx.get(sRef);
    if (!sSnap.exists) throw notFound("err.workNotFound");
    const before = sSnap.data() as WorkSessionDoc;
    const driverRef = db.doc(`groups/${groupId}/drivers/${before.driverId}`);
    const dSnap = await tx.get(driverRef);
    const driver = dSnap.exists ? (dSnap.data() as DriverDoc) : null;
    const isCurrent = driver?.currentSessionId === sessionId;

    if (!isCurrent && patch.clockOutAt === null) {
      throw badRequest("err.closedNeedsOut");
    }
    if (isCurrent && patch.clockOutAt !== null && driver?.status === "BUSY") {
      throw conflict("err.busyCantClockOut", "DRIVER_BUSY");
    }

    const now = Date.now();
    tx.update(sRef, { clockInAt: patch.clockInAt, clockOutAt: patch.clockOutAt, editedBy: actorId, editedAt: now });
    if (isCurrent && patch.clockOutAt !== null) {
      // 관리자가 진행 중인 근무를 마감 → 기사 퇴근 처리
      tx.update(driverRef, { status: "OFF_DUTY", currentSessionId: null, locationSharing: false, updatedAt: now });
      tx.delete(db.doc(`groups/${groupId}/driverLocations/${before.driverId}`));
    } else if (isCurrent) {
      tx.update(driverRef, { lastClockInAt: patch.clockInAt, updatedAt: now });
    }
    writeAudit(
      groupId,
      {
        action: "WORK_SESSION_EDITED",
        actorId,
        targetType: "workSession",
        targetId: sessionId,
        before: { clockInAt: before.clockInAt, clockOutAt: before.clockOutAt },
        after: { clockInAt: patch.clockInAt, clockOutAt: patch.clockOutAt },
      },
      tx,
    );
  });
}
