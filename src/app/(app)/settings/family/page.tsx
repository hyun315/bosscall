"use client";
import { useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { InviteShare } from "@/components/common/InviteShare";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { ErrorState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { DriverCard } from "@/components/driver/DriverCard";
import { useDrivers, useMembers } from "@/hooks/useGroupData";
import { useReadySession } from "@/hooks/useSession";
import { isOwner, PLAN_LIMITS, ROLE_LABEL } from "@/lib/permissions";
import { removeMember } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import type { MemberDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/** §8 FAMILY SHARING — 우리 기사 + 가족 구성원 + 가족 초대 */
export default function FamilyPage() {
  const { groupId, group, role, uid, tz } = useReadySession();
  const toast = useToast();
  const { t } = useI18n();
  const members = useMembers(groupId);
  const drivers = useDrivers(groupId);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<MemberDoc | null>(null);
  const [busy, setBusy] = useState(false);

  const family = members.data.filter((m) => m.role !== "DRIVER");
  const memberCount = family.filter((m) => m.role === "MEMBER").length;
  const limit = PLAN_LIMITS[group.plan].maxFamilyMembers;

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await removeMember(groupId, removing.userId);
      toast(t("family.removedToast", { name: removing.displayName }), "success");
      setRemoving(null);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader title={t("settings.family")} back="/settings" />
      <main className="mx-auto max-w-md space-y-5 px-4 pb-6 pt-3">
        <section>
          <h2 className="section-title">{t("drivers.title")}</h2>
          <div className="space-y-2">
            {drivers.data.map((d) => (
              <DriverCard key={d.id} driver={d} tz={tz} href={`/drivers/${d.id}`} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">{t("settings.family")}</h2>
          {members.loading ? (
            <LoadingState />
          ) : members.error ? (
            <ErrorState title={members.error} />
          ) : (
            <div className="card divide-y divide-line overflow-hidden">
              {family.map((m) => (
                <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
                  <MemberAvatar name={m.displayName} url={m.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-ink">
                      {m.displayName}
                      {m.userId === uid ? ` ${t("common.me")}` : ""}
                    </p>
                    <p className="text-sm text-ink-sub">{t(ROLE_LABEL[m.role])}</p>
                  </div>
                  {isOwner(role) && m.role === "MEMBER" && (
                    <button onClick={() => setRemoving(m)} className="min-h-[40px] px-2 text-sm font-semibold text-danger">
                      {t("family.remove")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {isOwner(role) &&
          (memberCount < limit ? (
            <Button block onClick={() => setInviting(true)}>
              + {t("family.invite")}
            </Button>
          ) : (
            <p className="text-center text-sm text-ink-sub">{t("family.limitReached", { n: limit })}</p>
          ))}
        {!isOwner(role) && <p className="text-center text-sm text-ink-sub">{t("family.ownerOnly")}</p>}
      </main>

      {inviting && (
        <BottomSheet open onClose={() => setInviting(false)} title={t("family.invite")}>
          <p className="mb-4 text-[15px] leading-relaxed text-ink-sub">
            {t("family.inviteDesc")}
          </p>
          <InviteShare groupId={groupId} groupName={group.name} role="MEMBER" driverId={null} />
        </BottomSheet>
      )}
      <ConfirmModal
        open={removing !== null}
        title={t("family.removeConfirmTitle", { name: removing?.displayName ?? "" })}
        message={t("family.removeConfirmBody")}
        confirmLabel={t("family.remove")}
        tone="danger"
        loading={busy}
        onConfirm={() => void remove()}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
