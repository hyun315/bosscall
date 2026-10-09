/**
 * 입력 검증 — 서버 API에서 사용 (명세 §24 Input validation).
 * 오류는 번역 키로 던지고, 응답을 만들 때 요청자의 언어로 번역한다.
 */
import type { MsgKey, MsgParams } from "@/i18n/index";
import { COORD_SOURCES, PLACE_CATEGORIES, type ActualFix, type PlaceCategory, type PlaceInput } from "@/types/domain";

/** 입력칸 이름 키 (field.*) */
export type FieldKey = Extract<MsgKey, `field.${string}`>;

export class ValidationError extends Error {
  constructor(
    public readonly key: MsgKey,
    public readonly params?: MsgParams,
  ) {
    super(key);
    this.name = "ValidationError";
  }
}

const f = (field: FieldKey) => ({ field: `@${field}` });

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function requireRecord(v: unknown, label: FieldKey = "field.request"): Record<string, unknown> {
  if (!isRecord(v)) throw new ValidationError("val.format", f(label));
  return v;
}

export function requireString(
  v: unknown,
  label: FieldKey,
  opts: { min?: number; max?: number } = {},
): string {
  const min = opts.min ?? 1;
  const max = opts.max ?? 200;
  if (typeof v !== "string") throw new ValidationError("val.required", f(label));
  const s = v.trim();
  if (s.length < min) throw new ValidationError("val.required", f(label));
  if (s.length > max) throw new ValidationError("val.tooLong", { ...f(label), max });
  return s;
}

export function optionalString(v: unknown, label: FieldKey, max = 200): string | null {
  if (v === undefined || v === null || v === "") return null;
  return requireString(v, label, { min: 1, max });
}

export function requireId(v: unknown, label: FieldKey): string {
  const s = requireString(v, label, { min: 1, max: 128 });
  if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new ValidationError("val.format", f(label));
  return s;
}

export function requireOneOf<T extends string>(v: unknown, allowed: readonly T[], label: FieldKey): T {
  if (typeof v !== "string" || !(allowed as readonly string[]).includes(v)) {
    throw new ValidationError("val.invalid", f(label));
  }
  return v as T;
}

export function requireLat(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < -90 || v > 90) {
    throw new ValidationError("val.invalid", f("field.latitude"));
  }
  return v;
}

export function requireLng(v: unknown): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < -180 || v > 180) {
    throw new ValidationError("val.invalid", f("field.longitude"));
  }
  return v;
}

/** 전화번호: 숫자, +, 공백, -, 괄호만 허용. 저장 시 공백 제거 */
export function optionalPhone(v: unknown): string | null {
  const s = optionalString(v, "field.phone", 30);
  if (s === null) return null;
  if (!/^\+?[0-9\s\-()]{6,30}$/.test(s)) throw new ValidationError("val.phone");
  return s.replace(/[\s\-()]/g, "");
}

export function requirePlace(v: unknown, label: FieldKey): PlaceInput {
  const r = requireRecord(v, label);
  const placeId = optionalString(r.placeId, "field.placeId", 300);
  return {
    lat: requireLat(r.lat),
    lng: requireLng(r.lng),
    address: requireString(r.address, "field.address", { max: 300 }),
    name: optionalString(r.name, "field.placeLabel", 120),
    placeId,
    // 출처를 모르면 google 로 본다 (보수적 — 30일 뒤 좌표 삭제)
    source: r.source === undefined || r.source === null ? "google" : requireOneOf(r.source, COORD_SOURCES, "field.coordSource"),
    category: optionalCategory(r.category),
    fetchedAt: typeof r.fetchedAt === "number" && Number.isFinite(r.fetchedAt) ? r.fetchedAt : null,
  };
}

export function optionalCategory(v: unknown): PlaceCategory | null {
  if (v === undefined || v === null || v === "") return null;
  return requireOneOf(v, PLACE_CATEGORIES, "field.category");
}

/** 기사 기기 GPS 값 (없으면 null) — 품질 판단은 서버 서비스에서 */
export function optionalFix(v: unknown): ActualFix | null {
  if (v === undefined || v === null) return null;
  const r = requireRecord(v, "field.position");
  const accuracy = r.accuracy;
  const at = r.at;
  if (typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy <= 0) {
    throw new ValidationError("val.invalid", f("field.position"));
  }
  if (typeof at !== "number" || !Number.isFinite(at)) throw new ValidationError("val.invalid", f("field.position"));
  return { lat: requireLat(r.lat), lng: requireLng(r.lng), accuracy, at };
}

/** epoch ms, 2020-01-01 ~ 현재+1일 */
export function requireTimestamp(v: unknown, label: FieldKey, now: number): number {
  if (typeof v !== "number" || !Number.isInteger(v)) throw new ValidationError("val.invalid", f(label));
  if (v < Date.UTC(2020, 0, 1) || v > now + 24 * 3600 * 1000) {
    throw new ValidationError("val.outOfRange", f(label));
  }
  return v;
}

export const SUPPORTED_TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Seoul",
  "Asia/Singapore",
  "Asia/Ho_Chi_Minh",
] as const;
