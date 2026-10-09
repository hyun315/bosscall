"use client";
import { translate } from "@/i18n/index";
import { getLocale } from "@/i18n/runtime";
import { placesLibrary } from "@/lib/location/googleMaps";
import { coordsGone, fetchedAtFromExpiry, sourceOf } from "@/lib/tripData";
import type { CallDoc, FavoriteLocationDoc, PlaceInput } from "@/types/domain";

/**
 * 저장된 장소 → 호출에 쓸 PlaceInput.
 * 구글 좌표는 30일 보관 한도가 지나면 서버가 지운다(needsRefresh). 그때는 Place ID로 좌표를 다시 받는다.
 */
export type StoredPlace = PlaceInput & { needsRefresh: boolean };

export function callSidePlace(c: CallDoc, side: "pickup" | "destination"): StoredPlace {
  const src = side === "pickup" ? c.pickupSource : c.destinationSource;
  const google = sourceOf(src) === "google";
  return side === "pickup"
    ? {
        lat: c.pickupLat,
        lng: c.pickupLng,
        address: c.pickupAddress,
        name: c.pickupName,
        placeId: c.pickupPlaceId,
        source: sourceOf(src),
        category: c.pickupCategory ?? null,
        fetchedAt: google ? fetchedAtFromExpiry(c.geoExpiresAt) : null,
        needsRefresh: coordsGone(c, src) || (google && expired(c.geoExpiresAt)),
      }
    : {
        lat: c.destinationLat,
        lng: c.destinationLng,
        address: c.destinationAddress,
        name: c.destinationName,
        placeId: c.destinationPlaceId,
        source: sourceOf(src),
        category: c.destinationCategory ?? null,
        fetchedAt: google ? fetchedAtFromExpiry(c.geoExpiresAt) : null,
        needsRefresh: coordsGone(c, src) || (google && expired(c.geoExpiresAt)),
      };
}

export function favoritePlace(f: FavoriteLocationDoc): StoredPlace {
  const google = sourceOf(f.source) === "google";
  return {
    lat: f.latitude,
    lng: f.longitude,
    address: f.address,
    name: f.name,
    placeId: f.placeId,
    source: sourceOf(f.source),
    category: f.category ?? null,
    fetchedAt: google ? fetchedAtFromExpiry(f.geoExpiresAt) : null,
    needsRefresh: (google && f.coordsCleared === true) || (google && expired(f.geoExpiresAt)),
  };
}

function expired(geoExpiresAt: number | null | undefined): boolean {
  return !!geoExpiresAt && geoExpiresAt <= Date.now();
}

/** 다시 쓸 수 있는지 (좌표가 지워졌는데 Place ID도 없으면 불가) */
export function usable(p: StoredPlace): boolean {
  return !p.needsRefresh || !!p.placeId;
}

/** 필요하면 Place ID로 좌표를 새로 받아 호출에 쓸 PlaceInput 으로 만든다 */
export async function resolvePlace(p: StoredPlace): Promise<PlaceInput> {
  const { needsRefresh, ...place } = p;
  if (!needsRefresh) return place;
  if (!p.placeId) throw new Error(translate(getLocale(), "loc.noCoords"));
  const lib = await placesLibrary();
  const fresh = new lib.Place({ id: p.placeId });
  await fresh.fetchFields({ fields: ["location"] });
  const loc = fresh.location;
  if (!loc) throw new Error(translate(getLocale(), "loc.noCoords"));
  return { ...place, lat: loc.lat(), lng: loc.lng(), source: "google", fetchedAt: Date.now() };
}

/**
 * 운행 시작·완료 순간의 기사 위치 — 이미 위치 권한을 허용한 경우에만, 새 권한 창 없이 짧게 시도.
 * 못 받으면 null (운행 처리는 그대로 진행).
 */
export async function quickFix(): Promise<{ lat: number; lng: number; accuracy: number; at: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  try {
    const perm = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    if (!perm || perm.state !== "granted") return null;
  } catch {
    return null;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          at: pos.timestamp || Date.now(),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 },
    );
  });
}
