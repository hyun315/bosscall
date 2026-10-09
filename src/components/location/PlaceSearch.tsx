"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "@/components/common/Button";
import { PlaceRow } from "@/components/location/LocationCard";
import { errorMessage, trackClient } from "@/services/client/api";
import { PlaceSearchSession, type Suggestion } from "@/services/client/location";
import { MapsError } from "@/lib/location/googleMaps";
import type { PlaceInput } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/**
 * 장소 검색 (§5 C02 "장소 검색", §34.2 Places Autocomplete → Place ID + 좌표 + 주소)
 * 입력 후 350ms 멈추면 요청 — 불필요한 반복 호출 방지 (§34.5)
 */
export function PlaceSearch({
  groupId,
  onSelect,
  autoFocus = false,
  placeholder,
}: {
  groupId: string | null;
  onSelect: (p: PlaceInput) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const { t } = useI18n();
  const session = useMemo(() => new PlaceSearchSession(groupId), [groupId]);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await session.suggest(q);
        if (r === null) return; // 더 최신 요청이 진행 중
        setItems(r);
        setError(null);
      } catch (e) {
        trackClient("maps_error", groupId, { code: e instanceof MapsError ? e.code : "PLACES" });
        setError(e instanceof MapsError ? e.message : t("search.failed"));
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, session, groupId]);

  const pick = async (s: Suggestion) => {
    setSelecting(s.placeId);
    try {
      onSelect(await session.select(s));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSelecting(null);
    }
  };

  const noResult = !loading && !error && q.trim().length >= 2 && items.length === 0;

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg" aria-hidden>
          🔍
        </span>
        <input
          className="field pl-11 pr-10"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder ?? t("search.placeholder")}
          autoFocus={autoFocus}
          inputMode="search"
          enterKeyHint="search"
          aria-label={t("loc.search")}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
            <Spinner className="h-5 w-5" />
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {noResult && (
        <p className="mt-3 px-1 text-sm text-ink-sub">
          {t("search.noResults")}
        </p>
      )}
      {items.length > 0 && (
        <div className="card mt-3 divide-y divide-line overflow-hidden">
          {items.map((s) => (
            <PlaceRow
              key={s.placeId}
              icon={selecting === s.placeId ? "⏳" : "📌"}
              title={s.main}
              subtitle={s.secondary}
              onClick={() => void pick(s)}
            />
          ))}
          <p className="px-4 py-2 text-right text-[11px] text-ink-faint">Powered by Google</p>
        </div>
      )}
    </div>
  );
}
