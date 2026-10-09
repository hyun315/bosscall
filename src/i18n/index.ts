import type { Locale, Tri } from "@/i18n/core";
import { authMsgs } from "@/i18n/messages/auth";
import { callMsgs } from "@/i18n/messages/call";
import { commonMsgs } from "@/i18n/messages/common";
import { driverMsgs } from "@/i18n/messages/driver";
import { errorMsgs } from "@/i18n/messages/errors";
import { historyMsgs } from "@/i18n/messages/history";
import { homeMsgs } from "@/i18n/messages/home";
import { locationMsgs } from "@/i18n/messages/location";
import { payrollMsgs } from "@/i18n/messages/payroll";
import { privacyMsgs } from "@/i18n/messages/privacy";
import { pushMsgs } from "@/i18n/messages/push";
import { settingsMsgs } from "@/i18n/messages/settings";

export const NAMESPACES = {
  auth: authMsgs,
  call: callMsgs,
  common: commonMsgs,
  driver: driverMsgs,
  errors: errorMsgs,
  history: historyMsgs,
  home: homeMsgs,
  location: locationMsgs,
  payroll: payrollMsgs,
  privacy: privacyMsgs,
  push: pushMsgs,
  settings: settingsMsgs,
} as const;

export const MESSAGES = {
  ...authMsgs,
  ...callMsgs,
  ...commonMsgs,
  ...driverMsgs,
  ...errorMsgs,
  ...historyMsgs,
  ...homeMsgs,
  ...locationMsgs,
  ...payrollMsgs,
  ...privacyMsgs,
  ...pushMsgs,
  ...settingsMsgs,
} as const;

export type MsgKey = keyof typeof MESSAGES;
export type MsgParams = Record<string, string | number>;

const TABLE: Record<string, Tri> = MESSAGES;

export function isMsgKey(k: unknown): k is MsgKey {
  return typeof k === "string" && Object.prototype.hasOwnProperty.call(TABLE, k);
}

/**
 * 번역 — "{name}" 자리를 params 로 채운다.
 * params 값이 "@키" 형태면 그 키도 같은 언어로 번역해 넣는다 (예: 입력칸 이름).
 */
export function translate(locale: Locale, key: MsgKey | string, params?: MsgParams): string {
  const entry = TABLE[key];
  let s = entry ? entry[locale] : key;
  if (params) {
    s = s.replace(/\{(\w+)\}/g, (m, name: string) => {
      const v = params[name];
      if (v === undefined) return m;
      if (typeof v === "string" && v.startsWith("@") && TABLE[v.slice(1)]) return translate(locale, v.slice(1));
      return String(v);
    });
  }
  return s;
}
