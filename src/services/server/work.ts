import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { IN_PROGRESS_STATUSES, PENDING_STATUSES } from "@/lib/callStateMachine";
import { track } from "@/lib/server/analytics";
import { writeAudit } from "@/lib/server/audit";
import { badRequest, conflict, notFound } from "@/lib/server/http";
import { notifyUsers } from "@/lib/server/push";
import { formatTime } from "@/lib/time";
import { expireStaleCalls } from "@/services/server/calls";
import type { CallDoc, DriverDoc, GroupDoc, MemberDoc, WorkSessionDoc } from "@/types/domain";

/** 명세 §10 — 출근/퇴근은 서버 timestamp 로 기록 */
export async function clock(
  group: GroupDoc,
  member: MemberDoc,
  action: "CLOCK_IN" | "CLOCK_OUT",
  /** 출근 시 위치 공유 여부 (기사가 안내를 보고 선택) */
  shareLocation = false,
): Promise<{ sessionId: string }> {
  if (!member.driverId) throw badRequest("err.driverOnlyClock");
  const db = adminDb();
  const groupId = group.id;
  const driverRef = db.doc(`groups/${groupId}/drivers/${member.driverId}`);
  const locationRef = db.doc(`groups/${groupId}/driverLocations/${member.driverId}`);

  if (action === "CLOCK_OUT") await expireStaleCalls(groupId, member.driverId);

  const now = Date.now();
  const sessionId = await db.runTransaction(async (tx) => {
    const dSnap = await tx.get(driverRef);
    if (!dSnap.exists) throw notFound("err.driverNotFound");
    const driver = dSnap.data() as DriverDoc;
    if (driver.userId !== member.userId) throw badRequest("err.notLinkedDriver");

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
      };
      tx.create(ref, session);
      tx.update(driverRef, {
        status: "ON_DUTY",
        currentSessionId: ref.id,
        lastClockInAt: now,
        locationSharing: shareLocation,
        ...(shareLocation && !driver.locationConsentAt ? { locationConsentAt: now } : {}),
        updatedAt: now,
      });
      tx.delete(locationRef); // 이전 근무의 잔여 위치 제거
      return ref.id;
    }

    if (!driver.currentSessionId) throw conflict("err.notClockedIn", "NOT_CLOCKED_IN");
    const activeSnap = await tx.get(
      db.collection(`groups/${groupId}/calls`).where("status", "in", [...PENDING_STATUSES, ...IN_PROGRESS_STATUSES]),
    );
    const active = activeSnap.docs.map((d) => d.data() as CallDoc).filter((c) => c.driverId === driver.id);
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
    tx.update(sRef, { clockOutAt: now });
    tx.update(driverRef, { status: "OFF_DUTY", currentSessionId: null, locationSharing: false, updatedAt: now });
    tx.delete(locationRef); // 퇴근 즉시 위치 삭제 (명세 §24)
    return driver.currentSessionId;
  });

  const owners = await db.collection(`groups/${groupId}/members`).where("role", "in", ["OWNER", "MEMBER"]).get();
  const recipients = owners.docs.map((d) => (d.data() as MemberDoc).userId);
  const t = formatTime(now, group.timezone);
  await Promise.all([
    track(action === "CLOCK_IN" ? "clock_in" : "clock_out", member.userId, groupId),
    notifyUsers(recipients, {
      type: action === "CLOCK_IN" ? "DRIVER_CLOCK_IN" : "DRIVER_CLOCK_OUT",
      groupId,
      callId: null,
      titleKey: action === "CLOCK_IN" ? "push.clockIn.title" : "push.clockOut.title",
      bodyKey: action === "CLOCK_IN" ? "push.clockIn.body" : "push.clockOut.body",
      params: { driver: member.displayName, time: t },
      path: "/home",
    }),
  ]);
  return { sessionId };
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
