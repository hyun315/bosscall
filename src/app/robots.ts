import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** 로그인 뒤 화면·API — 검색 로봇에게도 열지 않는다 */
const PRIVATE = [
  "/api/",
  "/home",
  "/calls",
  "/call",
  "/history",
  "/drivers",
  "/settings",
  "/notifications",
  "/profile",
  "/operator",
  "/onboarding",
  "/invite/",
];

/**
 * 로봇 안내 — 검색엔진(구글·네이버·빙·다음·덕덕고)과 링크 미리보기(카카오톡·WhatsApp 등)만 허용하고
 * AI 검색 로봇도 허용하고, 그 밖의 로봇(SEO 수집기, AI 학습 수집기 등)은 전부 막는다. 말을 안 듣는 로봇은 middleware.ts 가 403 으로 막는다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          "Googlebot",
          "Googlebot-Image",
          "Google-InspectionTool",
          "Yeti",
          "Bingbot",
          "Daumoa",
          "DuckDuckBot",
          "kakaotalk-scrap",
          "facebookexternalhit",
          "WhatsApp",
          "Twitterbot",
          "Slackbot",
          "TelegramBot",
          "LinkedInBot",
          // AI 검색 — 답변에 보스콜을 소개·인용할 때 쓰는 로봇 (학습용 GPTBot·ClaudeBot 등은 아래 "*" 로 막힘)
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "Perplexity-User",
          "Claude-SearchBot",
          "Claude-User",
        ],
        allow: "/",
        disallow: PRIVATE,
      },
      { userAgent: "*", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
