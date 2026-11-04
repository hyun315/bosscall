"use client";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useToast } from "@/components/common/Toast";
import { useReadySession } from "@/hooks/useSession";
import { isOwner } from "@/lib/permissions";
import { clockForDriver } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import type { DriverDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/**
 * 관리자: 기사 대신 출근/퇴근 처리 (기사가 버튼을 깜빡한 경우).
 * 근무기록에 '관리자 처리'로 남고, 기사에게 알림이 간다. 관리자(OWNER)에게만 보인다.
 */
export function OwnerClockButton({ driver, compact = false }: { driver: DriverDoc; compact?: boolean }) {
  const { groupId, role } = useReadySession();
  const { t } = useI18n();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!isOwner(role) || driver.status === "INACTIVE") return null;

  const onDuty = Boolean(driver.currentSessionId);
  const action = onDuty ? "CLOCK_OUT" : "CLOCK_IN";
  const name = driver.displayName;

  const run = async () => {
    setBusy(true);
    try {
      await clockForDriver(groupId, driver.id, action);
      toast(t(onDuty ? "ownerClock.outDone" : "ownerClock.inDone", { name }), "success");
      setConfirm(false);
    } catch (e) {
      toast(errorMessage(e), "error");
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="min-h-[44px] w-full rounded-btn text-sm font-semibold text-link active:bg-action-soft"
        >
          {t(onDuty ? "ownerClock.outButton" : "ownerClock.inButton")}
        </button>
      ) : (
        <Button variant="secondary" block onClick={() => setConfirm(true)}>
          {onDuty ? "⚪ " : "🟢 "}
          {t(onDuty ? "ownerClock.outButton" : "ownerClock.inButton")}
        </Button>
      )}
      <ConfirmModal
        open={confirm}
        title={t(onDuty ? "ownerClock.outTitle" : "ownerClock.inTitle", { name })}
        message={t("ownerClock.body")}
        confirmLabel={t(onDuty ? "ownerClock.outConfirm" : "ownerClock.inConfirm")}
        loading={busy}
        onConfirm={() => void run()}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
