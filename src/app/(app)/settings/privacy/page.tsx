"use client";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { useToast } from "@/components/common/Toast";
import { ConsentOptions, type ConsentChoice } from "@/components/privacy/ConsentOptions";
import { useReadySession } from "@/hooks/useSession";
import { formatDate } from "@/lib/time";
import { updateMe } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { useI18n } from "@/i18n/client";

/** 개인정보·데이터 활용 — 선택 동의 변경 */
export default function PrivacySettingsPage() {
  const { me, group, role } = useReadySession();
  const { t, locale } = useI18n();
  const toast = useToast();
  const saved: ConsentChoice = {
    analytics: me.consents?.analytics.granted ?? false,
    marketing: me.consents?.marketing.granted ?? false,
  };
  const [choice, setChoice] = useState<ConsentChoice>(saved);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setChoice({ analytics: me.consents?.analytics.granted ?? false, marketing: me.consents?.marketing.granted ?? false });
  }, [me.consents?.analytics.granted, me.consents?.marketing.granted]);

  const change = async (next: ConsentChoice) => {
    setChoice(next);
    setSaving(true);
    try {
      await updateMe({ consents: next });
      toast(t("privacy.saved"), "success");
    } catch (e) {
      setChoice(saved);
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const at = me.consents?.analytics.at;
  return (
    <>
      <AppHeader title={t("settings.privacy")} back={role === "DRIVER" ? "/profile" : "/settings"} />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-3">
        <p className="px-1 text-sm leading-relaxed text-ink-sub">{t("privacy.intro")}</p>
        <ConsentOptions value={choice} onChange={(v) => void change(v)} disabled={saving} />
        {at && (
          <p className="px-1 text-xs text-ink-faint">{t("privacy.updatedAt", { date: formatDate(at, group.timezone, locale) })}</p>
        )}
        <div className="space-y-2 px-1 text-xs leading-relaxed text-ink-faint">
          <p>{t("privacy.serviceNote")}</p>
          <p>{t("privacy.googleNote")}</p>
        </div>
      </main>
    </>
  );
}
