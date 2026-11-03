import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { type ClockInReminder, reminderDue } from "@/lib/clockInReminder";
import { conflict, notFound } from "@/lib/server/http";
import { notifyUsers } from "@/lib/server/push";
import type { DriverDoc, GroupDoc, MemberDoc } from "@/types/domain";

/**
 * 출근 관련 알림
 *  - 출근 요청: 사장님·가족이 단추 하나로 기사에게 "출근을 눌러 주세요"
 *  - 출근 깜빡 알림: 정한 요일·시각이 지나도 출근을 안 눌렀으면 하루 한 번 자동으로
 *    (정기 실행: GitHub Actions 가 10분마다 /api/cron/clockin-reminders 를 부른다 — 하루 한 번만 보내므로 여러 번 불러도 안전)
 */

async function readDriver(groupId: string, driverId: string): Promise<DriverDoc> {
  const snap = await adminDb().doc(`groups/${groupId}/drivers/${driverId}`).get();
  const d = snap.data() as DriverDoc | undefined;
  if (!d || d.removedAt) throw notFound("err.driverNotFound");
  return d;
}

export async function requestClockIn(groupId: string, driverId: string, requester: MemberDoc): Promise<void> {
  const driver = await readDriver(groupId, driverId);
  if (!driver.userId) throw conflict("err.driverNotConnected", "DRIVER_NOT_CONNECTED");
  if (driver.currentSessionId) throw conflict("err.driverAlreadyOnDuty", "ALREADY_ON_DUTY");
  await notifyUsers([driver.userId], {
    type: "CLOCK_IN_REQUEST",
    groupId,
    callId: null,
    titleKey: "push.clockInRequest.title",
    bodyKey: "push.clockInRequest.body",
    params: { caller: requester.displayName },
    path: "/home",
  });
}

/** 출근 깜빡 알림 설정 (null = 끄기) — 기사 문서(화면 표시용)와 정기 실행 목록에 같이 저장 */
export async function setClockInReminder(groupId: string, driverId: string, rem: ClockInReminder | null): Promise<void> {
  const db = adminDb();
  await readDriver(groupId, driverId);
  const listRef = db.doc(`clockInReminders/${groupId}_${driverId}`);
  const batch = db.batch();
  batch.update(db.doc(`groups/${groupId}/drivers/${driverId}`), { clockInReminder: rem, updatedAt: Date.now() });
  if (rem) {
    const group = (await db.doc(`groups/${groupId}`).get()).data() as GroupDoc | undefined;
    batch.set(listRef, { groupId, driverId, ...rem, timezone: group?.timezone ?? "Asia/Jakarta", lastSentDay: null });
  } else {
    batch.delete(listRef);
  }
  await batch.commit();
}

interface ReminderRow extends ClockInReminder {
  groupId: string;
  driverId: string;
  timezone: string;
  lastSentDay: number | null;
}

/** 정기 실행 — 보낼 차례인 기사에게 알림. 보낸 수를 돌려준다 */
export async function runClockInReminders(now = Date.now()): Promise<number> {
  const db = adminDb();
  const rows = await db.collection("clockInReminders").get();
  let sent = 0;
  await Promise.all(
    rows.docs.map(async (doc) => {
      const r = doc.data() as ReminderRow;
      const day = reminderDue(r, r.lastSentDay, now, r.timezone);
      if (day === null) return;
      // 같은 날 두 번 보내지 않게 먼저 표시 (동시에 두 번 불려도 하나만 통과)
      const claimed = await db.runTransaction(async (tx) => {
        const fresh = (await tx.get(doc.ref)).data() as ReminderRow | undefined;
        if (!fresh || fresh.lastSentDay === day) return false;
        tx.update(doc.ref, { lastSentDay: day });
        return true;
      });
      if (!claimed) return;
      const dSnap = await db.doc(`groups/${r.groupId}/drivers/${r.driverId}`).get();
      const driver = dSnap.data() as DriverDoc | undefined;
      if (!driver || driver.removedAt) {
        await doc.ref.delete();
        return;
      }
      if (driver.currentSessionId || !driver.userId) return; // 이미 출근함 — 오늘은 끝
      await notifyUsers([driver.userId], {
        type: "CLOCK_IN_REMINDER",
        groupId: r.groupId,
        callId: null,
        titleKey: "push.clockInReminder.title",
        bodyKey: "push.clockInReminder.body",
        params: { time: r.time },
        path: "/home",
      });
      sent += 1;
    }),
  );
  return sent;
}
