"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import { InviteShare } from "@/components/common/InviteShare";
import { LoadingState } from "@/components/common/States";
import { useToast } from "@/components/common/Toast";
import { useSession } from "@/hooks/useSession";
import { createGroup } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { SUPPORTED_TIMEZONES } from "@/lib/validation";
import { useI18n } from "@/i18n/client";
import type { MsgKey } from "@/i18n/index";
import { LanguagePicker } from "@/components/common/LanguagePicker";

const TZ_LABEL: Record<string, MsgKey> = {
  "Asia/Jakarta": "tz.jakarta",
  "Asia/Makassar": "tz.makassar",
  "Asia/Jayapura": "tz.jayapura",
  "Asia/Seoul": "tz.seoul",
  "Asia/Singapore": "tz.singapore",
  "Asia/Ho_Chi_Minh": "tz.hcm",
};

/**
 * §20 Onboarding — 1) 가족/조직 만들기 2) 기사 연결 3) 첫 호출
 * (S03 Create Group 포함)
 */
export default function OnboardingPage() {
  const { status, me, signOut } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [timezone, setTimezone] = useState<string>("Asia/Jakarta");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ groupId: string; driverId: string } | null>(null);
  const inFlow = useRef(false);

  useEffect(() => {
    if (status === "signed-out") router.replace("/login");
    if (status === "ready" && !inFlow.current) router.replace("/home");
  }, [status, router]);

  useEffect(() => {
    if (me && !name) setName(t("onb.defaultGroupName", { name: me.name }));
    // 최초 1회 기본값
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    inFlow.current = true;
    try {
      const r = await createGroup({
        name: name.trim(),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim() || null,
        timezone,
      });
      setCreated(r);
      setStep(2);
    } catch (err) {
      inFlow.current = false;
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || status === "signed-out") return <LoadingState full />;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-[calc(32px+var(--safe-bottom))] pt-[calc(32px+var(--safe-top))]">
      <ol className="mb-8 flex gap-2" aria-label={t("onb.steps")}>
        {[t("onb.step1"), t("home.stepDriver"), t("home.stepFirstCall")].map((label, i) => (
          <li key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${i < step ? "bg-action" : "bg-line"}`} />
            <p className={`mt-1.5 text-xs font-semibold ${i + 1 === step ? "text-action" : "text-ink-faint"}`}>
              {i + 1}. {label}
            </p>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <form onSubmit={submit} className="space-y-5">
          <LanguagePicker variant="compact" />
          <div>
            <h1 className="text-2xl font-bold text-ink">{t("onb.title")}</h1>
            <p className="mt-1 text-[15px] text-ink-sub">{t("onb.subtitle")}</p>
          </div>
          <div>
            <label className="label" htmlFor="g-name">
              {t("onb.groupName")}
            </label>
            <input id="g-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          </div>
          <div>
            <label className="label" htmlFor="d-name">
              {t("drivers.nameLabel")}
            </label>
            <input
              id="d-name"
              className="field"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder={t("onb.driverPlaceholder")}
              maxLength={40}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="d-phone">
              {t("onb.driverPhone")}
            </label>
            <input
              id="d-phone"
              className="field"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="0812-3456-7890"
              inputMode="tel"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label" htmlFor="tz">
              {t("onb.timezone")}
            </label>
            <select id="tz" className="field" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {SUPPORTED_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {TZ_LABEL[tz] ? t(TZ_LABEL[tz]) : tz}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" block loading={busy} disabled={!name.trim() || !driverName.trim()}>
            {t("onb.start")}
          </Button>
          <div className="rounded-card bg-action-soft p-4 text-sm leading-relaxed text-navy">
            <p className="font-semibold">{t("onb.gotInvite")}</p>
            <p className="mt-1 text-ink-sub">
              {t("onb.gotInviteDesc")}
            </p>
          </div>
          <button type="button" onClick={() => void signOut()} className="w-full py-2 text-sm text-ink-sub underline">
            {t("common.otherAccount")}
          </button>
        </form>
      )}

      {step === 2 && created && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-ink">{t("onb.connectTitle", { name: driverName })}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-sub">
              {t("onb.connectDesc")}
            </p>
          </div>
          <InviteShare groupId={created.groupId} groupName={name} role="DRIVER" driverId={created.driverId} targetName={driverName} />
          <Button variant="ghost" block onClick={() => router.replace("/home")}>
            {t("onb.later")}
          </Button>
        </div>
      )}
    </main>
  );
}
