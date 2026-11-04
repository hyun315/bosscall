"use client";
/**
 * About BossCall — 작은 브랜드 공간 (설정 › BossCall 소개). 로그인 없이도 열림.
 * 광고 페이지처럼 만들지 않는다: 로고 · 짧은 문장 · 충분한 여백.
 * 운영 정보는 확인된 것만 (운영: BossCall, 문의 메일). 약관·개인정보처리방침은 본문이 생기면 추가.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { IconBack } from "@/components/brand/Icons";
import { useI18n } from "@/i18n/client";

const CONTACT = "hanin.jakarta114@gmail.com";
const VERSION = "2.0";
const BUILD = (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7);

export default function AboutPage() {
  const { t } = useI18n();
  const values = [
    { name: "Simplicity", desc: t("about.v1") },
    { name: "Connection", desc: t("about.v2") },
    { name: "Peace of Mind", desc: t("about.v3") },
  ];
  return (
    <main className="min-h-dvh bg-surface pb-[calc(40px+var(--safe-bottom))]">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 pt-[var(--safe-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-4">
          <Link
            href="/settings"
            aria-label={t("common.back")}
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink active:bg-line/60"
          >
            <IconBack />
          </Link>
          <h1 className="flex-1 truncate text-lg font-bold text-ink">{t("about.title")}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-md px-6">
        <section className="flex flex-col items-center pb-10 pt-12 text-center">
          <Logo variant="vertical" className="h-28 w-auto" />
          <p className="mt-6 text-[19px] font-bold leading-snug tracking-tight text-ink [text-wrap:balance]">
            {t("brand.slogan")}
          </p>
          <p className="mt-2 text-[15px] text-ink-sub">Make Every Day Easier.</p>
        </section>

        <Block title={t("about.storyTitle")}>
          <p>{t("about.story1")}</p>
          <p>{t("about.story2")}</p>
          <p>{t("about.story3")}</p>
        </Block>

        <Block title={t("about.philosophyTitle")}>
          <p>{t("about.philosophy")}</p>
        </Block>

        <Block title={t("about.valuesTitle")}>
          <ul className="space-y-3">
            {values.map((v) => (
              <li key={v.name} className="flex gap-3 rounded-card bg-bg p-4">
                {/* 장식용 브랜드 틸 점 (정보는 글자로 전달) */}
                <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-teal" />
                <span>
                  <span className="block text-[16px] font-bold text-ink">{v.name}</span>
                  <span className="mt-0.5 block text-[15px] leading-relaxed text-ink-sub">{v.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </Block>

        <Block title={t("about.infoTitle")}>
          <dl className="divide-y divide-line rounded-card border border-line">
            <Row label={t("about.operator")} value="BossCall" />
            <Row
              label={t("about.contact")}
              value={
                <a href={`mailto:${CONTACT}`} className="font-semibold text-link underline-offset-2 active:underline">
                  {CONTACT}
                </a>
              }
            />
            <Row label={t("about.version")} value={BUILD ? `${VERSION} (${BUILD})` : VERSION} />
          </dl>
        </Block>
      </div>
    </main>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-8">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-teal">{title}</h2>
      <div className="mt-3 space-y-3 text-[16px] leading-[1.75] text-ink">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 text-[15px]">
      <dt className="text-ink-sub">{label}</dt>
      <dd className="min-w-0 truncate text-right text-ink">{value}</dd>
    </div>
  );
}
