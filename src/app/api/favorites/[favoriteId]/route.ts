import { requireMember, requireUser } from "@/lib/server/auth";
import { routeWithParams } from "@/lib/server/http";
import { requireId } from "@/lib/validation";
import { deleteFavorite } from "@/services/server/favorites";

/** DELETE /api/favorites/{id}?groupId= */
export const DELETE = routeWithParams<{ favoriteId: string }>(async (req, params) => {
  const user = await requireUser(req);
  const groupId = requireId(new URL(req.url).searchParams.get("groupId"), "field.group");
  const { member } = await requireMember(groupId, user.uid, ["OWNER", "MEMBER"]);
  await deleteFavorite(groupId, requireId(params.favoriteId, "field.favorite"), member);
  return { ok: true };
});
