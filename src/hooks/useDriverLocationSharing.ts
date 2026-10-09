"use client";
import { useEffect, useState } from "react";
import { useLiveDoc } from "@/hooks/useLive";
import {
  getShareState,
  startLocationSharing,
  stopLocationSharing,
  subscribeShareState,
} from "@/services/client/locationSharing";
import type { DriverDoc } from "@/types/domain";

/**
 * 기사 계정: 근무 중 + 공유 켜짐이면 위치 전송을 시작하고, 아니면 멈춘다.
 * (app) 레이아웃에서 한 번만 사용 — 호출 화면에 있을 때도 계속 동작한다.
 */
export function useDriverLocationSharing(groupId: string | null, driverId: string | null): void {
  const driver = useLiveDoc<DriverDoc>(groupId && driverId ? `groups/${groupId}/drivers/${driverId}` : null);
  const shouldShare = Boolean(groupId && driver.data?.currentSessionId && driver.data?.locationSharing);
  useEffect(() => {
    if (shouldShare && groupId) startLocationSharing(groupId);
    else stopLocationSharing();
  }, [shouldShare, groupId]);
  useEffect(() => () => stopLocationSharing(), []);
}

export function useShareStatus() {
  const [s, setS] = useState(getShareState);
  useEffect(() => subscribeShareState(setS), []);
  return s;
}
