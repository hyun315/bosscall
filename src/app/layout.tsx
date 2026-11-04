import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BossCall — Your Family. Your Driver. Your Peace of Mind.",
  description: "Your Family. Your Driver. Your Peace of Mind. 가족과 기사님의 하루를 편하게 잇습니다. Menghubungkan hari keluarga dan sopir.",
  manifest: "/manifest.webmanifest",
  applicationName: "BossCall",
  appleWebApp: { capable: true, title: "BossCall", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#13212F" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 휴대폰 다크 모드를 따른다 — 앱이 직접 다크 색을 정하므로 브라우저가 강제로 칠하지 않음 */}
        <meta name="color-scheme" content="light dark" />
        {/* 카카오톡 등 인앱 브라우저 → 외부 브라우저 (앱 코드보다 먼저) */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/open-external.js" />
        <script src="/recover.js" />
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
