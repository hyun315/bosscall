import { requireMember, requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { requireId, requireLat, requireLng, requireRecord, requireTimestamp, ValidationError } from "@/lib/validation";
import { setLocationSharing, updateDriverLocation } from "@/services/server/location";

/** 기사 최신 위치 전송 — 연결된 기사 본인, 근무 중 + 공유 켜짐일 때만 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await rateLimit(user.uid, "location", 8, 60); // 정책상 최대 3회/분, 여유 포함
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  const { member } = await requireMember(groupId, user.uid, ["DRIVER"]);
  const accuracy = body.accuracy;
  if (typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0) {
    throw new ValidationError("val.invalid", { field: "@field.accuracy" });
  }
  return updateDriverLocation(groupId, member, {
    lat: requireLat(body.lat),
    lng: requireLng(body.lng),
    accuracy,
    capturedAt: requireTimestamp(body.capturedAt, "field.capturedAt", Date.now()),
  });
});

/** 근무 중 위치 공유 켜기/끄기 — 기사 본인 */
export const PATCH = route(async (req) => {
  const user = await requireUser(req);
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  const { member } = await requireMember(groupId, user.uid, ["DRIVER"]);
  if (typeof body.enabled !== "boolean") throw new ValidationError("val.invalid", { field: "@field.setting" });
  await setLocationSharing(groupId, member, body.enabled);
  return { ok: true };
});
