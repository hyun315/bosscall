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
  placeHref,
  slotLayout,
  type AdPlace,
  type AdPlaceUse,
  type AdSlotId,
  type HouseAd,
} from "@/lib/ads";
import { trackClient } from "@/services/client/api";
import { useI18n } from "@/i18n/client";

/**
 * 광고 칸 — 사장님·가족 화면 전용. 기사 계정에는 아무것도 그리지 않는다.
 * 한 화면 1~5번 고정 자리 (slotLayout): 유료 광고는 자기 번호 자리에, 픽업·목적지 화면에선 같은 번호면 호출 묶음 우선,
 * 1번이 비면 한인업소록, 나머지 빈 자리는 "광고 자리 N" 안내. 끝난 광고 자리는 빈칸으로 남는다.
 * 노출은 칸이 화면에 처음 보였을 때 1번, 클릭은 누를 때마다 기록한다 (내부 참고용).
 *
 * 광고에 업소 위치가 있으면 [출발지로 설정·목적지로 설정] 단추가 붙는다.
 *  - [출발지로 설정]/[목적지로 설정]. onPlace 를 주면 (호출 화면) 그 자리에서 바로 채운다.
 *  - 없으면 기사 호출 화면으로 목적지를 들고 이동한다. 응답 대기 화면처럼 호출 중이면 noDestination.
 */
export function AdSlot({
  slot,
  className = "",
  onPlace,
  noDestination = false,
}: {
  slot: AdSlotId;
  className?: string;
  onPlace?: (p: AdPlace, use: AdPlaceUse) => void;
  noDestination?: boolean;
}) {
  const { role, groupId } = useReadySession();
  const router = useRouter();
  const ref = useRef<HTMLElement | null>(null);
  const seen = useRef(false);
  const show = adsEnabled() && role !== "DRIVER";
  const campaigns = useAdCampaigns(show);
  // 1~5번 고정 자리 — 끝난 광고 자리는 빈칸으로 남는다
  const cells = slotLayout(campaigns, slot, Date.now());
  const house = SLOT_FALLBACK.find((c): c is HouseAd => c.kind === "ad");
  const adIds = cells
    .map((x) => (x.kind === "paid" ? x.c.id : x.kind === "house" ? house?.id : null))
    .filter(Boolean)
    .join(",");

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
      {cells.map((cell) => {
        if (cell.kind === "house") {
          return house ? <BannerCard key="house" ad={house} slot={slot} onClick={clickOf(house.id)} /> : null;
        }
        if (cell.kind === "empty") {
          return <EmptyAdCard key={`e${cell.n}`} n={cell.n} slot={slot} onClick={clickOf("inquiry")} />;
        }
        const c = cell.c;
        return (
        <PaidBanner
          key={c.id}
          company={c.company}
          bannerUrl={c.bannerUrl}
          detailUrl={c.detailUrl}
          linkUrl={c.linkUrl ? adLink(c.linkUrl, slot) : null}
          onOpen={clickOf(c.id)}
          onGo={
            c.place && !noDestination
              ? (use: AdPlaceUse) => {
                  const place = c.place!;
                  trackClient("ad_click", groupId, { slot, ad: c.id, action: use });
                  if (onPlace) onPlace(place, use);
                  else router.push(placeHref(place, use));
                }
              : undefined
          }
        />
        );
      })}
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
  /** 있으면 배너 아래와 상세 화면에 [출발지로 설정]/[목적지로 설정] */
  onGo?: (use: AdPlaceUse) => void;
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
      </div>
      {/* 배너 바로 아래 — 이미지를 가리지 않게 단추 두 개를 따로 둔다 */}
      {onGo && (
        <div className="-mt-1.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onGo("pickup")}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-btn border border-line bg-surface text-[14px] font-bold text-navy shadow-card active:scale-[0.98]"
          >
            📍 {t("ad.setPickup")}
          </button>
          <button
            type="button"
            onClick={() => onGo("destination")}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-btn bg-action text-[14px] font-bold text-white shadow-card active:scale-[0.98]"
          >
            🎯 {t("ad.setDestination")}
          </button>
        </div>
      )}
      {open && detailUrl && (
        <AdDetail
          company={company}
          detailUrl={detailUrl}
          linkUrl={linkUrl}
          onGo={
            onGo
              ? (use: AdPlaceUse) => {
                  setOpen(false);
                  onGo(use);
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
  onGo?: (use: AdPlaceUse) => void;
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
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onGo("pickup")}
              className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-btn bg-white text-[15px] font-bold text-navy"
            >
              📍 {t("ad.setPickup")}
            </button>
            <button
              type="button"
              onClick={() => onGo("destination")}
              className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-btn bg-action text-[15px] font-bold text-white"
            >
              🎯 {t("ad.setDestination")}
            </button>
          </div>
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

/** 비어 있는 광고 자리 — 번호와 함께 "광고가 올라갈 자리" 안내, 누르면 광고 안내 페이지 */
function EmptyAdCard({ n, slot, onClick }: { n: number; slot: AdSlotId; onClick: () => void }) {
  const { t } = useI18n();
  return (
    <Link
      href={advertisePath(slot)}
      onClick={onClick}
      className="flex items-center gap-3 rounded-card border border-dashed border-action/40 bg-action-soft/50 px-4 py-3 active:bg-action-soft"
    >
      <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-btn bg-surface text-action shadow-card" aria-hidden>
        <span className="text-[10px] font-semibold leading-none">AD</span>
        <span className="text-[17px] font-extrabold leading-tight">{n}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-ink">{t("ad.emptyTitle", { n })}</span>
        <span className="mt-0.5 block truncate text-xs text-ink-sub">{t("ad.inquiryShort")}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-action">{t("ad.inquiryMore")} ›</span>
    </Link>
  );
}
