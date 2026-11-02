"use client";
/**
 * 기사 홈 맨 위 "휴대폰 준비" — 한 번에 한 단계만, 큰 단추 하나.
 *  1) 홈 화면에 추가 (홈 화면 앱이어야 화면이 꺼져도 호출이 울린다)
 *  2) 알림 켜기
 *  3) 소리 테스트 (5초 뒤 알림 → 화면 끄고 확인 → [소리 났어요])
 * 다 끝나면 사라진다. 안드로이드 Chrome 은 홈 화면 앱이 아니어도 알림이 되지만, 같은 순서로 안내한다.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { InstallPrompt } from "@/components/common/InstallPrompt";
import { useToast } from "@/components/common/Toast";
import { TestPushResult } from "@/components/common/TestPushResult";
import { sendTestPush } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { isStandaloneApp, subscribeInstall } from "@/services/client/install";
import { enablePush, getPushState, type PushState } from "@/services/client/push";
import { useI18n } from "@/i18n/client";

const TESTED_KEY = "bosscall.soundTested";

export function DriverSetupCard({ groupId }: { groupId: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const [standalone, setStandalone] = useState<boolean | null>(null);
  const [push, setPush] = useState<PushState | null>(null);
  const [tested, setTested] = useState(true);
  const [testSent, setTestSent] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setStandalone(isStandaloneApp());
    sync();
    void getPushState().then(setPush);
    try {
      setTested(localStorage.getItem(TESTED_KEY) === "1");
    } catch {
      setTested(false);
    }
    return subscribeInstall(sync);
  }, []);

  if (standalone === null || push === null) return null;

  // 홈 화면 앱이 아니면 1단계 — 기존 설치 안내(아이폰 순서·안드로이드 Chrome 안내 포함)를 그대로 쓴다.
  // (브라우저에서 이미 알림을 켠 안드로이드는 넘어간다)
  const needInstall = !standalone && push !== "granted";
  const step = needInstall ? 1 : push !== "granted" ? 2 : !tested ? 3 : 0;
  if (step === 0) return null;

  const turnOn = async () => {
    setBusy(true);
    try {
      const s = await enablePush(groupId);
      setPush(s);
      if (s === "denied") toast(t("pushp.blockedToast"), "error");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      setSentAt(Date.now());
      const r = await sendTestPush();
      if (r.devices > 0) setTestSent(true);
      else toast(t("alarm.testNoDevice"), "error");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const done = () => {
    try {
      localStorage.setItem(TESTED_KEY, "1");
    } catch {
      /* 무시 */
    }
    setTested(true);
    toast(t("setup.allDone"), "success");
  };

  return (
    <section className="rounded-card border-2 border-action bg-action-soft p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold uppercase tracking-wide text-action">{t("setup.title")}</p>
        <p className="text-[13px] font-bold text-action">{step} / 3</p>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-action" : "bg-action/20"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="mt-3">
          <InstallPrompt variant="panel" emphasis groupId={groupId} />
        </div>
      )}

      {step === 2 && (
        <div className="mt-3 space-y-3">
          <p className="text-[18px] font-extrabold text-ink">🔔 {t("setup.pushTitle")}</p>
          <p className="text-[15px] leading-relaxed text-ink-sub">{t("setup.pushBody")}</p>
          {push === "default" ? (
            <Button variant="success" size="cta" block loading={busy} onClick={() => void turnOn()}>
              {t("setup.pushButton")}
            </Button>
          ) : (
            <p className="rounded-btn bg-danger-soft px-3 py-2.5 text-sm leading-relaxed text-danger">
              {push === "denied" ? t("pushp.denied") : push === "needs-install" ? t("pushp.needsInstall") : t("pushp.unsupported")}
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="mt-3 space-y-3">
          <p className="text-[18px] font-extrabold text-ink">🔊 {t("setup.testTitle")}</p>
          <p className="text-[15px] leading-relaxed text-ink-sub">{testSent ? t("setup.testWait") : t("setup.testBody")}</p>
          {!testSent ? (
            <Button variant="success" size="cta" block loading={busy} onClick={() => void test()}>
              {t("setup.testButton")}
            </Button>
          ) : (
            <>
            <TestPushResult sentAt={sentAt} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="lg" block onClick={() => setTestSent(false)}>
                {t("setup.testAgain")}
              </Button>
              <Button variant="success" size="lg" block onClick={done}>
                {t("setup.testHeard")}
              </Button>
            </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
