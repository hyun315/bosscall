"use client";
import { useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { FavoriteLocationCard, LocationCard } from "@/components/location/LocationCard";
import { LocationPicker } from "@/components/location/LocationPicker";
import { useFavorites } from "@/hooks/useGroupData";
import { useReadySession } from "@/hooks/useSession";
import { canDeleteFavorite, canManageFavorites } from "@/lib/permissions";
import { createFavorite, deleteFavorite } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { PLACE_CATEGORIES, type FavoriteLocationDoc, type PlaceCategory, type PlaceInput } from "@/types/domain";
import { useI18n } from "@/i18n/client";

const PRESETS = ["Home", "Office", "School", "Country Club"];
/** 이름 예시를 누르면 분류도 함께 고른다 */
const PRESET_CATEGORY: Record<string, PlaceCategory> = { Home: "HOME", Office: "OFFICE", School: "SCHOOL", "Country Club": "GOLF" };

/** §11 장소 관리 — 즐겨찾기 (Home / Office / School …) */
export default function PlacesPage() {
  const { groupId, role, uid } = useReadySession();
  const toast = useToast();
  const { t } = useI18n();
  const favorites = useFavorites(groupId);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<FavoriteLocationDoc | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteFavorite(groupId, deleting.id);
      toast(t("common.deleted"), "success");
      setDeleting(null);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader title={t("settings.places")} back="/settings" />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-3">
        {favorites.loading ? (
          <LoadingState />
        ) : favorites.error ? (
          <ErrorState title={favorites.error} />
        ) : favorites.data.length === 0 ? (
          <EmptyState icon="⭐" title={t("places.empty")} description={t("places.emptyDesc")} />
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {favorites.data.map((f) => (
              <FavoriteLocationCard
                key={f.id}
                name={f.name}
                address={f.address}
                trailing={
                  canDeleteFavorite(role, uid, f.createdBy) ? (
                    <button onClick={() => setDeleting(f)} className="min-h-[48px] px-4 text-sm font-semibold text-danger">
                      {t("common.delete")}
                    </button>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
        {canManageFavorites(role) && (
          <Button block onClick={() => setAdding(true)}>
            + {t("places.add")}
          </Button>
        )}
      </main>

      {adding && <AddFavoriteSheet groupId={groupId} onClose={() => setAdding(false)} />}
      <ConfirmModal
        open={deleting !== null}
        title={t("places.deleteConfirm", { name: deleting?.name ?? "" })}
        confirmLabel={t("common.delete")}
        tone="danger"
        loading={busy}
        onConfirm={() => void remove()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

function AddFavoriteSheet({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const toast = useToast();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [place, setPlace] = useState<PlaceInput | null>(null);
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!place) return;
    setBusy(true);
    try {
      await createFavorite(groupId, name.trim(), { ...place, category });
      toast(t("places.savedToast"), "success");
      onClose();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} title={t("places.add")}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="fav-name">{t("places.nameLabel")}</label>
          <input id="fav-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder={t("places.namePlaceholder")} />
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => {
                  setName(p);
                  setCategory(PRESET_CATEGORY[p] ?? null);
                }} className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-sub">
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label">{t("cat.label")}</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("cat.label")}>
            {PLACE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={category === c}
                onClick={() => setCategory(category === c ? null : c)}
                className={`min-h-[40px] rounded-full border px-3 text-sm ${
                  category === c ? "border-action bg-action-soft font-semibold text-action" : "border-line text-ink-sub"
                }`}
              >
                {t(`cat.${c}`)}
              </button>
            ))}
          </div>
        </div>
        {place ? (
          <div className="card p-4">
            <LocationCard
              kind="pickup"
              name={place.name}
              address={place.address}
              action={
                <button onClick={() => setPlace(null)} className="text-sm font-semibold text-action">
                  {t("common.change")}
                </button>
              }
            />
          </div>
        ) : (
          <LocationPicker kind="pickup" groupId={groupId} favorites={[]} recents={[]} onPicked={setPlace} />
        )}
        <Button block loading={busy} disabled={!name.trim() || !place} onClick={() => void save()}>
          {t("common.save")}
        </Button>
      </div>
    </BottomSheet>
  );
}
