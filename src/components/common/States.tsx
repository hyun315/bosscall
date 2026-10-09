"use client";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { Spinner } from "@/components/common/Button";

/** 빈 상태 (§19) — 사용자가 빈 화면을 보지 않도록 다음 행동을 함께 제시 */
export function EmptyState({
  icon = "🚗",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 text-4xl" aria-hidden>
        {icon}
      </div>
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-sub">{description}</p>}
      {action && <div className="mt-5 w-full max-w-xs">{action}</div>}
    </div>
  );
}

export function LoadingState({ label, full = false }: { label?: string; full?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-ink-sub ${full ? "min-h-[60dvh]" : "py-12"}`}
      role="status"
    >
      <Spinner className="h-7 w-7 text-action" />
      <span className="text-sm">{label ?? t("common.loading")}</span>
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center" role="alert">
      <div className="mb-3 text-4xl" aria-hidden>
        ⚠️
      </div>
      <p className="text-base font-semibold text-ink">{title ?? t("err.network")}</p>
      {description && <p className="mt-1.5 text-sm text-ink-sub">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 min-h-[48px] rounded-btn border border-line bg-surface px-6 font-semibold text-ink active:bg-bg"
        >
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

/** 상단 배너 (§18 NotificationBanner) */
export function NotificationBanner({
  tone = "info",
  children,
  action,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  children: ReactNode;
  action?: ReactNode;
}) {
  const cls = {
    info: "bg-action-soft text-navy border-action/20",
    warning: "bg-warning-soft text-warning-text border-warning/30",
    danger: "bg-danger-soft text-danger border-danger/20",
    success: "bg-success-soft text-success border-success/20",
  }[tone];
  return (
    <div className={`flex items-center gap-3 rounded-card border px-4 py-3 text-sm ${cls}`} role="status">
      <div className="flex-1 leading-snug">{children}</div>
      {action}
    </div>
  );
}
