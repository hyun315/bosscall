import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import { isPending } from "@/lib/callStateMachine";
import { notifyUsers } from "@/lib/server/push";
import type { CallDoc, DriverDoc } from "@/types/domain";

/**
 * 기사 알람 — 서버 쪽 (앱이 닫혀 있거나 화면이 꺼진 기사 휴대폰용).
 *
 * 웹앱은 닫혀 있으면 소리를 직접 낼 수 없다. 그래서 기사가 [확인]할 때까지 서버가 5초마다
 * 휴대폰 알림을 다시 보낸다 (알림마다 새 알림 → 매번 알림음·진동).
 *   - 응답 대기 중인 호출: 수락·거절할 때까지
 *   - 호출이 취소됨 / 응답 시간이 지남(놓친 호출): 기사가 [확인]할 때까지 (call.cancelAlertFor)
 *
 * 서버 함수는 한 번에 60초까지만 돈다 → 48초 돌고, 아직 확인 전이면 자기 자신을 다시 불러 이어 간다
 * (최대 10분). 같은 호출에 반복이 두 개 돌지 않도록 call.alertLoopId 가 다르면 멈춘다.
 */

const EVERY_MS = 5_000;
const SLICE_MS = 48_000;
const MAX_MS = 10 * 60_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 새 반복을 시작한다 (이전 반복은 다음 차례에 스스로 멈춘다). 호출 생성·취소·시간 초과 뒤에 부른다. */
export async function startDriverAlerts(groupId: string, callId: string): Promise<void> {
  const loopId = randomUUID();
  await adminDb().doc(`groups/${groupId}/calls/${callId}`).update({ alertLoopId: loopId });
  await runAlertSlice(groupId, callId, loopId, Date.now());
}

/** 한 조각(약 48초) 동안 5초마다 알림. 끝나면 필요할 때 다음 조각을 부른다. */
export async function runAlertSlice(groupId: string, callId: string, loopId: string, startedAt: number): Promise<void> {
  const sliceStart = Date.now();
  while (Date.now() - sliceStart < SLICE_MS) {
    await sleep(EVERY_MS);
    if (Date.now() - startedAt > MAX_MS) return;
    let more = false;
    try {
      more = await alertOnce(groupId, callId, loopId);
    } catch (e) {
      console.error("[driver-alert] failed", e);
      return;
    }
    if (!more) return;
  }
  await continueLater(groupId, callId, loopId, startedAt);
}

/** 지금 알릴 것이 있으면 한 번 보낸다. 더 보낼 필요가 없으면 false */
async function alertOnce(groupId: string, callId: string, loopId: string): Promise<boolean> {
  const db = adminDb();
  const ref = db.doc(`groups/${groupId}/calls/${callId}`);
  let call = (await ref.get()).data() as CallDoc | undefined;
  if (!call || call.alertLoopId !== loopId) return false;

  // 응답 시간이 지났는데 아무도 '시간 초과' 처리를 안 했으면 여기서 한다 → 놓친 호출 알람으로 이어진다
  if (isPending(call.status) && call.expiresAt <= Date.now()) {
    const { transitionCall } = await import("@/services/server/calls");
    await transitionCall(groupId, callId, "TIMEOUT", { userId: "system", role: "SYSTEM", driverId: null }).catch(() => undefined);
    call = (await ref.get()).data() as CallDoc | undefined;
    if (!call) return false;
  }

  const pending = isPending(call.status) && call.expiresAt > Date.now();
  const unacked = !!call.cancelAlertFor;
  if (!pending && !unacked) return false;

  const dSnap = await db.doc(`groups/${groupId}/drivers/${call.driverId}`).get();
  const driverUserId = (dSnap.data() as DriverDoc | undefined)?.userId;
  if (!driverUserId) return false;

  const path = `/calls/${callId}?g=${groupId}`;
  if (pending) {
    await notifyUsers([driverUserId], {
      type: "CALL_CREATED",
      groupId,
      callId,
      titleKey: "push.callReminder.title",
      bodyKey: "push.callReminder.body",
      params: { caller: call.callerName },
      path,
      urgent: true,
      inbox: false,
    });
  } else {
    const missed = call.status === "TIMEOUT";
    await notifyUsers([driverUserId], {
      type: "CALL_CANCELLED",
      groupId,
      callId,
      titleKey: missed ? "push.missedDriver.title" : "push.cancelledDriver.title",
      bodyKey: missed ? "push.missedDriver.body" : "push.cancelledDriver.body",
      params: { caller: call.callerName },
      path,
      urgent: true,
      inbox: false,
    });
  }
  return true;
}

/* ───────── 60초 제한 넘기기: 자기 자신을 다시 부른다 ───────── */

function secretKey(): string {
  const k = process.env.FIREBASE_PRIVATE_KEY;
  if (!k) throw new Error("FIREBASE_PRIVATE_KEY missing");
  return k;
}

export function alertToken(groupId: string, callId: string, loopId: string, startedAt: number): string {
  return createHmac("sha256", secretKey()).update(`driver-alert:${groupId}:${callId}:${loopId}:${startedAt}`).digest("hex");
}

export function verifyAlertToken(groupId: string, callId: string, loopId: string, startedAt: number, token: string): boolean {
  const want = Buffer.from(alertToken(groupId, callId, loopId, startedAt), "hex");
  const got = Buffer.from(token, "hex");
  return want.length === got.length && timingSafeEqual(want, got) && Date.now() - startedAt < MAX_MS;
}

async function continueLater(groupId: string, callId: string, loopId: string, startedAt: number): Promise<void> {
  // 아직 알릴 게 남았는지 먼저 확인 (불필요한 호출 방지)
  const call = (await adminDb().doc(`groups/${groupId}/calls/${callId}`).get()).data() as CallDoc | undefined;
  if (!call || call.alertLoopId !== loopId) return;
  if (!(isPending(call.status) && call.expiresAt > Date.now()) && !call.cancelAlertFor) return;

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const base = (process.env.NEXT_PUBLIC_APP_URL || (prod ? `https://${prod}` : "")).replace(/\/$/, "");
  if (!base) return; // 로컬 개발 — 이어 가지 않음
  const res = await fetch(`${base}/api/calls/alert-loop`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ groupId, callId, loopId, startedAt, token: alertToken(groupId, callId, loopId, startedAt) }),
  }).catch((e) => {
    console.error("[driver-alert] relay failed", e);
    return null;
  });
  if (res && !res.ok) console.error("[driver-alert] relay status", res.status);
}
