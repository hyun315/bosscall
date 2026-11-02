"use client";
/**
 * BossCall 광고 안내 — 로그인 없이 볼 수 있는 한 페이지.
 * 광고주(자카르타 한인 업소) 대상이라 한국어로만 둔다. 앱 안 빈 광고 칸을 누르면 여기로 온다.
 */
import Link from "next/link";
import { useState } from "react";
import { useSearchParam } from "@/hooks/useSearchParam";
import { BannerCard } from "@/components/ads/AdSlot";
import { BannerSpecGuide } from "@/components/ads/BannerSpecGuide";
import {
  AD_CONTACT_EMAIL,
  AD_PRODUCTS,
  AD_TIERS_ENABLED,
  HOUSE_AD_SAMPLE,
  MAX_LIVE_ADS,
  PRODUCT_INFO,
  SLOT_INFO,
  inquiryMailto,
} from "@/lib/ads";

const SAMPLE = HOUSE_AD_SAMPLE;

const STEPS = [
  { title: "신청서 작성", desc: "업체 정보, 광고 상품·기간, 배너와 상세 이미지를 올립니다. 앱에서 보일 모습을 바로 미리 볼 수 있습니다." },
  { title: "검토", desc: "BossCall이 내용을 확인하고 WhatsApp·카카오톡·이메일로 연락드립니다." },
  { title: "자동 게재", desc: "승인되면 시작일에 앱에 올라가고, 기간이 끝나면 자동으로 내려갑니다." },
];

const RULES = [
  "사장님·가족 화면에만 나옵니다. 운전 중인 기사님 화면에는 나오지 않습니다.",
  "광고는 화면 아래쪽 한 곳에만 모아 두고, 항상 \"광고\" 표시를 붙입니다.",
  "호출 버튼을 가리거나 팝업으로 뜨지 않습니다.",
];

