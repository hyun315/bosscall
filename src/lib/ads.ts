/**
 * 광고 칸 — 위치와 내용을 이 파일 한 곳에서 관리한다.
 *
 * 원칙 (사용자 안전·신뢰)
 *  - 사장님·가족 화면에만. 기사 화면에는 절대 넣지 않는다 (운전 중 안전).
 *  - 호출 버튼 주변·호출 확인 화면·푸시 알림에는 넣지 않는다.
 *  - 화면당 1칸, 항상 "광고" 표시.
 *
 * 광고주가 늘면 SLOT_ADS 에서 칸마다 광고를 바꾸면 된다.
 */
import type { Tri } from "@/i18n/core";

export const AD_SLOTS = [
  "destinationSearch", // 목적지 검색 아래 — 관심도 가장 높음
  "tripCompleted", // 운행 완료 화면
  "onTheWay", // 기사님 오는 중 화면 (상태 카드 아래)
  "homeBenefits", // 홈 맨 아래
  "payroll", // 급여 화면 아래
] as const;
export type AdSlotId = (typeof AD_SLOTS)[number];

/** 광고 문의 메일 */
export const AD_CONTACT_EMAIL = "hanin.jakarta114@gmail.com";

export interface HouseAd {
  kind: "ad";
  id: string;
  /** 광고주 이름 (작게 표시) */
  sponsor: Tri;
  title: Tri;
  body: Tri;
  cta: Tri;
  url: string;
  /** 칸 아이콘 (이모지 한 글자) */
  icon: string;
}

export interface InquirySlot {
  kind: "inquiry";
}

export type SlotContent = HouseAd | InquirySlot;

const HANIN_DIRECTORY: HouseAd = {
  kind: "ad",
  id: "hanin-jakarta",
  icon: "📒",
  sponsor: { ko: "자카르타 한인업소록", id: "Direktori Korea Jakarta", en: "Jakarta Korean Directory" },
  title: {
    ko: "도착한 곳 근처 한식당·병원, 한 번에 찾기",
    id: "Cari restoran Korea & klinik terdekat",
    en: "Find Korean restaurants & clinics nearby",
  },
  body: {
    ko: "식당·병원·학원·뷰티까지 자카르타 한인 업소 290여 곳. 전화번호와 구글 지도를 바로 엽니다.",
    id: "Hampir 300 usaha Korea di Jakarta: restoran, klinik, kursus, salon. Telepon dan Google Maps langsung.",
    en: "Nearly 300 Korean businesses in Jakarta — restaurants, clinics, academies, beauty. Call or open Google Maps instantly.",
  },
  cta: { ko: "업소록 열기", id: "Buka direktori", en: "Open directory" },
  url: "https://hanin-jakarta.vercel.app",
};

const INQUIRY: InquirySlot = { kind: "inquiry" };

/** 칸별 광고 — 지금은 한인업소록 + 나머지는 광고 문의 안내 */
export const SLOT_ADS: Readonly<Record<AdSlotId, SlotContent>> = {
  destinationSearch: HANIN_DIRECTORY,
  tripCompleted: HANIN_DIRECTORY,
  onTheWay: INQUIRY,
  homeBenefits: INQUIRY,
  payroll: INQUIRY,
};

/** 광고 링크에 유입 경로 표시 (광고주가 BossCall에서 온 방문을 알 수 있게) */
export function adLink(url: string, slot: AdSlotId): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=bosscall&utm_medium=app&utm_campaign=${encodeURIComponent(slot)}`;
}

/** 광고 문의 메일 — 제목에 어느 칸을 보고 문의했는지 남긴다 */
export function inquiryMailto(slot: AdSlotId): string {
  const subject = encodeURIComponent(`[BossCall 광고 문의] ${slot}`);
  return `mailto:${AD_CONTACT_EMAIL}?subject=${subject}`;
}

/** 환경변수로 전체 광고를 끌 수 있다 (NEXT_PUBLIC_ADS_ENABLED=false) */
export function adsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_ENABLED !== "false";
}
