"use client";
import Link from "next/link";
import { AppHeader } from "@/components/common/AppHeader";
import { AccountForm } from "@/components/common/AccountForm";
import { Button } from "@/components/common/Button";
import { useLiveDoc } from "@/hooks/useLive";
import { useReadySession } from "@/hooks/useSession";
import type { DriverDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import { LanguagePicker } from "@/components/common/LanguagePicker";

/** §2.2 Driver Profile — 기사 정보 */
export default function ProfilePage() {
  const { groupId, member, group, signOut } = useReadySession();
  const { t } = useI18n();
  const driver = useLiveDoc<DriverDoc>(member.driverId ? `groups/${groupId}/drivers/${member.driverId}` : null);
  return (
    <>
      <AppHeader title={t("nav.profile")} />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-3">
        <div className="card divide-y divide-line">
          <div className="flex justify-between px-4 py-3.5 text-[15px]">
            <span className="text-ink-sub">{t("profile.group")}</span>
            <span className="font-semibold">{group.name}</span>
          </div>
          <div className="flex justify-between px-4 py-3.5 text-[15px]">
            <span className="text-ink-sub">{t("drivers.nameLabel")}</span>
            <span className="font-semibold">{driver.data?.displayName ?? "—"}</span>
          </div>
          <div className="flex justify-between px-4 py-3.5 text-[15px]">
            <span className="text-ink-sub">{t("profile.phone")}</span>
            <span className="font-semibold">{driver.data?.phone ?? "—"}</span>
          </div>
        </div>
        <Link
          href="/settings/notifications"
          className="card flex min-h-[56px] items-center gap-3 px-4 active:bg-bg"
        >
          <span aria-hidden>🔔</span>
          <span className="flex-1 font-semibold">{t("settings.notifications")}</span>
          <span className="text-ink-faint" aria-hidden>›</span>
        </Link>
        <LanguagePicker />
        <AccountForm />
        <Button variant="ghost" block onClick={() => void signOut()}>
          {t("common.logout")}
        </Button>
      </main>
    </>
  );
}
