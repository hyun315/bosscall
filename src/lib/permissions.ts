/**
 * 역할·요금제 기반 권한 규칙 (명세 §0.2, §22, §29 보안).
 * 서버 API가 이 함수로 판단하고, 클라이언트는 화면 표시(버튼 숨김 등)에만 참고한다.
 */
import type { MsgKey } from "@/i18n/index";
import type { MemberRole, PlanId } from "@/types/domain";

export const PLAN_LIMITS: Readonly<Record<PlanId, { maxDrivers: number; maxFamilyMembers: number }>> = {
  // [결정 필요] 명세 §22 "가족 구성원 제한"의 구체 숫자가 없어 임시로 5명(Owner 제외)으로 둔다.
  FREE: { maxDrivers: 1, maxFamilyMembers: 5 },
  PREMIUM: { maxDrivers: 10, maxFamilyMembers: 30 },
};

export function canCreateCall(role: MemberRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

/** Owner 전용 설정: 그룹 설정, 기사 추가/수정, 초대, 구성원 삭제, 근무기록 수정 */
export function isOwner(role: MemberRole): boolean {
  return role === "OWNER";
}

export function canManageFavorites(role: MemberRole): boolean {
  return role === "OWNER" || role === "MEMBER";
}

export function canDeleteFavorite(role: MemberRole, userId: string, createdBy: string): boolean {
  return role === "OWNER" || (role === "MEMBER" && userId === createdBy);
}

export const ROLE_LABEL: Readonly<Record<MemberRole, MsgKey>> = {
  OWNER: "role.OWNER",
  MEMBER: "role.MEMBER",
  DRIVER: "role.DRIVER",
  ADMIN: "role.ADMIN",
};
