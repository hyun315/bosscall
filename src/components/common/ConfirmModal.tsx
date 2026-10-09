"use client";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/common/Button";
import { useI18n } from "@/i18n/client";

/** 확인 모달 (§18 ConfirmModal) — 실수 터치 방지용 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" role="alertdialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/40" aria-label={t("common.close")} onClick={() => !loading && onCancel()} />
      <div className="relative w-full max-w-sm rounded-modal bg-surface p-6 shadow-modal">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {message && <div className="mt-2 text-[15px] leading-relaxed text-ink-sub">{message}</div>}
        <div className="mt-6 flex flex-col gap-3">
          <Button variant={tone === "danger" ? "danger" : "primary"} block loading={loading} onClick={onConfirm}>
            {confirmLabel ?? t("common.confirm")}
          </Button>
          <Button variant="secondary" block disabled={loading} onClick={onCancel}>
            {cancelLabel ?? t("common.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
