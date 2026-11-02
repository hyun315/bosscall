import "server-only";
import { runAfterResponse } from "@/lib/server/defer";
import { randomBytes } from "node:crypto";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { track } from "@/lib/server/analytics";
import { writeAudit } from "@/lib/server/audit";
import { badRequest, conflict, forbidden, notFound } from "@/lib/server/http";
import { PLAN_LIMITS } from "@/lib/permissions";
import type { DriverDoc, GroupDoc, InviteDoc, MemberDoc, UserDoc } from "@/types/domain";

const INVITE_TTL_MS = 7 * 24 * 3600 * 1000;

export interface CreateGroupInput {
  name: string;
  driverName: string;
  driverPhone: string | null;
  timezone: string;
}

/** S03 Create Group — 그룹(tenant) + OWNER 멤버십 + 첫 기사 레코드를 한 번에 만든다 */
export async function createGroup(uid: string, input: CreateGroupInput): Promise<{ groupId: string; driverId: string }> {
  const db = adminDb();
  const groupRef = db.collection("groups").doc();
  const driverRef = db.collection(`groups/${groupRef.id}/drivers`).doc();
  const userRef = db.doc(`users/${uid}`);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const uSnap = await tx.get(userRef);
    if (!uSnap.exists) throw forbidden("err.userMissing");
    const user = uSnap.data() as UserDoc;

    const group: GroupDoc = {
      id: groupRef.id,
      name: input.name,
      ownerId: uid,
      timezone: input.timezone,
      plan: "FREE",
      createdAt: now,
      updatedAt: now,
    };
    const member: MemberDoc = {
      id: uid,
      groupId: groupRef.id,
      userId: uid,
      role: "OWNER",
      status: "ACTIVE",
      displayName: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      driverId: null,
      createdAt: now,
    };
    const driver: DriverDoc = {
      id: driverRef.id,
      groupId: groupRef.id,
      userId: null,
      displayName: input.driverName,
      phone: input.driverPhone,
      status: "INACTIVE",
      currentSessionId: null,
      lastClockInAt: null,
      createdAt: now,
      updatedAt: now,
    };
    tx.set(groupRef, group);
    tx.set(db.doc(`groups/${groupRef.id}/members/${uid}`), member);
    tx.set(driverRef, driver);
    tx.update(userRef, {
      groupIds: FieldValue.arrayUnion(groupRef.id),
      activeGroupId: groupRef.id,
      updatedAt: now,
    });
  });

  await runAfterResponse(() => track("group_created", uid, groupRef.id));
  return { groupId: groupRef.id, driverId: driverRef.id };
}

export async function updateGroup(
  groupId: string,
  actorId: string,
  patch: { name?: string; timezone?: string },
): Promise<void> {
  const db = adminDb();
  const ref = db.doc(`groups/${groupId}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw notFound("err.groupNotFound");
    const before = snap.data() as GroupDoc;
    const next = { ...patch, updatedAt: Date.now() };
    tx.update(ref, next);
    writeAudit(
      groupId,
      {
        action: "GROUP_UPDATED",
        actorId,
        targetType: "group",
        targetId: groupId,
        before: { name: before.name, timezone: before.timezone },
        after: { name: patch.name ?? before.name, timezone: patch.timezone ?? before.timezone },
      },
      tx,
    );
  });
}

/* ───────────────────────── Drivers ───────────────────────── */

export async function addDriver(
  groupId: string,
  actorId: string,
  input: { displayName: string; phone: string | null },
): Promise<string> {
  const db = adminDb();
  const ref = db.collection(`groups/${groupId}/drivers`).doc();
  await db.runTransaction(async (tx) => {
    const g = await tx.get(db.doc(`groups/${groupId}`));
    if (!g.exists) throw notFound("err.groupNotFound");
    const plan = (g.data() as GroupDoc).plan;
    const existing = await tx.get(db.collection(`groups/${groupId}/drivers`));
    const current = existing.docs.filter((d) => !(d.data() as DriverDoc).removedAt).length; // 삭제한 기사는 세지 않음
    if (current >= PLAN_LIMITS[plan].maxDrivers) {
      throw conflict("err.planDriverLimit", "PLAN_LIMIT", { max: PLAN_LIMITS[plan].maxDrivers });
    }
    const now = Date.now();
    const driver: DriverDoc = {
      id: ref.id,
      groupId,
      userId: null,
      displayName: input.displayName,
      phone: input.phone,
      status: "INACTIVE",
      currentSessionId: null,
      lastClockInAt: null,
      createdAt: now,
      updatedAt: now,
    };
    tx.set(ref, driver);
    writeAudit(groupId, { action: "DRIVER_ADDED", actorId, targetType: "driver", targetId: ref.id }, tx);
  });
  return ref.id;
}

export async function updateDriver(
  groupId: string,
  driverId: string,
  actorId: string,
  patch: { displayName?: string; phone?: string | null },
): Promise<void> {
  const db = adminDb();
  const ref = db.doc(`groups/${groupId}/drivers/${driverId}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || (snap.data() as DriverDoc).removedAt) throw notFound("err.driverNotFound");
    const before = snap.data() as DriverDoc;
    tx.update(ref, { ...patch, updatedAt: Date.now() });
    writeAudit(
      groupId,
      {
        action: "DRIVER_UPDATED",
        actorId,
        targetType: "driver",
        targetId: driverId,
        before: { displayName: before.displayName, phone: before.phone },
        after: { displayName: patch.displayName ?? before.displayName, phone: patch.phone ?? before.phone },
      },
      tx,
    );
  });
}

