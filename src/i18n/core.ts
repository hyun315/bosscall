/**
 * 다국어 기반 — 한국어(ko) · 인도네시아어(id) · 영어(en).
 * 모든 문구는 messages/*.ts 에 세 언어를 나란히 적는다(Tri). 하나라도 빠지면 타입 오류.
 */
export const LOCALES = ["ko", "id", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export interface Tri {
  ko: string;
  id: string;
  en: string;
}

/** 언어 선택 화면에 보이는 이름 (각 언어로 표기) */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
  ko: "한국어",
  id: "Bahasa Indonesia",
  en: "English",
};

/** Intl 날짜·숫자 형식용 */
export const INTL_LOCALE: Readonly<Record<Locale, string>> = {
  ko: "ko-KR",
  id: "id-ID",
  en: "en-US",
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** "id-ID", "in", "ko-KR", "en-US,en;q=0.9" 같은 값 → 지원 언어. 모르면 fallback */
export function pickLocale(input: string | null | undefined, fallback: Locale = "en"): Locale {
  if (!input) return fallback;
  for (const part of input.split(",")) {
    const tag = part.trim().split(";")[0]?.toLowerCase() ?? "";
    if (tag.startsWith("ko")) return "ko";
    if (tag.startsWith("id") || tag.startsWith("in") || tag.startsWith("ms")) return "id";
    if (tag.startsWith("en")) return "en";
  }
  return fallback;
}
