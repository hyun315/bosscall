"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CALL_STATUS_LABEL, shortPlace } from "@/lib/format";
import type { CallDoc } from "@/types/domain";

/** 진행 중 호출 카드 (§18 CallStatusCard) — 홈에서 현재 호출로 바로 이동 */
export function CallStatusCard({ call, viewer }: { call: CallDoc; viewer: "owner" | "driver" }) {
  const { t } = useI18n();
  const s = CALL_STATUS_LABEL[call.status];
  const pending = call.status === "CALLING" || call.status === "RECEIVED";
  return (
    <Link
      href={`/calls/${call.id}`}
      className={`block rounded-card border-2 p-4 active:opacity-90 ${
        pending ? "border-action bg-action-soft" : "border-success/40 bg-success-soft"
      }`}
    >
      <div className="flex items-center justify-between">
        <StatusBadge label={t(s.key)} tone={s.tone} />
        <span className="text-sm font-semibold text-action">{t("common.open")} ›</span>
      </div>
      <p className="mt-2 text-base font-bold text-ink">
        {viewer === "driver"
          ? t("call.callFrom", { name: call.callerName })
          : t("call.callerToDriver", { caller: call.callerName, driver: call.driverName })}
      </p>
      <p className="mt-0.5 truncate text-sm text-ink-sub">
        {shortPlace(call.pickupName, call.pickupAddress)} → {shortPlace(call.destinationName, call.destinationAddress)}
      </p>
    </Link>
  );
}
