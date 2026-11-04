"use client";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import type { MsgKey } from "@/i18n/index";
import type { CallStatus } from "@/types/domain";
import { IconBell, IconCar, IconFlag, IconNavigate, IconPin } from "@/components/brand/Icons";

/**
 * 호출 진행 막대 — 호출 → 출발 → 도착 → 운행 → 완료.
 * 수락하면 바로 출발로 기록되므로 ACCEPTED 와 ON_THE_WAY 는 같은 단계로 본다.
 * call.status 만 보고 그리며, 데이터는 바꾸지 않는다.
 */
const STEPS: Array<{ label: MsgKey; icon: (c: string) => ReactNode }> = [
  { label: "step.called", icon: (c) => <IconBell className={c} /> },
  { label: "step.onTheWay", icon: (c) => <IconCar className={c} /> },
  { label: "step.arrived", icon: (c) => <IconPin className={c} /> },
  { label: "step.trip", icon: (c) => <IconNavigate className={c} /> },
  { label: "step.done", icon: (c) => <IconFlag className={c} /> },
];

const INDEX: Partial<Record<CallStatus, number>> = {
  CREATED: 0,
  CALLING: 0,
  RECEIVED: 0,
  ACCEPTED: 1,
  ON_THE_WAY: 1,
  ARRIVED: 2,
  TRIP_STARTED: 3,
  COMPLETED: 4,
};

export function progressIndex(status: CallStatus): number | null {
  return INDEX[status] ?? null;
}

export function CallProgress({ status, compact = false, className = "" }: { status: CallStatus; compact?: boolean; className?: string }) {
  const { t } = useI18n();
  const idx = progressIndex(status);
  if (idx === null) return null;
  const last = STEPS.length - 1;
  const size = compact ? "h-7 w-7" : "h-10 w-10";
  const icon = compact ? "h-4 w-4" : "h-5 w-5";
  // 칸 5개가 같은 너비라 원 중심은 10%·30%…90% — 연결선은 10%~90%
  const edge = 50 / STEPS.length;
  return (
    <div className={className}>
      <ol className="relative flex items-start justify-between" aria-label={t("step.aria")}>
        <span
          className={`absolute h-1 rounded-full bg-line ${compact ? "top-[12px]" : "top-[18px]"}`}
          style={{ left: `${edge}%`, right: `${edge}%` }}
          aria-hidden
        />
        <span
          className={`absolute h-1 rounded-full bg-success-solid transition-[width] duration-500 ${compact ? "top-[12px]" : "top-[18px]"}`}
          style={{ left: `${edge}%`, width: `${(100 - 2 * edge) * (idx / last)}%` }}
          aria-hidden
        />
        {STEPS.map((s, i) => {
          const done = i < idx || (i === idx && i === last);
          const current = i === idx && i !== last;
          return (
            <li
              key={s.label}
              className="relative z-[1] flex w-0 flex-1 flex-col items-center"
              aria-current={current ? "step" : undefined}
            >
              <span className={`relative flex ${size} items-center justify-center`}>
                {current && <span className="bc-pulse-ring absolute inset-0 rounded-full bg-action/30" aria-hidden />}
                <span
                  className={`relative flex ${size} items-center justify-center rounded-full ${
                    done
                      ? "bg-success-solid text-white"
                      : current
                        ? "bg-action text-white"
                        : "border-2 border-line-strong bg-surface text-ink-faint"
                  }`}
                >
                  {s.icon(icon)}
                </span>
              </span>
              <span
                className={`mt-1 whitespace-nowrap font-semibold ${compact ? "text-[10px]" : "text-xs"} ${
                  done ? "text-success" : current ? "text-link" : "text-ink-faint"
                }`}
              >
                {t(s.label)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
