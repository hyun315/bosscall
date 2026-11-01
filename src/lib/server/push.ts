import "server-only";
import { createHash } from "node:crypto";
import { isLocale, type Locale } from "@/i18n/core";
import { translate, type MsgKey, type MsgParams } from "@/i18n/index";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";
import { track } from "@/lib/server/analytics";
import type { NotificationType, UserDoc } from "@/types/domain";

export function tokenDocId(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 40);
}

export interface PushRequest {
  type: NotificationType;
  groupId: string;
  callId: string | null;
  /** 제목·본문은 번역 키 — 받는 사람의 언어(users.locale)로 번역해 보낸다 */
  titleKey: MsgKey;
  bodyKey: MsgKey;
  params?: MsgParams;
  /** 앱 내부 경로 (예: /calls/abc?g=xyz) — 알림 클릭 시 이동 (명세 §13 Deep Link) */
  path: string;
  /** 기사 호출처럼 사용자가 직접 닫을 때까지 알림을 유지할지 */
  urgent?: boolean;
  /** false 면 알림함에 기록하지 않고 푸시만 보낸다 (응답 재촉 알림) */
  inbox?: boolean;
}

const CALL_UPDATE_TYPES: readonly NotificationType[] = [
  "CALL_ACCEPTED",
  "CALL_DECLINED",
  "CALL_CANCELLED",
  "CALL_COMPLETED",
];
const WORK_TYPES: readonly NotificationType[] = ["DRIVER_CLOCK_IN", "DRIVER_CLOCK_OUT"];

function userLocale(u: UserDoc): Locale {
  return isLocale(u.locale) ? u.locale : "ko";
}

/**
 * 1) 사용자별 알림함(users/{uid}/notifications)에 받는 사람의 언어로 기록
 * 2) 등록된 기기로 FCM Web Push 발송 (언어별로 묶어 발송)
 *
 * Push payload에는 민감 정보를 넣지 않는다 (명세 §13): 주소·좌표 없이 type/callId/groupId,
 * 그리고 짧은 제목·본문만. 앱이 열리면 callId로 최신 정보를 다시 조회한다.
 * 발송 실패가 호출 처리를 막지 않도록 예외를 삼킨다.
 */
export async function notifyUsers(userIds: string[], req: PushRequest): Promise<void> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  const db = adminDb();
  const now = Date.now();

  try {
    const userSnaps = await db.getAll(...unique.map((id) => db.doc(`users/${id}`)));
    const recipients = userSnaps
      .filter((s) => s.exists)
      .map((s) => s.data() as UserDoc)
      .filter((u) => {
        const prefs = u.notificationPrefs ?? { callUpdates: true, workEvents: true };
        if (CALL_UPDATE_TYPES.includes(req.type)) return prefs.callUpdates !== false;
        if (WORK_TYPES.includes(req.type)) return prefs.workEvents !== false;
        return true; // CALL_CREATED(기사 대상)는 끌 수 없음
      });

    const textFor = (l: Locale) => ({
      title: translate(l, req.titleKey, req.params),
      body: translate(l, req.bodyKey, req.params),
    });

    const batch = db.batch();
    for (const u of req.inbox === false ? [] : recipients) {
      const ref = db.collection(`users/${u.id}/notifications`).doc();
      const text = textFor(userLocale(u));
      batch.set(ref, {
        id: ref.id,
        type: req.type,
        groupId: req.groupId,
        callId: req.callId,
        title: text.title,
        body: text.body,
        url: req.path,
        read: false,
        createdAt: now,
      });
    }
    await batch.commit();

    // 호출 알림 소리: 기사가 설정에서 끈 경우에만 무음. 설정하지 않았으면 항상 소리
    const silentFor = (u: UserDoc) => req.type === "CALL_CREATED" && u.callAlarmSound === false;
    const tokenEntries: Array<{ uid: string; token: string; locale: Locale; silent: boolean }> = [];
    await Promise.all(
      recipients.map(async (u) => {
        const snap = await db.collection(`users/${u.id}/deviceTokens`).get();
        for (const d of snap.docs) {
          const token = d.get("token");
          if (typeof token === "string") tokenEntries.push({ uid: u.id, token, locale: userLocale(u), silent: silentFor(u) });
        }
      }),
    );
    if (tokenEntries.length === 0) {
      await track("push_sent", null, req.groupId, { type: req.type, tokens: 0, success: 0 });
      return;
    }

    let success = 0;
    const cleanup: Promise<unknown>[] = [];
    const groups = [...new Set(tokenEntries.map((t) => `${t.locale}|${t.silent ? 1 : 0}`))];
    for (const g of groups) {
      const [locale, silentFlag] = g.split("|") as [Locale, string];
      const entries = tokenEntries.filter((t) => t.locale === locale && (t.silent ? "1" : "0") === silentFlag);
      const text = textFor(locale);
      const res = await adminMessaging().sendEachForMulticast({
        tokens: entries.map((t) => t.token),
        // data-only 메시지: 서비스워커(public/firebase-messaging-sw.js)가 직접 알림을 표시한다
        data: {
          type: req.type,
          groupId: req.groupId,
          callId: req.callId ?? "",
          title: text.title,
          body: text.body,
          url: req.path,
          urgent: req.urgent ? "1" : "0",
          silent: silentFlag,
        },
        webpush: {
          headers: { Urgency: "high", TTL: req.urgent ? "120" : "3600" },
        },
      });
      success += res.successCount;
      // 만료/잘못된 토큰 정리
      res.responses.forEach((r, i) => {
        const code = r.error?.code ?? "";
        const entry = entries[i];
        if (
          entry &&
          (code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token" ||
            code === "messaging/invalid-argument")
        ) {
          cleanup.push(db.doc(`users/${entry.uid}/deviceTokens/${tokenDocId(entry.token)}`).delete());
        }
      });
    }
    await Promise.all(cleanup);
    await track("push_sent", null, req.groupId, { type: req.type, tokens: tokenEntries.length, success });
  } catch (e) {
    console.error("[push] failed", req.type, e);
  }
}
