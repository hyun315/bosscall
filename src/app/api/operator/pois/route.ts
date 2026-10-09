import { adminDb } from "@/lib/firebase/admin";
import { requireOperator } from "@/lib/server/auth";
import { badRequest, readJson, route } from "@/lib/server/http";
import { parsePoiCsv } from "@/lib/tripData";
import { requireRecord } from "@/lib/validation";
import { clearPoiCache } from "@/services/server/tripData";
import { PLACE_CATEGORIES, type PoiDoc } from "@/types/domain";

const MAX_POIS = 3000;

export const GET = route(async (req) => {
  await requireOperator(req);
  const snap = await adminDb().collection("pois").orderBy("name").limit(MAX_POIS).get();
  return { pois: snap.docs.map((d) => d.data() as PoiDoc) };
});

/** CSV 등록. replace=true 면 기존 목록을 지우고 새로 넣는다 */
export const POST = route(async (req) => {
  await requireOperator(req);
  const body = requireRecord(await readJson(req));
  if (typeof body.csv !== "string" || body.csv.length > 1_000_000) throw badRequest("val.invalid", { field: "csv" });
  const { rows, errors } = parsePoiCsv(body.csv, PLACE_CATEGORIES);
  if (errors.length > 0) return { saved: 0, errors };
  if (rows.length > MAX_POIS) throw badRequest("val.invalid", { field: "csv" });

  const db = adminDb();
  const col = db.collection("pois");
  if (body.replace === true) {
    const old = await col.limit(MAX_POIS * 2).get();
    for (let i = 0; i < old.docs.length; i += 400) {
      const b = db.batch();
      old.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
      await b.commit();
    }
  }
  const now = Date.now();
  for (let i = 0; i < rows.length; i += 400) {
    const b = db.batch();
    for (const r of rows.slice(i, i + 400)) {
      const ref = col.doc();
      const doc: PoiDoc = { id: ref.id, ...r, updatedAt: now };
      b.set(ref, doc);
    }
    await b.commit();
  }
  clearPoiCache();
  return { saved: rows.length, errors: [] };
});
