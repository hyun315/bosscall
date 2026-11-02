"use client";
/**
 * 홈 화면에 추가(PWA 설치) 도우미.
 * - 안드로이드 Chrome 등은 beforeinstallprompt 이벤트를 붙잡아 두었다가 [앱 설치] 버튼에서 띄운다.
 * - 아이폰은 설치 창을 띄울 방법이 없어 Safari 공유 버튼 › 홈 화면에 추가 순서를 안내한다.
 */

export type InstallPlatform = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installedNow = false;
let started = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

/** 앱 시작 시 한 번 — 설치 창 이벤트를 놓치지 않게 일찍 등록한다 */
export function initInstallCapture(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // 브라우저 기본 배너 대신 우리 안내 카드에서 띄운다
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installedNow = true;
    deferred = null;
    emit();
  });
}

export function subscribeInstall(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return installedNow || window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function installPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/** 아이폰에서 Safari가 아닌 브라우저(카카오톡 인앱, Chrome 등)로 열었는지 */
export function isIosNonSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /CriOS|FxiOS|EdgiOS|KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent);
}

export function canPromptInstall(): boolean {
  return deferred !== null;
}

/** [앱 설치] — 브라우저 설치 창을 띄운다. 설치했으면 true */
export async function promptInstall(): Promise<boolean> {
  const e = deferred;
  if (!e) return false;
  deferred = null;
  emit();
  await e.prompt();
  const choice = await e.userChoice.catch(() => ({ outcome: "dismissed" as const }));
  return choice.outcome === "accepted";
}

const DISMISS_KEY = "bosscall.installDismissedAt";
const DISMISS_DAYS = 3;

export function installDismissedRecently(now = Date.now()): boolean {
  try {
    const v = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
    return Number.isFinite(v) && now - v < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

export function dismissInstall(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* 저장 불가 — 이번 화면에서만 숨김 */
  }
}

export type InAppBrowser = "kakao" | "line" | "instagram" | "facebook" | "naver" | "other";

/** 메신저·SNS 안의 브라우저(인앱)인지 — 구글 로그인·알림·홈 화면 추가가 안 된다 */
export function inAppBrowser(): InAppBrowser | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/KAKAOTALK/i.test(ua)) return "kakao";
  if (/ Line\//i.test(ua)) return "line";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
  if (/NAVER\(inapp|DaumApps/i.test(ua)) return "naver";
  if (/; wv\)/.test(ua) || /everytimeApp|Whale\/.*inapp/i.test(ua)) return "other";
  return null;
}

/**
 * 안드로이드에서 Chrome 이 아닌 브라우저(삼성 인터넷·웨일·파이어폭스 등)인지.
 * 삼성 인터넷이 만드는 홈 화면 앱은 Google Play 프로텍트가 "안전하지 않은 앱"으로 막는다 → Chrome 으로 설치해야 한다.
 */
export function androidNonChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (!/Android/i.test(ua)) return false;
  return !/Chrome\/\d/.test(ua) || /SamsungBrowser|Whale|EdgA|OPR|Firefox|YaBrowser|; wv\)/i.test(ua);
}

/** 지금 주소를 안드로이드 Chrome 으로 연다 */
export function openInChromeAndroid(): void {
  const l = window.location;
  window.location.href = `intent://${l.host}${l.pathname}${l.search}${l.hash}#Intent;scheme=https;package=com.android.chrome;end`;
}
