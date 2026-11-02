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

/**
 * 운영 방식 스위치.
 *  - false (지금, 무료 기간): 상품 하나("보스콜 광고" = 4개 화면 전부), 선착순, 화면별 칸 수 제한 + 넘치면 돌아가며 노출.
 *  - true: 프리미엄/호출 묶음 × 1~5번 고정 자리 (slotLayout). 가격이 정해지면 다시 켤 수 있게 남겨 둔다.
 */
export const AD_TIERS_ENABLED = false;

/** 단일 상품 운영 시: 화면별 광고 칸 수 (한인업소록 포함) */
export const SCREEN_CAP: Readonly<Record<AdSlotId, number>> = {
  homeBenefits: 5,
  waiting: 5,
  pickup: 5,
  destinationSearch: 5,
};
/** 단일 상품 운영 시: 같은 기간에 동시에 올릴 수 있는 광고 수 (넘치면 돌아가며 노출이 너무 묽어진다) */
export const MAX_LIVE_ADS = 12;

export const AD_PRODUCTS = ["premium", "callBundle"] as const;
export type AdProduct = (typeof AD_PRODUCTS)[number];

export const PRODUCT_INFO: Readonly<Record<AdProduct, { name: string; slots: readonly AdSlotId[]; desc: string }>> = {
  premium: {
    // 단일 상품 운영 중에는 이 상품 하나만 쓴다 (모든 화면)
    name: AD_TIERS_ENABLED ? "프리미엄" : "보스콜 광고",
    slots: ["homeBenefits", "waiting", "pickup", "destinationSearch"],
    desc: "홈 · 기사님 응답 대기 · 픽업 위치 · 목적지 — 광고 자리 4곳 모두",
  },
  callBundle: {
    name: "호출 묶음",
    slots: ["pickup", "destinationSearch"],
    desc: "픽업 위치 · 목적지 — 기사님을 부르는 순간의 2곳",
  },
};

/**
 * 한 화면의 광고 칸 — 1~5번 고정 자리.
 *  - 홈·응답 대기 화면: 프리미엄 N 이 N번 자리.
 *  - 픽업·목적지 화면: 호출 묶음 N 이 N번 자리, 프리미엄은 마지막 호출 묶음 아래에 번호순으로 자동 노출,
 *    남은 호출 묶음 자리 안내는 맨 아래 (전체 5칸이 될 때까지만).
 *  - 1번 자리가 비어 있으면 한인업소록.
 *  - 기간이 끝난 광고 자리는 빈칸으로 남는다 (아래 광고가 올라오지 않음).
 */
export const AD_POSITIONS = 5;
/** 상품 안 순번 */
export const AD_RANKS = [1, 2, 3, 4, 5] as const;

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

/**
 * 광고주 업소 위치 — [출발지로 설정·목적지로 설정] 단추용. 구글 좌표는 오래 보관하지 않도록 Place ID 만 두고,
 * 목적지로 고를 때 Place ID 로 좌표를 새로 받는다.
 */
export interface AdPlace {
  name: string;
  address: string;
  placeId: string;
}

export type AdPlaceUse = "pickup" | "destination";

/** /call/new 로 출발지(픽업) 또는 목적지를 들고 가는 주소 (목적지는 업소록 연동과 같은 방식) */
export function placeHref(p: AdPlace, use: AdPlaceUse): string {
  const q =
    use === "destination"
      ? new URLSearchParams({ dest: p.name, destAddr: p.address, destPlaceId: p.placeId })
      : new URLSearchParams({ pick: p.name, pickAddr: p.address, pickPlaceId: p.placeId });
  return `/call/new?${q.toString()}`;
}

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
  place: AdPlace | null;
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
  place?: AdPlace | null;
  /** 없으면(예전 광고) 자리 수로 판단: 4곳이면 프리미엄 */
  product?: AdProduct;
  /** 상품 안 순번 1~5 (없으면 5) */
  rank?: number;
  createdAt: number;
}

export function campaignProduct(c: Pick<AdCampaignDoc, "product" | "slots">): AdProduct {
  return c.product ?? (c.slots.length >= PRODUCT_INFO.premium.slots.length ? "premium" : "callBundle");
}

