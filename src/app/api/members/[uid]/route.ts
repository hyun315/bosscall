import { requireMember, requireUser } from "@/lib/server/auth";
import { routeWithParams } from "@/lib/server/http";
import { requireId } from "@/lib/validation";
import { removeMember } from "@/services/server/groups";

/** 구성원 삭제 / 기사 연결 해제 — Owner 전용. DELETE /api/members/{uid}?groupId= */
export const DELETE = routeWithParams<{ uid: string }>(async (req, params) => {
  const user = await requireUser(req);
  const groupId = requireId(new URL(req.url).searchParams.get("groupId"), "field.group");
  await requireMember(groupId, user.uid, ["OWNER"]);
  await removeMember(groupId, requireId(params.uid, "field.member"), user.uid);
  return { ok: true };
});
