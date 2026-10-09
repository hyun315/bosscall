"use client";
import { useState } from "react";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { DEFAULT_PAYROLL_RULES, formatIDR } from "@/lib/payroll";
import { savePayrollSettings } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import type { PayrollSettingsDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import { weekdayShort } from "@/lib/time";

/** "5.500.000" 같은 입력을 숫자로 */
function parseAmount(v: string): number {
  const n = Number(v.replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function amountText(n: number): string {
  return n > 0 ? new Intl.NumberFormat("id-ID").format(n) : "";
}

/** 급여 조건 설정 — 기본급 / 시간외 수당(시간당) / 기본 근무시간 / 근무 요일 / 계산 단위 / 기사 공개 */
export function PayrollSettingsSheet({
  groupId,
  driverId,
  driverName,
  current,
  onClose,
}: {
  groupId: string;
  driverId: string;
  driverName: string;
  current: PayrollSettingsDoc | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const { t, locale } = useI18n();
  const init = current ?? { ...DEFAULT_PAYROLL_RULES, shareWithDriver: true };
  const [base, setBase] = useState(amountText(init.monthlyBase));
  const [rate, setRate] = useState(amountText(init.overtimeHourlyRate));
  const [hours, setHours] = useState(String(init.regularHoursPerDay));
  const [workdays, setWorkdays] = useState<number[]>(init.workdays);
  const [rounding, setRounding] = useState<1 | 15 | 30 | 60>(init.overtimeRoundingMinutes);
  const [share, setShare] = useState(init.shareWithDriver);
  const [busy, setBusy] = useState(false);

  const toggleDay = (d: number) =>
    setWorkdays((xs) => (xs.includes(d) ? xs.filter((x) => x !== d) : [...xs, d].sort()));

  const save = async () => {
    const h = Number(hours);
    if (!Number.isFinite(h) || h < 1 || h > 16) {
      toast(t("val.regularHours"), "error");
      return;
    }
    setBusy(true);
    try {
      await savePayrollSettings(groupId, driverId, {
        monthlyBase: parseAmount(base),
        regularHoursPerDay: h,
        overtimeHourlyRate: parseAmount(rate),
        workdays,
        overtimeRoundingMinutes: rounding,
        shareWithDriver: share,
      });
      toast(t("pay.savedToast"), "success");
      onClose();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} title={t("pay.settingsTitle", { name: driverName })}>
      <div className="space-y-5">
        <div>
          <label className="label" htmlFor="ps-base">{t("pay.baseLabel")}</label>
          <input
            id="ps-base"
            className="field text-right tabular-nums"
            inputMode="numeric"
            value={base}
            onChange={(e) => setBase(amountText(parseAmount(e.target.value)))}
            placeholder={t("pay.basePlaceholder")}
          />
        </div>
        <div>
          <label className="label" htmlFor="ps-rate">{t("pay.rateLabel")}</label>
          <input
            id="ps-rate"
            className="field text-right tabular-nums"
            inputMode="numeric"
            value={rate}
            onChange={(e) => setRate(amountText(parseAmount(e.target.value)))}
            placeholder={t("pay.ratePlaceholder")}
          />
        </div>
        <div>
          <label className="label" htmlFor="ps-hours">{t("pay.hoursLabel")}</label>
          <div className="flex items-center gap-2">
            <input
              id="ps-hours"
              className="field w-24 text-right"
              inputMode="decimal"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <span className="text-[15px] text-ink-sub">{t("pay.hoursSuffix")}</span>
          </div>
        </div>
        <fieldset>
          <legend className="label">{t("pay.workdaysLabel")}</legend>
          <div className="grid grid-cols-7 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => {
              const w = weekdayShort(d, locale);
              const on = workdays.includes(d);
              return (
                <button
                  key={w}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDay(d)}
                  className={`h-11 rounded-btn border text-[15px] font-semibold ${
                    on ? "border-action bg-action text-white" : "border-line bg-surface text-ink-sub"
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div>
          <label className="label" htmlFor="ps-round">{t("pay.roundLabel")}</label>
          <select
            id="ps-round"
            className="field"
            value={rounding}
            onChange={(e) => setRounding(Number(e.target.value) as 1 | 15 | 30 | 60)}
          >
            <option value={1}>{t("pay.round1")}</option>
            <option value={15}>{t("pay.roundN", { n: 15 })}</option>
            <option value={30}>{t("pay.roundN", { n: 30 })}</option>
            <option value={60}>{t("pay.round60")}</option>
          </select>
        </div>
        <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-btn border border-line px-4">
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ink">{t("pay.shareLabel")}</span>
            <span className="block text-sm text-ink-sub">{t("pay.shareHint")}</span>
          </span>
          <input type="checkbox" role="switch" className="h-6 w-11 accent-action" checked={share} onChange={() => setShare(!share)} />
        </label>
        <p className="text-xs leading-relaxed text-ink-sub">
          {t("pay.example", {
            base: formatIDR(parseAmount(base) || 0),
            hours: hours || "?",
            rate: formatIDR(parseAmount(rate) || 0),
          })}
        </p>
        <Button block loading={busy} onClick={() => void save()}>
          {t("common.save")}
        </Button>
      </div>
    </BottomSheet>
  );
}
