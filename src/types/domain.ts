/**
 * BossCall 2.0 도메인 타입 — 명세서 §15 DATABASE 기준.
 * Firestore 구조:
 *   users/{uid}
 *   users/{uid}/deviceTokens/{tokenHash}
 *   users/{uid}/notifications/{id}
 *   groups/{groupId}                       ← 최상위 tenant
 *   groups/{groupId}/members/{uid}         ← group_members
 *   groups/{groupId}/drivers/{driverId}
 *   groups/{groupId}/calls/{callId}
 *   groups/{groupId}/calls/{callId}/events/{eventId}   ← call_events (append-only)
 *   groups/{groupId}/workSessions/{id}
 *   groups/{groupId}/favorites/{id}        ← favorite_locations
 *   groups/{groupId}/auditLogs/{id}
 *   invites/{code}, analyticsEvents/{id}, usageDaily/{date}, rateLimits/{key}  ← 서버 전용
 *   tripStats/{id}       ← 익명 운행 통계 (그룹·사용자 식별정보 없음, 서버 전용)
 *   adProfiles/{uid}     ← 맞춤 혜택용 관심 분류 횟수 (선택 동의자만, 서버 전용)
 *   pois/{id}            ← 운영자가 관리하는 자체 장소 목록 (분류 판단용, 서버 전용)
 *   users/{uid}/consentLog/{id} ← 동의 변경 이력 (append-only, 서버 전용)
 *
 * 모든 시각은 epoch milliseconds(number)로 저장한다. 서버 시각이 기준이다.
 */

