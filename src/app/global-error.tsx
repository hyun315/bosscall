"use client";
import "./globals.css";
import { CrashScreen } from "@/components/common/CrashScreen";

/** 루트 레이아웃까지 실패했을 때 — 자체 html/body 가 필요하다 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <CrashScreen error={error} />
      </body>
    </html>
  );
}
