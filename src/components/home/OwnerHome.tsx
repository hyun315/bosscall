"use client";
import Link from "next/link";
import { InstallPrompt } from "@/components/common/InstallPrompt";
import { OwnerClockButton } from "@/components/driver/OwnerClockButton";
import { AdSlot } from "@/components/ads/AdSlot";
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
import { DRIVER_STATUS_LABEL, toWhatsAppNumber } from "@/lib/format";
import { canCreateCall, mainDriverOf } from "@/lib/permissions";
import { useToast } from "@/components/common/Toast";
import { requestClockIn, updateGroup } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { formatTime, startOfDay } from "@/lib/time";
import type { DriverDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import { IconAlarm, IconCar, IconPin } from "@/components/brand/Icons";

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
  // 기사가 여러 명이면 메인 기사만 보여 주고, 다른 기사는 [다른 기사 N명]을 눌렀을 때만
  const [viewId, setViewId] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const main = mainDriverOf(drivers.data, group.mainDriverId);
  const driver: DriverDoc | undefined = drivers.data.find((d) => d.id === viewId) ?? main;
  const others = drivers.data.filter((d) => d.id !== driver?.id);
  const location = useDriverLocation(groupId, driver);
  const [savingMain, setSavingMain] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const toast = useToast();

  if (drivers.loading) return <LoadingState full />;

  const makeMain = async () => {
    if (!driver) return;
    setSavingMain(true);
    try {
      await updateGroup(groupId, { mainDriverId: driver.id });
      setViewId(null);
      toast(t("home.mainSet", { name: driver.displayName }), "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSavingMain(false);
    }
  };
  const myActive = active.data;
  const driverActive = driver ? myActive.find((c) => c.driverId === driver.id) : undefined;
  const hasEverCalled = recent.data.length > 0;

  let blocker: "NO_DRIVER" | "NOT_CONNECTED" | "OFF_DUTY" | "BUSY" | null = null;
  if (!driver) blocker = "NO_DRIVER";
  else if (!driver.userId || driver.status === "INACTIVE") blocker = "NOT_CONNECTED";
  else if (driverActive) blocker = "BUSY";
  else if (driver.status === "OFF_DUTY") blocker = "OFF_DUTY";

  const todayCount = today.data.length;
  // 오늘 이 기사가 놓친 호출 (응답 시간 초과)
  const missedToday = driver ? today.data.filter((c) => c.driverId === driver.id && c.status === "TIMEOUT").length : 0;
  const askClockIn = async () => {
    if (!driver) return;
    setRequesting(true);
    try {
      await requestClockIn(groupId, driver.id);
      toast(t("home.clockInRequested", { name: driver.displayName }), "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setRequesting(false);
    }
  };
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
                  <Link href={driver ? `/drivers/${driver.id}` : "/drivers"} className="ml-auto text-sm font-semibold text-link">
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
            {others.length > 0 && (
              <div className="px-1">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOthers((v) => !v)}
                    className="min-h-[40px] text-sm font-semibold text-link"
                    aria-expanded={showOthers}
                  >
                    {t("home.otherDrivers", { n: others.length })} {showOthers ? "▲" : "▼"}
                  </button>
                  {driver.id !== main?.id && role === "OWNER" && (
                    <button
                      type="button"
                      disabled={savingMain}
                      onClick={() => void makeMain()}
                      className="min-h-[40px] text-sm font-semibold text-ink-sub"
                    >
                      ★ {t("home.makeMain")}
                    </button>
                  )}
                </div>
                {showOthers && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {others.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setViewId(d.id);
                          setShowOthers(false);
                        }}
                        className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink"
                      >
                        {d.id === main?.id ? "★ " : ""}
                        {d.displayName}
                        <span className="ml-1 text-xs font-normal text-ink-sub">· {t(DRIVER_STATUS_LABEL[d.status].key)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* 관리자: 기사가 출근을 깜빡했을 때 대신 처리 (퇴근은 기사 상세 화면에서) */}
            {!driver.currentSessionId && <OwnerClockButton driver={driver} compact />}
            {driver.currentSessionId && (
              <Link
                href={`/drivers/${driver.id}`}
                className="card flex min-h-[52px] items-center gap-3 px-4 text-[15px] active:bg-bg"
              >
                <IconPin className="h-5 w-5 text-link" />
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
              <NotificationBanner tone="warning">
                <span className="block">{t("err.driverOffDuty")}</span>
                <span className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={requesting}
                    onClick={() => void askClockIn()}
                    className="min-h-[40px] whitespace-nowrap rounded-btn bg-action px-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    <IconAlarm className="mr-1 inline h-4 w-4 align-[-3px]" />{t("home.requestClockIn")}
                  </button>
                  {driver.phone && (
                    <a
                      href={`https://wa.me/${toWhatsAppNumber(driver.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-[40px] items-center whitespace-nowrap rounded-btn bg-surface px-3 text-sm font-semibold text-ink"
                    >
                      {t("home.contactDriver")}
                    </a>
                  )}
                </span>
              </NotificationBanner>
            )}
            {blocker === "BUSY" && (
              <NotificationBanner tone="info">{t("home.busyNote")}</NotificationBanner>
            )}
            <Link
              href={driver.id === main?.id ? "/call/new" : `/call/new?driver=${driver.id}`}
              aria-disabled={blocker !== null}
              onClick={(e) => blocker !== null && e.preventDefault()}
              className={`flex min-h-[72px] w-full items-center justify-center gap-3 rounded-card text-xl font-extrabold text-white transition-transform active:scale-[0.98] ${
                blocker === null ? "bg-action shadow-modal" : "pointer-events-none bg-action/35"
              }`}
            >
              <IconCar className="h-7 w-7" /> {t("home.callDriver")}
            </Link>
          </div>
        )}

        {/* 오늘 놓친 호출 */}
        {driver && missedToday > 0 && (
          <Link href="/history" className="block">
            <NotificationBanner tone="warning">
              <IconAlarm className="mr-1.5 inline h-4 w-4 align-[-3px]" />{t("home.missedToday", { name: driver.displayName, n: missedToday })} ›
            </NotificationBanner>
          </Link>
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

        <InstallPrompt groupId={groupId} />
        <PushPrompt groupId={groupId} />

        {/* 광고: 오늘 요약 아래, 최근 호출 위 (호출 버튼보다 항상 아래) */}
        <AdSlot slot="homeBenefits" />

        {/* 최근 호출 */}
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-ink-sub">{t("home.recentCalls")}</h2>
            {recent.data.length > 0 && (
              <Link href="/history" className="text-sm font-semibold text-link">
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
      </main>
    </>
  );
}
