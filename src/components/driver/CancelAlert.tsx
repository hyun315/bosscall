"use client";
/**
 * 기사 앱: 호출자가 취소한 호출 — [확인]을 누를 때까지 화면 전체 안내 + 알람 (호출 알람과 같은 소리).
 * 확인을 누르면 그 자리에서 소리를 끄고 서버에 확인을 보낸다 (서버는 다시 알림 보내기를 멈춘다).
 */
import { useAlarmState } from "@/hooks/useCallAlarm";
import { shortPlace } from "@/lib/format";
import { isCallSilenced, silenceCall, unsilenceCall } from "@/services/client/alarm";
import { ackCancelledCall } from "@/services/client/actions";
import type { CallDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

export function CancelAlert({ groupId, alerts }: { groupId: string; alerts: CallDoc[] }) {
  const { t } = useI18n();
  useAlarmState(); // 확인 후 바로 다시 그리기
  const call = alerts.find((c) => !isCallSilenced(`cancel-${c.id}`));
  if (!call) return null;

  const ok = () => {
    silenceCall(`cancel-${call.id}`);
    silenceCall(call.id);
    ackCancelledCall(groupId, call.id).catch(() => unsilenceCall(`cancel-${call.id}`));
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cancel-alert-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-5"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-card bg-surface text-center shadow-modal">
        <div className="bg-danger px-5 pb-5 pt-6 text-white">
          <p className="text-5xl" aria-hidden>
            🚫
          </p>
          <h2 id="cancel-alert-title" className="mt-3 text-[22px] font-extrabold">
            {t("cancelAlert.title")}
          </h2>
          <p className="mt-1 text-[15px] text-white/90">{t("cancelAlert.body", { caller: call.callerName })}</p>
        </div>
        <div className="space-y-1.5 px-5 py-4 text-left text-[15px] text-ink">
          <p className="truncate">📍 {shortPlace(call.pickupName, call.pickupAddress)}</p>
          <p className="truncate">🎯 {shortPlace(call.destinationName, call.destinationAddress)}</p>
        </div>
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={ok}
            className="flex min-h-[56px] w-full items-center justify-center rounded-btn bg-navy text-[17px] font-bold text-white active:scale-[0.99]"
          >
            {t("cancelAlert.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}
