"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { useLiveDoc } from "@/hooks/useLive";
import { formatAgo, isStale } from "@/lib/locationShare";
import { googleMapsViewUrl } from "@/lib/format";
import { MapsError, mapsLibrary, onMapsAuthFailure, type GMap } from "@/lib/location/googleMaps";
import { errorMessage, trackClient } from "@/services/client/api";
import { reverseGeocode } from "@/services/client/location";
import type { DriverDoc, DriverLocationDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

export function useDriverLocation(groupId: string, driver: DriverDoc | null | undefined) {
  const enabled = Boolean(driver && driver.currentSessionId && driver.locationSharing);
  return useLiveDoc<DriverLocationDoc>(enabled && driver ? `groups/${groupId}/driverLocations/${driver.id}` : null);
}

function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/**
 * 관리자·가족용 기사 위치 지도 — 최신 위치 1건을 실시간 구독해 지도 중앙에 표시.
 * 웹앱 특성상 기사 앱이 닫혀 있으면 위치가 멈추므로 "n분 전"과 오래된 위치 경고를 항상 함께 보여준다.
 */
export function DriverLocationMap({
  groupId,
  driver,
  height = 240,
}: {
  groupId: string;
  driver: DriverDoc;
  height?: number;
}) {
  const { t } = useI18n();
  const loc = useDriverLocation(groupId, driver);
  const now = useNow(15000);
  const onDuty = Boolean(driver.currentSessionId);
  const sharing = onDuty && Boolean(driver.locationSharing);
  const data = loc.data;

  let emptyText: string | null = null;
  if (!onDuty) emptyText = t("dloc.offDuty");
  else if (!sharing) emptyText = t("dloc.sharingOff");
  else if (loc.error) emptyText = loc.error;
  else if (!data) emptyText = loc.loading ? t("common.loading") : t("dloc.waiting");

  return (
    <section aria-label={t("dloc.aria")}>
      <div className="card overflow-hidden">
        {emptyText || !data ? (
          <div className="flex items-center gap-3 p-4">
            <span className="text-2xl" aria-hidden>
              📍
            </span>
            <p className="text-sm text-ink-sub">{emptyText}</p>
          </div>
        ) : (
          <LocationBody data={data} now={now} height={height} groupId={groupId} />
        )}
      </div>
    </section>
  );
}

function LocationBody({ data, now, height, groupId }: { data: DriverLocationDoc; now: number; height: number; groupId: string }) {
  const { t, locale } = useI18n();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<GMap | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [address, setAddress] = useState<{ forAt: number; text: string } | null>(null);
  const [addrBusy, setAddrBusy] = useState(false);
  const stale = isStale(data.updatedAt, now);

  useEffect(() => {
    let cancelled = false;
    const off = onMapsAuthFailure(() => setMapError(t("err.maps.key")));
    (async () => {
      try {
        const { Map } = await mapsLibrary();
        if (cancelled || !el.current) return;
        map.current = new Map(el.current, {
          center: { lat: data.lat, lng: data.lng },
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "none", // 항상 기사 위치가 중앙에 오도록
          clickableIcons: false,
        });
        trackClient("map_loaded", groupId, { view: "driver_location" });
      } catch (e) {
        if (!cancelled) setMapError(e instanceof MapsError ? e.message : t("map.cannotShow"));
      }
    })();
    return () => {
      cancelled = true;
      off();
    };
    // 지도는 한 번만 만들고, 위치 변경은 아래 effect에서 panTo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current?.panTo({ lat: data.lat, lng: data.lng });
  }, [data.lat, data.lng]);

  // 주소는 요청할 때만 조회 (Geocoding 비용 절감 §34.5)
  const lookup = async () => {
    setAddrBusy(true);
    try {
      const r = await reverseGeocode(data.lat, data.lng);
      setAddress({ forAt: data.updatedAt, text: r.address });
    } catch (e) {
      setAddress({ forAt: data.updatedAt, text: errorMessage(e) });
    } finally {
      setAddrBusy(false);
    }
  };

  return (
    <>
      <div className="relative bg-line/40" style={{ height }}>
        {mapError ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-sub">{mapError}</div>
        ) : (
          <>
            <div ref={el} className="absolute inset-0" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden>
              <span className={`absolute -inset-3 rounded-full ${stale ? "bg-ink-faint/30" : "bc-pulse-ring bg-action/40"}`} />
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white text-base shadow-modal ${
                  stale ? "bg-ink-faint" : "bg-action"
                }`}
              >
                🚗
              </span>
            </div>
          </>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[15px] font-semibold ${stale ? "text-warning-text" : "text-ink"}`}>
            {stale ? "⚠ " : "● "}
            {t("dloc.agoLabel", { ago: formatAgo(data.updatedAt, now, locale) })}
            <span className="ml-1 text-sm font-normal text-ink-sub">{t("dloc.accuracy", { m: data.accuracy })}</span>
          </p>
          <a
            href={googleMapsViewUrl(data.lat, data.lng, null)}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-sm font-semibold text-action"
          >
            {t("common.googleMaps")}
          </a>
        </div>
        {stale && (
          <p className="text-sm text-ink-sub">{t("dloc.staleNote")}</p>
        )}
        {address && address.forAt === data.updatedAt ? (
          <p className="text-sm text-ink">{address.text}</p>
        ) : (
          <Button size="sm" variant="secondary" loading={addrBusy} onClick={() => void lookup()}>
            {t("dloc.showAddress")}
          </Button>
        )}
      </div>
    </>
  );
}
