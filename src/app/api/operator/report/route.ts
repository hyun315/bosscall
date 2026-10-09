import type { Query } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOperator } from "@/lib/server/auth";
import { badRequest, route } from "@/lib/server/http";
import { aggregateTrips, reportCsv, REPORT_DIMENSIONS, REPORT_MIN_COUNT, type ReportDimension } from "@/lib/tripData";
import type { TripStatDoc } from "@/types/domain";

const MAX_ROWS = 50_000;

/**
 * 익명 운행 통계 리포트 (CSV)
 *   ?dims=month,dropoffCategory   묶는 기준
 *   &from=2026-10&to=2026-12       월 범위 (그룹 시간대 기준)
 *   &min=5                         이 건수 미만 묶음은 제외 (최소 5)
 */
export const GET = route(async (req) => {
  await requireOperator(req);
  const url = new URL(req.url);
  const dims = (url.searchParams.get("dims") ?? "month,dropoffCategory")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as ReportDimension[];
  if (dims.length === 0 || dims.some((d) => !(REPORT_DIMENSIONS as readonly string[]).includes(d))) {
    throw badRequest("val.invalid", { field: "dims" });
  }
  const month = /^\d{4}-\d{2}$/;
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if ((from && !month.test(from)) || (to && !month.test(to))) throw badRequest("val.invalid", { field: "from/to" });
  // 운영자도 최소 묶음 기준 아래로는 내릴 수 없다
  const min = Math.max(REPORT_MIN_COUNT, Number(url.searchParams.get("min") ?? REPORT_MIN_COUNT) || REPORT_MIN_COUNT);

  let q: Query = adminDb().collection("tripStats");
  if (from) q = q.where("month", ">=", from);
  if (to) q = q.where("month", "<=", to);
  const snap = await q.limit(MAX_ROWS).get();
  const stats = snap.docs.map((d) => d.data() as TripStatDoc);
  const { rows, suppressedTrips, totalTrips } = aggregateTrips(stats, dims, min);
  return {
    csv: reportCsv(dims, rows),
    totalTrips,
    suppressedTrips,
    groups: rows.length,
    truncated: snap.size >= MAX_ROWS,
    preview: rows.slice(0, 20),
  };
});
