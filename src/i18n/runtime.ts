/**
 * 브라우저에서 현재 언어를 보관 — React 밖(api 호출 헤더 등)에서도 읽을 수 있게 모듈 단위로 둔다.
 */
import { isLocale, pickLocale, type Locale } from "@/i18n/core";

const KEY = "bosscall.locale";
let current: Locale | null = null;

/** 저장된 선택 > 기기 언어 > 영어 */
export function detectLocale(): Locale {
  if (typeof window === "undefined") return "ko";
  try {
    const saved = window.localStorage.getItem(KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* 저장소 사용 불가 */
  }
  const langs = navigator.languages?.length ? navigator.languages.join(",") : navigator.language;
  return pickLocale(langs, "en");
}

export function getLocale(): Locale {
  if (!current) current = detectLocale();
  return current;
}

export function setRuntimeLocale(l: Locale): void {
  current = l;
  try {
    window.localStorage.setItem(KEY, l);
  } catch {
    /* 무시 */
  }
}
