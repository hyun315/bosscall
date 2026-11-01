/**
 * 광고 칸 — 위치와 내용을 이 파일 한 곳에서 관리한다.
 *
 * 원칙 (사용자 안전·신뢰)
 *  - 사장님·가족 화면에만. 기사 화면에는 절대 넣지 않는다 (운전 중 안전).
 *  - 호출 버튼 주변·호출 확인 화면·푸시 알림에는 넣지 않는다.
 *  - 화면 아래쪽 한 곳에만, 항상 "광고" 표시. (광고주 배너 + 광고 안내를 함께)
 *
 * 광고주가 늘면 SLOT_ADS 에서 칸마다 광고를 바꾸면 된다.
 */
import type { Tri } from "@/i18n/core";

export const AD_SLOTS = [
  "pickup", // 호출 › 픽업 위치 고르는 화면 맨 아래
  "destinationSearch", // 목적지 고르는 화면 맨 아래 — 관심도 가장 높음
  "waiting", // 기사 호출 직후, 기사님 응답 기다리는 화면 (맨 아래)
  "tripCompleted", // 운행 완료 화면
  "onTheWay", // 기사님 오는 중 화면 (상태 카드 아래)
  "homeBenefits", // 홈 · 최근 호출 위
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
  /** 크게 보여줄 숫자 한 줄 (예: 약 300곳) */
  stat?: Tri;
  /** 카테고리 칩 */
  chips?: { icon: string; label: Tri }[];
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
    ko: "전화번호와 구글 지도를 바로 엽니다.",
    id: "Telepon dan Google Maps langsung dari daftar.",
    en: "Call or open Google Maps right from the list.",
  },
  stat: { ko: "한인 업소 약 300곳", id: "±300 usaha Korea", en: "~300 Korean businesses" },
  chips: [
    { icon: "🍜", label: { ko: "식당·카페", id: "Restoran", en: "Food" } },
    { icon: "🏥", label: { ko: "병원·치과", id: "Klinik", en: "Clinics" } },
    { icon: "📚", label: { ko: "학원", id: "Kursus", en: "Academies" } },
    { icon: "💇", label: { ko: "뷰티", id: "Salon", en: "Beauty" } },
  ],
  cta: { ko: "업소록 열기", id: "Buka direktori", en: "Open directory" },
  url: "https://hanin-jakarta.vercel.app",
};

const INQUIRY: InquirySlot = { kind: "inquiry" };

/** 칸별 광고 — 위에서부터 차례로 보여준다. 지금은 모든 칸에 한인업소록 + 광고 안내 */
export const HOUSE_AD_SAMPLE = HANIN_DIRECTORY;
const DEFAULT_SLOT: readonly SlotContent[] = [HANIN_DIRECTORY, INQUIRY];
export const SLOT_ADS: Readonly<Record<AdSlotId, readonly SlotContent[]>> = {
  pickup: DEFAULT_SLOT,
  destinationSearch: DEFAULT_SLOT,
  waiting: DEFAULT_SLOT,
  tripCompleted: DEFAULT_SLOT,
  onTheWay: DEFAULT_SLOT,
  homeBenefits: DEFAULT_SLOT,
  payroll: DEFAULT_SLOT,
};

/** 광고 링크에 유입 경로 표시 (광고주가 BossCall에서 온 방문을 알 수 있게) */
export function adLink(url: string, slot: AdSlotId): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=bosscall&utm_medium=app&utm_campaign=${encodeURIComponent(slot)}`;
}

/** 광고 문의 메일 — 제목에 어느 칸을 보고 문의했는지 남긴다 */
export function inquiryMailto(from?: string | null): string {
  const subject = encodeURIComponent(`[BossCall 광고 문의]${from ? ` ${from}` : ""}`);
  return `mailto:${AD_CONTACT_EMAIL}?subject=${subject}`;
}

/** 광고 안내 페이지 (로그인 없이 볼 수 있음 — 광고주에게 링크로 보내도 됨) */
export function advertisePath(slot?: AdSlotId): string {
  return slot ? `/advertise?from=${slot}` : "/advertise";
}

/** 광고 안내 페이지에서 보여줄 칸 설명 */
export const SLOT_INFO: ReadonlyArray<{ slot: AdSlotId; icon: string; title: string; when: string }> = [
  { slot: "pickup", icon: "📍", title: "픽업 위치 고르는 화면", when: "기사님을 부르려고 앱을 열면 가장 먼저 보는 화면입니다." },
  { slot: "destinationSearch", icon: "🎯", title: "목적지 고르는 화면", when: "\"어디 가지?\" 고민하는 순간. 식당·골프장·병원 광고에 가장 잘 맞습니다." },
  { slot: "waiting", icon: "⏳", title: "기사님 응답 기다리는 화면", when: "기사 호출을 누른 직후, 응답을 기다리며 화면을 보는 순간입니다." },
  { slot: "tripCompleted", icon: "🏁", title: "운행 완료 화면", when: "목적지에 막 도착한 순간. 근처 가게·서비스를 알리기 좋습니다." },
  { slot: "onTheWay", icon: "🚗", title: "기사님 오는 중 화면", when: "기사님을 기다리며 5~15분 화면을 보는 시간입니다." },
  { slot: "homeBenefits", icon: "🏠", title: "홈 화면", when: "앱을 열 때마다 보는 화면입니다." },
  { slot: "payroll", icon: "💼", title: "기사님 급여 화면", when: "기사님을 고용한 사장님이 매달 보는 화면. 송금·보험·차량 서비스에 맞습니다." },
];

/** 환경변수로 전체 광고를 끌 수 있다 (NEXT_PUBLIC_ADS_ENABLED=false) */
export function adsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_ENABLED !== "false";
}
