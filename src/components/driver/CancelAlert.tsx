"use client";
/**
 * 기사 앱: 호출이 취소됨 / 응답 시간이 지남(놓친 호출) — [확인]을 누를 때까지 화면 전체 안내 + 알람.
 * 확인을 누르면 그 자리에서 소리를 끄고 서버에 확인을 보낸다 (서버는 다시 알림 보내기를 멈춘다).
 */
import { useAlarmState } from "@/hooks/useCallAlarm";
import { shortPlace } from "@/lib/format";
import { isCallSilenced, silenceCall, unsilenceCall } from "@/services/client/alarm";
import { ackCancelledCall } from "@/services/client/actions";
import type { CallDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import { IconAlarm, IconBan, IconFlag, IconPin } from "@/components/brand/Icons";

export function CancelAlert({ groupId, alerts }: { groupId: string; alerts: CallDoc[] }) {
  const { t } = useI18n();
  useAlarmState(); // 확인 후 바로 다시 그리기
  const call = alerts.find((c) => !isCallSilenced(`cancel-${c.id}`));
  if (!call) return null;
  const missed = call.status === "TIMEOUT";

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
        <div className="bg-danger-solid px-5 pb-5 pt-6 text-white">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15" aria-hidden>
            {missed ? <IconAlarm className="h-9 w-9" /> : <IconBan className="h-9 w-9" />}
          </span>
          <h2 id="cancel-alert-title" className="mt-3 text-[22px] font-extrabold">
            {t(missed ? "cancelAlert.missedTitle" : "cancelAlert.title")}
          </h2>
          <p className="mt-1 text-[15px] text-white/90">
            {t(missed ? "cancelAlert.missedBody" : "cancelAlert.body", { caller: call.callerName })}
          </p>
        </div>
        <div className="space-y-1.5 px-5 py-4 text-left text-[15px] text-ink">
          <p className="flex items-center gap-2 truncate"><IconPin className="h-4 w-4 shrink-0 text-link" />{shortPlace(call.pickupName, call.pickupAddress)}</p>
          <p className="flex items-center gap-2 truncate"><IconFlag className="h-4 w-4 shrink-0 text-teal" />{shortPlace(call.destinationName, call.destinationAddress)}</p>
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
