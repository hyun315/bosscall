"use client";
import { useEffect, useState } from "react";
import { ALARM_SOUNDS, DEFAULT_ALARM_SOUND, type AlarmSoundId } from "@/lib/alarmSounds";
import { getAlarmSound, installAlarmUnlock, previewAlarm, setAlarmSound } from "@/services/client/alarm";
import { useI18n } from "@/i18n/client";

/** 기사: 호출 알람 소리 고르기 (이 휴대폰에 저장). 고르면 바로 들려준다. */
export function AlarmSoundPicker() {
  const { t } = useI18n();
  const [sound, setSound] = useState<AlarmSoundId>(DEFAULT_ALARM_SOUND);

  useEffect(() => {
    installAlarmUnlock();
    setSound(getAlarmSound());
  }, []);

  const choose = (id: AlarmSoundId) => {
    setSound(id);
    setAlarmSound(id);
    previewAlarm(id);
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
              className="min-h-[44px] rounded-btn px-3 text-sm font-semibold text-action active:bg-action-soft"
              aria-label={t("alarm.previewAria", { name: t(`alarm.sound.${id}`) })}
            >
              ▶ {t("alarm.preview")}
            </button>
          </div>
        ))}
      </div>
      <p className="px-1 text-sm leading-relaxed text-ink-sub">{t("alarm.note")}</p>
    </section>
  );
}
