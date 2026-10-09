"use client";
import { useI18n } from "@/i18n/client";

export interface ConsentChoice {
  analytics: boolean;
  marketing: boolean;
}

/** 선택 동의 두 항목 — 기본값은 모두 꺼짐 */
export function ConsentOptions({
  value,
  onChange,
  disabled,
}: {
  value: ConsentChoice;
  onChange: (v: ConsentChoice) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const rows = [
    { key: "analytics", title: t("privacy.analyticsTitle"), desc: t("privacy.analyticsDesc") },
    { key: "marketing", title: t("privacy.marketingTitle"), desc: t("privacy.marketingDesc") },
  ] as const;
  return (
    <div className="card divide-y divide-line">
      {rows.map((r) => (
        <label key={r.key} className="flex cursor-pointer items-start gap-3 px-4 py-4">
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ink">{r.title}</span>
            <span className="mt-1 block text-sm leading-relaxed text-ink-sub">{r.desc}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="mt-1 h-6 w-11 shrink-0 cursor-pointer accent-action"
            checked={value[r.key]}
            disabled={disabled}
            onChange={() => onChange({ ...value, [r.key]: !value[r.key] })}
          />
        </label>
      ))}
    </div>
  );
}
