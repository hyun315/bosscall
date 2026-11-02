"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { useReadySession } from "@/hooks/useSession";
import { ALARM_SOUNDS, DEFAULT_ALARM_SOUND, type AlarmSoundId } from "@/lib/alarmSounds";
import { sendTestPush, updateMe } from "@/services/client/actions";
import { TestPushResult } from "@/components/common/TestPushResult";
import { errorMessage } from "@/services/client/api";
import { getAlarmSound, installAlarmUnlock, previewAlarm, setAlarmSound } from "@/services/client/alarm";
import { useI18n } from "@/i18n/client";

/**
 * 기사: 호출 소리 켜기/끄기 (계정에 저장 — 푸시 알림 소리에도 적용, 설정하지 않았으면 켜짐)
 * + 앱이 열려 있을 때 울릴 알람 소리 고르기 (이 휴대폰에 저장) + 화면 끄고 확인하는 테스트 알림.
 */
export function AlarmSoundPicker() {
  const { me } = useReadySession();
  const { t } = useI18n();
  const toast = useToast();
  const [sound, setSound] = useState<AlarmSoundId>(DEFAULT_ALARM_SOUND);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const soundOn = me.callAlarmSound !== false;

  useEffect(() => {
    installAlarmUnlock();
    setSound(getAlarmSound());
  }, []);

  const toggle = async () => {
    setSaving(true);
    try {
      await updateMe({ callAlarmSound: !soundOn });
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

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

      <label className="card flex min-h-[64px] cursor-pointer items-center gap-3 px-4 py-3">
        <span className="flex-1">
          <span className="block text-[15px] font-semibold text-ink">{t("alarm.soundOn")}</span>
          <span className="block text-sm text-ink-sub">{soundOn ? t("alarm.soundOnDesc") : t("alarm.soundOffDesc")}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="h-6 w-11 cursor-pointer accent-action"
          checked={soundOn}
          disabled={saving}
          onChange={() => void toggle()}
        />
      </label>

      <div
        className={`card divide-y divide-line ${soundOn ? "" : "pointer-events-none opacity-50"}`}
        role="radiogroup"
        aria-label={t("alarm.title")}
        aria-disabled={!soundOn}
      >
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
