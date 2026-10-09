import { CLIENT_EVENTS, track } from "@/lib/server/analytics";
import { requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { incrementUsage, rateLimit } from "@/lib/server/rateLimit";
import { isRecord, requireOneOf, requireRecord } from "@/lib/validation";

/** 클라이언트 이벤트 수집 (화이트리스트만) — 명세 §23, §34.5 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "analytics", 60, 60);
  const body = requireRecord(await readJson(req));
  const event = requireOneOf(body.event, CLIENT_EVENTS, "field.event");
  const groupId = typeof body.groupId === "string" && /^[A-Za-z0-9]{1,40}$/.test(body.groupId) ? body.groupId : null;

  const props: Record<string, string | number | boolean | null> = {};
  if (isRecord(body.props)) {
    for (const [k, v] of Object.entries(body.props).slice(0, 10)) {
      if (!/^[a-zA-Z_]{1,30}$/.test(k)) continue;
      if (typeof v === "number" && Number.isFinite(v)) props[k] = v;
      else if (typeof v === "boolean" || v === null) props[k] = v;
      else if (typeof v === "string") props[k] = v.slice(0, 100);
    }
  }
  await track(event, user.uid, groupId, props);

  // Maps 사용량 일별 집계
  if (event === "map_loaded") await incrementUsage("maps_js_load");
  if (event === "places_autocomplete_session") {
    const requests = typeof props.requests === "number" ? Math.min(props.requests, 100) : 1;
    await incrementUsage("places_autocomplete_requests", requests);
    await incrementUsage("places_details");
  }
  return { ok: true };
});