/**
 * 기사 삭제 (Owner) — 목록에서 사라지고 호출·초대할 수 없다. 연결된 기사 계정은 그룹에서 빠진다.
 * 지난 호출·근무·급여 기록은 지우지 않는다 (호출 문서에 기사 이름이 남아 있음).
 * 진행 중이거나 응답 대기 중인 호출이 있으면 막는다. 근무 중이면 퇴근 처리한다.
 */
export async function removeDriver(groupId: string, driverId: string, actorId: string): Promise<void> {
  const db = adminDb();
  const driverRef = db.doc(`groups/${groupId}/drivers/${driverId}`);
  await db.runTransaction(async (tx) => {
    // ── 읽기
    const [dSnap, activeSnap] = await Promise.all([
      tx.get(driverRef),
      tx.get(db.collection(`groups/${groupId}/calls`).where("driverId", "==", driverId)),
    ]);
    if (!dSnap.exists) throw notFound("err.driverNotFound");
    const driver = dSnap.data() as DriverDoc;
    if (driver.removedAt) return;
    const now = Date.now();
    const busy = activeSnap.docs
      .map((d) => d.data() as { status: string; expiresAt: number })
      .some((c) =>
        ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "TRIP_STARTED"].includes(c.status) ||
        (["CALLING", "RECEIVED"].includes(c.status) && c.expiresAt > now),
      );
    if (busy) throw conflict("err.driverBusyRemove", "DRIVER_BUSY");
    const memberRef = driver.userId ? db.doc(`groups/${groupId}/members/${driver.userId}`) : null;
    const userRef = driver.userId ? db.doc(`users/${driver.userId}`) : null;
    const [mSnap, uSnap] = await Promise.all([
      memberRef ? tx.get(memberRef) : Promise.resolve(null),
      userRef ? tx.get(userRef) : Promise.resolve(null),
    ]);

    // ── 쓰기
    if (driver.currentSessionId) {
      tx.update(db.doc(`groups/${groupId}/workSessions/${driver.currentSessionId}`), { clockOutAt: now, clockOutBy: actorId });
    }
    if (memberRef && mSnap?.exists && (mSnap.data() as MemberDoc).role === "DRIVER") tx.delete(memberRef);
    if (userRef && uSnap?.exists) {
      const u = uSnap.data() as UserDoc;
      tx.update(userRef, {
        groupIds: FieldValue.arrayRemove(groupId),
        ...(u.activeGroupId === groupId ? { activeGroupId: null } : {}),
      });
    }
    tx.update(driverRef, {
      removedAt: now,
      userId: null,
      status: "INACTIVE",
      currentSessionId: null,
      locationSharing: false,
      updatedAt: now,
    });
    tx.delete(db.doc(`groups/${groupId}/driverLocations/${driverId}`));
    writeAudit(
      groupId,
      {
        action: "DRIVER_REMOVED",
        actorId,
        targetType: "driver",
        targetId: driverId,
        before: { displayName: driver.displayName, phone: driver.phone, userId: driver.userId },
      },
      tx,
    );
  });
}

/* ───────────────────────── Invites ───────────────────────── */

