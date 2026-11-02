import { CLIENT_EVENTS, track } from "@/lib/server/analytics";
import { requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { incrementUsage, rateLimit } from "@/lib/server/rateLimit";
import { runAfterResponse } from "@/lib/server/defer";
import { countAdEvent } from "@/services/server/ads";
import { isRecord, requireOneOf, requireRecord } from "@/lib/validation";

/** 클라이언트 이벤트 수집 (화이트리스트만) — 명세 §23, §34.5 */
export const POST = route(async (req) => {
  const [user, raw] = await Promise.all([requireUser(req), readJson(req)]);
  await rateLimit(user.uid, "analytics", 60, 60);
  const body = requireRecord(raw);
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
  // 기록·집계는 응답 뒤에 (Maps 사용량 일별 집계 포함)
  await runAfterResponse(() => {
    const jobs: Promise<unknown>[] = [track(event, user.uid, groupId, props)];
    if (event === "map_loaded") jobs.push(incrementUsage("maps_js_load"));
    // 광고별 내부 집계 (광고주에게 제공하지 않음 — 유료 전환 때 가격 근거)
    if (event === "ad_impression" || event === "ad_click") jobs.push(countAdEvent(event, props));
    if (event === "places_autocomplete_session") {
      const requests = typeof props.requests === "number" ? Math.min(props.requests, 100) : 1;
      jobs.push(incrementUsage("places_autocomplete_requests", requests), incrementUsage("places_details"));
    }
    return Promise.all(jobs);
  });
  return { ok: true };
});
