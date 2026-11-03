"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { LoadingState } from "@/components/common/States";
import { ConsentSheet } from "@/components/privacy/ConsentSheet";
import { CancelAlert } from "@/components/driver/CancelAlert";
import { useLiveQuery, w } from "@/hooks/useLive";
import type { CallDoc } from "@/types/domain";
import { useDriverLocationSharing } from "@/hooks/useDriverLocationSharing";
import { useDriverAlarm } from "@/hooks/useCallAlarm";
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
  // 휴대폰에 저장된 지난 화면에서 이미 끝난 호출로 이동하지 않도록 응답 시간이 남은 호출만
  const incomingId =
    active.data.find((c) => c.driverId === driverId && c.status === "CALLING" && c.expiresAt > Date.now())?.id ?? null;
  // 기사 알람: 응답 대기 호출은 수락·거절할 때까지, 취소·놓친 호출은 [확인]할 때까지 계속 울린다.
  // 앱이 뒤에 있거나 닫혀 있으면 서버가 5초마다 휴대폰 알림을 보낸다 (driverAlerts).
  const cancelAlerts = useLiveQuery<CallDoc>(
    isDriver && driverId ? `groups/${session.groupId}/calls` : null,
    [w("cancelAlertFor", "==", driverId)],
  ).data;
  useDriverAlarm({
    enabled: isDriver,
    groupId: session.groupId,
    driverId,
    calls: active.data,
    alerts: cancelAlerts,
  });

  useEffect(() => {
    if (!incomingId) return;
    if (pathname === `/calls/${incomingId}`) return;
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
      {isDriver && session.groupId && <CancelAlert groupId={session.groupId} alerts={cancelAlerts} />}
    </div>
  );
}
