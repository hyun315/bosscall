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
 * 기사 앱 알람 — 다음 중 하나라도 있으면 계속 울린다.
 *  - 나에게 온 호출이 응답을 기다리는 중 (전달 전·전달됨)
 *  - 호출자가 취소했는데 아직 [확인]을 안 누름 (cancelAlerts)
 * 수락·거절·확인을 누르면 silenceCall 로 그 자리에서 바로 멈춘다 (서버 반영을 기다리지 않음).
 */
export function useIncomingCallAlarm(
  calls: CallDoc[],
  driverId: string | null,
  enabled: boolean,
  cancelAlerts: CallDoc[] = [],
  /** false = 진동만 (설정에서 호출 소리를 끔) */
  sound = true,
): void {
  const [tick, setTick] = useState(0);
  // silenceCall 이 불리면 다시 계산
  const [, setVersion] = useState(0);
  useEffect(() => subscribeAlarm(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    if (enabled) installAlarmUnlock();
  }, [enabled]);

  const now = Date.now();
  const waiting = enabled
    ? calls.filter((c) => c.driverId === driverId && isPending(c.status) && c.expiresAt > now && !isCallSilenced(c.id))
    : [];
  const cancelled = enabled ? cancelAlerts.filter((c) => !isCallSilenced(`cancel-${c.id}`)) : [];
  const nextExpiry = waiting.length > 0 ? Math.min(...waiting.map((c) => c.expiresAt)) : null;
  const ring = waiting.length > 0 || cancelled.length > 0;

  useEffect(() => {
    if (ring) startCallAlarm(sound);
    else stopCallAlarm();
  }, [ring, sound]);

  // 응답 대기 시간이 끝나면 (서버 TIMEOUT 처리 전이라도) 소리를 멈춘다
  useEffect(() => {
    if (nextExpiry === null) return;
    const timer = setTimeout(() => setTick((t) => t + 1), Math.max(0, nextExpiry - Date.now()) + 50);
    return () => clearTimeout(timer);
  }, [nextExpiry, tick]);

  // 로그아웃·화면 이탈 시 정리
  useEffect(() => () => stopCallAlarm(), []);
}

/** 알람 상태 (소리 막힘 안내 표시용) */
export function useAlarmState(): AlarmState {
  const [s, setS] = useState<AlarmState>({ wanted: false, playing: false, blocked: false });
  useEffect(() => subscribeAlarm(setS), []);
  return s;
}
