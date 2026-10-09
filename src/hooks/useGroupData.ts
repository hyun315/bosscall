"use client";
import { ACTIVE_STATUSES } from "@/lib/callStateMachine";
import { lim, ob, useLiveQuery, w } from "@/hooks/useLive";
import type { CallDoc, DriverDoc, FavoriteLocationDoc, MemberDoc, WorkSessionDoc } from "@/types/domain";

/** 그룹 범위 데이터 구독 모음 — 모든 경로가 groups/{groupId} 하위이므로 tenant 격리가 유지된다 */

export function useDrivers(groupId: string | null) {
  return useLiveQuery<DriverDoc>(groupId ? `groups/${groupId}/drivers` : null, [ob("createdAt", "asc")]);
}

export function useMembers(groupId: string | null) {
  return useLiveQuery<MemberDoc>(groupId ? `groups/${groupId}/members` : null, [ob("createdAt", "asc")]);
}

/** 진행 중 호출 (status in ACTIVE) — 정렬은 클라이언트에서 */
export function useActiveCalls(groupId: string | null) {
  const s = useLiveQuery<CallDoc>(groupId ? `groups/${groupId}/calls` : null, [w("status", "in", [...ACTIVE_STATUSES])]);
  return { ...s, data: [...s.data].sort((a, b) => b.createdAt - a.createdAt) };
}

export function useRecentCalls(groupId: string | null, n = 30) {
  return useLiveQuery<CallDoc>(groupId ? `groups/${groupId}/calls` : null, [ob("createdAt", "desc"), lim(n)]);
}

/** 기간 조회 [from, to) */
export function useCallsBetween(groupId: string | null, from: number, to: number, max = 500) {
  return useLiveQuery<CallDoc>(groupId ? `groups/${groupId}/calls` : null, [
    w("createdAt", ">=", from),
    w("createdAt", "<", to),
    ob("createdAt", "desc"),
    lim(max),
  ]);
}

export function useWorkSessionsBetween(groupId: string | null, from: number, to: number, max = 300) {
  return useLiveQuery<WorkSessionDoc>(groupId ? `groups/${groupId}/workSessions` : null, [
    w("clockInAt", ">=", from),
    w("clockInAt", "<", to),
    ob("clockInAt", "desc"),
    lim(max),
  ]);
}

export function useFavorites(groupId: string | null) {
  return useLiveQuery<FavoriteLocationDoc>(groupId ? `groups/${groupId}/favorites` : null, [ob("createdAt", "asc")]);
}
