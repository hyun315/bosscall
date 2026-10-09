"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { NotificationBanner } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { errorMessage } from "@/services/client/api";
import { enablePush, getPushState, type PushState } from "@/services/client/push";
import { useI18n } from "@/i18n/client";
import type { MsgKey } from "@/i18n/index";

/** 푸시 권한 상태 안내 + 켜기 버튼 (§14: 기기별 동작 차이를 사용자에게 명확히 안내) */
export function PushPrompt({ groupId, variant = "banner" }: { groupId: string; variant?: "banner" | "panel" }) {
  const toast = useToast();
  const { t } = useI18n();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getPushState().then(setState);
  }, []);

  const turnOn = async () => {
    setBusy(true);
    try {
      const s = await enablePush(groupId);
      setState(s);
      if (s === "granted") toast(t("pushp.enabled"), "success");
      else if (s === "denied") toast(t("pushp.blockedToast"), "error");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  if (state === null) return null;
  if (variant === "banner" && state === "granted") return null;

  const text: Record<PushState, MsgKey> = {
    granted: "pushp.granted",
    default: "pushp.default",
    denied: "pushp.denied",
    "needs-install": "pushp.needsInstall",
    unsupported: "pushp.unsupported",
  };

  const canEnable = state === "default";
  if (variant === "panel") {
    return (
      <div className="card space-y-3 p-4">
        <p className="text-[15px] font-semibold text-ink">{state === "granted" ? t("pushp.on") : t("pushp.off")}</p>
        <p className="text-sm leading-relaxed text-ink-sub">{t(text[state])}</p>
        {canEnable && (
          <Button block loading={busy} onClick={() => void turnOn()}>
            {t("pushp.enableHere")}
          </Button>
        )}
      </div>
    );
  }
  return (
    <NotificationBanner
      tone={state === "denied" || state === "unsupported" ? "danger" : "warning"}
      action={
        canEnable ? (
          <Button size="sm" loading={busy} onClick={() => void turnOn()}>
            {t("common.turnOn")}
          </Button>
        ) : undefined
      }
    >
      {t(text[state])}
    </NotificationBanner>
  );
}
