"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import {
  androidNonChrome,
  openInChromeAndroid,
  canPromptInstall,
  dismissInstall,
  initInstallCapture,
  installDismissedRecently,
  installPlatform,
  isIosNonSafari,
  isStandaloneApp,
  promptInstall,
  subscribeInstall,
  type InstallPlatform,
} from "@/services/client/install";
import { trackClient } from "@/services/client/api";
import { useI18n } from "@/i18n/client";

/** Safari 공유 버튼 모양 (□↑) */
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="inline h-5 w-5 align-[-3px] text-action" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

/**
 * 홈 화면에 추가 안내.
 * - variant="card": 홈 화면 카드. "나중에" 누르면 3일 숨김. 기사는 emphasis 로 강조.
 * - variant="panel": 알림 설정 화면 — 항상 보이고, 이미 설치했으면 "사용 중" 표시.
 * 홈 화면 앱(standalone)으로 열었거나 컴퓨터에서는 card 를 그리지 않는다.
 */
export function InstallPrompt({
  variant = "card",
  emphasis = false,
  groupId = null,
}: {
  variant?: "card" | "panel";
  emphasis?: boolean;
  groupId?: string | null;
}) {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("desktop");
  const [canPrompt, setCanPrompt] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    initInstallCapture();
    const sync = () => {
      setStandalone(isStandaloneApp());
      setCanPrompt(canPromptInstall());
    };
    setPlatform(installPlatform());
    setHidden(variant === "card" && installDismissedRecently());
    sync();
    setReady(true);
    return subscribeInstall(sync);
  }, [variant]);

  if (!ready) return null;

  if (standalone) {
    if (variant !== "panel") return null;
    return (
      <div className="card flex items-center gap-3 px-4 py-3.5">
        <span className="text-xl" aria-hidden>
          ✅
        </span>
        <span className="text-[15px] font-semibold text-ink">{t("install.using")}</span>
      </div>
    );
  }
  if (variant === "card" && (hidden || platform === "desktop")) return null;

  const install = async () => {
    setBusy(true);
    try {
      const ok = await promptInstall();
      trackClient("app_install_prompt", groupId, { outcome: ok ? "accepted" : "dismissed" });
    } finally {
      setBusy(false);
    }
  };

  const later = () => {
    dismissInstall();
    setHidden(true);
  };

  return (
    <section
      className={`rounded-card p-4 ${
        emphasis ? "border-2 border-action bg-action-soft" : "border border-line bg-surface"
      }`}
      aria-label={t("install.title")}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-navy text-xl text-white shadow-card"
          aria-hidden
        >
          📲
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold text-ink">{t("install.title")}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-sub">
            {emphasis ? t("install.whyDriver") : t("install.whyOwner")}
          </p>
        </div>
      </div>

      {platform === "ios" ? (
        <ol className="mt-3 space-y-2 text-[15px] text-ink">
          {isIosNonSafari() && (
            <li className="rounded-btn bg-warning-soft px-3 py-2 text-sm text-warning-text">{t("install.iosOpenSafari")}</li>
          )}
          <li className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">1</span>
            <span>
              {t("install.iosStep1a")} <ShareIcon /> {t("install.iosStep1b")}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">2</span>
            <span>{t("install.iosStep2")}</span>
          </li>
          <li className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">3</span>
            <span>{t("install.iosStep3")}</span>
          </li>
        </ol>
      ) : platform === "android" && androidNonChrome() ? (
        <div className="mt-3 space-y-2">
          <p className="rounded-btn bg-warning-soft px-3 py-2 text-sm leading-relaxed text-warning-text">{t("install.useChrome")}</p>
          <Button block onClick={openInChromeAndroid}>
            {t("inapp.openChrome")}
          </Button>
        </div>
      ) : platform === "android" ? (
        <div className="mt-3 space-y-3">
          {/* Chrome 이 설치 창을 허락하면 단추 한 번으로 끝 — 아래 단계는 그래도 안 될 때 */}
          {canPrompt && (
            <Button block loading={busy} onClick={() => void install()}>
              {t("install.androidButton")}
            </Button>
          )}
          {canPrompt && <p className="text-xs text-ink-sub">{t("install.androidOr")}</p>}
          <ol className="space-y-2 text-[15px] text-ink">
            {(["install.androidStep1", "install.androidStep2", "install.androidStep3"] as const).map((k, i) => (
              <li key={k} className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="mt-3 text-[15px] leading-relaxed text-ink">{t("install.desktopManual")}</p>
      )}

      {variant === "card" && (
        <button type="button" onClick={later} className="mt-2 min-h-[40px] w-full text-sm text-ink-sub">
          {t("install.later")}
        </button>
      )}
    </section>
  );
}
