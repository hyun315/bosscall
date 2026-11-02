"use client";
import { api } from "@/services/client/api";
import type { CallAction } from "@/lib/callStateMachine";
import type { ActualFix, NotificationPrefs, PlaceInput, PoiDoc } from "@/types/domain";
import type { AdCampaignDoc, AdPlace, AdProduct, AdRequestDoc } from "@/lib/ads";

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
  callAlarmSound?: boolean;
}) => api("/api/me", { method: "PATCH", body });

/** 이 계정의 모든 기기로 5초 뒤 테스트 알림 (화면을 끄고 소리 확인용) */
export const sendTestPush = () => api<{ ok: boolean; devices: number }>("/api/devices/test", { body: {} });

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

/** 기사: "호출이 취소되었습니다" 확인 */
export const ackCancelledCall = (groupId: string, callId: string) =>
  api(`/api/calls/${callId}/ack-cancel`, { body: { groupId } });

export const clock = (groupId: string, action: "CLOCK_IN" | "CLOCK_OUT", shareLocation = false) =>
  api<{ sessionId: string }>("/api/work", { body: { groupId, action, shareLocation } });

/** 관리자가 기사 대신 출근/퇴근 처리 */
export const clockForDriver = (groupId: string, driverId: string, action: "CLOCK_IN" | "CLOCK_OUT") =>
  api<{ sessionId: string }>("/api/work", { body: { groupId, action, driverId } });

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


/* ───────── 광고 신청 검토 (운영자) ───────── */
export const getAdRequests = () => api<{ requests: AdRequestDoc[]; campaigns: AdCampaignDoc[] }>("/api/operator/ads");
export const getAdRequest = (id: string) =>
  api<{ request: AdRequestDoc; banner: string | null; detail: string | null }>(`/api/operator/ads/${id}`);
export const approveAd = (id: string, startDate: string, months: number, rank: number, product: AdProduct) =>
  api<{ ok: true; campaignId: string } | { ok: false; takenBy: string }>(`/api/operator/ads/${id}`, {
    body: { action: "approve", startDate, months, rank, product },
  });
export const rejectAd = (id: string, reason: string) => api(`/api/operator/ads/${id}`, { body: { action: "reject", reason } });
export const setAdCampaignPlace = (campaignId: string, place: AdPlace | null) =>
  api(`/api/operator/ads/${campaignId}`, { body: { action: "place", place } });
export const updateAdCampaign = (
  campaignId: string,
  patch: {
    bannerImage?: string;
    detailImage?: string;
    startDate?: string;
    lastDate?: string;
    linkUrl?: string | null;
    rank?: number;
    product?: AdProduct;
  },
) =>
  api<{ ok: true; campaignId: string } | { ok: false; takenBy: string }>(`/api/operator/ads/${campaignId}`, {
    body: { action: "update", ...patch },
  });
/** 운영자가 광고를 처음부터 직접 올림 (바로 승인) */
export const createAdDirect = (body: {
  company: string;
  industry: string;
  contactName: string;
  whatsapp: string;
  kakaoId: string;
  email: string;
  product: AdProduct;
  rank: number;
  months: number;
  startDate: string;
  linkUrl: string;
  place: AdPlace | null;
  bannerImage: string;
  detailImage: string;
}) => api<{ ok: true; campaignId: string } | { ok: false; takenBy: string }>("/api/operator/ads", { body });
export const endAdCampaign = (campaignId: string) => api(`/api/operator/ads/${campaignId}`, { body: { action: "end" } });
