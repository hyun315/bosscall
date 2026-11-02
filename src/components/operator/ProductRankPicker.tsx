"use client";
/**
 * 상품·자리 번호 고르기 (운영자) — 프리미엄 1~5 / 호출 묶음 1~5 두 줄.
 * 하나를 누르면 상품과 번호가 함께 정해진다. 점(•)은 같은 기간에 이미 쓰는 자리.
 */
import { AD_PRODUCTS, AD_RANKS, PRODUCT_INFO, rankTaken, type AdCampaignDoc, type AdProduct } from "@/lib/ads";

export interface ProductRank {
  product: AdProduct;
  rank: number;
}

export function ProductRankPicker({
  value,
  onChange,
  campaigns,
  startAt,
  endAt,
  exceptId,
}: {
  value: ProductRank;
  onChange: (v: ProductRank) => void;
  campaigns: readonly AdCampaignDoc[];
  startAt: number | null;
  endAt: number | null;
  exceptId?: string;
}) {
  return (
    <div className="space-y-2">
      <span className="label">상품 · 자리 번호</span>
      {AD_PRODUCTS.map((p) => (
        <div key={p} className={`rounded-btn border p-2 ${value.product === p ? "border-action bg-action-soft/40" : "border-line bg-surface"}`}>
          <p className="mb-1.5 px-1 text-[13px] font-bold text-ink">
            {PRODUCT_INFO[p].name} <span className="font-normal text-ink-sub">· {PRODUCT_INFO[p].desc}</span>
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {AD_RANKS.map((r) => {
              const on = value.product === p && value.rank === r;
              const taken =
                !on && startAt !== null && endAt !== null ? rankTaken(campaigns, p, r, startAt, endAt, exceptId) : null;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onChange({ product: p, rank: r })}
                  aria-pressed={on}
                  title={taken ? `사용 중: ${taken.company}` : undefined}
                  className={`relative min-h-[44px] rounded-btn border text-[15px] font-bold ${
                    on ? "border-action bg-action text-white" : taken ? "border-line bg-line/40 text-ink-faint" : "border-line bg-surface text-ink"
                  }`}
                >
                  {r}
                  {taken && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warning" aria-label="사용 중" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs leading-relaxed text-ink-sub">
        화면마다 1~5번 고정 자리. 홈·응답 대기 화면은 프리미엄만, 픽업·목적지 화면은 같은 번호면 호출 묶음이 우선. 1번이 비면 한인업소록.
        점(•)은 같은 기간에 이미 쓰는 자리입니다.
      </p>
    </div>
  );
}
