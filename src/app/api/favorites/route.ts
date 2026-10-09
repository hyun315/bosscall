import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requirePlace, requireRecord, requireString } from "@/lib/validation";
import { createFavorite } from "@/services/server/favorites";

export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "favorite_create", 20, 60);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  const { member } = await requireMember(groupId, user.uid, ["OWNER", "MEMBER"]);
  const id = await createFavorite(groupId, member, {
    name: requireString(body.name, "field.placeLabel", { max: 30 }),
    place: requirePlace(body.place, "field.place"),
  });
  return { id };
});
