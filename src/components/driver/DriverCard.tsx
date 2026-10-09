"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DRIVER_STATUS_LABEL } from "@/lib/format";
import { formatTime } from "@/lib/time";
import type { DriverDoc } from "@/types/domain";

/** 기사 카드 (§18 DriverCard, §4 홈 상단·§9 기사 목록) */
export function DriverCard({
  driver,
  tz,
  todayCalls,
  href,
  size = "md",
}: {
  driver: DriverDoc;
  tz: string;
  todayCalls?: number;
  href?: string;
  size?: "md" | "lg";
}) {
  const { t } = useI18n();
  const s = DRIVER_STATUS_LABEL[driver.status];
  const clockInfo =
    driver.status === "INACTIVE"
      ? t("driver.waitingLink")
      : driver.currentSessionId && driver.lastClockInAt
        ? t("driver.clockedInToday", { time: formatTime(driver.lastClockInAt, tz) })
        : t("driver.offDutyState");
  const body = (
    <div className={`card flex items-center gap-4 ${size === "lg" ? "p-5" : "p-4"}`}>
      <div className="min-w-0 flex-1">
        <StatusBadge label={t(s.key)} tone={s.tone} size={size === "lg" ? "lg" : "md"} />
        <p className={`mt-2 truncate font-bold text-ink ${size === "lg" ? "text-xl" : "text-base"}`}>
          {t("driver.nameTitle", { name: driver.displayName })}
        </p>
        <p className="mt-0.5 text-sm text-ink-sub">{clockInfo}</p>
      </div>
      {todayCalls !== undefined && (
        <div className="text-right">
          <p className="text-xs text-ink-sub">{t("home.todayCalls")}</p>
          <p className="text-xl font-bold text-ink">{todayCalls}</p>
        </div>
      )}
      {href && (
        <span className="text-xl text-ink-faint" aria-hidden>
          ›
        </span>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block active:opacity-80">
      {body}
    </Link>
  ) : (
    body
  );
}
