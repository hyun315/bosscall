"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useReadySession } from "@/hooks/useSession";
import { useAdCampaigns } from "@/hooks/useAdCampaigns";
import {
  SLOT_FALLBACK,
  adLink,
  adsEnabled,
  advertisePath,
  destinationHref,
  liveCampaigns,
  type AdPlace,
  type AdSlotId,
  type HouseAd,
} from "@/lib/ads";
import { trackClient } from "@/services/client/api";
import { useI18n } from "@/i18n/client";

/**
 * 광고 칸 — 사장님·가족 화면 전용. 기사 계정에는 아무것도 그리지 않는다.
 * 순서: 한인업소록 → 승인된 광고(여러 곳이면 들어올 때마다 돌아가며 하나) → 광고 안내.
 * 노출은 칸이 화면에 처음 보였을 때 1번, 클릭은 누를 때마다 기록한다 (내부 참고용).
 *
 * 광고에 업소 위치가 있으면 [여기로 가기] 단추가 붙는다.
 *  - onDestination 을 주면 (목적지 고르는 화면) 바로 목적지로 고른다.
 *  - 없으면 기사 호출 화면으로 목적지를 들고 이동한다. 응답 대기 화면처럼 호출 중이면 noDestination.
 */
export function AdSlot({
  slot,
  className = "",
  onDestination,
  noDestination = false,
}: {
  slot: AdSlotId;
  className?: string;
  onDestination?: (p: AdPlace) => void;
  noDestination?: boolean;
}) {
  const { role, groupId } = useReadySession();
  const router = useRouter();
  const ref = useRef<HTMLElement | null>(null);
  const seen = useRef(false);
  const show = adsEnabled() && role !== "DRIVER";
  const campaigns = useAdCampaigns(show);
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  const live = liveCampaigns(campaigns, slot, Date.now());
  const paid = live.length > 0 ? live[seed % live.length] : null;
  const house = SLOT_FALLBACK.filter((c): c is HouseAd => c.kind === "ad");
  const adIds = [...house.map((c) => c.id), paid?.id, "inquiry"].filter(Boolean).join(",");

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
    // adIds 가 바뀌는 것(광고 목록 로딩)은 다시 세지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, groupId, slot]);

  if (!show) return null;
  const clickOf = (ad: string) => () => trackClient("ad_click", groupId, { slot, ad });

  return (
    <aside ref={ref} className={`space-y-3 ${className}`}>
      {house.map((c) => (
        <BannerCard key={c.id} ad={c} slot={slot} onClick={clickOf(c.id)} />
      ))}
      {paid && (
        <PaidBanner
          company={paid.company}
          bannerUrl={paid.bannerUrl}
          detailUrl={paid.detailUrl}
          linkUrl={paid.linkUrl ? adLink(paid.linkUrl, slot) : null}
          onOpen={clickOf(paid.id)}
          onGo={
            paid.place && !noDestination
              ? () => {
                  const place = paid.place!;
                  trackClient("ad_click", groupId, { slot, ad: paid.id, action: "destination" });
                  if (onDestination) onDestination(place);
                  else router.push(destinationHref(place));
                }
              : undefined
          }
        />
      )}
      <InquiryCard slot={slot} onClick={clickOf("inquiry")} />
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

/**
 * 광고주 이미지 배너 (1200×400, 3:1 고정) — 누르면 상세 이미지(1080×1350, 4:5)와 링크 버튼.
 * 광고 신청 화면의 미리보기에서도 같은 컴포넌트를 쓴다.
 */
export function PaidBanner({
  company,
  bannerUrl,
  detailUrl,
  linkUrl,
  onOpen,
  onGo,
}: {
  company: string;
  bannerUrl: string;
  detailUrl: string | null;
  linkUrl: string | null;
  onOpen?: () => void;
  /** 있으면 [여기로 가기] 단추 */
  onGo?: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="relative">
      <button
        type="button"
        onClick={() => {
          onOpen?.();
          if (detailUrl) setOpen(true);
          else if (linkUrl) window.open(linkUrl, "_blank", "noopener");
        }}
        className="relative block aspect-[3/1] w-full overflow-hidden rounded-card bg-line shadow-card active:scale-[0.99]"
        aria-label={`${t("ad.label")} · ${company}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {t("ad.label")}
        </span>
      </button>
      {onGo && (
        <button
          type="button"
          onClick={onGo}
          className="absolute bottom-2 right-2 inline-flex min-h-[36px] items-center gap-1 rounded-full bg-white/95 px-3 text-[13px] font-bold text-navy shadow-card ring-1 ring-black/5 active:scale-95"
        >
          🚗 {t("ad.goHere")}
        </button>
      )}
      </div>
      {open && detailUrl && (
        <AdDetail
          company={company}
          detailUrl={detailUrl}
          linkUrl={linkUrl}
          onGo={
            onGo
              ? () => {
                  setOpen(false);
                  onGo();
                }
              : undefined
          }
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function AdDetail({
  company,
  detailUrl,
  linkUrl,
  onGo,
  onClose,
}: {
  company: string;
  detailUrl: string;
  linkUrl: string | null;
  onGo?: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={company}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/80 px-4 pb-[calc(16px+var(--safe-bottom))] pt-[calc(16px+var(--safe-top))]"
      onClick={onClose}
    >
      <div className="flex w-full max-w-sm flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-white">
          <span className="flex items-center gap-2 text-sm">
            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-semibold">{t("ad.label")}</span>
            {company}
          </span>
          <button type="button" onClick={onClose} className="h-10 w-10 rounded-full text-2xl leading-none text-white/80" aria-label={t("common.close")}>
            ×
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={detailUrl} alt="" className="aspect-[4/5] max-h-[70dvh] w-full rounded-card bg-white/10 object-cover" />
        {onGo && (
          <button
            type="button"
            onClick={onGo}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-action text-[15px] font-bold text-white"
          >
            🚗 {t("ad.callHere")}
          </button>
        )}
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener sponsored"
            className={`flex min-h-[52px] items-center justify-center rounded-btn text-[15px] font-bold ${onGo ? "bg-white/15 text-white ring-1 ring-white/25" : "bg-white text-navy"}`}
          >
            {t("ad.openLink")} →
          </a>
        )}
      </div>
    </div>,
    document.body,
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
