import { requireOperator } from "@/lib/server/auth";
import { route } from "@/lib/server/http";
import { listAdRequests } from "@/services/server/ads";

/** 광고 신청 목록 + 게재 중·예정 광고 */
export const GET = route(async (req) => {
  await requireOperator(req);
  return listAdRequests();
});
