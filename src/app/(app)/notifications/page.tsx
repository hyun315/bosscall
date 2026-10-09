"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { lim, ob, useLiveQuery } from "@/hooks/useLive";
import { useReadySession } from "@/hooks/useSession";
import { formatDate, formatTime } from "@/lib/time";
import { markNotificationsRead } from "@/services/client/actions";
import type { NotificationDoc } from "@/types/domain";
import { useI18n } from "@/i18n/client";

/** 알림함 (§28 Phase 4 Notification center) */
export default function NotificationsPage() {
  const { uid, tz } = useReadySession();
  const { t, locale } = useI18n();
  const list = useLiveQuery<NotificationDoc>(`users/${uid}/notifications`, [ob("createdAt", "desc"), lim(50)]);
  const unreadCount = list.data.filter((n) => !n.read).length;

  // 화면을 열면 모두 읽음 처리
  useEffect(() => {
    if (unreadCount > 0) void markNotificationsRead().catch(() => undefined);
  }, [unreadCount]);

  return (
    <>
      <AppHeader title={t("header.notifications")} back showBell={false} />
      <main className="mx-auto max-w-md px-4 pb-6 pt-3">
        {list.loading ? (
          <LoadingState />
        ) : list.error ? (
          <ErrorState title={list.error} />
        ) : list.data.length === 0 ? (
          <EmptyState icon="🔔" title={t("notif.empty")} />
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {list.data.map((n) => (
              <Link key={n.id} href={n.url} className={`block px-4 py-3.5 active:bg-bg ${n.read ? "" : "bg-action-soft/60"}`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-ink">{n.title}</p>
                    <p className="mt-0.5 text-sm text-ink-sub">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-faint">
                    {formatDate(n.createdAt, tz, locale)}
                    <br />
                    {formatTime(n.createdAt, tz)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
