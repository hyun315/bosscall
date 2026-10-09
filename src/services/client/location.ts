"use client";
import { api, trackClient } from "@/services/client/api";
import { translate } from "@/i18n/index";
import { getLocale } from "@/i18n/runtime";
import { JAKARTA_CENTER, placesLibrary, type PlacePrediction } from "@/lib/location/googleMaps";
import type { PlaceInput } from "@/types/domain";

export type GeoErrorCode = "DENIED" | "UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED";

export interface GeoFix {
  lat: number;
  lng: number;
  /** 미터 */
  accuracy: number;
}

/** 이 값보다 오차가 크면 지도에서 수정하도록 안내 (명세 §34.6 "GPS 오차가 큰 경우 지도에서 수정") */
export const POOR_ACCURACY_M = 100;

export function getCurrentPosition(groupId: string | null): Promise<GeoFix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(Object.assign(new Error(translate(getLocale(), "loc.unsupported")), { code: "UNSUPPORTED" as GeoErrorCode }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        trackClient("location_permission_granted", groupId);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
      },
      (err) => {
        const code: GeoErrorCode = err.code === 1 ? "DENIED" : err.code === 3 ? "TIMEOUT" : "UNAVAILABLE";
        if (code === "DENIED") trackClient("location_permission_denied", groupId);
        reject(Object.assign(new Error(err.message), { code }));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });
}

export function geoErrorCode(e: unknown): GeoErrorCode {
  const c = (e as { code?: string }).code;
  return c === "DENIED" || c === "TIMEOUT" || c === "UNSUPPORTED" ? c : "UNAVAILABLE";
}

/** 좌표 → 주소 (서버 Geocoding). 결과가 없으면 좌표 문자열로 대체 */
export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; placeId: string | null }> {
  const r = await api<{ address: string | null; placeId: string | null }>("/api/geocode", { body: { lat, lng } });
  return {
    address: r.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    placeId: r.placeId,
  };
}

export interface Suggestion {
  placeId: string;
  main: string;
  secondary: string;
  prediction: PlacePrediction;
}

/**
 * Places Autocomplete (New) 세션.
 * 입력 중 여러 번의 자동완성 요청 + 마지막 1회 상세조회를 하나의 세션 토큰으로 묶어 과금을 줄인다 (§34.5).
 */
export class PlaceSearchSession {
  private token: object | null = null;
  private requests = 0;
  private seq = 0;

  constructor(
    private readonly groupId: string | null,
    private readonly bias: { lat: number; lng: number } = JAKARTA_CENTER,
  ) {}

  async suggest(input: string): Promise<Suggestion[] | null> {
    const q = input.trim();
    if (q.length < 2) return [];
    const mySeq = ++this.seq;
    const lib = await placesLibrary();
    if (!this.token) this.token = new lib.AutocompleteSessionToken();
    this.requests += 1;
    const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: q,
      sessionToken: this.token,
      includedRegionCodes: ["id"],
      locationBias: { center: this.bias, radius: 30000 },
      language: getLocale(),
      region: "id",
    });
    if (mySeq !== this.seq) return null; // 더 최신 입력이 있음 → 이 결과는 버린다
    return suggestions
      .map((s) => s.placePrediction)
      .filter((p): p is PlacePrediction => p !== null)
      .map((p) => ({
        placeId: p.placeId,
        main: p.mainText?.toString() ?? p.text.toString(),
        secondary: p.secondaryText?.toString() ?? "",
        prediction: p,
      }));
  }

  /** 선택 → Place ID + 좌표 + 주소 확보, 세션 종료 */
  async select(s: Suggestion): Promise<PlaceInput> {
    const place = s.prediction.toPlace();
    await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location"] });
    const loc = place.location;
    if (!loc) throw new Error(translate(getLocale(), "loc.noCoords"));
    trackClient("places_autocomplete_session", this.groupId, { requests: this.requests });
    this.token = null;
    this.requests = 0;
    return {
      lat: loc.lat(),
      lng: loc.lng(),
      address: place.formattedAddress ?? s.secondary ?? s.main,
      name: place.displayName ?? s.main,
      placeId: place.id ?? s.placeId,
      source: "google",
      fetchedAt: Date.now(),
    };
  }
}
