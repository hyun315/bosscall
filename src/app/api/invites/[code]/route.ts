import { requireUser } from "@/lib/server/auth";
import { routeWithParams } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId } from "@/lib/validation";
import { acceptInvite, previewInvite } from "@/services/server/groups";

/** 초대 미리보기 (로그인 필요 — 그룹명이 외부에 노출되지 않도록) */
export const GET = routeWithParams<{ code: string }>(async (req, params) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "invite_preview", 30, 60);
  return previewInvite(requireId(params.code, "field.inviteCode"), user.uid);
});

/** 초대 수락 */
export const POST = routeWithParams<{ code: string }>(async (req, params) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "invite_accept", 10, 60);
  return acceptInvite(requireId(params.code, "field.inviteCode"), user.uid);
});
