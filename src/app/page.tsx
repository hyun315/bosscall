"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-navy px-6 text-center text-white">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/10 text-4xl" aria-hidden>
        🚗
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">BossCall</h1>
      <p className="mt-3 text-base text-white/70">Your driver, one tap away.</p>
    </main>
  );
}
