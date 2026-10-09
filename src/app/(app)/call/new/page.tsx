"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/common/Button";
import { EmptyState, LoadingState, NotificationBanner } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { LocationCard } from "@/components/location/LocationCard";
import { LocationPicker, recentPlaces } from "@/components/location/LocationPicker";
import { useDrivers, useFavorites, useRecentCalls } from "@/hooks/useGroupData";
import { useLiveDoc } from "@/hooks/useLive";
import { useSearchParam } from "@/hooks/useSearchParam";
import { useReadySession } from "@/hooks/useSession";
import { canCreateCall } from "@/lib/permissions";
import { createCall } from "@/services/client/actions";
import { callSidePlace, resolvePlace } from "@/services/client/places";
import { ClientApiError, errorMessage } from "@/services/client/api";
import type { CallDoc, PlaceInput } from "@/types/domain";
import { useI18n } from "@/i18n/client";

type Step = "pickup" | "destination" | "confirm";

/** §5 CALL FLOW — C01 Pickup → C02 Destination → C03 Confirm */
export default function NewCallPage() {
  const { groupId, member, role } = useReadySession();
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const fromCallId = useSearchParam("from");

  const drivers = useDrivers(groupId);
  const favorites = useFavorites(groupId);
  const recentCalls = useRecentCalls(groupId, 30);
  const source = useLiveDoc<CallDoc>(fromCallId ? `groups/${groupId}/calls/${fromCallId}` : null);

  const [step, setStep] = useState<Step>("pickup");
  const [pickup, setPickup] = useState<PlaceInput | null>(null);
  const [destination, setDestination] = useState<PlaceInput | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const eligible = useMemo(
    () => drivers.data.filter((d) => d.userId && (d.status === "ON_DUTY" || d.status === "BUSY")),
    [drivers.data],
  );

  useEffect(() => {
    if (!driverId && eligible[0]) setDriverId(eligible[0].id);
  }, [eligible, driverId]);

  // 재호출: 이전 호출 내용으로 바로 확인 단계
  useEffect(() => {
    const c = source.data;
    if (!c || pickup) return;
    let cancelled = false;
    // 오래된 호출은 구글 좌표가 지워졌을 수 있어 Place ID로 다시 받는다
    void Promise.all([resolvePlace(callSidePlace(c, "pickup")), resolvePlace(callSidePlace(c, "destination"))])
      .then(([p, d]) => {
        if (cancelled) return;
        setPickup(p);
        setDestination(d);
        setDriverId(c.driverId);
        setStep("confirm");
      })
      .catch((e) => {
        if (!cancelled) setSubmitError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [source.data, pickup]);

  const pickupRecents = useMemo(() => recentPlaces(recentCalls.data, "both"), [recentCalls.data]);
  const destRecents = useMemo(() => recentPlaces(recentCalls.data, "destination"), [recentCalls.data]);

  if (!canCreateCall(role)) {
    return (
      <>
        <AppHeader title={t("home.callDriver")} back="/home" />
        <main className="mx-auto max-w-md px-4 pt-6">
          <EmptyState icon="🚫" title={t("newCall.driverCannotCall")} />
        </main>
      </>
    );
  }
  if (drivers.loading || favorites.loading || (fromCallId && source.loading)) return <LoadingState full />;

  const submit = async () => {
    if (!pickup || !destination || !driverId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await createCall(groupId, driverId, pickup, destination);
      router.replace(`/calls/${r.callId}`);
    } catch (e) {
      const msg = errorMessage(e);
      setSubmitError(msg);
      if (e instanceof ClientApiError && e.code === "NETWORK") toast(msg, "error");
      setSubmitting(false);
    }
  };

  const back = () => {
    if (step === "confirm") setStep("destination");
    else if (step === "destination") setStep("pickup");
    else router.push("/home");
  };

  const selectedDriver = drivers.data.find((d) => d.id === driverId);

  return (
    <>
      <AppHeader
        title={step === "pickup" ? t("newCall.whereMeet") : step === "destination" ? t("newCall.whereGo") : t("newCall.confirm")}
        back={back}
        showBell={false}
      />
      <main className="mx-auto max-w-md px-4 pb-[calc(24px+var(--safe-bottom))] pt-4">
        {eligible.length === 0 && (
          <div className="mb-4">
            <NotificationBanner tone="warning">{t("newCall.offDuty")}</NotificationBanner>
          </div>
        )}

        {step === "pickup" && (
          <LocationPicker
            kind="pickup"
            groupId={groupId}
            favorites={favorites.data}
            recents={pickupRecents}
            onPicked={(p) => {
              setPickup(p);
              setStep("destination");
            }}
          />
        )}

        {step === "destination" && (
          <div className="space-y-4">
            {pickup && (
              <button onClick={() => setStep("pickup")} className="card block w-full p-4 text-left active:bg-bg">
                <LocationCard kind="pickup" name={pickup.name} address={pickup.address} />
              </button>
            )}
            <LocationPicker
              kind="destination"
              groupId={groupId}
              favorites={favorites.data}
              recents={destRecents}
              onPicked={(p) => {
                setDestination(p);
                setStep("confirm");
              }}
            />
          </div>
        )}

        {step === "confirm" && pickup && destination && (
          <div className="space-y-4">
            <div className="card divide-y divide-line">
              <div className="p-4">
                <LocationCard
                  kind="pickup"
                  name={pickup.name}
                  address={pickup.address}
                  lat={pickup.lat}
                  lng={pickup.lng}
                  placeId={pickup.placeId}
                  action={
                    <button onClick={() => setStep("pickup")} className="text-sm font-semibold text-action">
                      {t("common.change")}
                    </button>
                  }
                />
              </div>
              <div className="p-4">
                <LocationCard
                  kind="destination"
                  name={destination.name}
                  address={destination.address}
                  lat={destination.lat}
                  lng={destination.lng}
                  placeId={destination.placeId}
                  action={
                    <button onClick={() => setStep("destination")} className="text-sm font-semibold text-action">
                      {t("common.change")}
                    </button>
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-ink-sub">{t("call.caller")}</span>
                <span className="font-semibold text-ink">{member.displayName}</span>
              </div>
              <div className="p-4">
                <span className="text-sm text-ink-sub">{t("role.DRIVER")}</span>
                {eligible.length > 1 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {eligible.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDriverId(d.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                          driverId === d.id ? "border-action bg-action text-white" : "border-line bg-surface text-ink"
                        }`}
                      >
                        {d.displayName}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 font-semibold text-ink">{selectedDriver ? t("driver.nameTitle", { name: selectedDriver.displayName }) : t("newCall.noDriverOnDuty")}</p>
                )}
              </div>
            </div>

            {submitError && <NotificationBanner tone="danger">{submitError}</NotificationBanner>}

            <Button
              size="cta"
              block
              loading={submitting}
              disabled={!driverId || !eligible.some((d) => d.id === driverId)}
              onClick={() => void submit()}
              icon={<span aria-hidden>🚗</span>}
            >
              {t("home.callDriver")}
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
