"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CALL_STATUS_LABEL, shortPlace } from "@/lib/format";
import { formatTime } from "@/lib/time";
import type { CallDoc } from "@/types/domain";

/** 호출 이력 항목 (§18 CallCard, §12) */
export function CallCard({ call, tz, showDriver = false }: { call: CallDoc; tz: string; showDriver?: boolean }) {
  const { t } = useI18n();
  const s = CALL_STATUS_LABEL[call.status];
  return (
    <Link href={`/calls/${call.id}`} className="block px-4 py-3.5 active:bg-bg">
      <div className="flex items-start gap-3">
        <span className="w-12 shrink-0 pt-0.5 text-[15px] font-semibold tabular-nums text-ink">
          {formatTime(call.createdAt, tz)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">
            {shortPlace(call.pickupName, call.pickupAddress)} → {shortPlace(call.destinationName, call.destinationAddress)}
          </p>
          <p className="mt-0.5 text-[13px] text-ink-sub">
            {t("call.callerLine", { name: call.callerName })}
            {showDriver ? ` · ${t("driver.nameTitle", { name: call.driverName })}` : ""}
          </p>
        </div>
        <StatusBadge label={t(s.key)} tone={s.tone} />
      </div>
    </Link>
  );
}
