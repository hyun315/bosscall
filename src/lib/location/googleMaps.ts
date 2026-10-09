"use client";
/**
 * Google Maps Platform 로더 (명세 §34).
 * - Maps JavaScript API: 지도 표시/지도에서 선택
 * - Places API (New): AutocompleteSuggestion + Place.fetchFields (세션 토큰으로 과금 최적화, §34.5)
 * - Geocoding: 서버 라우트 /api/geocode (서버용 Key)
 *
 * @types/google.maps 버전 차이로 빌드가 깨지지 않도록, 사용하는 부분만 최소 타입으로 선언한다.
 */

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface GMap {
  getCenter(): { lat(): number; lng(): number } | undefined;
  setCenter(c: LatLngLiteral): void;
  panTo(c: LatLngLiteral): void;
  setZoom(z: number): void;
  addListener(event: string, handler: (e?: { latLng?: { lat(): number; lng(): number } }) => void): { remove(): void };
}

interface MapsLibrary {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
}

export interface PlacePrediction {
  placeId: string;
  text: { toString(): string };
  mainText: { toString(): string } | null;
  secondaryText: { toString(): string } | null;
  toPlace(): PlaceObj;
}

export interface PlaceObj {
  id: string;
  displayName?: string | null;
  formattedAddress?: string | null;
  location?: { lat(): number; lng(): number } | null;
  fetchFields(opts: { fields: string[] }): Promise<unknown>;
}

interface PlacesLibrary {
  Place: new (opts: { id: string }) => PlaceObj;
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(req: Record<string, unknown>): Promise<{
      suggestions: Array<{ placePrediction: PlacePrediction | null }>;
    }>;
  };
}

interface GoogleNS {
  maps: { importLibrary(name: "maps"): Promise<MapsLibrary>; importLibrary(name: "places"): Promise<PlacesLibrary> };
}

declare global {
  interface Window {
    google?: GoogleNS;
    __bosscallMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

import { translate } from "@/i18n/index";
import { getLocale } from "@/i18n/runtime";

export class MapsError extends Error {
  constructor(
    public readonly code: "NO_KEY" | "LOAD_FAILED" | "AUTH_FAILED",
    message: string,
  ) {
    super(message);
  }
}

/** 자카르타 중심 (Monas) — 위치를 모를 때 기본 지도 중심 */
export const JAKARTA_CENTER: LatLngLiteral = { lat: -6.1754, lng: 106.8272 };

let loading: Promise<GoogleNS> | null = null;
let authFailed = false;
const authListeners = new Set<() => void>();

export function onMapsAuthFailure(cb: () => void): () => void {
  authListeners.add(cb);
  if (authFailed) cb();
  return () => authListeners.delete(cb);
}

export function loadGoogleMaps(): Promise<GoogleNS> {
  if (typeof window === "undefined") return Promise.reject(new MapsError("LOAD_FAILED", "browser only"));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (loading) return loading;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  if (!key) return Promise.reject(new MapsError("NO_KEY", translate(getLocale(), "err.maps.notConfigured")));

  loading = new Promise<GoogleNS>((resolve, reject) => {
    // Key 제한(도메인 불일치·API 미허용·결제 미설정) 시 Google이 호출하는 전역 콜백
    window.gm_authFailure = () => {
      authFailed = true;
      authListeners.forEach((cb) => cb());
    };
    window.__bosscallMapsReady = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new MapsError("LOAD_FAILED", translate(getLocale(), "err.maps.load")));
    };
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key,
      v: "weekly",
      loading: "async",
      libraries: "places",
      language: getLocale(),
      region: "ID",
      callback: "__bosscallMapsReady",
    });
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => {
      loading = null;
      reject(new MapsError("LOAD_FAILED", translate(getLocale(), "err.maps.load")));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export async function mapsLibrary(): Promise<MapsLibrary> {
  const g = await loadGoogleMaps();
  return g.maps.importLibrary("maps");
}

export async function placesLibrary(): Promise<PlacesLibrary> {
  const g = await loadGoogleMaps();
  return g.maps.importLibrary("places");
}
