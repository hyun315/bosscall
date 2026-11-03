"use client";
/**
 * 알림 테스트 결과 — 서버가 실제로 보냈는지 / 애플·구글이 거절했는지 / 무음으로 보냈는지를 보여주고,
 * "보냈는데 소리가 안 났다"면 휴대폰 설정 점검 순서를 기기별로 안내한다.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { useReadySession } from "@/hooks/useSession";
import { installPlatform } from "@/services/client/install";
import { enablePush } from "@/services/client/push";
import { useI18n } from "@/i18n/client";
import { PhoneCheck } from "@/components/common/PhoneCheck";

export function TestPushResult({ sentAt }: { sentAt: number | null }) {
  if (!sentAt) return null;
  return (
    <div className="space-y-2">
      <ResultLine sentAt={sentAt} />
      <PhoneCheck />
    </div>
  );
}

function ResultLine({ sentAt }: { sentAt: number }) {
  const { me, groupId } = useReadySession();
  const { t } = useI18n();
  const [fixing, setFixing] = useState(false);
  const [late, setLate] = useState(false);
  useEffect(() => {
    setLate(false);
    const id = setTimeout(() => setLate(true), 25_000);
    return () => clearTimeout(id);
  }, [sentAt]);
  const r = me.lastTestPush;
  const fresh = r && r.at >= sentAt;
  const apple = installPlatform() === "ios";

  const reRegister = async () => {
    setFixing(true);
    try {
      await enablePush(groupId);
    } finally {
      setFixing(false);
    }
  };

  if (!fresh) {
    if (late) return <p className="rounded-btn bg-warning-soft px-3 py-2.5 text-sm text-warning-text">⚠️ {t("ptest.noResult")}</p>;
    return <p className="rounded-btn bg-bg px-3 py-2.5 text-sm text-ink-sub">⏳ {t("ptest.waiting")}</p>;
  }
  if (r.tokens === 0 || r.success === 0) {
    return (
      <div className="space-y-2 rounded-btn bg-danger-soft px-3 py-3 text-sm leading-relaxed text-danger">
        <p className="font-bold">✗ {r.tokens === 0 ? t("ptest.noDevice") : t("ptest.failed")}</p>
        {r.errors.length > 0 && <p className="text-xs opacity-80">{t(errorKey(r.errors[0] ?? ""))}</p>}
        <Button size="sm" loading={fixing} onClick={() => void reRegister()}>
          {t("ptest.reRegister")}
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-btn bg-success-soft px-3 py-3 text-sm leading-relaxed text-ink">
      <p className="font-bold text-success">✓ {t("ptest.sent", { ok: r.success, all: r.tokens })}</p>
      <p>{t("ptest.ifNoSound")}</p>
      <ol className="list-decimal space-y-1 pl-5">
        {(apple ? (["ptest.ios1", "ptest.ios2", "ptest.ios3"] as const) : (["ptest.and1", "ptest.and2", "ptest.and3"] as const)).map((k) => (
          <li key={k}>{t(k)}</li>
        ))}
      </ol>
    </div>
  );
}

function errorKey(code: string) {
  if (code.includes("not-registered") || code.includes("invalid-registration")) return "ptest.errExpired" as const;
  if (code.includes("third-party-auth") || code.includes("mismatched")) return "ptest.errAuth" as const;
  if (code.includes("quota") || code.includes("unavailable") || code.includes("internal")) return "ptest.errServer" as const;
  return "ptest.errOther" as const;
}
