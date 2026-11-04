"use client";
/**
 * 출근 깜빡 알림 (사장님) — 정한 요일·시각이 지나도 기사가 출근을 안 눌렀으면 기사에게 하루 한 번 알림.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { setClockInReminder } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { weekdayShort } from "@/lib/time";
import type { DriverDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import { IconAlarm } from "@/components/brand/Icons";

const WEEK = [1, 2, 3, 4, 5, 6, 0];

export function ClockInReminderCard({ groupId, driver }: { groupId: string; driver: DriverDoc }) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const saved = driver.clockInReminder ?? null;
  const [time, setTime] = useState(saved?.time ?? "07:30");
  const [days, setDays] = useState<number[]>(saved?.days ?? [1, 2, 3, 4, 5, 6]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (saved) {
      setTime(saved.time);
      setDays(saved.days);
    }
  }, [saved?.time, saved?.days?.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (on: boolean) => {
    setBusy(true);
    try {
      await setClockInReminder(groupId, driver.id, on ? time : null, days);
      toast(on ? t("reminder.saved", { time }) : t("reminder.off"), "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  const toggleDay = (d: number) => setDays((v) => (v.includes(d) ? v.filter((x) => x !== d) : [...v, d]));
  const changed = !saved || saved.time !== time || saved.days.slice().sort().join() !== days.slice().sort().join();

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[15px] font-semibold text-ink"><IconAlarm className="h-5 w-5 text-link" />{t("reminder.title")}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-sub">
            {saved ? t("reminder.onDesc", { time: saved.time }) : t("reminder.desc")}
          </p>
        </div>
        {saved && (
          <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success">ON</span>
        )}
      </div>
      <label className="flex items-center gap-3">
        <span className="text-sm font-semibold text-ink">{t("reminder.time")}</span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="min-h-[44px] rounded-btn border border-line bg-surface px-3 text-[16px] text-ink"
        />
      </label>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("reminder.days")}>
        {WEEK.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={days.includes(d)}
            onClick={() => toggleDay(d)}
            className={`h-10 w-10 rounded-full text-sm font-bold ${
              days.includes(d) ? "bg-action text-white" : "bg-line/60 text-ink-sub"
            }`}
          >
            {weekdayShort(d, locale)}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {(changed || !saved) && (
          <Button className="flex-1" loading={busy} disabled={days.length === 0} onClick={() => void save(true)}>
            {saved ? t("reminder.update") : t("reminder.turnOn")}
          </Button>
        )}
        {saved && (
          <Button variant="secondary" className="flex-1" loading={busy} onClick={() => void save(false)}>
            {t("reminder.turnOff")}
          </Button>
        )}
      </div>
    </div>
  );
}
