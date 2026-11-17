"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import { safeNext, useSearchParam } from "@/hooks/useSearchParam";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/i18n/client";
import { LanguagePicker } from "@/components/common/LanguagePicker";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { IconAlarm, IconChevron, IconNavigate, IconWallet } from "@/components/brand/Icons";

/** S02 Login — MVP 인증: Google 로그인 */
export default function LoginPage() {
  const { status, signInWithGoogle } = useSession();
  const { t, locale } = useI18n();
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 [word-break:keep-all] pb-[calc(32px+var(--safe-bottom))] pt-[calc(40px+var(--safe-top))]">
      <div className="mb-7">
        <LanguagePicker variant="compact" />
      </div>
      <div className="flex-1">
        <h1 className="sr-only">BossCall</h1>
        <Logo className="h-10 w-auto" />
        {/* 처음 온 사람에게: 무엇을 하는 앱인지(제목) → 누구용인지 → 무엇을 얻는지(3줄) */}
        <p className="mt-6 text-[26px] font-bold leading-tight tracking-tight text-ink whitespace-pre-line [text-wrap:balance]">{t("login.headline")}</p>
        <p className="mt-2 text-[13px] font-semibold text-teal">{t("brand.slogan")}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-sub">{t("login.forWho")}</p>
        <ul className="mt-6 space-y-4">
          <Feature icon={<IconAlarm className="h-5 w-5" />} title={t("login.f1t")} desc={t("login.f1d")} />
          <Feature icon={<IconNavigate className="h-5 w-5" />} title={t("login.f2t")} desc={t("login.f2d")} />
          <Feature icon={<IconWallet className="h-5 w-5" />} title={t("login.f3t")} desc={t("login.f3d")} />
        </ul>
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
        {/* 로그인 없이 열리는 소개 — 한국어는 1장짜리 안내, 그 외 언어는 BossCall 소개 */}
        <Link
          href={locale === "ko" ? "/guide" : "/about"}
          className="flex min-h-[44px] items-center justify-center gap-1 text-[15px] font-semibold text-link"
        >
          {t("login.browse")}
          <IconChevron className="h-4 w-4" />
        </Link>
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

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action-soft text-link" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold text-ink">{title}</span>
        <span className="block text-sm text-ink-sub">{desc}</span>
      </span>
    </li>
  );
}
