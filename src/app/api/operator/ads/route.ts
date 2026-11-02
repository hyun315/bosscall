import { requireOperator } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { AD_RANKS } from "@/lib/ads";
import { parseAdRequestBody } from "@/lib/server/adRequestBody";
import { createAdByOperator, listAdRequests } from "@/services/server/ads";

/** 광고 신청 목록 + 게재 중·예정·최근 종료 광고 */
export const GET = route(async (req) => {
  await requireOperator(req);
  return listAdRequests();
});

/** 운영자가 광고를 처음부터 직접 올린다 — 신청서와 같은 내용 + 상품·자리 번호, 바로 승인 */
export const POST = route(async (req) => {
  const [user, raw] = await Promise.all([requireOperator(req), readJson(req)]);
  const input = parseAdRequestBody(raw, { operator: true });
  const rank = AD_RANKS.find((r) => r === (raw as { rank?: unknown }).rank) ?? 5;
  return createAdByOperator(input, rank, user.email ?? user.uid);
});

export const maxDuration = 30;
