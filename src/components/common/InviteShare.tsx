"use client";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { createInvite } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { useI18n } from "@/i18n/client";
import { translate } from "@/i18n/index";

/**
 * 초대 링크 생성·공유 — 기사/가족 초대 (§1 Driver 초대, Family Member 초대)
 * WhatsApp 공유는 단순 링크 공유(wa.me)이며 WhatsApp API 연동이 아니다.
 */
export function InviteShare({
  groupId,
  groupName,
  role,
  driverId,
  targetName,
}: {
  groupId: string;
  groupName: string;
  role: "DRIVER" | "MEMBER";
  driverId: string | null;
  targetName?: string;
}) {
  const toast = useToast();
  const { t, locale } = useI18n();
  const [invite, setInvite] = useState<{ url: string; expiresAt: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const make = async () => {
    setBusy(true);
    try {
      const r = await createInvite(groupId, role, driverId);
      setInvite({ url: r.url || `${window.location.origin}/invite/${r.code}`, expiresAt: r.expiresAt });
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  // 기사 초대는 받는 기사님이 읽을 수 있도록 인도네시아어 문구를 함께 넣는다
  const inviteKey = role === "DRIVER" ? ("invite.msgDriver" as const) : ("invite.msgMember" as const);
  const params = { group: groupName, name: targetName ?? "" };
  const message = invite
    ? [
        t(inviteKey, params),
        ...(role === "DRIVER" && locale !== "id" ? ["", translate("id", inviteKey, params)] : []),
        invite.url,
      ].join("\n")
    : "";

  const copy = async () => {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.url);
      toast(t("invite.copied"), "success");
    } catch {
      toast(t("invite.copyFailed"), "error");
    }
  };

  const share = async () => {
    if (!invite) return;
    const nav = navigator as Navigator & { share?: (d: { text: string; title?: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: t("invite.shareTitle"), text: message });
      } catch {
        /* 사용자가 취소 */
      }
    } else {
      await copy();
    }
  };

  if (!invite) {
    return (
      <Button block loading={busy} onClick={() => void make()} icon={<span aria-hidden>✉️</span>}>
        {role === "DRIVER" ? t("invite.makeDriver") : t("invite.makeMember")}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-btn border border-line bg-bg px-4 py-3">
        <p className="break-all text-sm font-medium text-ink">{invite.url}</p>
        <p className="mt-1 text-xs text-ink-sub">{t("invite.validity")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[48px] items-center justify-center rounded-btn bg-[#25D366] px-4 font-semibold text-white active:brightness-95"
        >
          WhatsApp
        </a>
        <Button variant="secondary" size="md" onClick={() => void share()}>
          {t("invite.shareCopy")}
        </Button>
      </div>
    </div>
  );
}
