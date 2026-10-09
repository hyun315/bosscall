import { requireMember, requireUser } from "@/lib/server/auth";
import { appUrl, readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requireOneOf, requireRecord } from "@/lib/validation";
import { createInvite } from "@/services/server/groups";

/** 기사/가족 초대 링크 생성 — Owner 전용 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "invite_create", 20, 3600);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  await requireMember(groupId, user.uid, ["OWNER"]);
  const role = requireOneOf(body.role, ["DRIVER", "MEMBER"] as const, "field.inviteType");
  const invite = await createInvite(groupId, user.uid, {
    role,
    driverId: role === "DRIVER" ? requireId(body.driverId, "field.driver") : null,
  });
  return { code: invite.code, url: appUrl(`/invite/${invite.code}`), expiresAt: invite.expiresAt };
});
