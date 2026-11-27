import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // 첫 주소(/)는 /login 으로 넘어가는 화면이라 싣지 않는다 (대표 주소는 /login).
  return [
    ...PUBLIC_PATHS.map((p) => ({
      url: `${SITE_URL}${p}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: p === "/login" ? 1 : 0.6,
    })),
  ];
}
