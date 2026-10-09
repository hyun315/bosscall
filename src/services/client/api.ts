"use client";
import { clientAuth } from "@/lib/firebase/client";
import { translate } from "@/i18n/index";
import { getLocale } from "@/i18n/runtime";

export class ClientApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

/**
 * 서버 API 호출 — Firebase ID 토큰을 붙여 보낸다. 네트워크 오류는 code=NETWORK 로 통일.
 */
export async function api<T = unknown>(
  path: string,
  init: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<T> {
  const user = clientAuth().currentUser;
  if (!user) throw new ClientApiError(401, "UNAUTHENTICATED", translate(getLocale(), "err.unauthenticated"));
  const token = await user.getIdToken();
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: {
        Authorization: `Bearer ${token}`,
        "X-BossCall-Locale": getLocale(),
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ClientApiError(0, "NETWORK", translate(getLocale(), "err.network"));
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* 본문 없음 */
  }
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ClientApiError(res.status, err?.code ?? "UNKNOWN", err?.message ?? translate(getLocale(), "err.requestFailed"));
  }
  return data as T;
}

export function errorMessage(e: unknown): string {
  if (e instanceof ClientApiError) return e.message;
  if (e instanceof Error) return e.message;
  return translate(getLocale(), "err.unknown");
}

/** 분석 이벤트 — 실패해도 무시 */
export function trackClient(
  event: string,
  groupId: string | null,
  props: Record<string, string | number | boolean | null> = {},
): void {
  if (!clientAuth().currentUser) return;
  void api("/api/analytics", { body: { event, groupId, props } }).catch(() => undefined);
}
