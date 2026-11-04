"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { useReadySession } from "@/hooks/useSession";
import { isOwner, ROLE_LABEL } from "@/lib/permissions";
import { SUPPORTED_TIMEZONES } from "@/lib/validation";
import { getOperatorStatus, updateGroup } from "@/services/client/actions";
import { errorMessage } from "@/services/client/api";
import { useI18n } from "@/i18n/client";
import type { MsgKey } from "@/i18n/index";
import { LOCALE_NAMES } from "@/i18n/core";

/** §2.1 Settings — 가족 구성원 · 장소 관리 · 알림 설정 · 계정 */
export default function SettingsPage() {
  const { group, role, me, member, signOut } = useReadySession();
  const { t, locale } = useI18n();
  const [editGroup, setEditGroup] = useState(false);
  // 운영자 여부는 거의 바뀌지 않으므로 이 탭(세션) 동안 기억해 두고 다시 묻지 않는다
  const opKey = `bosscall.operator.${member.userId}`;
  const [operator, setOperator] = useState(() => {
    try {
      return sessionStorage.getItem(opKey) === "1";
    } catch {
      return false;
    }
  });
  const [pendingAds, setPendingAds] = useState(0);
  useEffect(() => {
    // 운영자가 아닌 것으로 기억된 계정은 다시 묻지 않는다. 운영자는 검토 대기 수를 보러 매번 묻는다
    try {
      if (sessionStorage.getItem(opKey) === "0") return;
    } catch {
      /* 저장소 불가 — 그냥 묻는다 */
    }
    getOperatorStatus()
      .then((r) => {
        setOperator(r.operator);
        setPendingAds(r.pendingAds);
        try {
          sessionStorage.setItem(opKey, r.operator ? "1" : "0");
        } catch {
          /* 무시 */
        }
      })
      .catch(() => undefined);
  }, [opKey]);

  const items: Array<{ href: string; icon: string; label: MsgKey; value?: string }> = [
    { href: "/settings/family", icon: "👨‍👩‍👦", label: "settings.family" },
    { href: "/settings/places", icon: "⭐", label: "settings.places" },
    { href: "/settings/notifications", icon: "🔔", label: "settings.notifications" },
    { href: "/settings/privacy", icon: "🔒", label: "settings.privacy" },
    { href: "/settings/account", icon: "🌐", label: "settings.language", value: LOCALE_NAMES[locale] },
    { href: "/settings/account", icon: "👤", label: "settings.account" },
    // 사용 안내 — 기사는 인도네시아어 기사용, 그 외는 사용 설명서(차례·단추 모양·문제 해결)
    { href: role === "DRIVER" ? "/manual/driver" : "/manual", icon: "📖", label: "settings.guide" },
    { href: "/about", icon: "ℹ️", label: "about.title" },
  ];

  return (
    <>
      <AppHeader title={t("nav.settings")} />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-6 pt-3">
        <div className="card flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-ink">{group.name}</p>
            <p className="text-sm text-ink-sub">
              {me.name} · {t(ROLE_LABEL[role])} · {group.timezone}
            </p>
          </div>
          {isOwner(role) && (
            <Button size="sm" variant="secondary" onClick={() => setEditGroup(true)}>
              {t("common.edit")}
            </Button>
          )}
        </div>

        <nav className="card divide-y divide-line overflow-hidden">
          {items.map((i) => (
            <Link key={i.label} href={i.href} className="flex min-h-[56px] items-center gap-3 px-4 active:bg-bg">
              <span className="text-xl" aria-hidden>
                {i.icon}
              </span>
              <span className="flex-1 text-[15px] font-semibold text-ink">{t(i.label)}</span>
              {i.value && <span className="text-sm text-ink-sub">{i.value}</span>}
              <span className="text-ink-faint" aria-hidden>
                ›
              </span>
            </Link>
          ))}
        </nav>

        {operator && (
          <Link href="/operator" className="card flex min-h-[56px] items-center gap-3 px-4 active:bg-bg">
            <span className="text-xl" aria-hidden>
              📊
            </span>
            {/* 운영자 전용 메뉴 — 한국어로만 표시 */}
            <span className="flex-1 text-[15px] font-semibold text-ink">운영자 도구</span>
            {pendingAds > 0 && (
              <span className="rounded-full bg-danger-solid px-2 py-0.5 text-xs font-bold text-white">광고 신청 {pendingAds}</span>
            )}
            <span className="text-ink-faint" aria-hidden>
              ›
            </span>
          </Link>
        )}

        <Button variant="ghost" block onClick={() => void signOut()}>
          {t("common.logout")}
        </Button>
      </main>
      {editGroup && <GroupEditSheet onClose={() => setEditGroup(false)} />}
    </>
  );
}

function GroupEditSheet({ onClose }: { onClose: () => void }) {
  const { group, groupId } = useReadySession();
  const toast = useToast();
  const { t } = useI18n();
  const [name, setName] = useState(group.name);
  const [tz, setTz] = useState(group.timezone);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await updateGroup(groupId, { name: name.trim(), timezone: tz });
      toast(t("common.saved"), "success");
      onClose();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <BottomSheet open onClose={onClose} title={t("settings.groupTitle")}>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="ge-name">{t("settings.groupName")}</label>
          <input id="ge-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </div>
        <div>
          <label className="label" htmlFor="ge-tz">{t("settings.timezone")}</label>
          <select id="ge-tz" className="field" value={tz} onChange={(e) => setTz(e.target.value)}>
            {SUPPORTED_TIMEZONES.map((tzOpt) => (
              <option key={tzOpt} value={tzOpt}>
                {tzOpt}
              </option>
            ))}
          </select>
        </div>
        <Button block loading={busy} disabled={!name.trim()} onClick={() => void save()}>
          {t("common.save")}
        </Button>
      </div>
    </BottomSheet>
  );
}
