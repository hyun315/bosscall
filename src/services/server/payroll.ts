import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { writeAudit } from "@/lib/server/audit";
import { badRequest, conflict, notFound } from "@/lib/server/http";
import type { DriverDoc, GroupDoc, PayrollSettingsDoc, WorkSessionDoc } from "@/types/domain";

export type PayrollSettingsInput = Omit<PayrollSettingsDoc, "driverId" | "groupId" | "currency" | "updatedAt" | "updatedBy">;

/** 급여 조건 저장 — Owner 전용 (라우트에서 검사), 감사 로그 */
export async function savePayrollSettings(
  groupId: string,
  driverId: string,
  actorId: string,
  input: PayrollSettingsInput,
): Promise<void> {
  const db = adminDb();
  const driverRef = db.doc(`groups/${groupId}/drivers/${driverId}`);
  const ref = db.doc(`groups/${groupId}/payrollSettings/${driverId}`);
  await db.runTransaction(async (tx) => {
    const [d, cur] = await Promise.all([tx.get(driverRef), tx.get(ref)]);
    if (!d.exists) throw notFound("err.driverNotFound");
    const before = cur.exists ? (cur.data() as PayrollSettingsDoc) : null;
    const doc: PayrollSettingsDoc = {
      ...input,
      driverId,
      groupId,
      currency: "IDR",
      updatedAt: Date.now(),
      updatedBy: actorId,
    };
    tx.set(ref, doc);
    writeAudit(
      groupId,
      {
        action: "PAYROLL_SETTINGS_SAVED",
        actorId,
        targetType: "payrollSettings",
        targetId: driverId,
        before: before
          ? {
              monthlyBase: before.monthlyBase,
              regularHoursPerDay: before.regularHoursPerDay,
              overtimeHourlyRate: before.overtimeHourlyRate,
              workdays: before.workdays,
              overtimeRoundingMinutes: before.overtimeRoundingMinutes,
              shareWithDriver: before.shareWithDriver,
            }
          : null,
        after: {
          monthlyBase: input.monthlyBase,
          regularHoursPerDay: input.regularHoursPerDay,
          overtimeHourlyRate: input.overtimeHourlyRate,
          workdays: input.workdays,
          overtimeRoundingMinutes: input.overtimeRoundingMinutes,
          shareWithDriver: input.shareWithDriver,
        },
      },
      tx,
    );
  });
}

const DAY = 86400000;

/**
 * 근무기록 수동 추가 — Owner 전용 (보스첵 "보스/드라이버 양방향 입력").
 * 기사가 출퇴근을 누르지 못한 날을 사장님이 채운다. 같은 기사의 기존 근무와 겹치면 거부.
 */
export async function addManualWorkSession(
  group: GroupDoc,
  driverId: string,
  actorId: string,
  clockInAt: number,
  clockOutAt: number,
): Promise<string> {
  if (clockOutAt <= clockInAt) throw badRequest("err.clockOutBeforeIn");
  if (clockOutAt - clockInAt > DAY) throw badRequest("err.sessionTooLong");
  if (clockOutAt > Date.now()) throw badRequest("err.futureTime");
  const db = adminDb();
  const groupId = group.id;
  const col = db.collection(`groups/${groupId}/workSessions`);
  const ref = col.doc();
  await db.runTransaction(async (tx) => {
    const d = await tx.get(db.doc(`groups/${groupId}/drivers/${driverId}`));
    if (!d.exists) throw notFound("err.driverNotFound");
    const driver = d.data() as DriverDoc;
    // clockInAt 단일 필드 범위 쿼리 후 기사 필터 (복합 색인 불필요)
    const nearby = await tx.get(col.where("clockInAt", ">=", clockInAt - DAY).where("clockInAt", "<", clockOutAt));
    const now = Date.now();
    const overlap = nearby.docs
      .map((x) => x.data() as WorkSessionDoc)
      .filter((s) => s.driverId === driverId)
      .some((s) => s.clockInAt < clockOutAt && (s.clockOutAt ?? now) > clockInAt);
    if (overlap) throw conflict("err.overlap", "OVERLAP");
    const session: WorkSessionDoc = {
      id: ref.id,
      groupId,
      driverId: driver.id,
      clockInAt,
      clockOutAt,
      timezone: group.timezone,
      createdAt: now,
      editedBy: actorId,
      editedAt: now,
    };
    tx.create(ref, session);
    writeAudit(
      groupId,
      {
        action: "WORK_SESSION_ADDED",
        actorId,
        targetType: "workSession",
        targetId: ref.id,
        after: { driverId, clockInAt, clockOutAt },
      },
      tx,
    );
  });
  return ref.id;
}
