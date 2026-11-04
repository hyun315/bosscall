"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useLiveQuery, w, lim } from "@/hooks/useLive";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/i18n/client";
import { Logo } from "@/components/brand/Logo";
import { IconBack, IconBell } from "@/components/brand/Icons";

/** 상단 헤더 (§18 AppHeader) */
export function AppHeader({
  title,
  back,
  right,
  showBell = true,
}: {
  title?: string;
  /** true 면 뒤로가기, 문자열이면 해당 경로로 이동, 함수면 직접 처리 */
  back?: boolean | string | (() => void);
  right?: ReactNode;
  showBell?: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const { authUser } = useSession();
  const unread = useLiveQuery<{ id: string }>(
    showBell && authUser ? `users/${authUser.uid}/notifications` : null,
    [w("read", "==", false), lim(20)],
  );
  const count = unread.data.length;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 pt-[var(--safe-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-4">
        {back ? (
          <button
            aria-label={t("common.back")}
            onClick={() => {
              if (typeof back === "function") back();
              else if (typeof back === "string") router.push(back);
              else router.back();
            }}
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink active:bg-line/60"
          >
            <IconBack />
          </button>
        ) : null}
        {title ? (
          <h1 className="flex-1 truncate text-lg font-bold text-ink">{title}</h1>
        ) : (
          <h1 className="flex flex-1 items-center">
            <Logo className="h-7 w-auto" />
          </h1>
        )}
        {right}
        {showBell && (
          <Link
            href="/notifications"
            aria-label={count > 0 ? t("header.notificationsCount", { n: count }) : t("header.notifications")}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink active:bg-line/60"
          >
            <IconBell />
            {count > 0 && (
              <span className="absolute right-1.5 top-1.5 min-w-[18px] rounded-full bg-danger-solid px-1 text-center text-[11px] font-bold leading-[18px] text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
