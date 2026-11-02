"use client";
import { useEffect, useState } from "react";
import type { AdCampaignDoc } from "@/lib/ads";

/**
 * 게재 중·예정 광고. 여러 광고 자리가 한 번 받아 온 목록을 같이 쓰고, 2분이 지나면 다시 받는다.
 */
const REFRESH_MS = 2 * 60_000;
let cache: { at: number; data: AdCampaignDoc[] } | null = null;
let inflight: Promise<AdCampaignDoc[]> | null = null;

function load(): Promise<AdCampaignDoc[]> {
  if (cache && Date.now() - cache.at < REFRESH_MS) return Promise.resolve(cache.data);
  inflight ??= fetch("/api/ad-campaigns")
    .then((r) => (r.ok ? (r.json() as Promise<{ campaigns: AdCampaignDoc[] }>) : { campaigns: [] }))
    .then((j) => {
      cache = { at: Date.now(), data: j.campaigns ?? [] };
      return cache.data;
    })
    .catch(() => cache?.data ?? [])
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useAdCampaigns(enabled: boolean): AdCampaignDoc[] {
  const [data, setData] = useState<AdCampaignDoc[]>(() => cache?.data ?? []);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    void load().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return data;
}
