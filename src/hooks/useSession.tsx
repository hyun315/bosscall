"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { useLiveDoc } from "@/hooks/useLive";
import { api } from "@/services/client/api";
import { unregisterThisDevice } from "@/services/client/push";
import type { GroupDoc, MemberDoc, UserDoc } from "@/types/domain";

export type SessionStatus = "loading" | "signed-out" | "no-group" | "ready";

interface SessionValue {
  status: SessionStatus;
  authUser: User | null;
  me: UserDoc | null;
  group: GroupDoc | null;
  member: MemberDoc | null;
  groupId: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    const auth = clientAuth();
    // 리다이렉트 로그인 결과 처리 (홈 화면 앱/PWA)
    getRedirectResult(auth).catch((e) => console.warn("[auth] redirect result", e));
    return onAuthStateChanged(auth, async (u) => {
      setAuthUser(u);
      setAuthReady(true);
      if (u) {
        setProfileReady(false);
        try {
          await api("/api/me", { method: "POST", body: {} });
        } catch (e) {
          console.error("[auth] profile upsert failed", e);
        } finally {
          setProfileReady(true);
        }
      } else {
        setProfileReady(true);
      }
    });
  }, []);

  const meState = useLiveDoc<UserDoc>(authUser && profileReady ? `users/${authUser.uid}` : null);
  const me = meState.data;
  const groupId = me?.activeGroupId ?? null;
  const groupState = useLiveDoc<GroupDoc>(groupId ? `groups/${groupId}` : null);
  const memberState = useLiveDoc<MemberDoc>(groupId && authUser ? `groups/${groupId}/members/${authUser.uid}` : null);

  const status: SessionStatus = useMemo(() => {
    if (!authReady) return "loading";
    if (!authUser) return "signed-out";
    if (!profileReady || meState.loading) return "loading";
    if (!me || !groupId) return "no-group";
    if (groupState.loading || memberState.loading) return "loading";
    if (!groupState.data || !memberState.data) return "no-group";
    return "ready";
  }, [authReady, authUser, profileReady, meState.loading, me, groupId, groupState, memberState]);

  const signInWithGoogle = useCallback(async () => {
    const auth = clientAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    if (isStandalone()) {
      await signInWithRedirect(auth, provider);
      return;
    }
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, provider);
        return;
      }
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    await unregisterThisDevice().catch(() => undefined);
    await fbSignOut(clientAuth());
  }, []);

  const value: SessionValue = {
    status,
    authUser,
    me,
    group: status === "ready" ? groupState.data : null,
    member: status === "ready" ? memberState.data : null,
    groupId: status === "ready" ? groupId : null,
    signInWithGoogle,
    signOut,
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(SessionContext);
  if (!v) throw new Error("SessionProvider 가 필요합니다.");
  return v;
}

/** status === "ready" 인 화면에서 사용 — group/member 가 반드시 있다 */
export function useReadySession() {
  const s = useSession();
  if (s.status !== "ready" || !s.group || !s.member || !s.me || !s.groupId || !s.authUser) {
    throw new Error("세션이 준비되지 않았습니다.");
  }
  return {
    ...s,
    group: s.group,
    member: s.member,
    me: s.me,
    groupId: s.groupId,
    uid: s.authUser.uid,
    role: s.member.role,
    tz: s.group.timezone,
  };
}
