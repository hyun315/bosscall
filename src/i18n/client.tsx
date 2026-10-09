"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { INTL_LOCALE, isLocale, type Locale } from "@/i18n/core";
import { translate, type MsgKey, type MsgParams } from "@/i18n/index";
import { getLocale, setRuntimeLocale } from "@/i18n/runtime";

interface I18nValue {
  locale: Locale;
  intl: string;
  t: (key: MsgKey, params?: MsgParams) => string;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<I18nValue | null>(null);

/**
 * 언어 상태. 우선순위: 사용자 계정에 저장된 언어 > 이 기기에서 고른 언어 > 기기 언어.
 * 서버 렌더와 첫 화면이 어긋나지 않도록 첫 렌더는 한국어, 마운트 직후 실제 언어로 바꾼다.
 */
export function I18nProvider({
  children,
  accountLocale,
  onPersist,
}: {
  children: ReactNode;
  /** users/{uid}.locale */
  accountLocale: string | null | undefined;
  /** 사용자가 언어를 바꿨을 때 계정에 저장 */
  onPersist: (l: Locale) => void;
}) {
  const [locale, setLocaleState] = useState<Locale>("ko");

  useEffect(() => {
    setLocaleState(getLocale());
  }, []);

  useEffect(() => {
    if (isLocale(accountLocale) && accountLocale !== getLocale()) {
      setRuntimeLocale(accountLocale);
      setLocaleState(accountLocale);
    }
  }, [accountLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (l: Locale) => {
      setRuntimeLocale(l);
      setLocaleState(l);
      onPersist(l);
    },
    [onPersist],
  );

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      intl: INTL_LOCALE[locale],
      t: (key, params) => translate(locale, key, params),
      setLocale,
    }),
    [locale, setLocale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("I18nProvider 가 필요합니다.");
  return v;
}
