import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/server/auth";
import { readJson, route } from "@/lib/server/http";
import { requireRecord } from "@/lib/validation";

/** 알림 읽음 처리. body: { ids?: string[] } — 없으면 전체 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const body = requireRecord(await readJson(req));
  const db = adminDb();
  const col = db.collection(`users/${user.uid}/notifications`);
  let refs;
  if (Array.isArray(body.ids)) {
    const ids = body.ids.filter((x): x is string => typeof x === "string" && /^[A-Za-z0-9]+$/.test(x)).slice(0, 100);
    refs = ids.map((id) => col.doc(id));
  } else {
    const snap = await col.where("read", "==", false).limit(200).get();
    refs = snap.docs.map((d) => d.ref);
  }
  if (refs.length === 0) return { updated: 0 };
  const batch = db.batch();
  for (const r of refs) batch.set(r, { read: true }, { merge: true });
  await batch.commit();
  return { updated: refs.length };
});
