"use client";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { clientAuth, firebaseApp } from "@/lib/firebase/client";
import { api, trackClient } from "@/services/client/api";
import { translate } from "@/i18n/index";
import { getLocale } from "@/i18n/runtime";
import { installPlatform, isStandaloneApp } from "@/services/client/install";

const TOKEN_KEY = "bosscall.fcmToken";

export type PushState = "unsupported" | "needs-install" | "default" | "granted" | "denied";

/**
 * 현재 기기의 푸시 가능 상태.
 * iOS는 홈 화면에 추가한 PWA에서만 Web Push가 가능하다 (iOS 16.4+). — 명세 §14: 플랫폼별 차이를 가정하지 않는다.
 */
export async function getPushState(): Promise<PushState> {
  if (typeof window === "undefined") return "unsupported";
  if (installPlatform() === "ios" && !isStandaloneApp()) return "needs-install";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  if (!(await isSupported().catch(() => false))) return "unsupported";
  return Notification.permission as PushState;
}

async function registerSw(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  return reg;
}

const SENT_KEY = "bosscall.fcmTokenSent";
const RESEND_MS = 24 * 3600 * 1000;

async function obtainAndSaveToken(force: boolean): Promise<string> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error(translate(getLocale(), "pushp.noVapid"));
  const reg = await registerSw();
  const token = await getToken(getMessaging(firebaseApp()), { vapidKey, serviceWorkerRegistration: reg });
  if (!token) throw new Error(translate(getLocale(), "pushp.noToken"));
  // 같은 사용자·같은 토큰을 하루 안에 이미 보냈으면 서버 호출을 건너뛴다 (앱 열 때마다 호출 방지)
  const uid = clientAuth().currentUser?.uid ?? "";
  let skip = false;
  try {
    const [sentUid, sentToken, sentAt] = (localStorage.getItem(SENT_KEY) ?? "").split("|");
    skip = !force && sentUid === uid && sentToken === token && Date.now() - Number(sentAt) < RESEND_MS;
  } catch {
    /* 저장소 불가 — 보낸다 */
  }
  if (!skip) await api("/api/devices", { body: { token } });
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (!skip) localStorage.setItem(SENT_KEY, `${uid}|${token}|${Date.now()}`);
  } catch {
    /* 저장 불가 환경 */
  }
  return token;
}

/** 사용자 탭(제스처) 안에서 호출해야 한다 — iOS 요구사항 */
export async function enablePush(groupId: string | null): Promise<PushState> {
  const state = await getPushState();
  if (state === "unsupported" || state === "needs-install") return state;
  const perm = state === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") {
    trackClient("notification_permission_denied", groupId);
    return perm === "denied" ? "denied" : "default";
  }
  await obtainAndSaveToken(true);
  trackClient("notification_permission_granted", groupId);
  return "granted";
}

/** 앱 시작 시: 이미 허용된 경우 토큰을 조용히 갱신 */
export async function refreshPushTokenSilently(): Promise<void> {
  if ((await getPushState()) !== "granted") return;
  await obtainAndSaveToken(false);
}

export async function unregisterThisDevice(): Promise<void> {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SENT_KEY);
  } catch {
    /* 무시 */
  }
  if (token) {
    await api("/api/devices", { method: "DELETE", body: { token } }).catch(() => undefined);
    await deleteToken(getMessaging(firebaseApp())).catch(() => undefined);
  }
}

/**
 * 출근 단추처럼 사용자가 누른 순간에 부른다 — 따로 "알림 켜기"를 누르지 않아도 되게.
 * 권한 창은 누른 동작 안에서 바로 띄워야 하므로(아이폰) 기다리지 않고 먼저 요청하고, 허용되면 기기를 등록한다.
 * 이미 허용돼 있으면 기기 등록만 확인한다. 실패해도 출근은 그대로 진행.
 */
export function ensurePushOnTap(groupId: string | null): void {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission()
        .then((p) => {
          trackClient(p === "granted" ? "notification_permission_granted" : "notification_permission_denied", groupId);
          if (p === "granted") return refreshPushTokenSilently();
        })
        .catch(() => undefined);
    } else if (Notification.permission === "granted") {
      void refreshPushTokenSilently().catch(() => undefined);
    }
  } catch {
    /* 미지원 브라우저 */
  }
}
