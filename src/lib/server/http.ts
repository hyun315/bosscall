import "server-only";
import { NextResponse } from "next/server";
import { isLocale, pickLocale, type Locale } from "@/i18n/core";
import { translate, type MsgKey, type MsgParams } from "@/i18n/index";
import { ValidationError } from "@/lib/validation";

/**
 * API 오류 — 메시지는 번역 키로 담고, 응답을 만들 때 요청자의 언어로 번역한다.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly key: MsgKey,
    public readonly params?: MsgParams,
  ) {
    super(key);
    this.name = "ApiError";
  }
}

export const badRequest = (key: MsgKey, params?: MsgParams, code = "BAD_REQUEST") => new ApiError(400, code, key, params);
export const unauthorized = (key: MsgKey = "err.unauthenticated") => new ApiError(401, "UNAUTHENTICATED", key);
export const forbidden = (key: MsgKey = "err.forbidden", code = "FORBIDDEN") => new ApiError(403, code, key);
export const notFound = (key: MsgKey = "err.notFound") => new ApiError(404, "NOT_FOUND", key);
export const conflict = (key: MsgKey, code = "CONFLICT", params?: MsgParams) => new ApiError(409, code, key, params);
export const tooMany = () => new ApiError(429, "RATE_LIMITED", "err.tooMany");

/** 요청자의 언어: 앱이 보내는 X-BossCall-Locale > Accept-Language > 한국어 */
export function localeFromRequest(req: Request): Locale {
  const h = req.headers.get("x-bosscall-locale");
  if (isLocale(h)) return h;
  return pickLocale(req.headers.get("accept-language"), "ko");
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw badRequest("err.badJson");
  }
}

function toErrorResponse(e: unknown, locale: Locale): Response {
  if (e instanceof ApiError) {
    return NextResponse.json(
      { error: { code: e.code, message: translate(locale, e.key, e.params) } },
      { status: e.status },
    );
  }
  if (e instanceof ValidationError) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: translate(locale, e.key, e.params) } },
      { status: 400 },
    );
  }
  console.error("[api] unhandled", e);
  return NextResponse.json({ error: { code: "INTERNAL", message: translate(locale, "err.internal") } }, { status: 500 });
}

function ok(data: unknown): Response {
  return NextResponse.json(data ?? { ok: true }, { headers: { "Cache-Control": "no-store" } });
}

/** 정적 경로 API 라우트 래퍼 — 일관된 오류 응답 { error: { code, message } } */
export function route(handler: (req: Request) => Promise<unknown>) {
  return async (req: Request): Promise<Response> => {
    try {
      return ok(await handler(req));
    } catch (e) {
      return toErrorResponse(e, localeFromRequest(req));
    }
  };
}

/** 동적 경로([id]) API 라우트 래퍼 */
export function routeWithParams<P extends Record<string, string>>(
  handler: (req: Request, params: P) => Promise<unknown>,
) {
  return async (req: Request, ctx: { params: Promise<P> }): Promise<Response> => {
    try {
      return ok(await handler(req, await ctx.params));
    } catch (e) {
      return toErrorResponse(e, localeFromRequest(req));
    }
  };
}

export function appUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}${path}`;
}
