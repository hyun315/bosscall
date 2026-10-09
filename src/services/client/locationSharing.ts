"use client";
import { shouldSendLocation, type SentState } from "@/lib/locationShare";
import { sendDriverLocation } from "@/services/client/actions";
import { ClientApiError } from "@/services/client/api";

/**
 * 기사 기기의 위치 전송기 (앱이 화면에 열려 있는 동안만 동작 — 웹앱의 한계, README 참고).
 * 여러 화면에서 상태를 볼 수 있도록 모듈 단위 상태 저장소로 둔다.
 */
export type ShareStatus = "idle" | "starting" | "active" | "denied" | "unavailable" | "error";

interface State {
  status: ShareStatus;
  lastSentAt: number | null;
}

let state: State = { status: "idle", lastSentAt: null };
const listeners = new Set<(s: State) => void>();
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}
export function getShareState(): State {
  return state;
}
export function subscribeShareState(l: (s: State) => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

let watchId: number | null = null;
let activeGroup: string | null = null;
let last: SentState | null = null;
let inFlight = false;

export function startLocationSharing(groupId: string): void {
  if (watchId !== null && activeGroup === groupId) return;
  stopLocationSharing();
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    set({ status: "unavailable" });
    return;
  }
  activeGroup = groupId;
  last = null;
  set({ status: "starting" });
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
      const now = Date.now();
      if (state.status !== "active") set({ status: "active" });
      if (inFlight || !shouldSendLocation(last, next, now)) return;
      inFlight = true;
      sendDriverLocation(groupId, { ...next, capturedAt: pos.timestamp || now })
        .then((r) => {
          if (r.stored) {
            last = { point: next, at: now };
            set({ lastSentAt: now });
          }
        })
        .catch((e) => {
          // 퇴근·공유 꺼짐이 서버에서 먼저 반영된 경우 조용히 멈춘다
          if (e instanceof ClientApiError && (e.code === "SHARING_OFF" || e.code === "NOT_ON_DUTY")) stopLocationSharing();
          else set({ status: "error" });
        })
        .finally(() => {
          inFlight = false;
        });
    },
    (err) => set({ status: err.code === 1 ? "denied" : "unavailable" }),
    { enableHighAccuracy: true, maximumAge: 15_000, timeout: 30_000 },
  );
}

export function stopLocationSharing(): void {
  if (watchId !== null && typeof navigator !== "undefined") navigator.geolocation.clearWatch(watchId);
  watchId = null;
  activeGroup = null;
  last = null;
  set({ status: "idle", lastSentAt: null });
}
