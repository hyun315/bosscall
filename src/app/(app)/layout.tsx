"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { LoadingState } from "@/components/common/States";
import { ConsentSheet } from "@/components/privacy/ConsentSheet";
import { useDriverLocationSharing } from "@/hooks/useDriverLocationSharing";
import { useActiveCalls } from "@/hooks/useGroupData";
import { useSession } from "@/hooks/useSession";
import { refreshPushTokenSilently } from "@/services/client/push";

/**
 * 로그인·그룹 소속 확인 가드 + 하단 탭.
 * 기사 계정은 새 호출이 들어오면 앱이 열려 있는 한 호출 화면을 자동으로 띄운다 (§6 D02).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (session.status === "signed-out") {
      router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
    } else if (session.status === "no-group") {
      router.replace("/onboarding");
    }
  }, [session.status, pathname, router]);

  useEffect(() => {
    if (session.status === "ready") void refreshPushTokenSilently().catch(() => undefined);
  }, [session.status]);

  const isDriver = session.member?.role === "DRIVER";
  const driverId = session.member?.driverId ?? null;
  const active = useActiveCalls(isDriver ? session.groupId : null);
  // 근무 중 위치 공유 (기사 본인이 켠 경우에만)
  useDriverLocationSharing(isDriver ? session.groupId : null, isDriver ? driverId : null);
  const incomingId = active.data.find((c) => c.driverId === driverId && c.status === "CALLING")?.id ?? null;

  useEffect(() => {
    if (!incomingId) return;
    if (pathname === `/calls/${incomingId}`) return;
    try {
      navigator.vibrate?.([300, 150, 300, 150, 600]);
    } catch {
      /* 미지원 */
    }
    router.push(`/calls/${incomingId}`);
  }, [incomingId, pathname, router]);

  if (session.status !== "ready" || !session.member) return <LoadingState full />;

  const hideNav = pathname.startsWith("/call/") || pathname.startsWith("/calls/");
  return (
    <div className={`min-h-dvh ${hideNav ? "" : "pb-[calc(72px+var(--safe-bottom))]"}`}>
      {children}
      {!hideNav && <BottomNavigation role={session.member.role} />}
      {/* 선택 동의는 호출하는 쪽(사장님·가족)에게만 묻는다 */}
      {!isDriver && session.me && <ConsentSheet me={session.me} />}
    </div>
  );
}
