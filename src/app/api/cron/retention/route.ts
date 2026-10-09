import { NextResponse } from "next/server";
import { clearExpiredGoogleCoords } from "@/services/server/retention";

export const dynamic = "force-dynamic";

/** Vercel Cron 전용 — Authorization: Bearer ${CRON_SECRET} (Vercel이 자동으로 붙인다) */
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  }
  try {
    const result = await clearExpiredGoogleCoords();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron] retention", e);
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}
