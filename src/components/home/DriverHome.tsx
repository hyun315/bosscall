"use client";
import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { CallStatusCard } from "@/components/call/CallStatusCard";
import { DriverLocationShareCard, askPermissionNow } from "@/components/driver/DriverLocationShareCard";
import { DriverSetupCard } from "@/components/driver/DriverSetupCard";
import { WorkStatusCard } from "@/components/work/WorkStatusCard";
import { useActiveCalls } from "@/hooks/useGroupData";
import { useLiveDoc } from "@/hooks/useLive";
import { useReadySession } from "@/hooks/useSession";
import { clock } from "@/services/client/actions";
import { primeAlarmAudio } from "@/services/client/alarm";
import { ensurePushOnTap } from "@/services/client/push";
import { errorMessage } from "@/services/client/api";
import type { DriverDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import { IconBook, IconPin } from "@/components/brand/Icons";

/** §6 D01 Driver Home — Owner UI보다 훨씬 단순하게. 큰 버튼, 최소 텍스트. */
export function DriverHome() {
  const { groupId, member, tz } = useReadySession();
  const toast = useToast();
  const { t, locale } = useI18n();
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

  const doClock = async (action: "CLOCK_IN" | "CLOCK_OUT", shareLocation = false, remember = false) => {
    if (remember) saveShareChoice(shareLocation);
    if (action === "CLOCK_IN") {
      // 출근 한 번으로 호출 받을 준비 끝: 알림 권한·기기 등록, 호출 소리, (선택 시) 위치 — 따로 누를 필요 없게
      ensurePushOnTap(groupId);
      primeAlarmAudio();
      if (shareLocation) askPermissionNow();
    }
    setBusy(true);
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
        {/* 휴대폰 준비 (홈 화면 추가 → 알림 → 소리 테스트) — 한 번에 한 단계, 끝나면 사라짐 */}
        <DriverSetupCard groupId={groupId} />
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
            <Button
              variant="success"
              size="cta"
              block
              loading={busy}
              onClick={() => {
                // 위치 공유는 처음 한 번만 묻고, 그다음부터는 지난번 선택대로 한 번에 출근
                const saved = savedShareChoice();
                if (saved === null) setClockInSheet(true);
                else void doClock("CLOCK_IN", saved);
              }}
            >
              {t("dhome.clockIn")}
            </Button>
          )}
          {myCall && onDuty && <p className="mt-2 text-center text-sm text-ink-sub">{t("dhome.finishFirst")}</p>}
        </div>

        {/* 기사용 사용 설명서 — 기사님 언어로 (한국어면 한국어 설명서) */}
        <Link
          href={`/manual/driver${locale === "ko" ? "?lang=ko" : ""}`}
          className="card flex min-h-[60px] items-center gap-3 px-4 py-3 active:bg-bg"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-action-soft text-link" aria-hidden>
            <IconBook className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-bold text-ink">{t("dhome.manual")}</span>
            <span className="block text-sm text-ink-sub">{t("dhome.manualDesc")}</span>
          </span>
          <span className="text-ink-faint" aria-hidden>
            ›
          </span>
        </Link>
      </main>

      {/* 출근 전 위치 공유 안내·선택 — 기사가 직접 고른다 */}
      <BottomSheet open={clockInSheet} onClose={() => !busy && setClockInSheet(false)} title={t("dhome.clockIn")}>
        <div className="space-y-4">
          {/* 처음 한 번만 묻는다 — 짧게. 자세한 내용은 펼쳐 보기 */}
          <p className="flex items-start gap-2 text-[17px] font-bold leading-snug text-ink"><IconPin className="mt-0.5 h-5 w-5 shrink-0 text-link" />{t("dhome.shareAsk")}</p>
          <p className="text-[15px] leading-relaxed text-ink-sub">{t("dhome.consent1")}</p>
          <details className="rounded-btn bg-bg px-3 py-2 text-sm text-ink-sub">
            <summary className="cursor-pointer font-semibold text-ink">{t("dhome.shareMore")}</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>{t("dhome.consent2")}</li>
              <li>{t("dhome.consent3")}</li>
              <li>{t("dhome.consent4")}</li>
              <li>{t("dhome.consent5")}</li>
            </ul>
          </details>
          <Button variant="success" size="cta" block loading={busy} onClick={() => void doClock("CLOCK_IN", true, true)}>
            {t("dhome.clockInShare")}
          </Button>
          <Button variant="secondary" block disabled={busy} onClick={() => void doClock("CLOCK_IN", false, true)}>
            {t("dhome.clockInNoShare")}
          </Button>
          <p className="text-center text-xs text-ink-faint">{t("dhome.shareRemember")}</p>
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

/* 출근 때 위치 공유 선택 — 이 휴대폰에 기억 (홈의 위치 공유 카드에서 언제든 끄고 켤 수 있음) */
const SHARE_KEY = "bosscall.shareOnClockIn";
function savedShareChoice(): boolean | null {
  try {
    const v = localStorage.getItem(SHARE_KEY);
    return v === "1" ? true : v === "0" ? false : null;
  } catch {
    return null;
  }
}
function saveShareChoice(on: boolean): void {
  try {
    localStorage.setItem(SHARE_KEY, on ? "1" : "0");
  } catch {
    /* 무시 */
  }
}
