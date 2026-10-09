"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import { EmptyState, LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { useSession } from "@/hooks/useSession";
import { acceptInvite, previewInvite, type InvitePreview } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { useI18n } from "@/i18n/client";
import { LanguagePicker } from "@/components/common/LanguagePicker";

/** 초대 수락 — /invite/{code} */
export default function InvitePage() {
  const params = useParams<{ code: string }>();
  const code = params?.code ?? "";
  const { status, me, signOut } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "signed-out") router.replace(`/login?next=${encodeURIComponent(`/invite/${code}`)}`);
  }, [status, code, router]);

  useEffect(() => {
    if (status === "loading" || status === "signed-out" || !code) return;
    previewInvite(code)
      .then(setPreview)
      .catch((e) => setError(errorMessage(e)));
  }, [status, code]);

  const accept = async () => {
    setBusy(true);
    try {
      await acceptInvite(code);
      toast(t("inv.connected"), "success");
      router.replace("/home");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || status === "signed-out" || (!preview && !error)) return <LoadingState full />;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 pb-[calc(32px+var(--safe-bottom))] pt-[calc(32px+var(--safe-top))]">
      {error || !preview ? (
        <EmptyState icon="🔗" title={t("inv.cannotCheck")} description={error ?? undefined} />
      ) : preview.status !== "VALID" ? (
        <EmptyState
          icon={preview.status === "ALREADY_MEMBER" ? "✅" : "⌛"}
          title={
            preview.status === "ALREADY_MEMBER"
              ? t("inv.alreadyIn", { group: preview.groupName })
              : preview.status === "USED"
                ? t("err.inviteUsed")
                : t("inv.expired")
          }
          description={
            preview.status === "ALREADY_MEMBER"
              ? undefined
              : t("inv.askNew", { name: preview.inviterName ?? t("role.OWNER") })
          }
          action={
            preview.status === "ALREADY_MEMBER" ? (
              <Button block onClick={() => router.replace("/home")}>
                {t("common.home")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="card p-6">
          <div className="mb-5">
            <LanguagePicker variant="compact" />
          </div>
          <p className="text-sm font-semibold text-action">{t("invite.shareTitle")}</p>
          <h1 className="mt-2 text-2xl font-bold leading-snug text-ink">
            {preview.role === "DRIVER"
              ? t("inv.joinAsDriver", { group: preview.groupName })
              : t("inv.joinAsMember", { group: preview.groupName })}
          </h1>
          <dl className="mt-5 space-y-2 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-ink-sub">{t("inv.inviter")}</dt>
              <dd className="font-semibold">{preview.inviterName ?? t("role.OWNER")}</dd>
            </div>
            {preview.driverName && (
              <div className="flex justify-between">
                <dt className="text-ink-sub">{t("drivers.nameLabel")}</dt>
                <dd className="font-semibold">{preview.driverName}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-sub">{t("inv.myAccount")}</dt>
              <dd className="font-semibold">{me?.email ?? me?.name}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-ink-sub">
            {preview.role === "DRIVER"
              ? t("inv.driverNote")
              : t("inv.memberNote")}
          </p>
          <Button block size="cta" className="mt-6" loading={busy} onClick={() => void accept()}>
            {t("inv.connect")}
          </Button>
          <button onClick={() => void signOut()} className="mt-3 w-full py-2 text-sm text-ink-sub underline">
            {t("common.otherAccount")}
          </button>
        </div>
      )}
    </main>
  );
}
