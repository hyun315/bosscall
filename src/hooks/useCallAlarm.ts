"use client";
import { useEffect, useState } from "react";
import { isPending } from "@/lib/callStateMachine";
import { installAlarmUnlock, startCallAlarm, stopCallAlarm, subscribeAlarm, type AlarmState } from "@/services/client/alarm";
import type { CallDoc } from "@/types/domain";

/**
 * 기사 앱: 나에게 온 호출이 응답을 기다리는 동안(전달 전·전달됨) 알람을 계속 울린다.
 * 수락·거절·취소·시간 초과로 상태가 바뀌면 실시간 구독으로 바로 멈춘다.
 */
export function useIncomingCallAlarm(calls: CallDoc[], driverId: string | null, enabled: boolean): void {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (enabled) installAlarmUnlock();
  }, [enabled]);

  const now = Date.now();
  const waiting = enabled
    ? calls.filter((c) => c.driverId === driverId && isPending(c.status) && c.expiresAt > now)
    : [];
  const nextExpiry = waiting.length > 0 ? Math.min(...waiting.map((c) => c.expiresAt)) : null;
  const ring = waiting.length > 0;

  useEffect(() => {
    if (ring) startCallAlarm();
    else stopCallAlarm();
  }, [ring]);

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
