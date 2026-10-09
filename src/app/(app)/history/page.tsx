"use client";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { CallCard } from "@/components/call/CallCard";
import { WorkSessionRow } from "@/components/work/WorkSessionRow";
import { PayrollView } from "@/components/payroll/PayrollView";
import { useI18n } from "@/i18n/client";
import type { MsgKey } from "@/i18n/index";
import { useLiveDoc } from "@/hooks/useLive";
import { useCallsBetween, useDrivers, useMembers, useWorkSessionsBetween } from "@/hooks/useGroupData";
import { useReadySession } from "@/hooks/useSession";
import { CALL_STATUS_LABEL } from "@/lib/format";
import { isOwner } from "@/lib/permissions";
import { formatDate, formatDuration, startOfDay, startOfMonth, workDurationMs } from "@/lib/time";
import { CALL_STATUSES, type CallDoc, type CallStatus, type DriverDoc, type PayrollSettingsDoc } from "@/types/domain";

type Tab = "calls" | "trips" | "work" | "pay";
type Range = "today" | "7d" | "30d" | "month";

const RANGE_LABEL: Record<Range, MsgKey> = {
  today: "hist.today",
  "7d": "hist.7d",
  "30d": "hist.30d",
  month: "hist.month",
};

/** §12 HISTORY — 호출 이력 / 운행 이력 / 근무 이력, 필터: 날짜·호출자·기사·상태 */
export default function HistoryPage() {
  const { groupId, tz, role, member, group } = useReadySession();
  const { t, locale } = useI18n();
  const isDriver = role === "DRIVER";
  const [tab, setTab] = useState<Tab>(isDriver ? "trips" : "calls");
  const [range, setRange] = useState<Range>("7d");
  const [callerId, setCallerId] = useState("");
  const [driverId, setDriverId] = useState(isDriver ? member.driverId ?? "" : "");
  const [status, setStatus] = useState<CallStatus | "">("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { from, to } = useMemo(() => {
    const today = startOfDay(now, tz);
    const end = today + 86400000;
    if (range === "today") return { from: today, to: end };
    if (range === "7d") return { from: today - 6 * 86400000, to: end };
    if (range === "30d") return { from: today - 29 * 86400000, to: end };
    return { from: startOfMonth(now, tz), to: end };
    // 분 단위로 갱신되는 now 대신 날짜가 바뀔 때만 다시 계산
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, tz, startOfDay(now, tz)]);

  const calls = useCallsBetween(groupId, from, to);
  const sessions = useWorkSessionsBetween(!isDriver && tab === "work" ? groupId : null, from, to);
  const drivers = useDrivers(groupId);
  const members = useMembers(groupId);
  // 기사 본인: 사장님이 공개한 경우에만 급여 조건을 읽을 수 있다 (비공개면 권한 오류 → 탭 숨김)
  const myPay = useLiveDoc<PayrollSettingsDoc>(isDriver && member.driverId ? `groups/${groupId}/payrollSettings/${member.driverId}` : null);
  const myDriver = useLiveDoc<DriverDoc>(isDriver && member.driverId ? `groups/${groupId}/drivers/${member.driverId}` : null);
  const payShared = Boolean(myPay.data?.shareWithDriver);

  const driverName = (id: string) => drivers.data.find((d) => d.id === id)?.displayName ?? t("role.DRIVER");

  const filtered = useMemo(() => {
    let xs: CallDoc[] = calls.data;
    if (tab === "trips") xs = xs.filter((c) => c.status === "COMPLETED");
    if (driverId) xs = xs.filter((c) => c.driverId === driverId);
    if (callerId) xs = xs.filter((c) => c.callerId === callerId);
    if (status && tab === "calls") xs = xs.filter((c) => c.status === status);
    return xs;
  }, [calls.data, tab, driverId, callerId, status]);

  const grouped = useMemo(() => {
    const m = new Map<number, CallDoc[]>();
    for (const c of filtered) {
      const d = startOfDay(c.createdAt, tz);
      m.set(d, [...(m.get(d) ?? []), c]);
    }
    return [...m.entries()].sort((a, b) => b[0] - a[0]);
  }, [filtered, tz]);

  const sessionList = useMemo(
    () => sessions.data.filter((s) => !driverId || s.driverId === driverId),
    [sessions.data, driverId],
  );
  const totalWork = sessionList.reduce((acc, s) => acc + workDurationMs(s.clockInAt, s.clockOutAt, now), 0);

  const tabs: Array<{ key: Tab; label: string }> = isDriver
    ? [
        { key: "trips", label: t("hist.tabTrips") },
        { key: "calls", label: t("hist.tabAllCalls") },
        ...(payShared ? [{ key: "pay" as const, label: t("drivers.tabPay") }] : []),
      ]
    : [
        { key: "calls", label: t("hist.tabCalls") },
        { key: "trips", label: t("hist.tabTrips") },
        { key: "work", label: t("hist.tabWork") },
      ];

  const callers = members.data.filter((m) => m.role !== "DRIVER");

  return (
    <>
      <AppHeader title={t("nav.history")} />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-3">
        <div className="flex rounded-btn bg-line/60 p-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`min-h-[40px] flex-1 rounded-[9px] text-[15px] font-semibold ${
                tab === t.key ? "bg-surface text-ink shadow-card" : "text-ink-sub"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "pay" && isDriver && member.driverId ? (
          <PayrollView
            groupId={groupId}
            groupName={group.name}
            driverId={member.driverId}
            driverName={myDriver.data?.displayName ?? member.displayName}
            tz={tz}
            settings={myPay.data}
            settingsLoading={myPay.loading}
            mode="driver"
          />
        ) : (
        <>
        {/* 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label={t("hist.period")}>
          {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                range === r ? "border-navy bg-navy text-white" : "border-line bg-surface text-ink-sub"
              }`}
            >
              {t(RANGE_LABEL[r])}
            </button>
          ))}
        </div>
        {!isDriver && (
          <div className="grid grid-cols-2 gap-2">
            {tab !== "work" && (
              <select className="field py-2.5 text-sm" value={callerId} onChange={(e) => setCallerId(e.target.value)} aria-label={t("call.caller")}>
                <option value="">{t("hist.allCallers")}</option>
                {callers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            )}
            {drivers.data.length > 1 && (
              <select className="field py-2.5 text-sm" value={driverId} onChange={(e) => setDriverId(e.target.value)} aria-label={t("role.DRIVER")}>
                <option value="">{t("hist.allDrivers")}</option>
                {drivers.data.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.displayName}
                  </option>
                ))}
              </select>
            )}
            {tab === "calls" && (
              <select
                className="field py-2.5 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as CallStatus | "")}
                aria-label={t("drivers.status")}
              >
                <option value="">{t("hist.allStatuses")}</option>
                {CALL_STATUSES.filter((s) => s !== "CREATED").map((s) => (
                  <option key={s} value={s}>
                    {t(CALL_STATUS_LABEL[s].key)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {tab !== "work" ? (
          calls.loading ? (
            <LoadingState />
          ) : calls.error ? (
            <ErrorState title={calls.error} onRetry={() => window.location.reload()} />
          ) : grouped.length === 0 ? (
            <EmptyState icon="🗂" title={tab === "trips" ? t("hist.noTrips") : t("hist.noCalls")} />
          ) : (
            <>
              <p className="px-1 text-sm text-ink-sub">{t("hist.count", { n: filtered.length })}</p>
              {grouped.map(([day, xs]) => (
                <section key={day}>
                  <h2 className="section-title">{formatDate(day, tz, locale)}</h2>
                  <div className="card divide-y divide-line overflow-hidden">
                    {xs.map((c) => (
                      <CallCard key={c.id} call={c} tz={tz} showDriver={drivers.data.length > 1} />
                    ))}
                  </div>
                </section>
              ))}
            </>
          )
        ) : sessions.loading ? (
          <LoadingState />
        ) : sessions.error ? (
          <ErrorState title={sessions.error} onRetry={() => window.location.reload()} />
        ) : sessionList.length === 0 ? (
          <EmptyState icon="🕘" title={t("hist.noWork")} description={t("hist.noWorkDesc")} />
        ) : (
          <>
            <div className="card flex items-center justify-between p-4">
              <span className="text-sm text-ink-sub">{t("hist.totalWork", { range: t(RANGE_LABEL[range]) })}</span>
              <span className="text-lg font-bold text-ink">{formatDuration(totalWork, locale)}</span>
            </div>
            <div className="card divide-y divide-line overflow-hidden">
              {sessionList.map((s) => (
                <WorkSessionRow
                  key={s.id}
                  session={s}
                  driverName={driverName(s.driverId)}
                  tz={tz}
                  now={now}
                  editable={isOwner(role)}
                  groupId={groupId}
                />
              ))}
            </div>
          </>
        )}
        </>
        )}
      </main>
    </>
  );
}
