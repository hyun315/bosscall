"use client";
import { LOCALES, LOCALE_NAMES } from "@/i18n/core";
import { useI18n } from "@/i18n/client";

/**
 * 언어 선택 — 한국어 / Bahasa Indonesia / English.
 * 로그인 전에는 이 기기에만, 로그인 후에는 계정에도 저장된다 (알림도 이 언어로 받음).
 */
export function LanguagePicker({ variant = "card" }: { variant?: "card" | "compact" }) {
  const { t, locale, setLocale } = useI18n();

  const buttons = (
    <div className={`grid gap-2 ${variant === "compact" ? "grid-cols-3" : "grid-cols-1"}`} role="radiogroup" aria-label={t("lang.title")}>
      {LOCALES.map((l) => {
        const on = l === locale;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={on}
            lang={l}
            onClick={() => setLocale(l)}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-btn border px-3 text-[15px] font-semibold ${
              variant === "card" ? "justify-between" : ""
            } ${on ? "border-action bg-action-soft text-action" : "border-line bg-surface text-ink"}`}
          >
            <span className={variant === "compact" ? "text-sm" : ""}>{LOCALE_NAMES[l]}</span>
            {variant === "card" && on && <span aria-hidden>✓</span>}
          </button>
        );
      })}
    </div>
  );

  if (variant === "compact") return buttons;
  return (
    <section className="card space-y-3 p-4">
      <div>
        <p className="text-[15px] font-semibold text-ink">🌐 {t("lang.title")}</p>
        <p className="mt-0.5 text-sm text-ink-sub">{t("lang.desc")}</p>
      </div>
      {buttons}
    </section>
  );
}
