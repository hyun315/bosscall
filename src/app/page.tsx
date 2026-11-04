"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { Logo } from "@/components/brand/Logo";

/** S01 Splash — 인증 상태 확인 후 2초 이내 이동 */
export default function SplashPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    router.replace(status === "signed-out" ? "/login" : status === "no-group" ? "/onboarding" : "/home");
  }, [status, router]);

  // 인증 확인이 늦어지면(오프라인 등) 로그인 화면으로
  useEffect(() => {
    const t = setTimeout(() => {
      if (status === "loading") router.replace("/login");
    }, 4000);
    return () => clearTimeout(t);
  }, [status, router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 text-center">
      <h1>
        <Logo variant="vertical" className="h-36 w-auto" />
      </h1>
      <p className="mt-6 text-[15px] font-medium text-ink-sub">Your Family. Your Driver. Your Peace of Mind.</p>
    </main>
  );
}
