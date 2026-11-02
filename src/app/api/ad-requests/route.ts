import { createHash } from "node:crypto";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { isRecord } from "@/lib/validation";
import { parseAdRequestBody } from "@/lib/server/adRequestBody";
import { createAdRequest } from "@/services/server/ads";
import { operatorUids } from "@/lib/server/auth";
import { runAfterResponse } from "@/lib/server/defer";
import { notifyUsers } from "@/lib/server/push";

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
  const input = parseAdRequestBody(raw, { operator: false });
  const result = await createAdRequest(input);
  // 운영자에게 알림 (휴대폰 푸시 + 알림함) — 응답 뒤에
  await runAfterResponse(async () => {
    const uids = await operatorUids();
    if (uids.length === 0) return;
    await notifyUsers(uids, {
      type: "AD_REQUEST",
      groupId: "",
      callId: null,
      titleKey: "push.adRequest.title",
      bodyKey: "push.adRequest.body",
      params: { company: input.company, industry: input.industry },
      path: "/operator",
    });
  });
  return result;
});

export const maxDuration = 30;
