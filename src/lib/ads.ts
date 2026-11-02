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
  "homeBenefits", // 홈 · 최근 호출 위
  "waiting", // 기사 호출 직후, 기사님 응답 기다리는 화면 (맨 아래)
  "pickup", // 호출 › 픽업 위치 고르는 화면 맨 아래
  "destinationSearch", // 목적지 고르는 화면 맨 아래
] as const;
export type AdSlotId = (typeof AD_SLOTS)[number];

/* ───────── 광고 상품 (판매 단위) ───────── */

export const AD_PRODUCTS = ["premium", "callBundle"] as const;
export type AdProduct = (typeof AD_PRODUCTS)[number];

export const PRODUCT_INFO: Readonly<Record<AdProduct, { name: string; slots: readonly AdSlotId[]; desc: string }>> = {
  premium: {
    name: "프리미엄",
    slots: ["homeBenefits", "waiting", "pickup", "destinationSearch"],
    desc: "홈 · 기사님 응답 대기 · 픽업 위치 · 목적지 — 광고 자리 4곳 모두",
  },
  callBundle: {
    name: "호출 묶음",
    slots: ["pickup", "destinationSearch"],
    desc: "픽업 위치 · 목적지 — 기사님을 부르는 순간의 2곳",
  },
};

/** 한 자리에 동시에 돌아가며 나오는 광고주 수 상한 */
export const MAX_ADS_PER_SLOT = 3;

export const AD_MONTHS = [1, 3, 6] as const;
export type AdMonths = (typeof AD_MONTHS)[number];

/** 이미지 규격 — 업로드한 사진은 이 크기로 잘라서 저장한다 (들쑥날쑥하지 않게) */
export const BANNER_SPEC = { w: 1200, h: 400, label: "배너", ratio: "3 : 1" } as const;
export const DETAIL_SPEC = { w: 1080, h: 1350, label: "상세 이미지", ratio: "4 : 5" } as const;

export const AD_INDUSTRIES = [
  "식당·카페",
  "병원·치과",
  "학원·교육",
  "뷰티·미용",
  "골프·레저",
  "부동산",
  "여행·항공",
  "마트·식품",
  "법률·회계·비자",
  "기타",
] as const;
export type AdIndustry = (typeof AD_INDUSTRIES)[number];

/** adRequests/{id} — 광고 신청 (서버만 읽고 씀. 운영자는 API로 본다) */
export type AdRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface AdRequestDoc {
  id: string;
  status: AdRequestStatus;
  company: string;
  contactName: string;
  whatsapp: string | null;
  kakaoId: string | null;
  email: string;
  industry: AdIndustry;
  linkUrl: string | null;
  product: AdProduct;
  /** "YYYY-MM-DD" (자카르타 날짜) */
  startDate: string;
  months: AdMonths;
  bannerImageId: string;
  detailImageId: string;
  createdAt: number;
  reviewedAt: number | null;
  reviewedBy: string | null;
  rejectReason: string | null;
  campaignId: string | null;
}

/** adCampaigns/{id} — 승인된 광고 (로그인한 사용자가 읽는다) */
export interface AdCampaignDoc {
  id: string;
  requestId: string;
  company: string;
  slots: AdSlotId[];
  startAt: number;
  endAt: number;
  bannerUrl: string;
  detailUrl: string;
  linkUrl: string | null;
  createdAt: number;
}

/** "YYYY-MM-DD" 자카르타 0시 (UTC+7, 서머타임 없음) */
export function jakartaDayStart(date: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - 7 * 3600_000;
  return Number.isFinite(t) ? t : null;
}

/** 시작일부터 N개월 뒤 같은 날 0시 (월말은 그 달 마지막 날 다음 날로) */
export function campaignWindow(startDate: string, months: number): { startAt: number; endAt: number } | null {
  const startAt = jakartaDayStart(startDate);
  if (startAt === null) return null;
  const [y, mo, d] = startDate.split("-").map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, mo - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const end = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d, lastDay)) - 7 * 3600_000;
  return { startAt, endAt: end };
}

/** 이 기간에 자리별로 이미 잡힌 광고 수 — 상한(MAX_ADS_PER_SLOT)을 넘는 자리를 돌려준다 */
export function fullSlots(
  existing: ReadonlyArray<Pick<AdCampaignDoc, "slots" | "startAt" | "endAt">>,
  slots: readonly AdSlotId[],
  startAt: number,
  endAt: number,
): AdSlotId[] {
  return slots.filter((s) => {
    const overlapping = existing.filter((c) => c.slots.includes(s) && c.startAt < endAt && c.endAt > startAt);
    return overlapping.length >= MAX_ADS_PER_SLOT;
  });
}

/** 지금 이 자리에 나갈 수 있는 광고 (시작일 순으로 고정 정렬) */
export function liveCampaigns(all: readonly AdCampaignDoc[], slot: AdSlotId, now: number): AdCampaignDoc[] {
  return all
    .filter((c) => c.slots.includes(slot) && c.startAt <= now && c.endAt > now)
    .sort((a, b) => a.startAt - b.startAt || a.id.localeCompare(b.id));
}

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

/** 승인된 광고가 없는 자리를 채우는 기본 광고 (한인업소록) + 광고 안내 */
export const HOUSE_AD_SAMPLE = HANIN_DIRECTORY;
export const SLOT_FALLBACK: readonly SlotContent[] = [HANIN_DIRECTORY, INQUIRY];

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

/** 광고 안내 페이지에서 보여줄 자리 설명 */
export const SLOT_INFO: ReadonlyArray<{ slot: AdSlotId; icon: string; title: string; when: string }> = [
  { slot: "homeBenefits", icon: "🏠", title: "홈 화면", when: "앱을 열 때마다 보는 화면입니다." },
  { slot: "waiting", icon: "⏳", title: "기사님 응답 기다리는 화면", when: "기사 호출을 누른 직후, 응답을 기다리며 화면만 보는 순간입니다." },
  { slot: "pickup", icon: "📍", title: "픽업 위치 고르는 화면", when: "기사님을 부르려고 가장 먼저 보는 화면입니다." },
  { slot: "destinationSearch", icon: "🎯", title: "목적지 고르는 화면", when: "\"어디 가지?\" 고민하는 순간. 식당·골프장·병원 광고에 잘 맞습니다." },
];

/** 환경변수로 전체 광고를 끌 수 있다 (NEXT_PUBLIC_ADS_ENABLED=false) */
export function adsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_ENABLED !== "false";
}
