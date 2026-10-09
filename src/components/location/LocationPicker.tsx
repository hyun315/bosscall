"use client";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { NotificationBanner } from "@/components/common/States";
import { FavoriteLocationCard, RecentLocationCard } from "@/components/location/LocationCard";
import { MapPicker } from "@/components/location/MapPicker";
import { PlaceSearch } from "@/components/location/PlaceSearch";
import { shortPlace } from "@/lib/format";
import { errorMessage } from "@/services/client/api";
import {
  POOR_ACCURACY_M,
  geoErrorCode,
  getCurrentPosition,
  reverseGeocode,
  type GeoFix,
} from "@/services/client/location";
import { callSidePlace, favoritePlace, resolvePlace, usable, type StoredPlace } from "@/services/client/places";
import type { CallDoc, FavoriteLocationDoc, PlaceInput } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/** 최근 호출에서 최근 장소를 뽑는다 (중복 제거: placeId 또는 좌표 4자리 ≈ 11m) */
export function recentPlaces(calls: CallDoc[], which: "pickup" | "destination" | "both", max = 5): StoredPlace[] {
  const out: StoredPlace[] = [];
  const seen = new Set<string>();
  const push = (p: StoredPlace) => {
    if (!usable(p)) return;
    const key = p.placeId ?? `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(p);
  };
  for (const c of [...calls].sort((a, b) => b.createdAt - a.createdAt)) {
    if (which !== "destination") push(callSidePlace(c, "pickup"));
    if (which !== "pickup") push(callSidePlace(c, "destination"));
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}

/**
 * 위치 선택 4종 (§11): 현재 위치 · 즐겨찾기 · 최근 · 지도 선택 (+ 장소 검색)
 */
export function LocationPicker({
  kind,
  groupId,
  favorites,
  recents,
  onPicked,
}: {
  kind: "pickup" | "destination";
  groupId: string;
  favorites: FavoriteLocationDoc[];
  recents: StoredPlace[];
  onPicked: (p: PlaceInput) => void;
}) {
  const { t } = useI18n();
  const [locating, setLocating] = useState(false);
  const [geoProblem, setGeoProblem] = useState<"DENIED" | "OTHER" | null>(null);
  const [poorFix, setPoorFix] = useState<{ fix: GeoFix; place: PlaceInput } | null>(null);
  const [mapOpen, setMapOpen] = useState<{ lat: number; lng: number } | null | false>(false);
  const [error, setError] = useState<string | null>(null);

  /** 즐겨찾기·최근 장소: 구글 좌표 보관 기한이 지났으면 Place ID로 좌표를 다시 받는다 */
  const pickStored = async (p: StoredPlace) => {
    setError(null);
    try {
      onPicked(await resolvePlace(p));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const pickCurrent = async () => {
    setLocating(true);
    setGeoProblem(null);
    setError(null);
    try {
      const fix = await getCurrentPosition(groupId);
      let place: PlaceInput;
      try {
        const r = await reverseGeocode(fix.lat, fix.lng);
        place = { lat: fix.lat, lng: fix.lng, address: r.address, name: t("loc.currentLocation"), placeId: null, source: "gps" };
      } catch (e) {
        setError(`${t("err.maps.failed")} ${errorMessage(e)}`);
        place = {
          lat: fix.lat,
          lng: fix.lng,
          address: `${t("loc.currentLocation")} (${fix.lat.toFixed(5)}, ${fix.lng.toFixed(5)})`,
          name: t("loc.currentLocation"),
          placeId: null,
          source: "gps",
        };
      }
      if (fix.accuracy > POOR_ACCURACY_M) setPoorFix({ fix, place });
      else onPicked(place);
    } catch (e) {
      setGeoProblem(geoErrorCode(e) === "DENIED" ? "DENIED" : "OTHER");
    } finally {
      setLocating(false);
    }
  };

  const favoritesList = favorites.length > 0 && (
    <section>
      <h3 className="section-title">{t("loc.favorites")}</h3>
      <div className="card divide-y divide-line overflow-hidden">
        {favorites.map((f) => (
          <FavoriteLocationCard key={f.id} name={f.name} address={f.address} onClick={() => void pickStored(favoritePlace(f))} />
        ))}
      </div>
    </section>
  );

  const recentsList = recents.length > 0 && (
    <section>
      <h3 className="section-title">{kind === "pickup" ? t("loc.recentPlaces") : t("loc.recentDestinations")}</h3>
      <div className="card divide-y divide-line overflow-hidden">
        {recents.map((p, i) => (
          <RecentLocationCard
            key={`${p.placeId ?? ""}${p.lat},${p.lng}-${i}`}
            title={shortPlace(p.name, p.address)}
            address={p.address}
            onClick={() => void pickStored(p)}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-5">
      {kind === "destination" && (
        <section>
          {/* 픽업 카드 아래에서 "이제 목적지를 고를 차례"임을 분명히 보여준다 */}
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-ink">
            <span aria-hidden>🎯</span>
            {t("loc.chooseDestinationTitle")}
          </h3>
          <PlaceSearch groupId={groupId} onSelect={onPicked} placeholder={t("loc.destinationSearchPlaceholder")} />
        </section>
      )}

      {kind === "pickup" && (
        <div className="grid gap-3">
          <Button size="lg" block loading={locating} onClick={() => void pickCurrent()} icon={<span aria-hidden>📍</span>}>
            {t("loc.pickupHere")}
          </Button>
          {geoProblem === "DENIED" && (
            <NotificationBanner tone="warning">
              {t("loc.deniedTitle")}
              <br />
              {t("loc.deniedBody")}
            </NotificationBanner>
          )}
          {geoProblem === "OTHER" && (
            <NotificationBanner tone="warning">
              {t("loc.notFound")}
            </NotificationBanner>
          )}
        </div>
      )}

      {favoritesList}
      {recentsList}
      {error && <p className="text-sm text-danger">{error}</p>}

      <Button variant="secondary" block onClick={() => setMapOpen(null)} icon={<span aria-hidden>🗺</span>}>
        {t("loc.chooseOnMap")}
      </Button>

      {kind === "pickup" && (
        <section>
          <h3 className="section-title">{t("loc.search")}</h3>
          <PlaceSearch groupId={groupId} onSelect={onPicked} />
        </section>
      )}

      {mapOpen !== false && (
        <MapPicker
          title={kind === "pickup" ? t("loc.pickPickup") : t("loc.pickDestination")}
          initial={mapOpen}
          groupId={groupId}
          onClose={() => setMapOpen(false)}
          onConfirm={(p) => {
            setMapOpen(false);
            onPicked(p);
          }}
        />
      )}

      <ConfirmModal
        open={poorFix !== null}
        title={t("loc.poorTitle")}
        message={
          poorFix && (
            <>
              {t("loc.poorAccuracy", { m: Math.round(poorFix.fix.accuracy) })}
              <br />
              <span className="font-semibold text-ink">{poorFix.place.address}</span>
              <br />
              {t("loc.poorQuestion")}
            </>
          )
        }
        confirmLabel={t("loc.fixOnMap")}
        cancelLabel={t("loc.useAsIs")}
        onConfirm={() => {
          if (poorFix) setMapOpen({ lat: poorFix.fix.lat, lng: poorFix.fix.lng });
          setPoorFix(null);
        }}
        onCancel={() => {
          if (poorFix) onPicked(poorFix.place);
          setPoorFix(null);
        }}
      />
    </div>
  );
}
