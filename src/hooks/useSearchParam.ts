"use client";
import { useEffect, useState } from "react";

/** useSearchParams 대신 사용 — 정적 빌드 시 Suspense 경계가 필요 없도록 클라이언트에서만 읽는다 */
export function useSearchParam(name: string): string | null | undefined {
  const [value, setValue] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(name));
  }, [name]);
  return value; // undefined = 아직 읽지 않음
}

/** 로그인 후 돌아갈 안전한 내부 경로만 허용 (오픈 리다이렉트 방지) */
export function safeNext(next: string | null | undefined, fallback = "/home"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
