"use client";
import { useState } from "react";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { ConsentOptions, type ConsentChoice } from "@/components/privacy/ConsentOptions";
import { CONSENT_VERSION } from "@/lib/tripData";
import { updateMe } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import type { UserDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/** 아직 묻지 않았거나 동의 문구가 바뀐 경우 */
export function needsConsentPrompt(me: UserDoc): boolean {
  const c = me.consents;
  return !c || c.analytics.version !== CONSENT_VERSION || c.marketing.version !== CONSENT_VERSION;
}

/**
 * 첫 사용 시 한 번 묻는 선택 동의 (사장님·가족). 닫거나 그대로 계속하면 "동의 안 함"으로 저장되어 다시 묻지 않는다.
 */
export function ConsentSheet({ me }: { me: UserDoc }) {
  const { t } = useI18n();
  const toast = useToast();
  const [open, setOpen] = useState(() => needsConsentPrompt(me));
  const [choice, setChoice] = useState<ConsentChoice>({
    analytics: me.consents?.analytics.granted ?? false,
    marketing: me.consents?.marketing.granted ?? false,
  });
  const [saving, setSaving] = useState(false);

  const save = async (c: ConsentChoice) => {
    setSaving(true);
    try {
      await updateMe({ consents: c });
      setOpen(false);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={() => void save({ analytics: false, marketing: false })} title={t("privacy.sheetTitle")}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-sub">{t("privacy.intro")}</p>
        <ConsentOptions value={choice} onChange={setChoice} disabled={saving} />
        <p className="text-xs leading-relaxed text-ink-faint">{t("privacy.serviceNote")}</p>
        <Button size="cta" block loading={saving} onClick={() => void save(choice)}>
          {t("privacy.continue")}
        </Button>
      </div>
    </BottomSheet>
  );
}
