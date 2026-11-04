"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { ALARM_SOUNDS, DEFAULT_ALARM_SOUND, type AlarmSoundId } from "@/lib/alarmSounds";
import { sendTestPush } from "@/services/client/actions";
import { TestPushResult } from "@/components/common/TestPushResult";
import { errorMessage } from "@/services/client/api";
import { getAlarmSound, installAlarmUnlock, previewAlarm, setAlarmSound } from "@/services/client/alarm";
import { useI18n } from "@/i18n/client";

/**
 * 기사: 알람 소리 고르기 (이 휴대폰에 저장) + 화면 끄고 확인하는 테스트 알림.
 * 알람은 끌 수 없다 — 홈 화면에 추가 = 소리에 동의 (사장님 결정). 무음 스위치와 상관없이 울린다.
 */
export function AlarmSoundPicker() {
  const { t } = useI18n();
  const toast = useToast();
  const [sound, setSound] = useState<AlarmSoundId>(DEFAULT_ALARM_SOUND);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    installAlarmUnlock();
    setSound(getAlarmSound());
  }, []);

  const choose = (id: AlarmSoundId) => {
    setSound(id);
    setAlarmSound(id);
    previewAlarm(id);
  };

  const [sentAt, setSentAt] = useState<number | null>(null);
  const test = async () => {
    setTesting(true);
    try {
      setSentAt(Date.now());
      const r = await sendTestPush();
      toast(r.devices > 0 ? t("alarm.testSent") : t("alarm.testNoDevice"), r.devices > 0 ? "success" : "error");
    } catch (e) {
      setSentAt(null); // 보내지 못했음 (너무 자주 누름 등) — "보내는 중"에 멈춰 있지 않게
      toast(errorMessage(e), "error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="space-y-2">
      <h2 className="section-title">{t("alarm.title")}</h2>

      <div className="card divide-y divide-line" role="radiogroup" aria-label={t("alarm.title")}>
        {ALARM_SOUNDS.map((id) => (
          <div key={id} className="flex min-h-[60px] items-center gap-3 px-4 py-2">
            <label className="flex flex-1 cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="alarm-sound"
                className="h-5 w-5 accent-action"
                checked={sound === id}
                onChange={() => choose(id)}
              />
              <span className="text-[15px] font-semibold text-ink">
                {t(`alarm.sound.${id}`)}
                {id === DEFAULT_ALARM_SOUND && <span className="ml-2 text-xs font-normal text-ink-sub">{t("alarm.default")}</span>}
              </span>
            </label>
            <button
              type="button"
              onClick={() => previewAlarm(id)}
              className="min-h-[44px] rounded-btn px-3 text-sm font-semibold text-link active:bg-action-soft"
              aria-label={t("alarm.previewAria", { name: t(`alarm.sound.${id}`) })}
            >
              ▶ {t("alarm.preview")}
            </button>
          </div>
        ))}
      </div>
      <p className="px-1 text-sm leading-relaxed text-ink-sub">{t("alarm.note")}</p>

      <div className="card space-y-2 p-4">
        <p className="text-[15px] font-semibold text-ink">{t("alarm.testTitle")}</p>
        <p className="text-sm leading-relaxed text-ink-sub">{t("alarm.testDesc")}</p>
        <Button block variant="secondary" loading={testing} onClick={() => void test()}>
          🔔 {t("alarm.testButton")}
        </Button>
        <TestPushResult sentAt={sentAt} />
      </div>
    </section>
  );
}
