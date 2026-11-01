"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useReadySession } from "@/hooks/useSession";
import { SLOT_ADS, adLink, adsEnabled, advertisePath, type AdSlotId, type HouseAd } from "@/lib/ads";
import { trackClient } from "@/services/client/api";
import { useI18n } from "@/i18n/client";

/**
 * 광고 칸 — 사장님·가족 화면 전용. 기사 계정에는 아무것도 그리지 않는다.
 * 노출은 칸이 화면에 처음 보였을 때 1번, 클릭은 누를 때마다 기록한다.
 */
export function AdSlot({ slot, className = "" }: { slot: AdSlotId; className?: string }) {
  const { role, groupId } = useReadySession();
  const ref = useRef<HTMLElement | null>(null);
  const seen = useRef(false);
  const contents = SLOT_ADS[slot];
  const show = adsEnabled() && role !== "DRIVER" && contents.length > 0;
  const adIds = contents.map((c) => (c.kind === "ad" ? c.id : "inquiry")).join(",");

  useEffect(() => {
    const el = ref.current;
    if (!show || !el || seen.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !seen.current) {
          seen.current = true;
          trackClient("ad_impression", groupId, { slot, ad: adIds });
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, groupId, slot, adIds]);

  if (!show) return null;
  const clickOf = (ad: string) => () => trackClient("ad_click", groupId, { slot, ad });

  return (
    <aside ref={ref} className={`space-y-3 ${className}`}>
      {contents.map((c) =>
        c.kind === "inquiry" ? (
          <InquiryCard key="inquiry" slot={slot} onClick={clickOf("inquiry")} />
        ) : (
          <BannerCard key={c.id} ad={c} slot={slot} onClick={clickOf(c.id)} />
        ),
      )}
    </aside>
  );
}

/** 광고주 배너 — 네이비 바탕, 큰 숫자, 카테고리 칩, 흰 버튼 */
export function BannerCard({ ad, slot, onClick }: { ad: HouseAd; slot: AdSlotId; onClick: () => void }) {
  const { t, locale } = useI18n();
  return (
    <a
      href={adLink(ad.url, slot)}
      target="_blank"
      rel="noopener sponsored"
      onClick={onClick}
      className="group relative block overflow-hidden rounded-card bg-navy px-5 pb-5 pt-4 text-white shadow-modal active:scale-[0.99]"
    >
      {/* 배경 장식 */}
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-action/40 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-[#F2C230]/20 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute right-4 top-10 select-none text-[64px] leading-none opacity-90 drop-shadow-lg">
        {ad.icon}
      </span>

      <span className="relative flex items-center gap-2 text-xs text-white/70">
        <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-semibold text-white">{t("ad.label")}</span>
        {ad.sponsor[locale]}
      </span>

      {ad.stat && (
        <span className="relative mt-3 block text-[13px] font-semibold tracking-wide text-[#F2C230]">{ad.stat[locale]}</span>
      )}
      <span className="relative mt-1 block max-w-[78%] text-[19px] font-extrabold leading-snug [text-wrap:balance]">
        {ad.title[locale]}
      </span>

      {ad.chips && ad.chips.length > 0 && (
        <span className="relative mt-3 flex flex-wrap gap-1.5">
          {ad.chips.map((c) => (
            <span key={c.label.ko} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15">
              {c.icon} {c.label[locale]}
            </span>
          ))}
        </span>
      )}

      <span className="relative mt-4 flex items-center justify-between gap-3">
        <span className="min-w-0 text-xs text-white/60">{ad.body[locale]}</span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-navy transition group-hover:translate-x-0.5">
          {ad.cta[locale]} →
        </span>
      </span>
    </a>
  );
}

/** 빈 칸 — 광고 안내 페이지로 */
function InquiryCard({ slot, onClick }: { slot: AdSlotId; onClick: () => void }) {
  const { t } = useI18n();
  return (
    <Link
      href={advertisePath(slot)}
      onClick={onClick}
      className="flex items-center gap-3 rounded-card border border-dashed border-action/40 bg-action-soft/60 px-4 py-4 active:bg-action-soft"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-btn bg-surface text-2xl shadow-card" aria-hidden>
        📣
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-ink">{t("ad.inquiryTitle")}</span>
        <span className="mt-0.5 block text-sm text-ink-sub">{t("ad.inquiryShort")}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-action">{t("ad.inquiryMore")} ›</span>
    </Link>
  );
}
