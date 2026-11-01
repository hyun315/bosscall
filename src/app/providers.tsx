"use client";
import { useCallback, useEffect, type ReactNode } from "react";
import { ToastProvider } from "@/components/common/Toast";
import { SessionProvider, useSession } from "@/hooks/useSession";
import type { Locale } from "@/i18n/core";
import { I18nProvider } from "@/i18n/client";
import { updateMe } from "@/services/client/actions";
import { initInstallCapture } from "@/services/client/install";

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
  // 설치 창 이벤트(beforeinstallprompt)는 일찍 지나가므로 앱 시작 직후 붙잡아 둔다
  useEffect(() => initInstallCapture(), []);
  return (
    <SessionProvider>
      <LocaleBridge>
        <ToastProvider>{children}</ToastProvider>
      </LocaleBridge>
    </SessionProvider>
  );
}