function newInviteCode(): string {
  // 혼동되는 문자(0/O/1/I/L) 제외
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return s;
}

export async function createInvite(
  groupId: string,
  actorId: string,
  input: { role: "DRIVER" | "MEMBER"; driverId: string | null },
): Promise<InviteDoc> {
  const db = adminDb();
  const gSnap = await db.doc(`groups/${groupId}`).get();
  if (!gSnap.exists) throw notFound("err.groupNotFound");
  const group = gSnap.data() as GroupDoc;

  if (input.role === "DRIVER") {
    if (!input.driverId) throw badRequest("err.chooseDriver");
    const d = await db.doc(`groups/${groupId}/drivers/${input.driverId}`).get();
    if (!d.exists || (d.data() as DriverDoc).removedAt) throw notFound("err.driverNotFound");
    if ((d.data() as DriverDoc).userId) throw conflict("err.alreadyConnected", "ALREADY_CONNECTED");
  }

  const now = Date.now();
  const invite: InviteDoc = {
    code: newInviteCode(),
    groupId,
    groupName: group.name,
    role: input.role,
    driverId: input.role === "DRIVER" ? input.driverId : null,
    createdBy: actorId,
    createdAt: now,
    expiresAt: now + INVITE_TTL_MS,
    usedBy: null,
    usedAt: null,
  };
  await db.doc(`invites/${invite.code}`).create(invite);
  await writeAudit(groupId, {
    action: "INVITE_CREATED",
    actorId,
    targetType: "invite",
    targetId: invite.code,
    after: { role: invite.role, driverId: invite.driverId },
  });
  await runAfterResponse(() => track(input.role === "DRIVER" ? "driver_invited" : "member_invited", actorId, groupId));
  return invite;
}

export interface InvitePreview {
  code: string;
  groupName: string;
  role: "DRIVER" | "MEMBER";
  driverName: string | null;
  inviterName: string | null;
  status: "VALID" | "EXPIRED" | "USED" | "ALREADY_MEMBER";
}

export async function previewInvite(code: string, uid: string): Promise<InvitePreview> {
  const db = adminDb();
  const snap = await db.doc(`invites/${code}`).get();
  if (!snap.exists) throw notFound("err.inviteInvalid");
  const inv = snap.data() as InviteDoc;
  const [inviter, driver, me] = await Promise.all([
    db.doc(`groups/${inv.groupId}/members/${inv.createdBy}`).get(),
    inv.driverId ? db.doc(`groups/${inv.groupId}/drivers/${inv.driverId}`).get() : Promise.resolve(null),
    db.doc(`groups/${inv.groupId}/members/${uid}`).get(),
  ]);
  let status: InvitePreview["status"] = "VALID";
  if (me.exists) status = "ALREADY_MEMBER";
  else if (inv.usedBy) status = "USED";
  else if (inv.expiresAt < Date.now()) status = "EXPIRED";
  return {
    code,
    groupName: inv.groupName,
    role: inv.role,
    driverName: driver && driver.exists ? (driver.data() as DriverDoc).displayName : null,
    inviterName: inviter.exists ? (inviter.data() as MemberDoc).displayName : null,
    status,
  };
}

