"use client";
/**
 * 화면 오류 — 빈 화면에 영어 오류 대신 "다시 열기" 단추. 옛 버전 파일 문제면 바로 새로고침한다.
 * 오류 내용은 작게 보여 준다 (캡처해서 보내면 원인을 바로 알 수 있게).
 */
import { useEffect } from "react";
import { IconRefresh } from "@/components/brand/Icons";

const STALE = /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed/i;

export function CrashScreen({ error, reset }: { error: Error & { digest?: string }; reset?: () => void }) {
  useEffect(() => {
    console.error(error);
    if (!STALE.test(`${error.name} ${error.message}`)) return;
    try {
      const last = Number(sessionStorage.getItem("bosscall.recoveredAt") || 0);
      if (Date.now() - last < 60_000) return;
      sessionStorage.setItem("bosscall.recoveredAt", String(Date.now()));
    } catch {
      /* 무시 */
    }
    window.location.reload();
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-action-soft text-link" aria-hidden>
        <IconRefresh className="h-8 w-8" />
      </span>
      <h1 className="text-xl font-extrabold text-ink">화면을 다시 열어 주세요</h1>
      <p className="text-[15px] leading-relaxed text-ink-sub">
        잠시 문제가 생겼습니다. 아래 단추를 누르면 다시 열립니다.
        <br />
        Terjadi masalah. Tekan tombol di bawah untuk membuka lagi.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-[52px] w-full max-w-xs rounded-btn bg-action text-[17px] font-bold text-white"
      >
        다시 열기 · Buka lagi
      </button>
      {reset && (
        <button type="button" onClick={reset} className="text-sm font-semibold text-link">
          이 화면만 다시 시도
        </button>
      )}
      <p className="mt-4 max-w-xs break-all text-[11px] text-ink-faint">
        {error.name}: {error.message}
        {error.digest ? ` (${error.digest})` : ""}
      </p>
    </main>
  );
}
