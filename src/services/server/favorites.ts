import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { canDeleteFavorite } from "@/lib/permissions";
import { track } from "@/lib/server/analytics";
import { conflict, forbidden, notFound } from "@/lib/server/http";
import { geoExpiryFor } from "@/lib/tripData";
import type { FavoriteLocationDoc, MemberDoc, PlaceInput } from "@/types/domain";

const MAX_FAVORITES = 30;

export async function createFavorite(
  groupId: string,
  member: MemberDoc,
  input: { name: string; place: PlaceInput },
): Promise<string> {
  const db = adminDb();
  const col = db.collection(`groups/${groupId}/favorites`);
  const count = await col.count().get();
  if (count.data().count >= MAX_FAVORITES) {
    throw conflict("err.favoriteLimit", "FAVORITE_LIMIT", { max: MAX_FAVORITES });
  }
  const ref = col.doc();
  const doc: FavoriteLocationDoc = {
    id: ref.id,
    groupId,
    createdBy: member.userId,
    name: input.name,
    address: input.place.address,
    latitude: input.place.lat,
    longitude: input.place.lng,
    placeId: input.place.placeId,
    source: input.place.source ?? "google",
    category: input.place.category ?? null,
    geoExpiresAt: geoExpiryFor([input.place], Date.now()),
    coordsCleared: false,
    createdAt: Date.now(),
  };
  await ref.create(doc);
  await track("favorite_created", member.userId, groupId);
  return ref.id;
}

export async function deleteFavorite(groupId: string, favoriteId: string, member: MemberDoc): Promise<void> {
  const ref = adminDb().doc(`groups/${groupId}/favorites/${favoriteId}`);
  const snap = await ref.get();
  if (!snap.exists) throw notFound("err.favoriteNotFound");
  const fav = snap.data() as FavoriteLocationDoc;
  if (!canDeleteFavorite(member.role, member.userId, fav.createdBy)) {
    throw forbidden("err.favoriteOwnOnly");
  }
  await ref.delete();
}
