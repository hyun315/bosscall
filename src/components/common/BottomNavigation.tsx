"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import type { MsgKey } from "@/i18n/index";
import type { MemberRole } from "@/types/domain";

interface Tab {
  href: string;
  label: MsgKey;
  icon: string;
  match: (p: string) => boolean;
}

const OWNER_TABS: Tab[] = [
  { href: "/home", label: "nav.home", icon: "🏠", match: (p) => p === "/home" || p.startsWith("/call") },
  { href: "/history", label: "nav.history", icon: "🗂", match: (p) => p.startsWith("/history") },
  { href: "/drivers", label: "nav.drivers", icon: "🚗", match: (p) => p.startsWith("/drivers") },
  { href: "/settings", label: "nav.settings", icon: "⚙️", match: (p) => p.startsWith("/settings") },
];

const DRIVER_TABS: Tab[] = [
  { href: "/home", label: "nav.home", icon: "🏠", match: (p) => p === "/home" || p.startsWith("/call") },
  { href: "/history", label: "nav.history", icon: "🗂", match: (p) => p.startsWith("/history") },
  { href: "/profile", label: "nav.profile", icon: "👤", match: (p) => p.startsWith("/profile") },
];

/** 하단 탭 (§18 BottomNavigation, §2 정보구조) */
export function BottomNavigation({ role }: { role: MemberRole }) {
  const pathname = usePathname() ?? "/home";
  const { t } = useI18n();
  const tabs = role === "DRIVER" ? DRIVER_TABS : OWNER_TABS;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[var(--safe-bottom)] backdrop-blur"
      aria-label={t("nav.main")}
    >
      <ul className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                  active ? "text-action" : "text-ink-faint"
                }`}
              >
                <span className={`text-xl ${active ? "" : "opacity-60 grayscale"}`} aria-hidden>
                  {tab.icon}
                </span>
                {t(tab.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
