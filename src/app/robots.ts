import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** 검색 로봇 안내 — 공개 페이지만 열고, 로그인 뒤 화면과 API 는 막는다 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
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
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
