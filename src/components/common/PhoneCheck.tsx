"use client";
/**
 * 휴대폰 점검 — 알림이 안 울릴 때 이 기기 상태를 한눈에 (홈 화면 앱으로 열었나 / iOS 버전 / 알림 권한 /
 * 서비스워커 / 푸시 구독). 빨간 줄이 원인이다. 캡처해서 보내면 바로 원인을 알 수 있게.
 */
import { useEffect, useState } from "react";
import { installPlatform, isStandaloneApp } from "@/services/client/install";
import { useI18n } from "@/i18n/client";
import { IconHeartbeat } from "@/components/brand/Icons";

type Row = { key: string; ok: boolean | null; value: string };

function iosVersion(): number | null {
  const m = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  return m ? Number(m[1]) + Number(m[2]) / 100 : null;
}

export function PhoneCheck() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const ios = installPlatform() === "ios";
      const out: Row[] = [];
      const standalone = isStandaloneApp();
      out.push({ key: "pcheck.standalone", ok: standalone, value: standalone ? "✓" : t("pcheck.notStandalone") });
      if (ios) {
        const v = iosVersion();
        out.push({ key: "pcheck.ios", ok: v === null ? null : v >= 16.4, value: v === null ? "?" : v.toFixed(2).replace(/\.?0+$/, "") });
      }
      const perm = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
      out.push({ key: "pcheck.permission", ok: perm === "granted", value: perm });
      let swOk = false;
      let subOk = false;
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        swOk = !!reg?.active;
        subOk = !!(await reg?.pushManager?.getSubscription());
      } catch {
        /* 미지원 */
      }
      out.push({ key: "pcheck.sw", ok: swOk, value: swOk ? "✓" : "✗" });
      out.push({ key: "pcheck.sub", ok: subOk, value: subOk ? "✓" : "✗" });
      if (alive) setRows(out);
    })();
    return () => {
      alive = false;
    };
  }, [t]);

  if (!rows) return null;
  const bad = rows.some((r) => r.ok === false);
  return (
    <div className="rounded-btn bg-bg p-3 text-sm ring-1 ring-line">
      <p className="flex items-center gap-2 font-bold text-ink"><IconHeartbeat className="h-5 w-5 text-link" />{t("pcheck.title")}</p>
      <ul className="mt-2 space-y-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-2">
            <span className="text-ink-sub">{t(r.key as "pcheck.title")}</span>
            <span className={`font-bold ${r.ok === false ? "text-danger" : r.ok ? "text-success" : "text-ink-sub"}`}>
              {r.ok === false ? "✗ " : r.ok ? "" : ""}
              {r.value}
            </span>
          </li>
        ))}
      </ul>
      <p className={`mt-2 text-xs leading-relaxed ${bad ? "text-danger" : "text-ink-sub"}`}>{bad ? t("pcheck.bad") : t("pcheck.good")}</p>
    </div>
  );
}
