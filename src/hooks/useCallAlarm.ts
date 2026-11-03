"use client";
import { useEffect, useState } from "react";
import { isPending } from "@/lib/callStateMachine";
import {
  installAlarmUnlock,
  isCallSilenced,
  startCallAlarm,
  stopCallAlarm,
  subscribeAlarm,
  type AlarmState,
} from "@/services/client/alarm";
import type { CallDoc } from "@/types/domain";

/**
 * 기사 앱 알람 — 다음 중 하나라도 있으면 [확인]할 때까지 계속 울린다.
 *  - 나에게 온 호출이 응답을 기다리는 중 → 수락·거절하면 멈춤
 *  - 호출이 취소됨 / 응답 시간이 지남(놓친 호출) (call.cancelAlertFor == 나) → [확인]하면 멈춤
 * 앱이 뒤에 있거나 닫혀 있을 때는 서버의 반복 알림(5초마다)이 대신 울린다.
 */
export function useDriverAlarm(opts: {
  enabled: boolean;
  driverId: string | null;
  calls: CallDoc[];
  alerts: CallDoc[];
}): void {
  const { enabled, driverId, calls, alerts } = opts;
  // silenceCall 이 불리면 다시 계산
  const [, setVersion] = useState(0);
  useEffect(() => subscribeAlarm(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    if (enabled) installAlarmUnlock();
  }, [enabled]);

  const waiting = enabled ? calls.filter((c) => c.driverId === driverId && isPending(c.status) && !isCallSilenced(c.id)) : [];
  const unacked = enabled ? alerts.filter((c) => !isCallSilenced(`cancel-${c.id}`)) : [];
  const ring = waiting.length > 0 || unacked.length > 0;

  useEffect(() => {
    if (ring) startCallAlarm();
    else stopCallAlarm();
  }, [ring]);

  // 로그아웃·화면 이탈 시 정리
  useEffect(
    () => () => stopCallAlarm(),
    [],
  );
}

/** 알람 상태 (다시 그리기용) */
export function useAlarmState(): AlarmState {
  const [s, setS] = useState<AlarmState>({ wanted: false, playing: false, blocked: false });
  useEffect(() => subscribeAlarm(setS), []);
  return s;
}