export async function acceptInvite(code: string, uid: string): Promise<{ groupId: string; role: "DRIVER" | "MEMBER" }> {
  const db = adminDb();
  const inviteRef = db.doc(`invites/${code}`);
  const userRef = db.doc(`users/${uid}`);
  const now = Date.now();

  const result = await db.runTransaction(async (tx) => {
    const [invSnap, uSnap] = await Promise.all([tx.get(inviteRef), tx.get(userRef)]);
    if (!invSnap.exists) throw notFound("err.inviteInvalid");
    if (!uSnap.exists) throw forbidden("err.userMissing");
    const inv = invSnap.data() as InviteDoc;
    const user = uSnap.data() as UserDoc;
    const memberRef = db.doc(`groups/${inv.groupId}/members/${uid}`);
    const mSnap = await tx.get(memberRef);
    if (mSnap.exists) throw conflict("err.alreadyMember", "ALREADY_MEMBER");
    if (inv.usedBy) throw conflict("err.inviteUsed", "INVITE_USED");
    if (inv.expiresAt < now) throw conflict("err.inviteExpired", "INVITE_EXPIRED");

    const gSnap = await tx.get(db.doc(`groups/${inv.groupId}`));
    if (!gSnap.exists) throw notFound("err.groupNotFound");
    const group = gSnap.data() as GroupDoc;

    let driverRef: DocumentReference | null = null;
    if (inv.role === "DRIVER") {
      if (!inv.driverId) throw badRequest("err.inviteBroken");
      driverRef = db.doc(`groups/${inv.groupId}/drivers/${inv.driverId}`);
      const dSnap = await tx.get(driverRef);
      if (!dSnap.exists || (dSnap.data() as DriverDoc).removedAt) throw notFound("err.driverNotFound");
      if ((dSnap.data() as DriverDoc).userId) throw conflict("err.alreadyConnected", "ALREADY_CONNECTED");
    } else {
      const members = await tx.get(db.collection(`groups/${inv.groupId}/members`).where("role", "==", "MEMBER"));
      if (members.size >= PLAN_LIMITS[group.plan].maxFamilyMembers) {
        throw conflict("err.planMemberLimit", "PLAN_LIMIT");
      }
    }

    const member: MemberDoc = {
      id: uid,
      groupId: inv.groupId,
      userId: uid,
      role: inv.role,
      status: "ACTIVE",
      displayName: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      driverId: inv.role === "DRIVER" ? inv.driverId : null,
      createdAt: now,
    };
    tx.set(memberRef, member);
    if (driverRef) tx.update(driverRef, { userId: uid, status: "OFF_DUTY", updatedAt: now });
    tx.update(inviteRef, { usedBy: uid, usedAt: now });
    tx.update(userRef, {
      groupIds: FieldValue.arrayUnion(inv.groupId),
      activeGroupId: inv.groupId,
      updatedAt: now,
    });
    writeAudit(
      inv.groupId,
      { action: "INVITE_ACCEPTED", actorId: uid, targetType: "invite", targetId: code, after: { role: inv.role } },
      tx,
    );
    return { groupId: inv.groupId, role: inv.role };
  });

  await runAfterResponse(() => track(result.role === "DRIVER" ? "driver_connected" : "member_joined", uid, result.groupId));
  return result;
}

/* ───────────────────────── Members ───────────────────────── */

export async function removeMember(groupId: string, targetUid: string, actorId: string): Promise<void> {
  if (targetUid === actorId) throw badRequest("err.cannotRemoveSelf");
  const db = adminDb();
  const memberRef = db.doc(`groups/${groupId}/members/${targetUid}`);
  const userRef = db.doc(`users/${targetUid}`);
  await db.runTransaction(async (tx) => {
    // ── 읽기
    const [mSnap, uSnap] = await Promise.all([tx.get(memberRef), tx.get(userRef)]);
    if (!mSnap.exists) throw notFound("err.memberNotFound");
    const m = mSnap.data() as MemberDoc;
    if (m.role === "OWNER") throw forbidden("err.cannotRemoveOwner");
    let driverRef: DocumentReference | null = null;
    let driver: DriverDoc | null = null;
    if (m.role === "DRIVER" && m.driverId) {
      const ref = db.doc(`groups/${groupId}/drivers/${m.driverId}`);
      const d = await tx.get(ref);
      if (d.exists) {
        driverRef = ref;
        driver = d.data() as DriverDoc;
        if (driver.status === "BUSY") throw conflict("err.driverBusyUnlink", "DRIVER_BUSY");
      }
    }
    const now = Date.now();
    // ── 쓰기
    tx.delete(memberRef);
    if (driverRef && driver) {
      if (driver.currentSessionId) {
        tx.update(db.doc(`groups/${groupId}/workSessions/${driver.currentSessionId}`), { clockOutAt: now });
      }
      tx.update(driverRef, {
        userId: null,
        status: "INACTIVE",
        currentSessionId: null,
        locationSharing: false,
        updatedAt: now,
      });
      tx.delete(db.doc(`groups/${groupId}/driverLocations/${driver.id}`));
    }
    if (uSnap.exists) {
      const u = uSnap.data() as UserDoc;
      tx.update(userRef, {
        groupIds: FieldValue.arrayRemove(groupId),
        ...(u.activeGroupId === groupId ? { activeGroupId: null } : {}),
      });
    }
    writeAudit(
      groupId,
      {
        action: "MEMBER_REMOVED",
        actorId,
        targetType: "member",
        targetId: targetUid,
        before: { role: m.role, displayName: m.displayName },
      },
      tx,
    );
  });
}
