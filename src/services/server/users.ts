import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { AuthedUser } from "@/lib/server/auth";
import { track } from "@/lib/server/analytics";
import { forbidden } from "@/lib/server/http";
import { translate } from "@/i18n/index";
import type { Locale } from "@/i18n/core";
import { CONSENT_VERSION } from "@/lib/tripData";
import { deleteAdProfile } from "@/services/server/tripData";
import type { NotificationPrefs, UserConsents, UserDoc } from "@/types/domain";

const DEFAULT_PREFS: NotificationPrefs = { callUpdates: true, workEvents: true };

/** 로그인 직후 호출: users/{uid} 생성 또는 기본 정보 갱신 */
export async function upsertMe(user: AuthedUser, locale: Locale): Promise<UserDoc> {
  const db = adminDb();
  const ref = db.doc(`users/${user.uid}`);
  const now = Date.now();
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const cur = snap.data() as UserDoc;
      const patch: Partial<UserDoc> = { updatedAt: now };
      if (!cur.avatarUrl && user.picture) patch.avatarUrl = user.picture;
      if (!cur.email && user.email) patch.email = user.email;
      tx.update(ref, patch);
      return { doc: { ...cur, ...patch }, created: false };
    }
    const doc: UserDoc = {
      id: user.uid,
      name: user.name ?? user.email?.split("@")[0] ?? translate(locale, "common.defaultUserName"),
      email: user.email,
      phone: null,
      avatarUrl: user.picture,
      activeGroupId: null,
      groupIds: [],
      notificationPrefs: DEFAULT_PREFS,
      locale,
      createdAt: now,
      updatedAt: now,
    };
    tx.set(ref, doc);
    return { doc, created: true };
  });
  if (result.created) await track("signup_completed", user.uid, null);
  return result.doc;
}

export interface MePatch {
  name?: string;
  phone?: string | null;
  notificationPrefs?: Partial<NotificationPrefs>;
  activeGroupId?: string;
  locale?: Locale;
  /** 선택 동의 — 둘 다 보내야 한다 (처음 묻는 화면·설정 화면 모두 두 항목을 함께 저장) */
  consents?: { analytics: boolean; marketing: boolean };
}

export async function updateMe(uid: string, patch: MePatch): Promise<void> {
  await updateMeDoc(uid, patch);
  if (patch.consents && !patch.consents.marketing) await deleteAdProfile(uid);
}

async function updateMeDoc(uid: string, patch: MePatch): Promise<void> {
  const db = adminDb();
  const ref = db.doc(`users/${uid}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw forbidden("err.userMissing");
    const cur = snap.data() as UserDoc;
    // 트랜잭션 규칙: 모든 읽기를 쓰기보다 먼저
    const touchesMembers = patch.name !== undefined || patch.phone !== undefined;
    const memberSnaps = touchesMembers
      ? await Promise.all((cur.groupIds ?? []).map((gid) => tx.get(db.doc(`groups/${gid}/members/${uid}`))))
      : [];
    if (patch.activeGroupId !== undefined) {
      const m = await tx.get(db.doc(`groups/${patch.activeGroupId}/members/${uid}`));
      if (!m.exists) throw forbidden("err.notMember");
    }

    const next: Record<string, unknown> = { updatedAt: Date.now() };
    if (patch.name !== undefined) next.name = patch.name;
    if (patch.phone !== undefined) next.phone = patch.phone;
    if (patch.notificationPrefs) {
      next.notificationPrefs = { ...DEFAULT_PREFS, ...cur.notificationPrefs, ...patch.notificationPrefs };
    }
    if (patch.activeGroupId !== undefined) next.activeGroupId = patch.activeGroupId;
    if (patch.locale !== undefined) next.locale = patch.locale;
    if (patch.consents) {
      const now = Date.now();
      const consents: UserConsents = {
        analytics: { granted: patch.consents.analytics, at: now, version: CONSENT_VERSION },
        marketing: { granted: patch.consents.marketing, at: now, version: CONSENT_VERSION },
      };
      next.consents = consents;
      // 동의 변경 이력 (증빙용, append-only)
      tx.create(db.collection(`users/${uid}/consentLog`).doc(), {
        analytics: patch.consents.analytics,
        marketing: patch.consents.marketing,
        version: CONSENT_VERSION,
        at: now,
      });
    }
    tx.update(ref, next);

    // 이름/전화번호는 소속 그룹의 member 문서에도 반영 (호출자 표시용). 존재하는 멤버십만 갱신.
    for (const m of memberSnaps) {
      if (!m.exists) continue;
      const mPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) mPatch.displayName = patch.name;
      if (patch.phone !== undefined) mPatch.phone = patch.phone;
      tx.update(m.ref, mPatch);
    }
  });
}
