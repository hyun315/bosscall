import { createHash } from "node:crypto";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { isRecord } from "@/lib/validation";
import { parseAdRequestBody } from "@/lib/server/adRequestBody";
import { createAdRequest } from "@/services/server/ads";

/**
 * 광고 신청 (로그인 없음 — 광고주가 링크로 들어와 작성).
 * 남용 방지: IP별 시간당 5건, 전체 하루 200건, 숨은 입력칸(website) 채우면 버림.
 */
export const POST = route(async (req) => {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown";
  const ipKey = `ip_${createHash("sha256").update(ip).digest("hex").slice(0, 24)}`;
  const raw = await readJson(req);
  await Promise.all([rateLimit(ipKey, "ad_request", 5, 3600), rateLimit("global", "ad_request", 200, 86400)]);
  if (isRecord(raw) && typeof raw.website === "string" && raw.website) return { ok: true, id: null }; // 자동 입력 프로그램
  return createAdRequest(parseAdRequestBody(raw, { operator: false }));
});

export const maxDuration = 30;
