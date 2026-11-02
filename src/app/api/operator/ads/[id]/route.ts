import { requireOperator } from "@/lib/server/auth";
import { ApiError, readJson, routeWithParams } from "@/lib/server/http";
import { requireId, requireRecord } from "@/lib/validation";
import { AD_MONTHS } from "@/lib/ads";
import { approveAdRequest, endCampaign, getAdRequestWithImages, parseAdPlace, rejectAdRequest, setAdPlace } from "@/services/server/ads";

/** 신청서 한 건 (이미지 포함) */
export const GET = routeWithParams<{ id: string }>(async (req, params) => {
  await requireOperator(req);
  return getAdRequestWithImages(requireId(params.id, "field.request"));
});

/** 승인 / 반려 / 위치 설정 / 게재 중단 — id 는 신청 id (위치·중단은 campaign id) */
export const POST = routeWithParams<{ id: string }>(async (req, params) => {
  const [user, raw] = await Promise.all([requireOperator(req), readJson(req)]);
  const body = requireRecord(raw);
  const id = requireId(params.id, "field.request");
  const who = user.email ?? user.uid;
  switch (body.action) {
    case "approve": {
      const startDate = typeof body.startDate === "string" ? body.startDate : undefined;
      const months = AD_MONTHS.find((m) => m === body.months);
      return approveAdRequest(id, who, { startDate, months });
    }
    case "reject": {
      const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : "";
      if (!reason) throw new ApiError(400, "BAD_REQUEST", "val.required", { field: "반려 사유" });
      await rejectAdRequest(id, who, reason);
      return { ok: true };
    }
    case "place":
      await setAdPlace(id, parseAdPlace(body.place));
      return { ok: true };
    case "end":
      await endCampaign(id);
      return { ok: true };
    default:
      throw new ApiError(400, "BAD_REQUEST", "val.invalid", { field: "action" });
  }
});
