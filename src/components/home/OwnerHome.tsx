"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorState, LoadingState, NotificationBanner } from "@/components/common/States";
import { PushPrompt } from "@/components/common/PushPrompt";
import { CallCard } from "@/components/call/CallCard";
import { CallStatusCard } from "@/components/call/CallStatusCard";
import { DriverCard } from "@/components/driver/DriverCard";
import { useDriverLocation } from "@/components/driver/DriverLocationMap";
import { formatAgo, isStale } from "@/lib/locationShare";
import { useActiveCalls, useCallsBetween, useDrivers, useRecentCalls } from "@/hooks/useGroupData";
import { useReadySession } from "@/hooks/useSession";
import { toWhatsAppNumber } from "@/lib/format";
import { canCreateCall } from "@/lib/permissions";
import { formatTime, startOfDay } from "@/lib/time";
import type { DriverDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/** §4 OWNER HOME — 홈에서 1번의 추가 판단만으로 기사를 호출할 수 있어야 한다 */
export function OwnerHome() {
  const { me, groupId, tz, role, group } = useReadySession();
  const { t, locale } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const dayStart = startOfDay(now, tz);

  const drivers = useDrivers(groupId);
  const active = useActiveCalls(groupId);
  const today = useCallsBetween(groupId, dayStart, dayStart + 86400000);
  const recent = useRecentCalls(groupId, 5);
  const location = useDriverLocation(groupId, drivers.data[0]);

  if (drivers.loading) return <LoadingState full />;

  const driver: DriverDoc | undefined = drivers.data[0];
  const myActive = active.data;
  const driverActive = driver ? myActive.find((c) => c.driverId === driver.id) : undefined;
  const hasEverCalled = recent.data.length > 0;

  let blocker: "NO_DRIVER" | "NOT_CONNECTED" | "OFF_DUTY" | "BUSY" | null = null;
  if (!driver) blocker = "NO_DRIVER";
  else if (!driver.userId || driver.status === "INACTIVE") blocker = "NOT_CONNECTED";
  else if (driverActive) blocker = "BUSY";
  else if (driver.status === "OFF_DUTY") blocker = "OFF_DUTY";

  const todayCount = today.data.length;
  const workLabel =
    driver?.currentSessionId && driver.lastClockInAt ? `${formatTime(driver.lastClockInAt, tz)}~` : t("driverStatus.OFF_DUTY");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md space-y-5 px-4 pb-6 pt-3">
        <p className="text-xl font-bold text-ink">{t("home.greeting", { name: me.name })}</p>

        {drivers.error && <ErrorState title={drivers.error} onRetry={() => window.location.reload()} />}

        {/* 온보딩 체크리스트 — 첫 호출까지 안내 (§20) */}
        {(blocker === "NOT_CONNECTED" || blocker === "NO_DRIVER" || !hasEverCalled) && role === "OWNER" && (
          <div className="card p-4">
            <p className="text-sm font-semibold text-ink">{t("home.gettingStarted")}</p>
            <ol className="mt-3 space-y-2 text-[15px]">
              <li className="flex items-center gap-2">
                <span className="text-success">✓</span> {t("home.stepGroup", { group: group.name })}
              </li>
              <li className="flex items-center gap-2">
                <span className={blocker === "NOT_CONNECTED" || blocker === "NO_DRIVER" ? "text-ink-faint" : "text-success"}>
                  {blocker === "NOT_CONNECTED" || blocker === "NO_DRIVER" ? "○" : "✓"}
                </span>
                {t("home.stepDriver")}
                {(blocker === "NOT_CONNECTED" || blocker === "NO_DRIVER") && (
                  <Link href={driver ? `/drivers/${driver.id}` : "/drivers"} className="ml-auto text-sm font-semibold text-action">
                    {t("home.invite")} ›
                  </Link>
                )}
              </li>
              <li className="flex items-center gap-2">
                <span className={hasEverCalled ? "text-success" : "text-ink-faint"}>{hasEverCalled ? "✓" : "○"}</span> {t("home.stepFirstCall")}
              </li>
            </ol>
          </div>
        )}

        {/* 진행 중 호출 */}
        {myActive.map((c) => (
          <CallStatusCard key={c.id} call={c} viewer="owner" />
        ))}

        {/* 기사 상태 */}
        {!driver ? (
          <EmptyState
            title={t("home.noDriverTitle")}
            description={t("home.noDriverDesc")}
            action={
              role === "OWNER" ? (
                <Link href="/drivers" className="block">
                  <Button block>{t("home.inviteDriver")}</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            <DriverCard driver={driver} tz={tz} size="lg" href={`/drivers/${driver.id}`} />
            {driver.currentSessionId && (
              <Link
                href={`/drivers/${driver.id}`}
                className="card flex min-h-[52px] items-center gap-3 px-4 text-[15px] active:bg-bg"
              >
                <span aria-hidden>📍</span>
                <span className="flex-1 font-semibold text-ink">{t("home.driverLocation")}</span>
                <span
                  className={`text-sm ${
                    location.data && isStale(location.data.updatedAt, now) ? "text-warning-text" : "text-ink-sub"
                  }`}
                >
                  {!driver.locationSharing
                    ? t("home.sharingOff")
                    : location.data
                      ? formatAgo(location.data.updatedAt, now, locale)
                      : t("home.locating")}
                </span>
                <span className="text-ink-faint" aria-hidden>
                  ›
                </span>
              </Link>
            )}
          </div>
        )}

        {/* 핵심 CTA */}
        {driver && canCreateCall(role) && (
          <div className="space-y-3">
            {blocker === "NOT_CONNECTED" && (
              <NotificationBanner tone="info">
                {t("home.waitForLink")}
              </NotificationBanner>
            )}
            {blocker === "OFF_DUTY" && (
              <NotificationBanner
                tone="warning"
                action={
                  driver.phone ? (
                    <a
                      href={`https://wa.me/${toWhatsAppNumber(driver.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="whitespace-nowrap rounded-btn bg-surface px-3 py-2 text-sm font-semibold text-ink"
                    >
                      {t("home.contactDriver")}
                    </a>
                  ) : undefined
                }
              >
                {t("err.driverOffDuty")}
              </NotificationBanner>
            )}
            {blocker === "BUSY" && (
              <NotificationBanner tone="info">{t("home.busyNote")}</NotificationBanner>
            )}
            <Link
              href="/call/new"
              aria-disabled={blocker !== null}
              onClick={(e) => blocker !== null && e.preventDefault()}
              className={`flex min-h-[72px] w-full items-center justify-center gap-3 rounded-card text-xl font-extrabold text-white transition-transform active:scale-[0.98] ${
                blocker === null ? "bg-action shadow-modal" : "pointer-events-none bg-action/35"
              }`}
            >
              <span aria-hidden>🚗</span> {t("home.callDriver")}
            </Link>
          </div>
        )}

        {/* 오늘 요약 */}
        {driver && (
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="text-sm text-ink-sub">{t("home.todayCalls")}</p>
              <p className="mt-1 text-2xl font-bold text-ink">{todayCount}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-ink-sub">{t("home.workHours")}</p>
              <p className="mt-1 text-2xl font-bold text-ink">{workLabel}</p>
            </div>
          </div>
        )}

        {/* 최근 호출 */}
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-ink-sub">{t("home.recentCalls")}</h2>
            {recent.data.length > 0 && (
              <Link href="/history" className="text-sm font-semibold text-action">
                {t("common.all")} ›
              </Link>
            )}
          </div>
          {recent.data.length === 0 ? (
            <p className="card px-4 py-6 text-center text-sm text-ink-sub">{t("home.noCalls")}</p>
          ) : (
            <div className="card divide-y divide-line overflow-hidden">
              {recent.data.map((c) => (
                <CallCard key={c.id} call={c} tz={tz} />
              ))}
            </div>
          )}
        </section>

        <PushPrompt groupId={groupId} />
      </main>
    </>
  );
}
