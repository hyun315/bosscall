"use client";
import { useEffect, useRef, useState } from "react";
import { useReadySession } from "@/hooks/useSession";
import { AD_CONTACT_EMAIL, SLOT_ADS, adLink, adsEnabled, inquiryMailto, type AdSlotId } from "@/lib/ads";
import { trackClient } from "@/services/client/api";
import { useI18n } from "@/i18n/client";

/**
 * 광고 칸 — 사장님·가족 화면 전용. 기사 계정에는 아무것도 그리지 않는다.
 * 노출은 칸이 화면에 처음 보였을 때 1번, 클릭은 누를 때마다 기록한다.
 */
export function AdSlot({ slot, className = "" }: { slot: AdSlotId; className?: string }) {
  const { role, groupId } = useReadySession();
  const { t, locale } = useI18n();
  const ref = useRef<HTMLElement | null>(null);
  const seen = useRef(false);
  const [copied, setCopied] = useState(false);
  const content = SLOT_ADS[slot];
  const show = adsEnabled() && role !== "DRIVER";

  useEffect(() => {
    const el = ref.current;
    if (!show || !el || seen.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !seen.current) {
          seen.current = true;
          trackClient("ad_impression", groupId, { slot, ad: content.kind === "ad" ? content.id : "inquiry" });
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, groupId, slot, content]);

  if (!show) return null;

  if (content.kind === "inquiry") {
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(AD_CONTACT_EMAIL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* 복사 불가 — 주소는 화면에 보이고 선택할 수 있다 */
      }
    };
    return (
      <aside
        ref={ref}
        aria-label={t("ad.inquiryTitle")}
        className={`rounded-card border border-dashed border-line bg-surface px-4 py-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl" aria-hidden>
            📣
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink">{t("ad.inquiryTitle")}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-sub">{t("ad.inquiryBody")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={inquiryMailto(slot)}
                onClick={() => trackClient("ad_click", groupId, { slot, ad: "inquiry" })}
                className="inline-flex min-h-[40px] items-center rounded-btn bg-action-soft px-3 text-sm font-semibold text-action"
              >
                ✉️ {t("ad.inquiryMail")}
              </a>
              <button
                type="button"
                onClick={() => void copy()}
                className="min-h-[40px] select-all rounded-btn px-2 text-sm text-ink-sub underline-offset-2 hover:underline"
              >
                {copied ? t("ad.copied") : AD_CONTACT_EMAIL}
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside ref={ref} aria-label={content.sponsor[locale]} className={`card overflow-hidden ${className}`}>
      <a
        href={adLink(content.url, slot)}
        target="_blank"
        rel="noopener sponsored"
        onClick={() => trackClient("ad_click", groupId, { slot, ad: content.id })}
        className="flex items-start gap-3 px-4 py-4 active:bg-bg"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-action-soft text-2xl" aria-hidden>
          {content.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-xs text-ink-sub">
            <span className="rounded border border-line px-1.5 py-px font-semibold">{t("ad.label")}</span>
            {content.sponsor[locale]}
          </span>
          <span className="mt-1 block text-[15px] font-bold leading-snug text-ink">{content.title[locale]}</span>
          <span className="mt-1 block text-sm leading-relaxed text-ink-sub">{content.body[locale]}</span>
          <span className="mt-2 inline-block text-sm font-semibold text-action">{content.cta[locale]} ›</span>
        </span>
      </a>
    </aside>
  );
}
