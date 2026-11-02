import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BossCall — Your driver, one tap away",
  description: "Call your private driver in one tap. 내 기사, 한 번에 호출. Panggil sopir Anda sekali tekan.",
  manifest: "/manifest.webmanifest",
  applicationName: "BossCall",
  appleWebApp: { capable: true, title: "BossCall", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B1736",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 휴대폰 다크 모드에서 브라우저(삼성 인터넷·Chrome)가 화면을 강제로 어둡게 칠하지 않도록 — 항상 밝은 화면 */}
        <meta name="color-scheme" content="only light" />
        {/* 카카오톡 등 인앱 브라우저 → 외부 브라우저 (앱 코드보다 먼저) */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/open-external.js" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
