import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";
import { SITE_URL, SITE_VERIFICATION } from "@/lib/site";

const DESC =
  "우리 집 기사님, 버튼 하나로 부르세요. 개인 기사님을 둔 가족을 위한 무료 앱 — 기사 호출, 출발·도착 확인, 출퇴근·근무시간·급여 기록까지. 자카르타 한인 가족을 위한 BossCall. Panggil sopir keluarga Anda dengan satu tombol.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BossCall — 우리 집 기사님, 버튼 하나로 | Your Family. Your Driver. Your Peace of Mind.",
    template: "%s | BossCall",
  },
  description: DESC,
  keywords: ["BossCall", "보스콜", "기사 호출", "개인 기사", "운전기사", "자카르타", "인도네시아", "주재원", "한인", "sopir pribadi", "driver app"],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "BossCall",
    title: "BossCall — 우리 집 기사님, 버튼 하나로 부르세요",
    description: DESC,
    locale: "ko_KR",
    alternateLocale: ["id_ID", "en_US"],
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "BossCall — 우리 집 기사님, 버튼 하나로 부르세요" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BossCall — 우리 집 기사님, 버튼 하나로 부르세요",
    description: DESC,
    images: ["/og-image.jpg"],
  },
  verification: {
    ...(SITE_VERIFICATION.google ? { google: SITE_VERIFICATION.google } : {}),
    ...(SITE_VERIFICATION.naver ? { other: { "naver-site-verification": SITE_VERIFICATION.naver } } : {}),
  },
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
        {/* Vercel Web Analytics — 방문자·페이지뷰 집계 (쿠키 없음). 대시보드 Analytics 탭에서 켜져 있어야 수집됨 */}
        <script
          dangerouslySetInnerHTML={{ __html: "window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};" }}
        />
        <script defer src="/_vercel/insights/script.js" />
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
