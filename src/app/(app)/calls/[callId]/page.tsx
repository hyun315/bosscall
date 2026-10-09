"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { ErrorState, LoadingState, NotificationBanner } from "@/components/common/States";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useToast } from "@/components/common/Toast";
import { DriverLocationMap } from "@/components/driver/DriverLocationMap";
import { LocationCard } from "@/components/location/LocationCard";
import { lim, ob, useLiveDoc, useLiveQuery } from "@/hooks/useLive";
import { useSearchParam } from "@/hooks/useSearchParam";
import { useReadySession } from "@/hooks/useSession";
import { isPending, isTerminal, type CallAction } from "@/lib/callStateMachine";
import { CALL_STATUS_LABEL, googleMapsDirectionsUrl, shortPlace, toWhatsAppNumber } from "@/lib/format";
import { formatTime } from "@/lib/time";
import { transitionCall, updateMe } from "@/services/client/actions";
import { quickFix } from "@/services/client/places";
import { coordsGone } from "@/lib/tripData";
import { ClientApiError, errorMessage } from "@/services/client/api";
import type { CallDoc, CallEventDoc, DriverDoc, MemberDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import type { MsgKey } from "@/i18n/index";

/**
 * 호출 상세 — Owner: C04 Calling / C05 Accepted / C06 Completed, Driver: D02 Incoming Call + 운행 진행.
 * 화면 상태는 오직 서버의 call.status 로 결정한다 (§7).
 */
export default function CallPage() {
  const params = useParams<{ callId: string }>();
  const callId = params?.callId ?? "";
  const session = useReadySession();
  const g = useSearchParam("g");
  const [switching, setSwitching] = useState(false);

  // 알림에서 다른 그룹의 호출을 연 경우 활성 그룹 전환 (Deep link §13)
  useEffect(() => {
    if (!g || g === session.groupId || !session.me.groupIds.includes(g)) return;
    setSwitching(true);
    updateMe({ activeGroupId: g })
      .catch(() => undefined)
      .finally(() => setSwitching(false));
  }, [g, session.groupId, session.me.groupIds]);

  if (switching || g === undefined) return <LoadingState full />;
  return <CallView key={`${session.groupId}-${callId}`} callId={callId} />;
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function CallView({ callId }: { callId: string }) {
  const { groupId, member, uid, tz, role } = useReadySession();
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const callState = useLiveDoc<CallDoc>(`groups/${groupId}/calls/${callId}`);
  const call = callState.data;
  const events = useLiveQuery<CallEventDoc>(`groups/${groupId}/calls/${callId}/events`, [ob("createdAt", "asc"), lim(30)]);
  const driverDoc = useLiveDoc<DriverDoc>(call ? `groups/${groupId}/drivers/${call.driverId}` : null);
  const callerDoc = useLiveDoc<MemberDoc>(call ? `groups/${groupId}/members/${call.callerId}` : null);
  const now = useNow(1000);

  const [busyAction, setBusyAction] = useState<CallAction | null>(null);
  const [confirm, setConfirm] = useState<CallAction | null>(null);
  const receivedSent = useRef(false);
  const timeoutSent = useRef(0);

  const isAssignedDriver = role === "DRIVER" && call?.driverId === member.driverId;

  const run = async (action: CallAction, opts: { silent?: boolean } = {}) => {
    setBusyAction(action);
    try {
      // 탑승 시작·운행 완료: 실제 출발·도착 지점 (위치 권한이 이미 있을 때만)
      const fix = isAssignedDriver && (action === "START_TRIP" || action === "COMPLETE") ? await quickFix() : null;
      await transitionCall(groupId, callId, action, fix);
      setConfirm(null);
    } catch (e) {
      // 이미 다른 사람이 처리한 경우(상태 불일치)는 화면이 실시간으로 갱신되므로 조용히 넘어간다
      const stale = e instanceof ClientApiError && e.code === "INVALID_STATE";
      if (!opts.silent && !stale) toast(errorMessage(e), "error");
      setConfirm(null);
      throw e;
    } finally {
      setBusyAction(null);
    }
  };

  // 기사 화면에 호출이 표시되면 RECEIVED 로 전이 — Owner는 "전달됨"을 추측하지 않고 확인한다 (§0.3-3)
  useEffect(() => {
    if (!call || !isAssignedDriver || call.status !== "CALLING" || receivedSent.current) return;
    receivedSent.current = true;
    void run("RECEIVE", { silent: true }).catch(() => {
      receivedSent.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.status, isAssignedDriver]);

  // 응답 대기 시간 종료 → 서버에 TIMEOUT 요청 (서버가 만료 여부를 다시 검증)
  const remainingMs = call ? call.expiresAt - now : 0;
  useEffect(() => {
    if (!call || !isPending(call.status) || remainingMs > 0) return;
    if (Date.now() - timeoutSent.current < 4000) return;
    timeoutSent.current = Date.now();
    void run("TIMEOUT", { silent: true }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.status, remainingMs <= 0, Math.floor(remainingMs / 4000)]);

  if (callState.loading) return <LoadingState full />;
  if (callState.error || !call) {
    return (
      <>
        <AppHeader title={t("call.titleCall")} back="/home" />
        <main className="mx-auto max-w-md px-4 pt-6">
          <ErrorState title={callState.error ?? t("err.callNotFound")} onRetry={() => router.refresh()} />
        </main>
      </>
    );
  }

  const s = CALL_STATUS_LABEL[call.status];
  const driverPhone = driverDoc.data?.phone ?? null;
  const callerPhone = callerDoc.data?.phone ?? null;
  const canCancel =
    role !== "DRIVER" &&
    (call.callerId === uid || role === "OWNER") &&
    (call.status === "CALLING" || call.status === "RECEIVED" || call.status === "ACCEPTED");
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));

  const timeline = events.data.map((e) => ({
    id: e.id,
    time: formatTime(e.createdAt, tz),
    label: t(EVENT_TEXT[e.eventType]),
  }));

  return (
    <>
      <AppHeader title={isAssignedDriver ? t("call.titleCall") : t("home.callDriver")} back="/home" showBell={false} />
      <main className="mx-auto max-w-md space-y-5 px-4 pb-[calc(32px+var(--safe-bottom))] pt-4">
        {role === "DRIVER" ? (
          <DriverPanel
            call={call}
            callerPhone={callerPhone}
            seconds={seconds}
            busyAction={busyAction}
            onAction={(a) => {
              if (a === "DECLINE" || a === "COMPLETE") setConfirm(a);
              else if (a === "ACCEPT" && call.status === "CALLING") {
                // 자동 RECEIVE 가 실패했더라도 상태머신 순서(CALLING→RECEIVED→ACCEPTED)를 지킨다
                void run("RECEIVE", { silent: true })
                  .catch(() => undefined)
                  .then(() => run("ACCEPT"))
                  .catch(() => undefined);
              } else void run(a).catch(() => undefined);
            }}
          />
        ) : (
          <>
            <OwnerPanel call={call} seconds={seconds} driverPhone={driverPhone} viewerIsCaller={call.callerId === uid} />
            {/* 수락~운행 중: 기사님이 어디쯤인지 */}
            {driverDoc.data && ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "TRIP_STARTED"].includes(call.status) && (
              <DriverLocationMap groupId={groupId} driver={driverDoc.data} height={200} />
            )}
          </>
        )}

        {/* 호출 정보 */}
        <div className="card divide-y divide-line">
          <div className="flex items-center justify-between p-4">
            <StatusBadge label={t(s.key)} tone={s.tone} size="lg" />
            <span className="text-sm text-ink-sub">{t("call.calledAt", { time: formatTime(call.createdAt, tz) })}</span>
          </div>
          <div className="p-4">
            <LocationCard
              kind="pickup"
              name={call.pickupName}
              address={call.pickupAddress}
              lat={coordsGone(call, call.pickupSource) ? undefined : call.pickupLat}
              lng={coordsGone(call, call.pickupSource) ? undefined : call.pickupLng}
              placeId={call.pickupPlaceId}
              large={role === "DRIVER"}
            />
          </div>
          <div className="p-4">
            <LocationCard
              kind="destination"
              name={call.destinationName}
              address={call.destinationAddress}
              lat={coordsGone(call, call.destinationSource) ? undefined : call.destinationLat}
              lng={coordsGone(call, call.destinationSource) ? undefined : call.destinationLng}
              placeId={call.destinationPlaceId}
              large={role === "DRIVER"}
            />
          </div>
          <div className="flex justify-between p-4 text-[15px]">
            <span className="text-ink-sub">{t("call.caller")}</span>
            <span className="font-semibold">{call.callerName}</span>
          </div>
          <div className="flex justify-between p-4 text-[15px]">
            <span className="text-ink-sub">{t("role.DRIVER")}</span>
            <span className="font-semibold">{call.driverName}</span>
          </div>
        </div>

        {canCancel && (
          <Button variant="secondary" block onClick={() => setConfirm("CANCEL")}>
            {t("call.cancel")}
          </Button>
        )}

        {/* 상태 기록 (call_events) */}
        {timeline.length > 0 && (
          <section>
            <h2 className="section-title">{t("call.timeline")}</h2>
            <ol className="card space-y-2 p-4 text-sm">
              {timeline.map((t) => (
                <li key={t.id} className="flex gap-3">
                  <span className="w-12 shrink-0 tabular-nums text-ink-sub">{t.time}</span>
                  <span className="text-ink">{t.label}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>

      <ConfirmModal
        open={confirm === "CANCEL"}
        title={t("call.cancelConfirmTitle")}
        message={call.status === "ACCEPTED" ? t("call.cancelAcceptedNote") : undefined}
        confirmLabel={t("call.cancel")}
        cancelLabel={t("common.goBack")}
        tone="danger"
        loading={busyAction === "CANCEL"}
        onConfirm={() => void run("CANCEL").catch(() => undefined)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === "DECLINE"}
        title={t("call.declineConfirmTitle")}
        message={t("call.declineConfirmBody", { name: call.callerName })}
        confirmLabel={t("call.decline")}
        cancelLabel={t("common.goBack")}
        tone="danger"
        loading={busyAction === "DECLINE"}
        onConfirm={() => void run("DECLINE").catch(() => undefined)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === "COMPLETE"}
        title={t("call.completeConfirmTitle")}
        confirmLabel={t("call.complete")}
        cancelLabel={t("common.goBack")}
        loading={busyAction === "COMPLETE"}
        onConfirm={() => void run("COMPLETE").catch(() => undefined)}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

const EVENT_TEXT: Record<CallEventDoc["eventType"], MsgKey> = {
  CREATED: "event.CREATED",
  CALLING: "event.CALLING",
  RECEIVED: "event.RECEIVED",
  ACCEPTED: "event.ACCEPTED",
  ON_THE_WAY: "event.ON_THE_WAY",
  ARRIVED: "event.ARRIVED",
  TRIP_STARTED: "event.TRIP_STARTED",
  COMPLETED: "event.COMPLETED",
  DECLINED: "event.DECLINED",
  TIMEOUT: "event.TIMEOUT",
  CANCELLED: "event.CANCELLED",
};

/* ─────────────────────────── Owner / Family ─────────────────────────── */

function OwnerPanel({
  call,
  seconds,
  driverPhone,
  viewerIsCaller,
}: {
  call: CallDoc;
  seconds: number;
  driverPhone: string | null;
  viewerIsCaller: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();

  if (call.status === "CALLING" || call.status === "RECEIVED" || call.status === "CREATED") {
    // C04 Calling
    return (
      <div className="card flex flex-col items-center px-6 py-8 text-center">
        <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
          <span className="bc-pulse-ring absolute inset-0 rounded-full bg-action/30" aria-hidden />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-action text-4xl" aria-hidden>
            🚗
          </span>
        </div>
        <p className="text-xl font-bold text-ink">{t("call.calling")}</p>
        <p className="mt-1 text-lg font-semibold text-ink">{t("driver.nameTitle", { name: call.driverName })}</p>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          <span className="bc-dot h-2.5 w-2.5 rounded-full bg-action" />
          <span className="bc-dot h-2.5 w-2.5 rounded-full bg-action" />
          <span className="bc-dot h-2.5 w-2.5 rounded-full bg-action" />
        </div>
        <p className="mt-4 text-[15px] text-ink-sub">
          {call.status === "RECEIVED" ? t("call.seen") : t("call.delivering")}
        </p>
        <p className="mt-1 text-sm tabular-nums text-ink-faint">{t("call.waitingSeconds", { s: seconds })}</p>
      </div>
    );
  }

  if (call.status === "ACCEPTED" || call.status === "ON_THE_WAY" || call.status === "ARRIVED" || call.status === "TRIP_STARTED") {
    // C05 Accepted (+ 진행 상태)
    const p = { driver: call.driverName, caller: call.callerName };
    const headline: Record<string, string> = {
      ACCEPTED: viewerIsCaller ? t("call.hlAcceptedMine", p) : t("call.hlAcceptedOther", p),
      ON_THE_WAY: t("call.hlOnTheWay", p),
      ARRIVED: t("call.hlArrived", p),
      TRIP_STARTED: t("call.hlTrip"),
    };
    return (
      <div className="card p-6">
        <p className="text-sm font-bold text-success">✓ {t(CALL_STATUS_LABEL[call.status].key)}</p>
        <p className="mt-2 whitespace-pre-line text-xl font-bold leading-snug text-ink">{headline[call.status]}</p>
        <ProgressSteps status={call.status} />
        {driverPhone && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <a
              href={`tel:${driverPhone}`}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn border border-line bg-surface font-semibold text-ink active:bg-bg"
            >
              {t("common.phoneCall")}
            </a>
            <a
              href={`https://wa.me/${toWhatsAppNumber(driverPhone)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-[#25D366] font-semibold text-white active:brightness-95"
            >
              WhatsApp
            </a>
          </div>
        )}
      </div>
    );
  }

  if (call.status === "COMPLETED") {
    // C06 Completed
    return (
      <div className="card p-6 text-center">
        <p className="text-4xl" aria-hidden>
          🏁
        </p>
        <p className="mt-3 text-xl font-bold text-ink">{t("call.completedTitle")}</p>
        <p className="mt-1 text-[15px] text-ink-sub">{t("call.completedSaved")}</p>
        <p className="mt-3 font-semibold text-ink">
          {shortPlace(call.pickupName, call.pickupAddress)} → {shortPlace(call.destinationName, call.destinationAddress)}
        </p>
        <Button block className="mt-5" onClick={() => router.push("/home")}>
          {t("common.confirm")}
        </Button>
      </div>
    );
  }

  // DECLINED / TIMEOUT / CANCELLED
  const text: Record<string, { icon: string; title: string; desc: string }> = {
    DECLINED: { icon: "🙏", title: t("call.declinedTitle"), desc: t("call.declinedDesc") },
    TIMEOUT: { icon: "⏱", title: t("call.timeoutTitle"), desc: t("call.timeoutDesc") },
    CANCELLED: { icon: "✕", title: t("call.cancelledTitle"), desc: "" },
  };
  const info = text[call.status] ?? { icon: "ℹ️", title: t(CALL_STATUS_LABEL[call.status].key), desc: "" };
  return (
    <div className="card p-6 text-center">
      <p className="text-4xl" aria-hidden>
        {info.icon}
      </p>
      <p className="mt-3 text-lg font-bold text-ink">{info.title}</p>
      {info.desc && <p className="mt-1 text-[15px] text-ink-sub">{info.desc}</p>}
      <div className="mt-5 space-y-3">
        {call.status !== "CANCELLED" && (
          <Link href={`/call/new?from=${call.id}`} className="block">
            <Button block>{t("call.callAgain")}</Button>
          </Link>
        )}
        {call.status !== "CANCELLED" && driverPhone && (
          <a
            href={`tel:${driverPhone}`}
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-btn border border-line bg-surface font-semibold text-ink"
          >
            {t("call.callDriverPhone")}
          </a>
        )}
        <Button variant="ghost" block onClick={() => router.push("/home")}>
          {t("common.home")}
        </Button>
      </div>
    </div>
  );
}

function ProgressSteps({ status }: { status: CallDoc["status"] }) {
  const { t } = useI18n();
  const steps: Array<{ key: string; label: MsgKey }> = [
    { key: "ACCEPTED", label: "step.accepted" },
    { key: "ON_THE_WAY", label: "step.onTheWay" },
    { key: "ARRIVED", label: "step.arrived" },
    { key: "TRIP_STARTED", label: "step.trip" },
    { key: "COMPLETED", label: "step.done" },
  ];
  const idx = steps.findIndex((s) => s.key === status);
  return (
    <ol className="mt-5 flex items-center gap-1" aria-label={t("step.aria")}>
      {steps.map((s, i) => (
        <li key={s.key} className="flex flex-1 flex-col items-center gap-1">
          <span className={`h-1.5 w-full rounded-full ${i <= idx ? "bg-success" : "bg-line"}`} />
          <span className={`text-[11px] font-semibold ${i <= idx ? "text-success" : "text-ink-faint"}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

/* ─────────────────────────── Driver ─────────────────────────── */

/** 운전 안전 원칙 (§6): 텍스트 최소화, 큰 버튼, 충분한 간격, 색+텍스트, 실수 터치 방지(거절·완료는 확인) */
function DriverPanel({
  call,
  callerPhone,
  seconds,
  busyAction,
  onAction,
}: {
  call: CallDoc;
  callerPhone: string | null;
  seconds: number;
  busyAction: CallAction | null;
  onAction: (a: CallAction) => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const navTarget =
    call.status === "TRIP_STARTED"
      ? googleMapsDirectionsUrl(call.destinationLat, call.destinationLng, call.destinationPlaceId)
      : googleMapsDirectionsUrl(call.pickupLat, call.pickupLng, call.pickupPlaceId);

  if (isPending(call.status)) {
    // D02 Incoming Call
    return (
      <div className="rounded-card border-2 border-action bg-action-soft p-5">
        <p className="text-lg font-bold text-action">{t("push.callCreated.title")}</p>
        <p className="mt-2 text-2xl font-extrabold text-ink">{t("call.honorific", { name: call.callerName })}</p>
        <p className="mt-2 text-lg font-semibold text-ink">📍 {shortPlace(call.pickupName, call.pickupAddress)}</p>
        <p className="text-lg font-semibold text-ink">🎯 {shortPlace(call.destinationName, call.destinationAddress)}</p>
        <p className="mt-2 text-sm tabular-nums text-ink-sub">{t("call.respondWithin", { s: seconds })}</p>
        <div className="mt-6 flex flex-col gap-5">
          <Button
            variant="success"
            size="cta"
            block
            className="min-h-[80px] text-2xl"
            loading={busyAction === "ACCEPT"}
            disabled={busyAction !== null}
            onClick={() => onAction("ACCEPT")}
          >
            ✓ {t("call.accept")}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            block
            disabled={busyAction !== null}
            onClick={() => onAction("DECLINE")}
          >
            {t("call.decline")}
          </Button>
        </div>
      </div>
    );
  }

  if (isTerminal(call.status)) {
    const msg: Record<string, string> = {
      COMPLETED: t("call.dDone"),
      DECLINED: t("call.dDeclined"),
      TIMEOUT: t("call.dTimeout"),
      CANCELLED: t("call.dCancelled", { name: call.callerName }),
    };
    return (
      <div className="card p-6 text-center">
        <p className="text-xl font-bold text-ink">{msg[call.status]}</p>
        <Button block size="lg" className="mt-5" onClick={() => router.push("/home")}>
          {t("common.home")}
        </Button>
      </div>
    );
  }

  // 수락 이후 운행 진행
  const next: Partial<Record<CallDoc["status"], { action: CallAction; label: string }>> = {
    ACCEPTED: { action: "DEPART", label: t("call.depart") },
    ON_THE_WAY: { action: "ARRIVE", label: t("call.arrive") },
    ARRIVED: { action: "START_TRIP", label: t("call.startTrip") },
    TRIP_STARTED: { action: "COMPLETE", label: t("call.complete") },
  };
  const step = next[call.status];
  return (
    <div className="space-y-4">
      <NotificationBanner tone="success">
        <span className="text-base font-bold">{t(CALL_STATUS_LABEL[call.status].key)}</span> ·{" "}
        {t("call.honorific", { name: call.callerName })}
      </NotificationBanner>
      <a
        href={navTarget}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-[56px] items-center justify-center gap-2 rounded-btn bg-navy text-lg font-bold text-white active:brightness-110"
      >
        🧭 {call.status === "TRIP_STARTED" ? t("call.navDestination") : t("call.navPickup")}
      </a>
      {step && (
        <Button
          variant={step.action === "COMPLETE" ? "success" : "primary"}
          size="cta"
          block
          className="min-h-[76px] text-2xl"
          loading={busyAction === step.action}
          disabled={busyAction !== null}
          onClick={() => onAction(step.action)}
        >
          {step.label}
        </Button>
      )}
      {callerPhone && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <a
            href={`tel:${callerPhone}`}
            className="inline-flex min-h-[52px] items-center justify-center rounded-btn border border-line bg-surface font-semibold text-ink"
          >
            {t("common.phoneCall")}
          </a>
          <a
            href={`https://wa.me/${toWhatsAppNumber(callerPhone)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[52px] items-center justify-center rounded-btn bg-[#25D366] font-semibold text-white"
          >
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
