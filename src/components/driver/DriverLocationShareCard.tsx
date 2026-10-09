"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { useShareStatus } from "@/hooks/useDriverLocationSharing";
import { formatAgo } from "@/lib/locationShare";
import { setLocationSharing } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import type { DriverDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/** 기사 홈: 위치 공유 상태 표시 + 켜기/끄기 — 공유 중임을 항상 기사에게 보여준다 */
export function DriverLocationShareCard({ driver, groupId }: { driver: DriverDoc; groupId: string }) {
  const toast = useToast();
  const { t, locale } = useI18n();
  const share = useShareStatus();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  if (!driver.currentSessionId) return null;
  const on = Boolean(driver.locationSharing);

  const toggle = async () => {
    setBusy(true);
    try {
      if (!on) askPermissionNow();
      await setLocationSharing(groupId, !on);
      toast(on ? t("share.turnedOff") : t("share.turnedOn"), "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  let line: string;
  let tone = "text-ink-sub";
  if (!on) line = t("share.lineOff");
  else if (share.status === "denied") {
    line = t("share.lineDenied");
    tone = "text-danger";
  } else if (share.status === "unavailable" || share.status === "error") {
    line = t("share.lineError");
    tone = "text-warning-text";
  } else if (share.lastSentAt) line = t("share.lineSent", { ago: formatAgo(share.lastSentAt, now, locale) });
  else line = t("share.lineLocating");

  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="text-2xl" aria-hidden>
        {on ? "📍" : "🚫"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">{on ? t("share.titleOn") : t("share.titleOff")}</p>
        <p className={`mt-0.5 text-sm ${tone}`}>{line}</p>
        {on && <p className="mt-1 text-xs text-ink-faint">{t("share.note")}</p>}
      </div>
      <Button size="sm" variant={on ? "secondary" : "primary"} loading={busy} onClick={() => void toggle()}>
        {on ? t("common.turnOff") : t("common.turnOn")}
      </Button>
    </div>
  );
}

/** 사용자 탭 안에서 위치 권한 요청을 띄운다 (iOS는 제스처 없이 뜨지 않는 경우가 있음) */
export function askPermissionNow(): void {
  try {
    navigator.geolocation?.getCurrentPosition(
      () => undefined,
      () => undefined,
      { maximumAge: 60_000, timeout: 10_000 },
    );
  } catch {
    /* 미지원 */
  }
}
