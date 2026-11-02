"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorState, LoadingState, NotificationBanner } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { PayrollSettingsSheet } from "@/components/payroll/PayrollSettingsSheet";
import { useWorkSessionsBetween } from "@/hooks/useGroupData";
import { toWhatsAppNumber } from "@/lib/format";
import { computeMonthlyPayroll, formatIDR, formatMinutes, payslipTextId } from "@/lib/payroll";
import { formatDate, formatMonth, formatTime, nextMonthStart, prevMonthStart, startOfMonth } from "@/lib/time";
import type { PayrollSettingsDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import { weekdayShort } from "@/lib/time";

/**
 * 월별 급여 — 기본급 + 시간외 수당, 일별 근무내역 (보스첵 요구사항).
 * mode="owner": 설정 수정·명세 공유 가능 / mode="driver": 읽기 전용
 */
export function PayrollView({
  groupId,
  groupName,
  driverId,
  driverName,
  driverPhone,
  tz,
  settings,
  settingsLoading,
  mode,
}: {
  groupId: string;
  groupName: string;
  driverId: string;
  driverName: string;
  driverPhone?: string | null;
  tz: string;
  settings: PayrollSettingsDoc | null;
  settingsLoading: boolean;
  mode: "owner" | "driver";
}) {
  const toast = useToast();
  const { t, locale } = useI18n();
  const [monthStart, setMonthStart] = useState(() => startOfMonth(Date.now(), tz));
  const [now, setNow] = useState(() => Date.now());
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const monthEnd = nextMonthStart(monthStart, tz);
  const isCurrentMonth = now >= monthStart && now < monthEnd;
  const sessions = useWorkSessionsBetween(groupId, monthStart, monthEnd, 500);

  const result = useMemo(() => {
    if (!settings) return null;
    const mine = sessions.data.filter((s) => s.driverId === driverId);
    return computeMonthlyPayroll(mine, settings, { timeZone: tz, from: monthStart, to: monthEnd, now });
  }, [settings, sessions.data, driverId, tz, monthStart, monthEnd, now]);

  if (settingsLoading) return <LoadingState />;

  if (!settings) {
    return mode === "owner" ? (
      <>
        <EmptyState
          icon="💰"
          title={t("pay.setupTitle")}
          description={t("pay.setupDesc")}
          action={<Button block onClick={() => setEditing(true)}>{t("pay.setupButton")}</Button>}
        />
        {editing && (
          <PayrollSettingsSheet groupId={groupId} driverId={driverId} driverName={driverName} current={null} onClose={() => setEditing(false)} />
        )}
      </>
    ) : (
      <EmptyState icon="💰" title={t("pay.notShared")} />
    );
  }

  const slip = result
    ? payslipTextId(result, settings, { driverName, groupName, monthStart, timeZone: tz })
    : "";
  const waNumber = driverPhone ? toWhatsAppNumber(driverPhone) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(slip);
      toast(t("pay.slipCopied"), "success");
    } catch {
      toast(t("pay.copyFailed"), "error");
    }
  };

  return (
    <div className="space-y-4">
      {/* 월 이동 */}
      <div className="flex items-center justify-between">
        <button
          aria-label={t("pay.prevMonth")}
          onClick={() => setMonthStart(prevMonthStart(monthStart, tz))}
          className="flex h-11 w-11 items-center justify-center rounded-full text-2xl active:bg-line/60"
        >
          ‹
        </button>
        <p className="text-lg font-bold text-ink">{formatMonth(monthStart, tz, locale)}</p>
        <button
          aria-label={t("pay.nextMonth")}
          disabled={isCurrentMonth}
          onClick={() => setMonthStart(nextMonthStart(monthStart, tz))}
          className="flex h-11 w-11 items-center justify-center rounded-full text-2xl active:bg-line/60 disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {sessions.loading ? (
        <LoadingState />
      ) : sessions.error ? (
        <ErrorState title={sessions.error} />
      ) : result ? (
        <>
          {/* 요약 */}
          <div className="card divide-y divide-line">
            <div className="p-5">
              <p className="text-sm text-ink-sub">{isCurrentMonth ? t("pay.expectedThisMonth") : t("pay.total")}</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink">{formatIDR(result.total)}</p>
              {result.hasOpenSession && <p className="mt-1 text-sm text-warning-text">{t("pay.openNote")}</p>}
            </div>
            <Row label={t("pay.base")} value={formatIDR(result.base)} />
            <Row
              label={t("pay.overtimeLine", {
                dur: formatMinutes(result.overtimeMin, locale),
                rate: formatIDR(settings.overtimeHourlyRate),
              })}
              value={formatIDR(result.overtimePay)}
            />
            <Row
              label={t("pay.daysAndHours")}
              value={t("pay.daysValue", { days: result.daysWorked, dur: formatMinutes(result.workedMin, locale) })}
            />
          </div>

          {mode === "owner" && (
            <div className="grid grid-cols-2 gap-3">
              {waNumber ? (
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(slip)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-btn bg-[#1FA855] px-3 text-[15px] font-semibold text-white"
                >
                  {t("pay.sendWhatsApp")}
                </a>
              ) : (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(slip)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-btn bg-[#1FA855] px-3 text-[15px] font-semibold text-white"
                >
                  {t("pay.shareWhatsApp")}
                </a>
              )}
              <Button variant="secondary" size="md" onClick={() => void copy()}>
                {t("pay.copySlip")}
              </Button>
            </div>
          )}

          {/* 일별 내역 */}
          <section>
            <h3 className="section-title">{t("pay.byDate")}</h3>
            {result.days.length === 0 ? (
              <p className="card px-4 py-6 text-center text-sm text-ink-sub">{t("pay.noRecords")}</p>
            ) : (
              <div className="card divide-y divide-line overflow-hidden">
                {result.days.map((d) => (
                  <div key={d.dayStart} className="flex items-start gap-3 px-4 py-3">
                    <div className="w-24 shrink-0">
                      <p className={`text-[15px] font-semibold ${d.isWorkday ? "text-ink" : "text-danger"}`}>
                        {formatDate(d.dayStart, tz, locale)}
                      </p>
                      {!d.isWorkday && <p className="text-xs text-danger">{t("pay.dayOffWork")}</p>}
                    </div>
                    <div className="min-w-0 flex-1 text-sm tabular-nums text-ink-sub">
                      {d.sessions.map((s) => (
                        <p key={s.id}>
                          {formatTime(s.clockInAt, tz)} ~ {s.clockOutAt ? formatTime(s.clockOutAt, tz) : t("common.inProgress")}
                        </p>
                      ))}
                    </div>
                    <div className="text-right text-sm tabular-nums">
                      <p className="font-semibold text-ink">{formatMinutes(d.workedMin, locale)}</p>
                      {d.overtimeMin > 0 && (
                        <p className="font-semibold text-action">{t("pay.overtimeShort", { dur: formatMinutes(d.overtimeMin, locale) })}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <NotificationBanner tone="info">
            {t("pay.ruleNote", {
              hours: settings.regularHoursPerDay,
              off:
                [0, 1, 2, 3, 4, 5, 6]
                  .filter((i) => !settings.workdays.includes(i))
                  .map((i) => weekdayShort(i, locale))
                  .join("·") || t("common.none"),
              rounding:
                settings.overtimeRoundingMinutes === 1
                  ? t("pay.roundingExact")
                  : t("pay.roundingDown", { n: settings.overtimeRoundingMinutes }),
            })}
          </NotificationBanner>

          {mode === "owner" && (
            <Button variant="secondary" block onClick={() => setEditing(true)}>
              {t("pay.editSettings")}
            </Button>
          )}
        </>
      ) : null}

      {editing && (
        <PayrollSettingsSheet
          groupId={groupId}
          driverId={driverId}
          driverName={driverName}
          current={settings}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 text-[15px]">
      <span className="text-ink-sub">{label}</span>
      <span className="shrink-0 font-semibold tabular-nums text-ink">{value}</span>
    </div>
  );
}
