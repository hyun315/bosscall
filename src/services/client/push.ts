"use client";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { firebaseApp } from "@/lib/firebase/client";
import { api, trackClient } from "@/services/client/api";
import { translate } from "@/i18n/index";
import { getLocale } from "@/i18n/runtime";

const TOKEN_KEY = "bosscall.fcmToken";

export type PushState = "unsupported" | "needs-install" | "default" | "granted" | "denied";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/**
 * 현재 기기의 푸시 가능 상태.
 * iOS는 홈 화면에 추가한 PWA에서만 Web Push가 가능하다 (iOS 16.4+). — 명세 §14: 플랫폼별 차이를 가정하지 않는다.
 */
export async function getPushState(): Promise<PushState> {
  if (typeof window === "undefined") return "unsupported";
  if (isIos() && !isStandalone()) return "needs-install";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  if (!(await isSupported().catch(() => false))) return "unsupported";
  return Notification.permission as PushState;
}

async function registerSw(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  return reg;
}

async function obtainAndSaveToken(): Promise<string> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error(translate(getLocale(), "pushp.noVapid"));
  const reg = await registerSw();
  const token = await getToken(getMessaging(firebaseApp()), { vapidKey, serviceWorkerRegistration: reg });
  if (!token) throw new Error(translate(getLocale(), "pushp.noToken"));
  await api("/api/devices", { body: { token } });
  try {
    localStorage.setItem(TOKEN_KEY, token);
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
  await obtainAndSaveToken();
  trackClient("notification_permission_granted", groupId);
  return "granted";
}

/** 앱 시작 시: 이미 허용된 경우 토큰을 조용히 갱신 */
export async function refreshPushTokenSilently(): Promise<void> {
  if ((await getPushState()) !== "granted") return;
  await obtainAndSaveToken();
}

export async function unregisterThisDevice(): Promise<void> {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* 무시 */
  }
  if (token) {
    await api("/api/devices", { method: "DELETE", body: { token } }).catch(() => undefined);
    await deleteToken(getMessaging(firebaseApp())).catch(() => undefined);
  }
}
