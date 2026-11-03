import { requireUser } from "@/lib/server/auth";
import { localeFromRequest, readJson, route } from "@/lib/server/http";
import { isLocale } from "@/i18n/core";
import { optionalPhone, requireId, requireRecord, requireString, ValidationError } from "@/lib/validation";
import { upsertMe, updateMe, type MePatch } from "@/services/server/users";

/** 로그인 직후 사용자 문서 생성/갱신 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const me = await upsertMe(user, localeFromRequest(req));
  return { user: me };
});

export const PATCH = route(async (req) => {
  const user = await requireUser(req);
  const body = requireRecord(await readJson(req));
  const patch: MePatch = {};
  if (body.name !== undefined) patch.name = requireString(body.name, "field.name", { max: 40 });
  if (body.phone !== undefined) patch.phone = optionalPhone(body.phone);
  if (body.activeGroupId !== undefined) patch.activeGroupId = requireId(body.activeGroupId, "field.group");
  if (body.locale !== undefined) {
    if (!isLocale(body.locale)) throw new ValidationError("val.invalid", { field: "@field.locale" });
    patch.locale = body.locale;
  }
  if (body.consents !== undefined) {
    const c = requireRecord(body.consents, "field.consents");
    if (typeof c.analytics !== "boolean" || typeof c.marketing !== "boolean") {
      throw new ValidationError("val.invalid", { field: "@field.consents" });
    }
    patch.consents = { analytics: c.analytics, marketing: c.marketing };
  }
  if (body.notificationPrefs !== undefined) {
    const p = requireRecord(body.notificationPrefs, "field.notifSettings");
    patch.notificationPrefs = {};
    if (typeof p.callUpdates === "boolean") patch.notificationPrefs.callUpdates = p.callUpdates;
    if (typeof p.workEvents === "boolean") patch.notificationPrefs.workEvents = p.workEvents;
  }
  await updateMe(user.uid, patch);
  return { ok: true };
});
