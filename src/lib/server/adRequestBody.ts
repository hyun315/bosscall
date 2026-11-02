import "server-only";
import { ApiError } from "@/lib/server/http";
import { isRecord } from "@/lib/validation";
import { AD_INDUSTRIES, AD_MONTHS, AD_PRODUCTS, type AdMonths } from "@/lib/ads";
import { parseAdPlace, type AdRequestInput } from "@/services/server/ads";

const req400 = (field: string) => new ApiError(400, "BAD_REQUEST", "val.required", { field });
const fmt400 = (field: string) => new ApiError(400, "BAD_REQUEST", "val.format", { field });

function text(v: unknown, field: string, max: number, required = true): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) {
    if (required) throw req400(field);
    return null;
  }
  if (s.length > max) throw new ApiError(400, "BAD_REQUEST", "val.tooLong", { field, max });
  return s;
}

/**
 * 광고 신청서 본문 검사 — 광고주 신청과 운영자 직접 올리기가 같이 쓴다.
 * 운영자는 연락처(담당자·WhatsApp/카카오톡·이메일)를 비워도 되고, 지난 날짜로도 시작할 수 있다.
 */
export function parseAdRequestBody(raw: unknown, opts: { operator: boolean }): AdRequestInput {
  if (!isRecord(raw)) throw fmt400("요청");
  const op = opts.operator;

  const email = text(raw.email, "이메일", 120, !op) ?? "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fmt400("이메일");
  const whatsapp = text(raw.whatsapp, "왓츠앱 번호", 30, false);
  if (whatsapp && !/^\+?[0-9 -]{7,20}$/.test(whatsapp)) throw fmt400("왓츠앱 번호");
  const kakaoId = text(raw.kakaoId, "카카오톡 ID", 40, false);
  if (!op && !whatsapp && !kakaoId) throw req400("왓츠앱 번호 또는 카카오톡 ID");
  const linkUrl = text(raw.linkUrl, "연결 링크", 500, false);
  if (linkUrl && !/^https:\/\/[^\s]+$/.test(linkUrl)) throw fmt400("연결 링크 (https:// 로 시작)");

  const industry = AD_INDUSTRIES.find((x) => x === raw.industry);
  if (!industry) throw req400("업종");
  const product = AD_PRODUCTS.find((x) => x === raw.product);
  if (!product) throw req400("광고 상품");
  const months = AD_MONTHS.find((x) => x === raw.months) as AdMonths | undefined;
  if (!months) throw req400("기간");
  const startDate = text(raw.startDate, "시작일", 10)!;
  const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || (!op && startDate < today)) throw fmt400("시작일");
  if (typeof raw.bannerImage !== "string" || !raw.bannerImage) throw req400("배너 이미지");
  if (typeof raw.detailImage !== "string" || !raw.detailImage) throw req400("상세 이미지");

  return {
    company: text(raw.company, "업체명", 60)!,
    contactName: text(raw.contactName, "담당자", 40, !op) ?? "",
    whatsapp,
    kakaoId,
    email,
    industry,
    linkUrl,
    place: parseAdPlace(raw.place),
    product,
    startDate,
    months,
    bannerDataUrl: raw.bannerImage,
    detailDataUrl: raw.detailImage,
  };
}
