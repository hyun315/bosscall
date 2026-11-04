"use client";
/**
 * 설명서 공용 부품 — 보스용(/manual)·기사용(/manual/driver)이 같이 쓴다.
 * - 위에 "아이폰·아이패드 / 안드로이드" 전환 (처음엔 휴대폰을 보고 자동 선택, ?os= 로 지정 가능)
 * - 내용은 기기별로 다를 수 있다: { ios, android } 로 주면 고른 쪽만 보인다
 * - 큰 글씨, 번호 순서, 실제 단추 모양 그대로
 */
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

export type Os = "ios" | "android";
export type ByOs<T> = T | { ios: T; android: T };

export function pick<T>(v: ByOs<T>, os: Os): T {
  return v && typeof v === "object" && "ios" in (v as object) && "android" in (v as object) ? (v as { ios: T; android: T })[os] : (v as T);
}

export interface ManualSection {
  id: string;
  icon: string;
  title: string;
  lead: string;
  steps: ByOs<ReactNode[]>;
  mock?: ByOs<ReactNode>;
  tip?: ByOs<ReactNode>;
  warn?: boolean;
}

export interface ManualFaq {
  icon: string;
  q: string;
  a: ByOs<ReactNode>;
  /** 이 기기에서만 보임 */
  only?: Os;
}

function detectOs(): Os {
  const q = new URLSearchParams(window.location.search).get("os");
  if (q === "ios" || q === "android") return q;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "android";
}

export function useOs(): [Os, (o: Os) => void] {
  const [os, setOsState] = useState<Os>("android");
  useEffect(() => setOsState(detectOs()), []);
  const setOs = (o: Os) => {
    setOsState(o);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("os", o);
      window.history.replaceState(null, "", u.toString());
    } catch {
      /* 무시 */
    }
  };
  return [os, setOs];
}

export interface ShellText {
  kicker: string;
  title: string;
  lead: string;
  osAsk: string;
  ios: string;
  android: string;
  faqTitle: string;
  print: string;
}

