import { requireUser } from "@/lib/server/auth";
import { ApiError, readJson, route } from "@/lib/server/http";
import { incrementUsage, rateLimit } from "@/lib/server/rateLimit";
import { requireLat, requireLng, requireRecord } from "@/lib/validation";

interface GeocodeResult {
  formatted_address: string;
  place_id: string;
  types: string[];
}

/**
 * 좌표 → 주소 (Geocoding API, 서버용 Key) — 명세 §34.2 "현재 위치/지도 선택 → Geocoding → 주소 표시"
 * 서버에서 호출하는 이유: 서버용 Key는 필요한 API만 허용하고 브라우저에 노출하지 않으며(§34.4),
 * 사용자별 레이트 리밋과 사용량 집계(§34.5)를 한곳에서 처리하기 위함.
 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "geocode", 30, 60);
  const body = requireRecord(await readJson(req));
  const lat = requireLat(body.lat);
  const lng = requireLng(body.lng);

  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) throw new ApiError(503, "MAPS_NOT_CONFIGURED", "err.maps.notConfigured");

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("language", "id");
  url.searchParams.set("region", "id");
  url.searchParams.set("key", key);

  let data: { status: string; results?: GeocodeResult[]; error_message?: string };
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    data = (await res.json()) as typeof data;
  } catch {
    throw new ApiError(502, "MAPS_NETWORK", "err.maps.network");
  }
  await incrementUsage("geocode_reverse");

  switch (data.status) {
    case "OK": {
      const results = data.results ?? [];
      const best =
        results.find((r) => !r.types.includes("plus_code") && (r.types.includes("street_address") || r.types.includes("premise"))) ??
        results.find((r) => !r.types.includes("plus_code")) ??
        results[0];
      if (!best) return { address: null, placeId: null };
      return { address: best.formatted_address, placeId: best.place_id };
    }
    case "ZERO_RESULTS":
      return { address: null, placeId: null };
    case "REQUEST_DENIED":
      console.error("[geocode] REQUEST_DENIED", data.error_message);
      throw new ApiError(502, "MAPS_KEY_ERROR", "err.maps.key");
    case "OVER_QUERY_LIMIT":
    case "OVER_DAILY_LIMIT":
      throw new ApiError(503, "MAPS_QUOTA", "err.maps.quota");
    default:
      throw new ApiError(502, "MAPS_ERROR", "err.maps.failed");
  }
});
