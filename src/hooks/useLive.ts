"use client";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit as qLimit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Query,
  type QueryConstraint,
} from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { translate } from "@/i18n/index";
import { getLocale } from "@/i18n/runtime";

export interface LiveState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

function describe(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const l = getLocale();
  if (code === "permission-denied") return translate(l, "live.permission");
  if (code === "unavailable") return translate(l, "err.network");
  if (code === "failed-precondition") return translate(l, "live.index");
  return translate(l, "live.failed");
}

/**
 * Firestore 문서 실시간 구독 (명세 §7: UI는 서버 상태를 구독만 한다).
 * path 가 null 이면 구독하지 않는다.
 */
export function useLiveDoc<T>(path: string | null): LiveState<T | null> {
  const [state, setState] = useState<LiveState<T | null> & { of: string | null }>({
    data: null,
    loading: path !== null,
    error: null,
    of: path,
  });
  useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: null, of: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null, of: path }));
    const unsub = onSnapshot(
      doc(clientDb(), path),
      (snap) => setState({ data: snap.exists() ? (snap.data() as T) : null, loading: false, error: null, of: path }),
      (e) => setState({ data: null, loading: false, error: describe(e), of: path }),
    );
    return unsub;
  }, [path]);
  // path 가 바뀐 직후 한 렌더 동안은 state 가 이전 대상의 것이다 (effect 는 렌더 뒤에 돈다).
  // 그 사이를 loading 으로 보지 않으면 "다 불러왔는데 비어 있음"으로 오인된다 — 딥링크가 홈으로 튕기던 원인.
  const stale = state.of !== path;
  return stale
    ? { data: null, loading: true, error: null }
    : { data: state.data, loading: state.loading, error: state.error };
}

export type Filter =
  | { type: "where"; field: string; op: "==" | "in" | ">=" | "<" | "<="; value: unknown }
  | { type: "orderBy"; field: string; dir: "asc" | "desc" }
  | { type: "limit"; n: number };

export const w = (field: string, op: "==" | "in" | ">=" | "<" | "<=", value: unknown): Filter => ({
  type: "where",
  field,
  op,
  value,
});
export const ob = (field: string, dir: "asc" | "desc" = "asc"): Filter => ({ type: "orderBy", field, dir });
export const lim = (n: number): Filter => ({ type: "limit", n });

function build(path: string, filters: Filter[]): Query {
  const cs: QueryConstraint[] = filters.map((f) => {
    if (f.type === "where") return where(f.field, f.op, f.value);
    if (f.type === "orderBy") return orderBy(f.field, f.dir);
    return qLimit(f.n);
  });
  return query(collection(clientDb(), path), ...cs);
}

/**
 * 컬렉션 실시간 구독. filters 는 JSON 직렬화 값으로 비교하므로 매 렌더 새로 만들어도 된다.
 */
export function useLiveQuery<T>(path: string | null, filters: Filter[] = []): LiveState<T[]> {
  const key = path ? `${path}|${JSON.stringify(filters)}` : null;
  const [state, setState] = useState<LiveState<T[]> & { of: string | null }>({
    data: [],
    loading: key !== null,
    error: null,
    of: key,
  });
  useEffect(() => {
    if (!key || !path) {
      setState({ data: [], loading: false, error: null, of: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null, of: key }));
    const parsed = JSON.parse(key.slice(path.length + 1)) as Filter[];
    const unsub = onSnapshot(
      build(path, parsed),
      (snap) => setState({ data: snap.docs.map((d) => d.data() as T), loading: false, error: null, of: key }),
      (e) => {
        console.error("[firestore]", path, e);
        setState({ data: [], loading: false, error: describe(e), of: key });
      },
    );
    return unsub;
    // key 가 path+filters 를 모두 담고 있다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  // useLiveDoc 과 같은 이유로, 구독 대상이 바뀐 직후 한 렌더는 loading 으로 본다
  const stale = state.of !== key;
  return stale
    ? { data: [], loading: true, error: null }
    : { data: state.data, loading: state.loading, error: state.error };
}
