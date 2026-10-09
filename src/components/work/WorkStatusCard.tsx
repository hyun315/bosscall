"use client";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DRIVER_STATUS_LABEL } from "@/lib/format";
import { formatDuration, formatTime, workDurationMs } from "@/lib/time";
import type { DriverDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/** 근무 상태 카드 (§18 WorkStatusCard, §6 D01) — 기사 홈 상단 */
export function WorkStatusCard({ driver, tz }: { driver: DriverDoc; tz: string }) {
  const { t, locale } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const s = DRIVER_STATUS_LABEL[driver.status];
  const onDuty = Boolean(driver.currentSessionId && driver.lastClockInAt);
  return (
    <div className="card p-6 text-center">
      <p className="text-2xl font-bold text-ink">{t("driver.nameTitle", { name: driver.displayName })}</p>
      <div className="mt-3 flex justify-center">
        <StatusBadge label={t(s.key)} tone={s.tone} size="lg" />
      </div>
      {onDuty && driver.lastClockInAt ? (
        <p className="mt-3 text-lg text-ink-sub">
          {t("driver.clockedInFor", {
            time: formatTime(driver.lastClockInAt, tz),
            dur: formatDuration(workDurationMs(driver.lastClockInAt, null, now), locale),
          })}
        </p>
      ) : (
        <p className="mt-3 text-lg text-ink-sub">{t("driver.notClockedIn")}</p>
      )}
    </div>
  );
}
