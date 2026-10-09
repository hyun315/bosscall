"use client";
import { useCallback, type ReactNode } from "react";
import { ToastProvider } from "@/components/common/Toast";
import { SessionProvider, useSession } from "@/hooks/useSession";
import type { Locale } from "@/i18n/core";
import { I18nProvider } from "@/i18n/client";
import { updateMe } from "@/services/client/actions";

/** 로그인한 사용자의 저장된 언어를 반영하고, 바꾸면 계정에 저장 */
function LocaleBridge({ children }: { children: ReactNode }) {
  const { me, authUser } = useSession();
  const persist = useCallback(
    (l: Locale) => {
      if (authUser) void updateMe({ locale: l }).catch(() => undefined);
    },
    [authUser],
  );
  return (
    <I18nProvider accountLocale={me?.locale} onPersist={persist}>
      {children}
    </I18nProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LocaleBridge>
        <ToastProvider>{children}</ToastProvider>
      </LocaleBridge>
    </SessionProvider>
  );
}
