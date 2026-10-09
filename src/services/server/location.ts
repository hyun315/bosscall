import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { LOCATION_POLICY } from "@/lib/locationShare";
import { writeAudit } from "@/lib/server/audit";
import { badRequest, conflict, notFound } from "@/lib/server/http";
import type { DriverDoc, DriverLocationDoc, MemberDoc } from "@/types/domain";

function driverRefs(groupId: string, driverId: string) {
  const db = adminDb();
  return {
    driver: db.doc(`groups/${groupId}/drivers/${driverId}`),
    location: db.doc(`groups/${groupId}/driverLocations/${driverId}`),
  };
}

/**
 * 기사 위치 저장 — 연결된 기사 본인, 근무 중, 공유 켜짐일 때만 (서버에서 재검증).
 * 최신 1건만 덮어쓴다.
 */
export async function updateDriverLocation(
  groupId: string,
  member: MemberDoc,
  input: { lat: number; lng: number; accuracy: number; capturedAt: number },
): Promise<{ stored: boolean }> {
  if (!member.driverId) throw badRequest("err.driverOnlyLocation");
  if (input.accuracy > LOCATION_POLICY.maxAccuracyMeters) return { stored: false };
  const refs = driverRefs(groupId, member.driverId);
  const now = Date.now();
  // 트랜잭션: 퇴근 직후 늦게 도착한 위치가 삭제된 위치를 되살리지 않도록
  await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(refs.driver);
    if (!snap.exists) throw notFound("err.driverNotFound");
    const driver = snap.data() as DriverDoc;
    if (driver.userId !== member.userId) throw badRequest("err.notLinkedDriver");
    if (!driver.currentSessionId) throw conflict("err.locationOnDutyOnly", "NOT_ON_DUTY");
    if (!driver.locationSharing) throw conflict("err.sharingOff", "SHARING_OFF");

    const doc: DriverLocationDoc = {
      driverId: driver.id,
      groupId,
      sessionId: driver.currentSessionId,
      lat: input.lat,
      lng: input.lng,
      accuracy: Math.round(input.accuracy),
      // 기기 시계가 틀려도 미래 시각이 저장되지 않도록
      capturedAt: Math.min(input.capturedAt, now),
      updatedAt: now,
    };
    tx.set(refs.location, doc);
  });
  return { stored: true };
}

/** 근무 중 위치 공유 켜기/끄기 — 기사 본인만. 끄면 저장된 위치를 즉시 삭제 */
export async function setLocationSharing(groupId: string, member: MemberDoc, enabled: boolean): Promise<void> {
  if (!member.driverId) throw badRequest("err.driverOnlySetting");
  const refs = driverRefs(groupId, member.driverId);
  const db = adminDb();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(refs.driver);
    if (!snap.exists) throw notFound("err.driverNotFound");
    const driver = snap.data() as DriverDoc;
    if (driver.userId !== member.userId) throw badRequest("err.notLinkedDriver");
    if (enabled && !driver.currentSessionId) throw conflict("err.clockInFirst", "NOT_ON_DUTY");
    const now = Date.now();
    tx.update(refs.driver, {
      locationSharing: enabled,
      ...(enabled && !driver.locationConsentAt ? { locationConsentAt: now } : {}),
      updatedAt: now,
    });
    if (!enabled) tx.delete(refs.location);
    writeAudit(
      groupId,
      {
        action: enabled ? "LOCATION_SHARING_ON" : "LOCATION_SHARING_OFF",
        actorId: member.userId,
        targetType: "driver",
        targetId: driver.id,
      },
      tx,
    );
  });
}
