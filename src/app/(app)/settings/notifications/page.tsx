"use client";
import { useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { PushPrompt } from "@/components/common/PushPrompt";
import { useToast } from "@/components/common/Toast";
import { useReadySession } from "@/hooks/useSession";
import { updateMe } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import type { NotificationPrefs } from "@/types/domain";
import { useI18n } from "@/i18n/client";
import type { MsgKey } from "@/i18n/index";

/** 알림 설정 — 기기별 푸시 켜기 + 알림 종류 선택 */
export default function NotificationSettingsPage() {
  const { groupId, me, role } = useReadySession();
  const toast = useToast();
  const { t } = useI18n();
  const prefs: NotificationPrefs = me.notificationPrefs ?? { callUpdates: true, workEvents: true };
  const [saving, setSaving] = useState<keyof NotificationPrefs | null>(null);

  const toggle = async (key: keyof NotificationPrefs) => {
    setSaving(key);
    try {
      await updateMe({ notificationPrefs: { [key]: !prefs[key] } });
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(null);
    }
  };

  const rows: Array<{ key: keyof NotificationPrefs; label: MsgKey; desc: MsgKey }> =
    role === "DRIVER"
      ? [{ key: "callUpdates", label: "notifSet.driverCancel", desc: "notifSet.driverCancelDesc" }]
      : [
          { key: "callUpdates", label: "notifSet.callResults", desc: "notifSet.callResultsDesc" },
          { key: "workEvents", label: "notifSet.work", desc: "notifSet.workDesc" },
        ];

  return (
    <>
      <AppHeader title={t("settings.notifications")} back={role === "DRIVER" ? "/profile" : "/settings"} />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-3">
        <PushPrompt groupId={groupId} variant="panel" />
        {role === "DRIVER" && (
          <p className="px-1 text-sm leading-relaxed text-ink-sub">{t("notifSet.driverNote")}</p>
        )}
        <div className="card divide-y divide-line">
          {rows.map((r) => (
            <label key={r.key} className="flex min-h-[64px] cursor-pointer items-center gap-3 px-4 py-3">
              <span className="flex-1">
                <span className="block text-[15px] font-semibold text-ink">{t(r.label)}</span>
                <span className="block text-sm text-ink-sub">{t(r.desc)}</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                className="h-6 w-11 cursor-pointer accent-action"
                checked={prefs[r.key]}
                disabled={saving === r.key}
                onChange={() => void toggle(r.key)}
              />
            </label>
          ))}
        </div>
      </main>
    </>
  );
}