export const MEMBER_ROLES = ["OWNER", "MEMBER", "DRIVER", "ADMIN"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const DRIVER_STATUSES = ["OFF_DUTY", "ON_DUTY", "BUSY", "INACTIVE"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const CALL_STATUSES = [
  "CREATED",
  "CALLING",
  "RECEIVED",
  "ACCEPTED",
  "ON_THE_WAY",
  "ARRIVED",
  "TRIP_STARTED",
  "COMPLETED",
  "DECLINED",
  "TIMEOUT",
  "CANCELLED",
] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

export type PlanId = "FREE" | "PREMIUM";

export interface UserDoc {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  activeGroupId: string | null;
  groupIds: string[];
  notificationPrefs: NotificationPrefs;
  /** 화면·알림 언어 (ko | id | en). 없으면 기기 언어 */
  locale?: "ko" | "id" | "en";
  /** 선택 동의 — 없으면 아직 묻지 않은 상태 */
  consents?: UserConsents;
  createdAt: number;
  updatedAt: number;
}

export interface NotificationPrefs {
  /** 호출 상태 변경 알림 (수락/거절/취소/완료) */
  callUpdates: boolean;
  /** 기사 출근/퇴근 알림 */
  workEvents: boolean;
}

export interface GroupDoc {
  id: string;
  name: string;
  ownerId: string;
  timezone: string;
  plan: PlanId;
  createdAt: number;
  updatedAt: number;
}

export interface MemberDoc {
  id: string; // = userId
  groupId: string;
  userId: string;
  role: MemberRole;
  status: "ACTIVE";
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  /** role === DRIVER 인 경우 연결된 drivers 문서 id */
  driverId: string | null;
  createdAt: number;
}

export interface DriverDoc {
  id: string;
  groupId: string;
  /** 초대 수락 전에는 null */
  userId: string | null;
  displayName: string;
  phone: string | null;
  status: DriverStatus;
  currentSessionId: string | null;
  lastClockInAt: number | null;
  /** 근무 중 위치 공유 여부 — 기사가 출근 시 선택, 근무 중 끄고 켤 수 있음. 퇴근 시 false */
  locationSharing?: boolean;
  /** 위치 공유 안내에 처음 동의한 시각 */
  locationConsentAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * 기사 최신 위치 — groups/{groupId}/driverLocations/{driverId}
 * 이력 없이 최신 1건만 덮어쓰고, 퇴근·공유 중지 시 삭제한다 (명세 §24 위치정보 최소 보관).
 */
export interface DriverLocationDoc {
  driverId: string;
  groupId: string;
  sessionId: string;
  lat: number;
  lng: number;
  /** 미터 */
  accuracy: number;
  /** 기기에서 위치를 측정한 시각 */
  capturedAt: number;
  /** 서버에 저장된 시각 */
  updatedAt: number;
}

/**
 * 좌표 출처 — 구글 약관상 구글에서 받은 좌표(google)는 30일까지만 보관할 수 있고
 * 다른 사용자와 섞어 쓸 수 없다. 기기 GPS(gps)·지도 핀(map)으로 사용자가 직접 정한 좌표는 자체 데이터.
 */
export const COORD_SOURCES = ["gps", "map", "google"] as const;
export type CoordSource = (typeof COORD_SOURCES)[number];

/**
 * 자체 장소 분류. 건강·종교처럼 민감한 추정을 낳는 분류(병원·예배당 등)는 일부러 두지 않는다.
 */
export const PLACE_CATEGORIES = [
  "HOME",
  "OFFICE",
  "SCHOOL",
  "GOLF",
  "RESTAURANT",
  "MALL",
  "HOTEL",
  "AIRPORT",
  "LEISURE",
  "OTHER",
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export interface PlaceInput {
  lat: number;
  lng: number;
  address: string;
  /** 즐겨찾기/검색 결과 이름 (예: Home, Grand Indonesia) */
  name: string | null;
  placeId: string | null;
  /** 없으면 google 로 간주 (보수적) */
  source?: CoordSource;
  /** 즐겨찾기에서 고른 경우 그 분류 */
  category?: PlaceCategory | null;
  /** 구글 좌표를 받은 시각 (보관 기한 계산용) */
  fetchedAt?: number | null;
}

/** 운행 중 기사 기기 GPS로 찍은 실제 위치 (자체 데이터) */
export interface ActualFix {
  lat: number;
  lng: number;
  accuracy: number;
  at: number;
}

export interface ConsentState {
  granted: boolean;
  at: number;
  /** 동의 문구 버전 (src/lib/tripData.ts CONSENT_VERSION) */
  version: string;
}

export interface UserConsents {
  /** 익명 이동 통계 활용 (서비스 개선·지역 리포트) */
  analytics: ConsentState;
  /** 자주 가는 장소 종류에 맞춘 혜택·광고 안내 */
  marketing: ConsentState;
}

/** tripStats/{id} — 운행 1건의 익명 통계. 그룹·사용자·호출 id, 정확한 좌표·시각은 없다 */
export interface TripStatDoc {
  v: 1;
  /** 그룹 시간대 기준 "YYYY-MM" */
  month: string;
  /** 0=일 … 6=토 (그룹 시간대) */
  weekday: number;
  /** 0~23 (그룹 시간대) */
  hour: number;
  timezone: string;
  /** 약 1.1km 격자 (자체 좌표가 있을 때만) */
  pickupCell: string | null;
  dropoffCell: string | null;
  pickupCategory: PlaceCategory | null;
  dropoffCategory: PlaceCategory | null;
  /** 탑승~도착 분 (5분 단위 반올림) */
  tripMinutes: number | null;
  createdAt: number;
}

/** adProfiles/{uid} — 맞춤 혜택 동의자만. 동의 철회 시 삭제 */
export interface AdProfileDoc {
  uid: string;
  /** 목적지 분류별 운행 횟수 */
  categoryCounts: Partial<Record<PlaceCategory, number>>;
  updatedAt: number;
}

/** pois/{id} — 운영자가 등록한 자체 장소 (구글 데이터가 아님) */
export interface PoiDoc {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  /** 이 반경(m) 안에 도착하면 이 장소로 본다 */
  radiusM: number;
  updatedAt: number;
}

export interface CallDoc {
  id: string;
  groupId: string;
  driverId: string;
  driverName: string;
  callerId: string;
  callerName: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  pickupName: string | null;
  pickupPlaceId: string | null;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  destinationName: string | null;
  destinationPlaceId: string | null;
  /** 좌표 출처 (없으면 google 로 간주) */
  pickupSource?: CoordSource;
  destinationSource?: CoordSource;
  pickupCategory?: PlaceCategory | null;
  destinationCategory?: PlaceCategory | null;
  /** 구글 좌표 보관 만료 시각 — 지나면 서버가 구글 좌표를 지운다(0으로 표시하고 coordsCleared=true) */
  geoExpiresAt?: number | null;
  coordsCleared?: boolean;
  /** 기사 GPS: 탑승 시작 / 운행 완료 지점 */
  actualPickup?: ActualFix | null;
  actualDropoff?: ActualFix | null;
  tripStartedAt?: number | null;
  status: CallStatus;
  createdAt: number;
  expiresAt: number;
  receivedAt: number | null;
  acceptedAt: number | null;
  completedAt: number | null;
  cancelledAt: number | null;
  endedAt: number | null;
  updatedAt: number;
}

export interface CallEventDoc {
  id: string;
  callId: string;
  groupId: string;
  eventType: CallStatus;
  fromStatus: CallStatus | null;
  actorId: string;
  actorRole: MemberRole | "SYSTEM";
  createdAt: number;
  metadata: Record<string, string | number | boolean | null>;
}

export interface WorkSessionDoc {
  id: string;
  groupId: string;
  driverId: string;
  clockInAt: number;
  clockOutAt: number | null;
  timezone: string;
  createdAt: number;
  editedBy: string | null;
  editedAt: number | null;
}

export interface FavoriteLocationDoc {
  id: string;
  groupId: string;
  createdBy: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId: string | null;
  source?: CoordSource;
  category?: PlaceCategory | null;
  geoExpiresAt?: number | null;
  /** 구글 좌표를 지운 상태 — 쓸 때 placeId로 좌표를 다시 받는다 */
  coordsCleared?: boolean;
  createdAt: number;
}

export type NotificationType =
  | "CALL_CREATED"
  | "CALL_ACCEPTED"
  | "CALL_DECLINED"
  | "CALL_CANCELLED"
  | "CALL_COMPLETED"
  | "DRIVER_CLOCK_IN"
  | "DRIVER_CLOCK_OUT";

export interface NotificationDoc {
  id: string;
  type: NotificationType;
  groupId: string;
  callId: string | null;
  title: string;
  body: string;
  url: string;
  read: boolean;
  createdAt: number;
}

export interface InviteDoc {
  code: string;
  groupId: string;
  groupName: string;
  role: "DRIVER" | "MEMBER";
  driverId: string | null;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  usedBy: string | null;
  usedAt: number | null;
}

/**
 * 급여 조건 — groups/{groupId}/payrollSettings/{driverId} (보스첵 요구사항 반영)
 * 읽기: Owner, 그리고 shareWithDriver=true 일 때 해당 기사 본인. 가족(MEMBER)은 볼 수 없다.
 */
export interface PayrollSettingsDoc {
  driverId: string;
  groupId: string;
  currency: "IDR";
  /** 월 기본급 (루피아, 정수) */
  monthlyBase: number;
  /** 근무일 1일 기본 근무시간 (시간). 이를 넘는 시간이 시간외 */
  regularHoursPerDay: number;
  /** 시간외 수당 (시간당 루피아) */
  overtimeHourlyRate: number;
  /** 근무일 요일 (0=일 … 6=토). 근무일이 아닌 날의 근무는 전부 시간외 */
  workdays: number[];
  /** 하루 시간외 합계를 이 단위(분)로 내림: 1 | 15 | 30 | 60 */
  overtimeRoundingMinutes: 1 | 15 | 30 | 60;
  /** 기사 본인에게 급여 내역 공개 */
  shareWithDriver: boolean;
  updatedAt: number;
  updatedBy: string;
}
