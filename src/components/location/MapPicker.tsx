"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@/components/common/Button";
import { errorMessage, trackClient } from "@/services/client/api";
import { getCurrentPosition, reverseGeocode } from "@/services/client/location";
import {
  JAKARTA_CENTER,
  MapsError,
  mapsLibrary,
  onMapsAuthFailure,
  type GMap,
  type LatLngLiteral,
} from "@/lib/location/googleMaps";
import type { PlaceInput } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import { IconMap } from "@/components/brand/Icons";

/**
 * 지도에서 선택 (§5 C01 "지도에서 선택", §34.2 지도 선택 → 좌표 → Geocoding → 주소)
 * 화면 중앙 핀 방식: 지도를 움직여 핀을 원하는 곳에 맞춘다. 지도를 탭하면 그 위치로 이동.
 */
export function MapPicker({
  title,
  initial,
  groupId,
  onConfirm,
  onClose,
  question,
  confirmLabel,
  note,
  initialAsGps,
}: {
  title: string;
  initial?: LatLngLiteral | null;
  groupId: string | null;
  onConfirm: (place: PlaceInput) => void;
  onClose: () => void;
  /** 아래 패널 제목으로 묻는 질문 (예: 이 위치가 맞습니까?) */
  question?: string;
  confirmLabel?: string;
  /** 질문 아래 안내 한 줄 (예: GPS 오차) */
  note?: string | null;
  /** 시작 위치가 휴대폰 GPS — 핀을 옮기지 않고 확인하면 '현재 위치'로 저장 */
  initialAsGps?: boolean;
}) {
  const { t } = useI18n();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<GMap | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqSeq = useRef(0);
  const [center, setCenter] = useState<LatLngLiteral>(initial ?? JAKARTA_CENTER);
  const [address, setAddress] = useState<{ text: string; placeId: string | null } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [moving, setMoving] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const moved = useRef(false);

  const resolve = useCallback((c: LatLngLiteral) => {
    if (debounce.current) clearTimeout(debounce.current);
    // 지도를 멈춘 뒤 잠시 기다렸다가 1회만 Geocoding (비용 절감 §34.5)
    debounce.current = setTimeout(async () => {
      const seq = ++reqSeq.current;
      setResolving(true);
      setGeoError(null);
      try {
        const r = await reverseGeocode(c.lat, c.lng);
        if (seq === reqSeq.current) setAddress({ text: r.address, placeId: r.placeId });
      } catch (e) {
        if (seq === reqSeq.current) {
          setAddress(null);
          setGeoError(errorMessage(e));
        }
      } finally {
        if (seq === reqSeq.current) setResolving(false);
      }
    }, 700);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const offAuth = onMapsAuthFailure(() =>
      setMapError(t("map.keyProblem")),
    );
    (async () => {
      try {
        const { Map } = await mapsLibrary();
        if (cancelled || !el.current) return;
        const start = initial ?? JAKARTA_CENTER;
        const m = new Map(el.current, {
          center: start,
          zoom: initial ? 17 : 13,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
        });
        map.current = m;
        trackClient("map_loaded", groupId);
        m.addListener("dragstart", () => {
          moved.current = true;
          setMoving(true);
        });
        m.addListener("idle", () => {
          setMoving(false);
          const c = m.getCenter();
          if (!c) return;
          const next = { lat: c.lat(), lng: c.lng() };
          setCenter(next);
          resolve(next);
        });
        m.addListener("click", (e) => {
          if (e?.latLng) {
            moved.current = true;
            m.panTo({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        });
      } catch (e) {
        if (!cancelled) {
          trackClient("maps_error", groupId, { code: e instanceof MapsError ? e.code : "UNKNOWN" });
          setMapError(errorMessage(e));
        }
      }
    })();
    return () => {
      cancelled = true;
      offAuth();
      if (debounce.current) clearTimeout(debounce.current);
    };
    // 최초 1회만 지도 생성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToMyLocation = async () => {
    setLocating(true);
    try {
      const fix = await getCurrentPosition(groupId);
      map.current?.panTo({ lat: fix.lat, lng: fix.lng });
      map.current?.setZoom(17);
    } catch {
      setGeoError(t("map.noGps"));
    } finally {
      setLocating(false);
    }
  };

  const confirm = () => {
    const asGps = Boolean(initialAsGps) && !moved.current;
    onConfirm({
      lat: center.lat,
      lng: center.lng,
      address: address?.text ?? `${t("map.selected")} (${center.lat.toFixed(5)}, ${center.lng.toFixed(5)})`,
      name: asGps ? t("loc.currentLocation") : null,
      placeId: address?.placeId ?? null,
      // 휴대폰 GPS 그대로면 gps, 핀을 옮겼으면 사용자가 정한 좌표(map). 주소만 Geocoding
      source: asGps ? "gps" : "map",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex h-14 items-center gap-2 border-b border-line px-2 pt-[var(--safe-top)]">
        <button onClick={onClose} aria-label={t("common.close")} className="flex h-11 w-11 items-center justify-center text-2xl">
          ✕
        </button>
        <h2 className="flex-1 text-lg font-bold">{title}</h2>
      </div>

      <div className="relative flex-1">
        {mapError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <IconMap className="h-10 w-10 text-ink-sub" />
            <p className="font-semibold text-ink">{t("map.cannotShow")}</p>
            <p className="text-sm text-ink-sub">{mapError}</p>
          </div>
        ) : (
          <>
            <div ref={el} className="absolute inset-0 bg-line/40" />
            {/* 중앙 고정 핀 */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" aria-hidden>
              <div className={`drop-shadow-md transition-transform ${moving ? "-translate-y-2" : ""}`}>
                {/* 지도 가운데 핀 — 브랜드 블루, 흰 테두리 */}
                <svg viewBox="0 0 32 40" className="h-11 w-9">
                  <path d="M16 39s13-12.2 13-23A13 13 0 0 0 3 16c0 10.8 13 23 13 23Z" fill="#1479C9" stroke="#fff" strokeWidth="2.5" />
                  <circle cx="16" cy="16" r="5" fill="#fff" />
                </svg>
              </div>
            </div>
            <button
              onClick={goToMyLocation}
              disabled={locating}
              className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-xl shadow-modal active:bg-bg"
              aria-label={t("map.toMyLocation")}
            >
              {locating ? <Spinner /> : "◎"}
            </button>
          </>
        )}
      </div>

      <div className="border-t border-line bg-surface px-5 pb-[calc(16px+var(--safe-bottom))] pt-4">
        {question ? (
          <>
            <p className="text-lg font-bold text-ink">{question}</p>
            {note && <p className="mt-0.5 text-sm text-warning-text">{note}</p>}
            <p className="mt-0.5 text-sm text-ink-sub">{t("loc.confirmHereHint")}</p>
          </>
        ) : (
          <p className="text-xs font-semibold text-ink-sub">{t("map.selected")}</p>
        )}
        <p className="mt-1 min-h-[48px] text-[15px] font-semibold text-ink">
          {moving
            ? t("map.moving")
            : resolving
              ? t("map.resolving")
              : address?.text ?? (geoError ? t("map.noAddress") : t("map.hint"))}
        </p>
        {geoError && <p className="mt-1 text-sm text-danger">{geoError}</p>}
        <Button block className="mt-3" disabled={Boolean(mapError) || moving || resolving} onClick={confirm}>
          {confirmLabel ?? t("map.choose")}
        </Button>
      </div>
    </div>
  );
}
