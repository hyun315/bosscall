"use client";
/** 광고주 업소 위치 고르기 — 구글 장소 검색. 결과는 이름·주소·Place ID 만 남긴다 */
import { PlaceSearch } from "@/components/location/PlaceSearch";
import type { AdPlace } from "@/lib/ads";

export function AdPlaceField({ value, onChange }: { value: AdPlace | null; onChange: (p: AdPlace | null) => void }) {
  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-btn border border-line bg-surface px-4 py-3">
        <span className="text-xl" aria-hidden>
          📍
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">{value.name}</span>
          <span className="block truncate text-xs text-ink-sub">{value.address}</span>
        </span>
        <button type="button" onClick={() => onChange(null)} className="shrink-0 text-sm font-semibold text-action">
          변경
        </button>
      </div>
    );
  }
  return (
    <PlaceSearch
      groupId={null}
      placeholder="업소 이름이나 주소로 검색"
      onSelect={(p) => {
        if (p.placeId) onChange({ name: p.name ?? p.address, address: p.address, placeId: p.placeId });
      }}
    />
  );
}
