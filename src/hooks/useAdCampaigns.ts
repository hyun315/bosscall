"use client";
import { w, useLiveQuery } from "@/hooks/useLive";
import type { AdCampaignDoc } from "@/lib/ads";

/**
 * 끝나지 않은 승인 광고. 여러 광고 자리가 같은 조건으로 구독하면 Firestore SDK가 연결 하나로 묶는다.
 * 조건 값은 하루 단위로만 바뀌게 해서 구독을 다시 만들지 않는다.
 */
export function useAdCampaigns(enabled: boolean): AdCampaignDoc[] {
  const day = Math.floor(Date.now() / 86400_000) * 86400_000;
  return useLiveQuery<AdCampaignDoc>(enabled ? "adCampaigns" : null, [w("endAt", ">", day)]).data;
}