export function ManualShell({
  text,
  os,
  setOs,
  sections,
  faq,
  top,
  bottom,
  lang,
}: {
  text: ShellText;
  os: Os;
  setOs: (o: Os) => void;
  sections: ManualSection[];
  faq: ManualFaq[];
  top?: ReactNode;
  bottom?: ReactNode;
  lang?: string;
}) {
  return (
    <main lang={lang} className="min-h-dvh bg-bg pb-[calc(48px+var(--safe-bottom))] print:bg-white print:pb-0">
      <header className="bg-navy px-5 pb-6 pt-[calc(20px+var(--safe-top))] text-white print:px-8 print:pt-6">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <Link href="/" className="text-sm font-semibold text-white/70">
              ← BossCall
            </Link>
            {top}
          </div>
          <p className="mt-4 text-[13px] font-bold tracking-wide text-[#F2C230]">{text.kicker}</p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight [text-wrap:balance]">{text.title}</h1>
          <p className="mt-2 text-[16px] leading-relaxed text-white/80">{text.lead}</p>
        </div>
      </header>

      {/* 기기 고르기 — 화면 위에 붙어 있음 */}
      <div className="sticky top-0 z-10 border-b border-line bg-bg/95 px-4 pb-3 pt-[calc(10px+var(--safe-top))] backdrop-blur print:hidden">
        <div className="mx-auto max-w-lg">
          <p className="mb-1.5 text-center text-[13px] font-semibold text-ink-sub">{text.osAsk}</p>
          <div role="tablist" className="grid grid-cols-2 gap-1 rounded-btn bg-line/60 p-1">
            {(["ios", "android"] as const).map((o) => (
              <button
                key={o}
                type="button"
                role="tab"
                aria-selected={os === o}
                onClick={() => setOs(o)}
                className={`min-h-[48px] rounded-[10px] text-[16px] font-extrabold transition ${
                  os === o ? "bg-surface text-ink shadow-card ring-2 ring-action" : "text-ink-sub"
                }`}
              >
                {o === "ios" ? `🍎 ${text.ios}` : `🤖 ${text.android}`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="hidden px-8 pt-3 text-sm font-bold text-ink print:block">{os === "ios" ? `🍎 ${text.ios}` : `🤖 ${text.android}`}</p>

      <div className="mx-auto max-w-lg px-4 pt-5 print:max-w-none print:px-8">
        <nav className="grid grid-cols-2 gap-2 print:hidden">
          {[...sections, { id: "faq", icon: "🛟", title: text.faqTitle, warn: false }].map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`flex min-h-[56px] items-center gap-2 rounded-card border bg-surface px-3 text-[15px] font-bold text-ink active:bg-bg ${
                s.warn ? "border-danger/50" : "border-line"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {s.icon}
              </span>
              <span className="leading-tight">{s.title}</span>
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-10">
          {sections.map((s, i) => {
            const mock = s.mock ? pick(s.mock, os) : null;
            const tip = s.tip ? pick(s.tip, os) : null;
            return (
              <section key={s.id} id={s.id} className="scroll-mt-28 break-inside-avoid">
                <h2 className="flex items-center gap-2 text-[22px] font-extrabold text-ink">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] text-white ${
                      s.warn ? "bg-danger-solid" : "bg-navy"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {s.title}
                </h2>
                <p className="mt-2 text-[16px] leading-relaxed text-ink-sub">{s.lead}</p>
                <div className={`mt-4 ${mock ? "grid gap-4 sm:grid-cols-[1fr_210px]" : ""}`}>
                  <ol className="space-y-3">
                    {pick(s.steps, os).map((step, k) => (
                      <li key={k} className="flex gap-3 rounded-card bg-surface p-3.5 ring-1 ring-line">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action text-sm font-bold text-white">
                          {k + 1}
                        </span>
                        <span className="text-[17px] leading-relaxed text-ink">{step}</span>
                      </li>
                    ))}
                  </ol>
                  {mock && <div className="mx-auto w-full max-w-[230px]">{mock}</div>}
                </div>
                {tip && <p className="mt-3 rounded-btn bg-warning-soft px-4 py-3 text-[15px] leading-relaxed text-warning-text">💡 {tip}</p>}
              </section>
            );
          })}

          <section id="faq" className="scroll-mt-28">
            <h2 className="flex items-center gap-2 text-[22px] font-extrabold text-ink">🛟 {text.faqTitle}</h2>
            <div className="mt-4 space-y-3">
              {faq.filter((f) => !f.only || f.only === os).map((f) => (
                <details key={f.q} className="group rounded-card bg-surface ring-1 ring-line open:ring-action">
                  <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-4 text-[17px] font-bold text-ink">
                    <span aria-hidden>{f.icon}</span>
                    <span className="flex-1">{f.q}</span>
                    <span className="text-ink-faint transition group-open:rotate-180" aria-hidden>
                      ▾
                    </span>
                  </summary>
                  <div className="space-y-2 px-4 pb-4 text-[16px] leading-relaxed text-ink">{pick(f.a, os)}</div>
                </details>
              ))}
            </div>
          </section>

          {bottom}

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full rounded-btn border border-line bg-surface py-3 text-sm font-semibold text-ink print:hidden"
          >
            🖨 {text.print}
          </button>
        </div>
      </div>
    </main>
  );
}

/* ───────── 단추·화면 모양 ───────── */

export function B({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "blue" | "green" | "dark" | "red" }) {
  const cls = {
    gray: "bg-surface text-ink ring-1 ring-line",
    blue: "bg-action text-white",
    green: "bg-success-solid text-white",
    dark: "bg-navy text-white",
    red: "bg-danger-solid text-white",
  }[tone];
  return <span className={`mx-0.5 inline-block whitespace-nowrap rounded-lg px-2 py-0.5 text-[0.95em] font-bold ${cls}`}>{children}</span>;
}

/** 휴대폰 화면 그림. dark=다른 앱(설정·브라우저) 느낌 */
export function Phone({ children, title, bar }: { children: ReactNode; title?: ReactNode; bar?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[26px] border-[6px] border-navy bg-bg shadow-modal" aria-hidden>
      {title !== undefined && (
        <div className="flex h-8 items-center bg-surface px-3 text-[11px] font-extrabold text-brand">{title}</div>
      )}
      <div className="space-y-2 p-2.5 text-[11px]">{children}</div>
      {bar}
    </div>
  );
}

export function MockCard({ children }: { children: ReactNode }) {
  return <div className="rounded-xl bg-surface p-2.5 ring-1 ring-line">{children}</div>;
}

/** 노란 테두리 = "여기를 누르세요" */
export const HL = "ring-4 ring-[#F2C230]";

/** 아이폰 Safari — 아래 공유 단추 → 홈 화면에 추가 */
export function IosAddToHomeMock({ share, add, more }: { share: string; add: string; more: string }) {
  return (
    <Phone
      title={<span className="mx-auto rounded-md bg-line/70 px-6 py-0.5 text-[10px] font-semibold text-ink-sub">🔒 bosscall-ten.vercel.app</span>}
      bar={
        <div className="flex items-center justify-around border-t border-line bg-surface py-2 text-[15px] text-link">
          <span>‹</span>
          <span>›</span>
          <span className={`rounded-md px-1 ${HL}`}>⬆︎</span>
          <span>📖</span>
          <span>⧉</span>
        </div>
      }
    >
      <div className="h-10 rounded-xl bg-surface ring-1 ring-line" />
      <div className="rounded-xl bg-surface p-1.5 ring-1 ring-line">
        <p className="px-1 pb-1 text-[9px] text-ink-faint">{share}</p>
        <div className="rounded-lg bg-bg px-2 py-1.5 text-ink">📋 …</div>
        <div className={`mt-1 flex items-center justify-between rounded-lg bg-bg px-2 py-1.5 font-bold text-ink ${HL}`}>
          {add} <span>⊞</span>
        </div>
      </div>
      <p className="text-center text-[9px] text-ink-sub">{more}</p>
    </Phone>
  );
}

/** 안드로이드 Chrome — 오른쪽 위 ⋮ → 앱 설치 */
export function AndroidInstallMock({ install, home }: { install: string; home: string }) {
  return (
    <Phone
      title={
        <span className="flex w-full items-center gap-2">
          <span className="flex-1 rounded-full bg-line/70 px-2 py-0.5 text-[10px] font-semibold text-ink-sub">bosscall-ten.vercel.app</span>
          <span className={`rounded px-1 text-[14px] text-ink ${HL}`}>⋮</span>
        </span>
      }
    >
      <div className="ml-auto w-[78%] rounded-xl bg-surface p-1.5 shadow-modal ring-1 ring-line">
        <div className="px-2 py-1.5 text-ink">＋ …</div>
        <div className={`rounded-lg px-2 py-1.5 font-bold text-ink ${HL}`}>📲 {install}</div>
        <div className="px-2 py-1.5 text-ink-sub">{home}</div>
      </div>
      <div className="h-12 rounded-xl bg-surface ring-1 ring-line" />
    </Phone>
  );
}

/** 알림 허용 창 */
export function PermissionMock({ os, q, allow, deny }: { os: Os; q: string; allow: string; deny: string }) {
  return (
    <Phone title="BossCall">
      <div className="h-8 rounded-xl bg-surface ring-1 ring-line" />
      <div className="rounded-2xl bg-surface p-3 text-center shadow-modal ring-1 ring-line">
        <p className="text-[11px] font-bold leading-snug text-ink">{q}</p>
        {os === "ios" ? (
          <div className="mt-2 grid grid-cols-2 gap-1 border-t border-line pt-1.5 text-[11px]">
            <span className="py-1 text-link">{deny}</span>
            <span className={`rounded-md py-1 font-bold text-link ${HL}`}>{allow}</span>
          </div>
        ) : (
          <div className="mt-2 space-y-1 text-[11px]">
            <div className={`rounded-full bg-action py-1.5 font-bold text-white ${HL}`}>{allow}</div>
            <div className="py-1 text-ink-sub">{deny}</div>
          </div>
        )}
      </div>
    </Phone>
  );
}

/** 휴대폰 설정 화면 (알림 켜기) */
export function SettingsMock({ path, rows }: { path: string; rows: Array<{ label: string; on?: boolean; hl?: boolean }> }) {
  return (
    <Phone title={<span className="text-ink">⚙️ {path}</span>}>
      {rows.map((r) => (
        <div
          key={r.label}
          className={`flex items-center justify-between rounded-xl bg-surface px-2.5 py-2 text-ink ring-1 ring-line ${r.hl ? HL : ""}`}
        >
          <span className="font-semibold">{r.label}</span>
          {r.on !== undefined && (
            <span className={`flex h-4 w-7 items-center rounded-full px-0.5 ${r.on ? "justify-end bg-success-solid" : "bg-line"}`}>
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
          )}
        </div>
      ))}
    </Phone>
  );
}
