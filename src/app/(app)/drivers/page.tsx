"use client";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { DriverCard } from "@/components/driver/DriverCard";
import { useCallsBetween, useDrivers } from "@/hooks/useGroupData";
import { useReadySession } from "@/hooks/useSession";
import { isOwner, PLAN_LIMITS } from "@/lib/permissions";
import { startOfDay } from "@/lib/time";
import { addDriver } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";

/** §9 DRIVER MANAGEMENT — 우리 기사 목록 */
export default function DriversPage() {
  const { groupId, tz, role, group } = useReadySession();
  const { t } = useI18n();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const dayStart = startOfDay(now, tz);
  const drivers = useDrivers(groupId);
  const today = useCallsBetween(groupId, dayStart, dayStart + 86400000);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (role === "DRIVER") router.replace("/home");
  }, [role, router]);

  const limit = PLAN_LIMITS[group.plan].maxDrivers;
  const canAdd = isOwner(role) && drivers.data.length < limit;

  return (
    <>
      <AppHeader title={t("drivers.title")} />
      <main className="mx-auto max-w-md space-y-3 px-4 pb-6 pt-3">
        {drivers.loading ? (
          <LoadingState />
        ) : drivers.error ? (
          <ErrorState title={drivers.error} onRetry={() => window.location.reload()} />
        ) : drivers.data.length === 0 ? (
          <EmptyState
            title={t("home.noDriverTitle")}
            description={t("home.noDriverDesc")}
            action={isOwner(role) ? <Button block onClick={() => setAdding(true)}>{t("drivers.add")}</Button> : undefined}
          />
        ) : (
          drivers.data.map((d) => (
            <DriverCard
              key={d.id}
              driver={d}
              tz={tz}
              todayCalls={today.data.filter((c) => c.driverId === d.id).length}
              href={`/drivers/${d.id}`}
            />
          ))
        )}

        {isOwner(role) && drivers.data.length > 0 && (
          canAdd ? (
            <Button variant="secondary" block onClick={() => setAdding(true)}>
              + {t("drivers.add")}
            </Button>
          ) : (
            <p className="px-1 text-center text-sm text-ink-sub">
              {t("drivers.planLimit", { n: limit })}
            </p>
          )
        )}
      </main>
      {adding && <AddDriverSheet groupId={groupId} onClose={() => setAdding(false)} onAdded={(id) => router.push(`/drivers/${id}`)} />}
    </>
  );
}

function AddDriverSheet({ groupId, onClose, onAdded }: { groupId: string; onClose: () => void; onAdded: (id: string) => void }) {
  const toast = useToast();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const r = await addDriver(groupId, name.trim(), phone.trim() || null);
      toast(t("drivers.addedToast"), "success");
      onAdded(r.driverId);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <BottomSheet open onClose={onClose} title={t("drivers.add")}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="nd-name">{t("drivers.nameLabel")}</label>
          <input id="nd-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </div>
        <div>
          <label className="label" htmlFor="nd-phone">{t("account.phoneLabel")}</label>
          <input id="nd-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </div>
        <Button block loading={busy} disabled={!name.trim()} onClick={() => void submit()}>
          {t("common.add")}
        </Button>
      </div>
    </BottomSheet>
  );
}
