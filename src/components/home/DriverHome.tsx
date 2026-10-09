"use client";
import { useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { ErrorState, LoadingState } from "@/components/common/States";
import { PushPrompt } from "@/components/common/PushPrompt";
import { useToast } from "@/components/common/Toast";
import { CallStatusCard } from "@/components/call/CallStatusCard";
import { DriverLocationShareCard, askPermissionNow } from "@/components/driver/DriverLocationShareCard";
import { WorkStatusCard } from "@/components/work/WorkStatusCard";
import { useActiveCalls } from "@/hooks/useGroupData";
import { useLiveDoc } from "@/hooks/useLive";
import { useReadySession } from "@/hooks/useSession";
import { clock } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import type { DriverDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/** §6 D01 Driver Home — Owner UI보다 훨씬 단순하게. 큰 버튼, 최소 텍스트. */
export function DriverHome() {
  const { groupId, member, tz } = useReadySession();
  const toast = useToast();
  const { t } = useI18n();
  const driverState = useLiveDoc<DriverDoc>(member.driverId ? `groups/${groupId}/drivers/${member.driverId}` : null);
  const active = useActiveCalls(groupId);
  const [busy, setBusy] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [clockInSheet, setClockInSheet] = useState(false);

  if (driverState.loading) return <LoadingState full />;
  const driver = driverState.data;
  if (!driver) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-md px-4 pt-6">
          <ErrorState title={t("err.driverNotFound")} description={t("dhome.askReinvite")} />
        </main>
      </>
    );
  }

  const myCall = active.data.find((c) => c.driverId === driver.id);
  const onDuty = Boolean(driver.currentSessionId);

  const doClock = async (action: "CLOCK_IN" | "CLOCK_OUT", shareLocation = false) => {
    setBusy(true);
    if (action === "CLOCK_IN" && shareLocation) askPermissionNow();
    try {
      await clock(groupId, action, shareLocation);
      toast(action === "CLOCK_IN" ? t("dhome.clockedIn") : t("dhome.clockedOut"), "success");
      setConfirmOut(false);
      setClockInSheet(false);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-6 pt-4">
        <PushPrompt groupId={groupId} />
        <WorkStatusCard driver={driver} tz={tz} />
        <DriverLocationShareCard driver={driver} groupId={groupId} />

        {myCall ? (
          <CallStatusCard call={myCall} viewer="driver" />
        ) : (
          <div className="card px-4 py-6 text-center text-lg text-ink-sub">
            {onDuty ? t("dhome.noCall") : t("dhome.clockInToReceive")}
          </div>
        )}

        <div className="pt-4">
          {onDuty ? (
            <Button
              variant="secondary"
              size="cta"
              block
              disabled={Boolean(myCall)}
              onClick={() => setConfirmOut(true)}
              className="border-2"
            >
              {t("dhome.clockOut")}
            </Button>
          ) : (
            <Button variant="success" size="cta" block loading={busy} onClick={() => setClockInSheet(true)}>
              {t("dhome.clockIn")}
            </Button>
          )}
          {myCall && onDuty && <p className="mt-2 text-center text-sm text-ink-sub">{t("dhome.finishFirst")}</p>}
        </div>
      </main>

      {/* 출근 전 위치 공유 안내·선택 — 기사가 직접 고른다 */}
      <BottomSheet open={clockInSheet} onClose={() => !busy && setClockInSheet(false)} title={t("dhome.clockIn")}>
        <div className="space-y-4">
          <div className="rounded-card bg-action-soft p-4 text-[15px] leading-relaxed text-navy">
            <p className="font-semibold">📍 {t("share.titleOn")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-sub">
              <li>{t("dhome.consent1")}</li>
              <li>{t("dhome.consent2")}</li>
              <li>{t("dhome.consent3")}</li>
              <li>{t("dhome.consent4")}</li>
              <li>{t("dhome.consent5")}</li>
            </ul>
          </div>
          <Button variant="success" size="cta" block loading={busy} onClick={() => void doClock("CLOCK_IN", true)}>
            {t("dhome.clockInShare")}
          </Button>
          <Button variant="secondary" block disabled={busy} onClick={() => void doClock("CLOCK_IN", false)}>
            {t("dhome.clockInNoShare")}
          </Button>
        </div>
      </BottomSheet>

      <ConfirmModal
        open={confirmOut}
        title={t("dhome.confirmOutTitle")}
        message={t("dhome.confirmOutBody")}
        confirmLabel={t("dhome.clockOut")}
        loading={busy}
        onConfirm={() => void doClock("CLOCK_OUT")}
        onCancel={() => setConfirmOut(false)}
      />
    </>
  );
}
