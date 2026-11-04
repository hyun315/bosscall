"use client";
/**
 * 카카오톡 등 인앱 브라우저에서 자동으로 못 빠져나간 경우 (주로 아이폰의 인스타그램·페이스북 등, 또는 이동 실패)
 * — 외부 브라우저로 여는 방법 안내 + 다시 시도 + 링크 복사. 닫으면 이 탭에서는 다시 띄우지 않는다.
 */
import { useEffect, useState } from "react";
import { inAppBrowser, installPlatform, openInChromeAndroid, type InAppBrowser } from "@/services/client/install";
import { useI18n } from "@/i18n/client";
import { IconGlobe } from "@/components/brand/Icons";

const DISMISS = "bosscall.inappDismissed";

export function InAppBrowserNotice() {
  const { t } = useI18n();
  const [kind, setKind] = useState<InAppBrowser | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS) === "1";
    } catch {
      /* 무시 */
    }
    if (!dismissed) setKind(inAppBrowser());
  }, []);

  if (!kind) return null;
  const ios = installPlatform() === "ios";
  const href = typeof window === "undefined" ? "" : window.location.href;

  const retry = () => {
    if (kind === "kakao" && ios) {
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(href)}`;
    } else if (kind === "line") {
      window.location.href = href + (href.includes("?") ? "&" : "?") + "openExternalBrowser=1";
    } else if (!ios) {
      openInChromeAndroid();
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
    } catch {
      /* 복사 불가 — 주소를 길게 눌러 복사 */
    }
  };
  const close = () => {
    try {
      sessionStorage.setItem(DISMISS, "1");
    } catch {
      /* 무시 */
    }
    setKind(null);
  };
  const canRetry = kind === "kakao" || kind === "line" || !ios;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-card bg-surface p-5 shadow-modal">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-action-soft text-link" aria-hidden>
          <IconGlobe className="h-6 w-6" />
        </span>
        <h2 className="mt-2 text-[19px] font-extrabold text-ink">{t("inapp.title")}</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-ink-sub">{t("inapp.body")}</p>
        <p className="mt-3 rounded-btn bg-bg px-3 py-2.5 text-sm leading-relaxed text-ink">
          {ios ? t("inapp.howIos") : t("inapp.howAndroid")}
        </p>
        <div className="mt-4 space-y-2">
          {canRetry && (
            <button
              type="button"
              onClick={retry}
              className="flex min-h-[52px] w-full items-center justify-center rounded-btn bg-action text-[15px] font-bold text-white"
            >
              {ios ? t("inapp.openSafari") : t("inapp.openChrome")}
            </button>
          )}
          <button
            type="button"
            onClick={() => void copy()}
            className="flex min-h-[48px] w-full items-center justify-center rounded-btn border border-line text-[15px] font-semibold text-ink"
          >
            {copied ? t("inapp.copied") : t("inapp.copy")}
          </button>
          <button type="button" onClick={close} className="w-full py-2 text-sm text-ink-sub">
            {t("inapp.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}
