import { NextResponse } from "next/server";
import { listActiveCampaigns } from "@/services/server/ads";

export const dynamic = "force-dynamic";

/**
 * 게재 중·예정 광고 목록 (공개 정보만: 업체명·이미지 주소·링크·기간).
 * 서버가 읽어 주므로 Firestore 보안 규칙을 따로 열 필요가 없다. CDN 에 1분 캐시.
 */
export async function GET(): Promise<Response> {
  try {
    const campaigns = await listActiveCampaigns();
    return NextResponse.json(
      { campaigns },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (e) {
    console.error("[ad-campaigns]", e);
    return NextResponse.json({ campaigns: [] }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