/** "프리미엄 2" 같은 표시 */
export function campaignLabel(c: Pick<AdCampaignDoc, "product" | "slots" | "rank">): string {
  return `${PRODUCT_INFO[campaignProduct(c)].name} ${c.rank ?? 5}`;
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

/** 같은 상품·같은 번호를 겹치는 기간에 이미 쓰는 광고 (없으면 null) */
export function rankTaken(
  existing: ReadonlyArray<AdCampaignDoc>,
  product: AdProduct,
  rank: number,
  startAt: number,
  endAt: number,
  exceptId?: string,
): AdCampaignDoc | null {
  return (
    existing.find(
      (c) =>
        c.id !== exceptId &&
        campaignProduct(c) === product &&
        (c.rank ?? 5) === rank &&
        c.startAt < endAt &&
        c.endAt > startAt,
    ) ?? null
  );
}

export type AdCell = { kind: "paid"; n: number; c: AdCampaignDoc } | { kind: "house"; n: number } | { kind: "empty"; n: number };

/** 이 화면의 1~5번 자리에 무엇이 나오는지 */
export function slotLayout(all: readonly AdCampaignDoc[], slot: AdSlotId, now: number): AdCell[] {
  const live = all
    .filter((c) => c.slots.includes(slot) && c.startAt <= now && c.endAt > now)
    .sort((a, b) => a.startAt - b.startAt || a.id.localeCompare(b.id));
  const at = (product: AdProduct, n: number) => live.find((c) => campaignProduct(c) === product && (c.rank ?? 5) === n);
  // 호출 묶음 화면(픽업·목적지)은 호출 묶음이 1~5번 자리의 주인, 그 밖의 화면은 프리미엄
  const callScreen = PRODUCT_INFO.callBundle.slots.includes(slot);
  const owner: AdProduct = callScreen ? "callBundle" : "premium";
  const cell = (n: number): AdCell => {
    const c = at(owner, n);
    if (c) return { kind: "paid", n, c };
    return n === 1 ? { kind: "house", n } : { kind: "empty", n };
  };
  if (!callScreen) return Array.from({ length: AD_POSITIONS }, (_, i) => cell(i + 1));

  // 호출 묶음 화면: 호출 묶음 1~마지막 번호까지는 번호 자리 그대로 (사이 빈칸 유지)
  const lastBundle = Math.max(0, ...live.filter((c) => campaignProduct(c) === "callBundle").map((c) => c.rank ?? 5));
  const head = Array.from({ length: Math.max(1, lastBundle) }, (_, i) => cell(i + 1));
  // 프리미엄은 자동으로 그 아래에 번호순
  const premium = AD_RANKS.map((r) => at("premium", r))
    .filter((c): c is AdCampaignDoc => !!c)
    .map((c): AdCell => ({ kind: "paid", n: AD_POSITIONS + (c.rank ?? 5), c }));
  // 남은 호출 묶음 번호 자리는 맨 아래 "광고 자리 N" 안내 — 전체가 AD_POSITIONS 칸이 될 때까지만
  const tail: AdCell[] = [];
  for (let n = Math.max(2, lastBundle + 1); n <= AD_POSITIONS && head.length + premium.length + tail.length < AD_POSITIONS; n++) {
    tail.push({ kind: "empty", n });
  }
  return [...head, ...premium, ...tail];
}

/**
 * 단일 상품 운영(선착순) — 1번 한인업소록, 그다음 먼저 승인된 광고부터.
 * 유료 광고는 들어올 때마다 무작위 순서, 칸(SCREEN_CAP)보다 많으면 그중 일부만.
 * 자리가 남으면 맨 아래 "광고 자리" 안내 1칸.
 */
export function simpleLayout(all: readonly AdCampaignDoc[], slot: AdSlotId, now: number, seed: number): AdCell[] {
  // 단일 상품이므로 예전에 호출 묶음으로 올린 광고도 모든 화면에
  const live = all
    .filter((c) => c.startAt <= now && c.endAt > now)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const paidCap = Math.max(0, SCREEN_CAP[slot] - 1);
  // 무료 기간: 화면에 들어올 때마다 무작위 순서 (seed 로 섞음 — 같은 화면 안에서는 순서 고정)
  const shown = seededShuffle(live, seed).slice(0, paidCap);
  const cells: AdCell[] = [{ kind: "house", n: 1 }, ...shown.map((c, i): AdCell => ({ kind: "paid", n: i + 2, c }))];
  if (live.length < paidCap) cells.push({ kind: "empty", n: cells.length + 1 });
  return cells;
}

/** seed 로 정해지는 무작위 순서 (Fisher–Yates + mulberry32 — 작은 seed 도 고르게 섞인다) */
export function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const a = [...arr];
  let x = seed >>> 0;
  const rand = () => {
    x = (x + 0x6d2b79f5) >>> 0;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** 지금 쓰는 배치 (스위치에 따라) */
export function screenLayout(all: readonly AdCampaignDoc[], slot: AdSlotId, now: number, seed: number): AdCell[] {
  return AD_TIERS_ENABLED ? slotLayout(all, slot, now) : simpleLayout(all, slot, now, seed);
}

/** 같은 기간에 겹치는 광고 수 (단일 상품 운영의 상한 확인) */
export function overlappingCount(existing: ReadonlyArray<AdCampaignDoc>, startAt: number, endAt: number, exceptId?: string): number {
  return existing.filter((c) => c.id !== exceptId && c.startAt < endAt && c.endAt > startAt).length;
}

/** 같은 상품에서 겹치는 기간에 아직 안 쓴 가장 앞 순번 (다 쓰였으면 5) */
export function nextFreeRank(
  existing: ReadonlyArray<AdCampaignDoc>,
  product: AdProduct,
  startAt: number,
  endAt: number,
  exceptId?: string,
): number {
  const used = new Set(
    existing
      .filter((c) => c.id !== exceptId && campaignProduct(c) === product && c.startAt < endAt && c.endAt > startAt)
      .map((c) => c.rank ?? 5),
  );
  return AD_RANKS.find((r) => !used.has(r)) ?? 5;
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
