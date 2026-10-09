"use client";
import { AppHeader } from "@/components/common/AppHeader";
import { AccountForm } from "@/components/common/AccountForm";
import { Button } from "@/components/common/Button";
import { useReadySession } from "@/hooks/useSession";
import { useI18n } from "@/i18n/client";
import { LanguagePicker } from "@/components/common/LanguagePicker";

export default function AccountPage() {
  const { signOut } = useReadySession();
  const { t } = useI18n();
  return (
    <>
      <AppHeader title={t("settings.account")} back="/settings" />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-3">
        <LanguagePicker />
        <AccountForm />
        <Button variant="ghost" block onClick={() => void signOut()}>
          {t("common.logout")}
        </Button>
      </main>
    </>
  );
}
