"use client";
import { api } from "@/services/client/api";
import type { CallAction } from "@/lib/callStateMachine";
import type { ActualFix, NotificationPrefs, PlaceInput, PoiDoc } from "@/types/domain";

/** 서버 API 호출 모음 — UI 컴포넌트는 이 함수들만 사용한다 (코딩규칙 3) */

export const createGroup = (body: { name: string; driverName: string; driverPhone: string | null; timezone: string }) =>
  api<{ groupId: string; driverId: string }>("/api/groups", { body });

export const updateGroup = (groupId: string, body: { name?: string; timezone?: string }) =>
  api(`/api/groups/${groupId}`, { method: "PATCH", body });

export const updateMe = (body: {
  name?: string;
  phone?: string | null;
  activeGroupId?: string;
  notificationPrefs?: Partial<NotificationPrefs>;
  locale?: "ko" | "id" | "en";
  consents?: { analytics: boolean; marketing: boolean };
}) => api("/api/me", { method: "PATCH", body });

export const addDriver = (groupId: string, displayName: string, phone: string | null) =>
  api<{ driverId: string }>("/api/drivers", { body: { groupId, displayName, phone } });

export const updateDriver = (groupId: string, driverId: string, body: { displayName?: string; phone?: string | null }) =>
  api(`/api/drivers/${driverId}`, { method: "PATCH", body: { groupId, ...body } });

export const createInvite = (groupId: string, role: "DRIVER" | "MEMBER", driverId: string | null) =>
  api<{ code: string; url: string; expiresAt: number }>("/api/invites", { body: { groupId, role, driverId } });

export interface InvitePreview {
  code: string;
  groupName: string;
  role: "DRIVER" | "MEMBER";
  driverName: string | null;
  inviterName: string;
  status: "VALID" | "EXPIRED" | "USED" | "ALREADY_MEMBER";
}
export const previewInvite = (code: string) => api<InvitePreview>(`/api/invites/${code}`);
export const acceptInvite = (code: string) =>
  api<{ groupId: string; role: "DRIVER" | "MEMBER" }>(`/api/invites/${code}`, { method: "POST", body: {} });

export const removeMember = (groupId: string, uid: string) =>
  api(`/api/members/${uid}?groupId=${encodeURIComponent(groupId)}`, { method: "DELETE" });

export const createCall = (groupId: string, driverId: string, pickup: PlaceInput, destination: PlaceInput) =>
  api<{ callId: string }>("/api/calls", { body: { groupId, driverId, pickup, destination } });

export const transitionCall = (groupId: string, callId: string, action: CallAction, fix?: ActualFix | null) =>
  api<{ status: string }>(`/api/calls/${callId}/transition`, { body: { groupId, action, fix: fix ?? null } });

export const clock = (groupId: string, action: "CLOCK_IN" | "CLOCK_OUT", shareLocation = false) =>
  api<{ sessionId: string }>("/api/work", { body: { groupId, action, shareLocation } });

export const sendDriverLocation = (
  groupId: string,
  p: { lat: number; lng: number; accuracy: number; capturedAt: number },
) => api<{ stored: boolean }>("/api/location", { body: { groupId, ...p } });

export const setLocationSharing = (groupId: string, enabled: boolean) =>
  api("/api/location", { method: "PATCH", body: { groupId, enabled } });

export const editWorkSession = (groupId: string, sessionId: string, clockInAt: number, clockOutAt: number | null) =>
  api(`/api/work/${sessionId}`, { method: "PATCH", body: { groupId, clockInAt, clockOutAt } });

export const createFavorite = (groupId: string, name: string, place: PlaceInput) =>
  api<{ id: string }>("/api/favorites", { body: { groupId, name, place } });

export const deleteFavorite = (groupId: string, id: string) =>
  api(`/api/favorites/${id}?groupId=${encodeURIComponent(groupId)}`, { method: "DELETE" });

export const markNotificationsRead = (ids?: string[]) =>
  api("/api/notifications/read", { body: ids ? { ids } : {} });

export const savePayrollSettings = (
  groupId: string,
  driverId: string,
  s: {
    monthlyBase: number;
    regularHoursPerDay: number;
    overtimeHourlyRate: number;
    workdays: number[];
    overtimeRoundingMinutes: 1 | 15 | 30 | 60;
    shareWithDriver: boolean;
  },
) => api(`/api/payroll/${driverId}`, { method: "PUT", body: { groupId, ...s } });

export const addManualWorkSession = (groupId: string, driverId: string, clockInAt: number, clockOutAt: number) =>
  api<{ id: string }>("/api/work/manual", { body: { groupId, driverId, clockInAt, clockOutAt } });

// ── 운영자 전용 (익명 통계 리포트 · 자체 장소 목록)
export interface TripReport {
  csv: string;
  totalTrips: number;
  suppressedTrips: number;
  groups: number;
  truncated: boolean;
  preview: Array<{ key: Record<string, string | undefined>; count: number; avgTripMinutes: number | null }>;
}
export const getOperatorStatus = () => api<{ operator: boolean }>("/api/operator");
export const getTripReport = (dims: string[], from: string, to: string) =>
  api<TripReport>(
    `/api/operator/report?dims=${encodeURIComponent(dims.join(","))}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
export const getPois = () => api<{ pois: PoiDoc[] }>("/api/operator/pois");
export const uploadPois = (csv: string, replace: boolean) =>
  api<{ saved: number; errors: { line: number; reason: string }[] }>("/api/operator/pois", { body: { csv, replace } });
