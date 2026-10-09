"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { InviteShare } from "@/components/common/InviteShare";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useToast } from "@/components/common/Toast";
import { CallCard } from "@/components/call/CallCard";
import { WorkSessionRow } from "@/components/work/WorkSessionRow";
import { ManualWorkSheet } from "@/components/payroll/ManualWorkSheet";
import { PayrollView } from "@/components/payroll/PayrollView";
import { useCallsBetween, useWorkSessionsBetween } from "@/hooks/useGroupData";
import { useLiveDoc } from "@/hooks/useLive";
import { useReadySession } from "@/hooks/useSession";
import { DriverLocationMap } from "@/components/driver/DriverLocationMap";
import { DRIVER_STATUS_LABEL, toWhatsAppNumber } from "@/lib/format";
import { isOwner } from "@/lib/permissions";
import { formatTime, startOfDay, startOfMonth } from "@/lib/time";
import { removeMember, updateDriver } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import type { DriverDoc, PayrollSettingsDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import type { MsgKey } from "@/i18n/index";

type Tab = "work" | "calls" | "pay" | "info";

/** §9 Driver 상세 — 상태·출근·오늘/이번달 호출, [근무기록] [호출기록] [기본정보] */
export default function DriverDetailPage() {
  const params = useParams<{ driverId: string }>();
  const driverId = params?.driverId ?? "";
  const { groupId, tz, role, group } = useReadySession();
  const { t } = useI18n();
  const router = useRouter();
  const driverState = useLiveDoc<DriverDoc>(`groups/${groupId}/drivers/${driverId}`);
  const [tab, setTab] = useState<Tab>("work");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (role === "DRIVER") router.replace("/home");
  }, [role, router]);

  const monthStart = startOfMonth(now, tz);
  const dayStart = startOfDay(now, tz);
  const monthCalls = useCallsBetween(groupId, monthStart, dayStart + 86400000);
  const sessions = useWorkSessionsBetween(tab === "work" ? groupId : null, dayStart - 30 * 86400000, dayStart + 86400000);
  // 급여 조건은 관리자만 읽을 수 있다 (가족은 급여 탭 없음)
  const payroll = useLiveDoc<PayrollSettingsDoc>(isOwner(role) ? `groups/${groupId}/payrollSettings/${driverId}` : null);
  const [addingWork, setAddingWork] = useState(false);

  const mine = useMemo(() => monthCalls.data.filter((c) => c.driverId === driverId), [monthCalls.data, driverId]);
  const todayCount = mine.filter((c) => c.createdAt >= dayStart).length;

  if (driverState.loading) return <LoadingState full />;
  const driver = driverState.data;
  if (!driver) {
    return (
      <>
        <AppHeader title={t("role.DRIVER")} back="/drivers" />
        <main className="mx-auto max-w-md px-4 pt-6">
          <ErrorState title={driverState.error ?? t("err.driverNotFound")} />
        </main>
      </>
    );
  }
  const s = DRIVER_STATUS_LABEL[driver.status];

  return (
    <>
      <AppHeader title={driver.displayName} back="/drivers" />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-3">
        <div className="card divide-y divide-line">
          <Row label={t("drivers.status")} value={<StatusBadge label={t(s.key)} tone={s.tone} />} />
          <Row
            label={t("work.clockIn")}
            value={driver.currentSessionId && driver.lastClockInAt ? formatTime(driver.lastClockInAt, tz) : "—"}
          />
          <Row label={t("home.todayCalls")} value={String(todayCount)} />
          <Row label={t("drivers.monthCalls")} value={String(mine.length)} />
        </div>

        {driver.currentSessionId && <DriverLocationMap groupId={groupId} driver={driver} />}

        {driver.phone && (
          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${driver.phone}`} className="inline-flex min-h-[48px] items-center justify-center rounded-btn border border-line bg-surface font-semibold">
              {t("common.phoneCall")}
            </a>
            <a
              href={`https://wa.me/${toWhatsAppNumber(driver.phone)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center rounded-btn bg-[#25D366] font-semibold text-white"
            >
              WhatsApp
            </a>
          </div>
        )}

        <div className="flex rounded-btn bg-line/60 p-1" role="tablist">
          {(
            [
              ["work", "drivers.tabWork"],
              ["calls", "drivers.tabCalls"],
              ...(isOwner(role) ? [["pay", "drivers.tabPay"]] : []),
              ["info", "drivers.tabInfo"],
            ] as Array<[Tab, MsgKey]>
          ).map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`min-h-[40px] flex-1 rounded-[9px] text-[15px] font-semibold ${tab === k ? "bg-surface text-ink shadow-card" : "text-ink-sub"}`}
            >
              {t(label)}
            </button>
          ))}
        </div>

        {tab === "work" && isOwner(role) && (
          <Button variant="secondary" block onClick={() => setAddingWork(true)}>
            + {t("work.addTitle")}
          </Button>
        )}
        {addingWork && <ManualWorkSheet groupId={groupId} driverId={driverId} tz={tz} onClose={() => setAddingWork(false)} />}

        {tab === "pay" && isOwner(role) && (
          <PayrollView
            groupId={groupId}
            groupName={group.name}
            driverId={driverId}
            driverName={driver.displayName}
            driverPhone={driver.phone}
            tz={tz}
            settings={payroll.data}
            settingsLoading={payroll.loading}
            mode="owner"
          />
        )}

        {tab === "work" &&
          (sessions.loading ? (
            <LoadingState />
          ) : sessions.data.filter((x) => x.driverId === driverId).length === 0 ? (
            <EmptyState icon="🕘" title={t("drivers.noWork30")} />
          ) : (
            <div className="card divide-y divide-line overflow-hidden">
              {sessions.data
                .filter((x) => x.driverId === driverId)
                .map((x) => (
                  <WorkSessionRow
                    key={x.id}
                    session={x}
                    driverName={driver.displayName}
                    tz={tz}
                    now={now}
                    editable={isOwner(role)}
                    groupId={groupId}
                  />
                ))}
            </div>
          ))}

        {tab === "calls" &&
          (mine.length === 0 ? (
            <EmptyState icon="🗂" title={t("drivers.noCallsMonth")} />
          ) : (
            <div className="card divide-y divide-line overflow-hidden">
              {mine.map((c) => (
                <CallCard key={c.id} call={c} tz={tz} />
              ))}
            </div>
          ))}

        {tab === "info" && <DriverInfo driver={driver} groupId={groupId} groupName={group.name} canEdit={isOwner(role)} />}
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 text-[15px]">
      <span className="text-ink-sub">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function DriverInfo({ driver, groupId, groupName, canEdit }: { driver: DriverDoc; groupId: string; groupName: string; canEdit: boolean }) {
  const toast = useToast();
  const { t } = useI18n();
  const [name, setName] = useState(driver.displayName);
  const [phone, setPhone] = useState(driver.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateDriver(groupId, driver.id, { displayName: name.trim(), phone: phone.trim() || null });
      toast(t("common.saved"), "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    if (!driver.userId) return;
    setBusy(true);
    try {
      await removeMember(groupId, driver.userId);
      toast(t("drivers.unlinkedToast"), "success");
      setConfirmUnlink(false);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="di-name">{t("drivers.nameLabel")}</label>
          <input id="di-name" className="field" value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} maxLength={40} />
        </div>
        <div>
          <label className="label" htmlFor="di-phone">{t("drivers.phoneLabel")}</label>
          <input id="di-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canEdit} inputMode="tel" />
        </div>
        {canEdit && (
          <Button block loading={busy} disabled={!name.trim()} onClick={() => void save()}>
            {t("common.save")}
          </Button>
        )}
      </div>

      {canEdit && (
        <div className="card space-y-3 p-4">
          <p className="text-[15px] font-semibold text-ink">{t("drivers.appLink")}</p>
          {driver.userId ? (
            <>
              <p className="text-sm text-ink-sub">{t("drivers.linked")}</p>
              <Button variant="secondary" block disabled={driver.status === "BUSY"} onClick={() => setConfirmUnlink(true)}>
                {t("drivers.unlink")}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-sub">{t("drivers.inviteHint")}</p>
              <InviteShare groupId={groupId} groupName={groupName} role="DRIVER" driverId={driver.id} targetName={driver.displayName} />
            </>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmUnlink}
        title={t("drivers.unlinkConfirmTitle")}
        message={t("drivers.unlinkConfirmBody")}
        confirmLabel={t("drivers.unlink")}
        tone="danger"
        loading={busy}
        onConfirm={() => void unlink()}
        onCancel={() => setConfirmUnlink(false)}
      />
    </div>
  );
}
