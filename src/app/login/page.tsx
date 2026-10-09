"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import { safeNext, useSearchParam } from "@/hooks/useSearchParam";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/i18n/client";
import { LanguagePicker } from "@/components/common/LanguagePicker";

/** S02 Login — MVP 인증: Google 로그인 */
export default function LoginPage() {
  const { status, signInWithGoogle } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const next = useSearchParam("next");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading" || status === "signed-out" || next === undefined) return;
    const target = safeNext(next);
    // 초대 링크로 들어온 경우 그룹이 없어도 초대 화면으로 보낸다
    if (status === "no-group" && !target.startsWith("/invite/")) router.replace("/onboarding");
    else router.replace(target);
  }, [status, next, router]);

  const login = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      setError(t("login.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-[calc(32px+var(--safe-bottom))] pt-[calc(64px+var(--safe-top))]">
      <div className="mb-8">
        <LanguagePicker variant="compact" />
      </div>
      <div className="flex-1">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-navy text-3xl" aria-hidden>
          🚗
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">BossCall</h1>
        <p className="mt-2 text-xl font-bold text-ink">{t("brand.tagline")}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-sub">
          {t("brand.desc1")}
          <br />
          {t("brand.desc2")}
        </p>
      </div>

      <div className="space-y-3">
        {error && <p className="text-center text-sm text-danger">{error}</p>}
        <Button
          variant="secondary"
          block
          loading={busy || status === "loading"}
          onClick={() => void login()}
          icon={<GoogleIcon />}
        >
          {t("login.google")}
        </Button>
        <p className="text-center text-xs leading-relaxed text-ink-faint">
          {t("login.driverHint")}
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 38.2 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