export default function AdvertisePage() {
  const from = useSearchParam("from") ?? null;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(AD_CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 복사 불가 — 주소를 길게 눌러 복사 */
    }
  };

  return (
    <main className="min-h-dvh bg-bg pb-[calc(40px+var(--safe-bottom))]">
      {/* 히어로 */}
      <header className="relative overflow-hidden bg-navy px-5 pb-10 pt-[calc(28px+var(--safe-top))] text-white">
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-action/40 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-[#F2C230]/20 blur-3xl" />
        <div className="relative mx-auto max-w-md">
          <Link href="/" className="text-sm font-semibold text-white/70">
            ← BossCall
          </Link>
          <p className="mt-6 flex flex-wrap items-center gap-2 text-[13px] font-semibold tracking-wide text-[#F2C230]">
            BossCall 광고 안내
            <span className="rounded-full bg-[#F2C230] px-2.5 py-0.5 text-[12px] font-bold text-navy">
              🎉 신규 출시 기념 · 2027년 3월 31일까지 무료
            </span>
          </p>
          <h1 className="mt-2 text-[28px] font-extrabold leading-tight [text-wrap:balance]">
            자카르타 한인 가정이
            <br />
            매일 여는 화면에 우리 가게를
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75">
            BossCall은 자카르타 한인 사장님과 가족이 기사님을 부를 때 쓰는 앱입니다. 어디로 갈지 고르고, 기다리고, 도착하는 순간에
            광고가 함께 보입니다.
          </p>
          <Link
            href="/advertise/apply"
            className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-white px-5 text-[15px] font-bold text-navy"
          >
            📝 광고 신청하기
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-10 px-5 pt-8">
        {/* 광고 예시 */}
        <section>
          <h2 className="text-lg font-bold text-ink">이렇게 보입니다</h2>
          <p className="mt-1 text-sm text-ink-sub">지금 실제로 나가고 있는 광고입니다.</p>
          <div className="mt-4">
            <BannerCard ad={SAMPLE} slot="destinationSearch" onClick={() => undefined} />
          </div>
        </section>

        {/* 광고 상품 */}
        <section>
          <h2 className="text-lg font-bold text-ink">광고 상품</h2>
          <div className="mt-4 space-y-3">
            {(AD_TIERS_ENABLED ? AD_PRODUCTS : (["premium"] as const)).map((p) => (
              <Link
                key={p}
                href={`/advertise/apply?product=${p}`}
                className="block rounded-card border border-line bg-surface p-4 active:bg-bg"
              >
                <span className="flex items-center justify-between">
                  <span className="text-[17px] font-extrabold text-ink">{PRODUCT_INFO[p].name}</span>
                  <span className="text-sm font-semibold text-action">신청 ›</span>
                </span>
                <span className="mt-1 block text-sm text-ink-sub">
                  {AD_TIERS_ENABLED ? PRODUCT_INFO[p].desc : "홈 · 기사님 응답 대기 · 픽업 위치 · 목적지 — 4개 화면 모두"}
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-sub">
            {AD_TIERS_ENABLED
              ? "기간 1·3·6개월 · 화면마다 1~5번 고정 자리 · 프리미엄은 픽업·목적지 화면에도 자동 노출 (호출 묶음 아래)"
              : `기간 1·3·6개월 · 무료 기간 선착순 · 동시에 최대 ${MAX_LIVE_ADS}곳, 화면 칸보다 많으면 돌아가며 노출`}
          </p>
        </section>

        {/* 광고 자리 */}
        <section>
          <h2 className="text-lg font-bold text-ink">광고 자리</h2>
          <ul className="mt-4 space-y-3">
            {SLOT_INFO.map((s) => (
              <li
                key={s.slot}
                className={`flex gap-3 rounded-card border bg-surface p-4 ${s.slot === from ? "border-action ring-2 ring-action/20" : "border-line"}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-action-soft text-xl" aria-hidden>
                  {s.icon}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-ink">
                    {s.title}
                    {s.slot === from && <span className="rounded-full bg-action px-2 py-0.5 text-[11px] font-semibold text-white">방금 본 자리</span>}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink-sub">{s.when}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* 이미지 규격 */}
        <section>
          <h2 className="text-lg font-bold text-ink">이미지 규격</h2>
          <p className="mt-1 text-sm text-ink-sub">모든 광고가 같은 크기로 보이도록 규격을 맞춥니다.</p>
          <div className="mt-4">
            <BannerSpecGuide />
          </div>
        </section>

        {/* 진행 순서 */}
        <section>
          <h2 className="text-lg font-bold text-ink">진행 순서</h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{i + 1}</span>
                <span className="min-w-0 pt-1">
                  <span className="block text-[15px] font-bold text-ink">{s.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink-sub">{s.desc}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-card bg-[#F2C230]/15 px-4 py-3 ring-1 ring-[#F2C230]/50">
            <p className="text-[15px] font-bold text-ink">🎉 신규 출시 기념 · 2027년 3월 31일까지 무료</p>
            <p className="mt-0.5 text-sm text-ink-sub">
              이 기간에는 게재 비용을 받지 않습니다. 선착순으로 올라가며, 무료 기간에 입점한 업체에는 유료 전환 때 <b>창립 광고주 혜택</b>을
              드립니다.
            </p>
          </div>
        </section>

        {/* 약속 */}
        <section>
          <h2 className="text-lg font-bold text-ink">사용자를 위한 약속</h2>
          <ul className="mt-3 space-y-2">
            {RULES.map((r) => (
              <li key={r} className="flex gap-2 text-sm leading-relaxed text-ink">
                <span className="text-success" aria-hidden>
                  ✓
                </span>
                {r}
              </li>
            ))}
          </ul>
        </section>

        {/* 문의 */}
        <section className="rounded-card bg-navy p-5 text-white">
          <h2 className="text-lg font-bold">광고 신청 · 문의</h2>
          <p className="mt-1 text-sm text-white/70">2027년 3월 31일까지는 무료입니다. 궁금한 점은 메일로 물어보세요.</p>
          <Link
            href="/advertise/apply"
            className="mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-white text-[15px] font-bold text-navy"
          >
            📝 광고 신청하기
          </Link>
          <a
            href={inquiryMailto(from)}
            className="mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-btn bg-white/10 text-[15px] font-semibold ring-1 ring-white/15"
          >
            ✉️ 메일로 문의
          </a>
          <button
            type="button"
            onClick={() => void copy()}
            className="mt-3 w-full select-all rounded-btn bg-white/10 px-4 py-3 text-center text-[15px] font-semibold tracking-wide ring-1 ring-white/15"
          >
            {copied ? "주소를 복사했습니다" : AD_CONTACT_EMAIL}
          </button>
          <p className="mt-2 text-center text-xs text-white/50">주소를 누르면 복사됩니다</p>
        </section>
      </div>
    </main>
  );
}
