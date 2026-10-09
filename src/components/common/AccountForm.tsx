"use client";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { useToast } from "@/components/common/Toast";
import { useReadySession } from "@/hooks/useSession";
import { updateMe } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { useI18n } from "@/i18n/client";

/** 계정 — 이름·전화번호(기사/가족이 전화·WhatsApp 연결에 사용) */
export function AccountForm() {
  const { me } = useReadySession();
  const toast = useToast();
  const { t } = useI18n();
  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateMe({ name: name.trim(), phone: phone.trim() || null });
      toast(t("common.saved"), "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-4 p-4">
      <div className="flex items-center gap-3">
        <MemberAvatar name={me.name} url={me.avatarUrl} size={48} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{me.name}</p>
          <p className="truncate text-sm text-ink-sub">{me.email}</p>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="ac-name">{t("account.nameLabel")}</label>
        <input id="ac-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </div>
      <div>
        <label className="label" htmlFor="ac-phone">{t("account.phoneLabel")}</label>
        <input id="ac-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="0812-3456-7890" />
      </div>
      <Button block loading={busy} disabled={!name.trim()} onClick={() => void save()}>
        {t("common.save")}
      </Button>
    </div>
  );
}
