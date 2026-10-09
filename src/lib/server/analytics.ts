import "server-only";
import { adminDb } from "@/lib/firebase/admin";

/** 명세 §23 — 서버에서 확정되는 이벤트는 서버에서 기록한다 */
export const SERVER_EVENTS = [
  "signup_completed",
  "group_created",
  "driver_invited",
  "driver_connected",
  "member_invited",
  "member_joined",
  "call_created",
  "call_accepted",
  "call_declined",
  "call_timeout",
  "call_cancelled",
  "call_completed",
  "clock_in",
  "clock_out",
  "favorite_created",
  "push_sent",
] as const;

/** 클라이언트에서 보내는 이벤트 (화이트리스트) */
export const CLIENT_EVENTS = [
  "location_permission_granted",
  "location_permission_denied",
  "notification_permission_granted",
  "notification_permission_denied",
  "map_loaded",
  "places_autocomplete_session",
  "maps_error",
] as const;

export type AnalyticsEvent = (typeof SERVER_EVENTS)[number] | (typeof CLIENT_EVENTS)[number];

export async function track(
  event: AnalyticsEvent,
  userId: string | null,
  groupId: string | null,
  props: Record<string, string | number | boolean | null> = {},
): Promise<void> {
  try {
    await adminDb().collection("analyticsEvents").add({
      event,
      userId,
      groupId,
      props,
      createdAt: Date.now(),
    });
  } catch (e) {
    // 분석 실패가 본 기능을 막지 않도록 한다
    console.warn("[analytics] failed", event, e);
  }
}
