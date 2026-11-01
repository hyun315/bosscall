"use client";
/**
 * BossCall 광고 안내 — 로그인 없이 볼 수 있는 한 페이지.
 * 광고주(자카르타 한인 업소) 대상이라 한국어로만 둔다. 앱 안 빈 광고 칸을 누르면 여기로 온다.
 */
import Link from "next/link";
import { useState } from "react";
import { useSearchParam } from "@/hooks/useSearchParam";
import { BannerCard } from "@/components/ads/AdSlot";
import { AD_CONTACT_EMAIL, SLOT_ADS, SLOT_INFO, inquiryMailto, type HouseAd } from "@/lib/ads";

const SAMPLE = SLOT_ADS.destinationSearch as HouseAd;

const STEPS = [
  { title: "메일로 문의", desc: "업소 이름, 원하는 광고 자리, 게재 기간을 알려주세요." },
  { title: "광고 내용 전달", desc: "제목 한 줄, 짧은 설명, 연결할 링크(홈페이지·인스타그램·WhatsApp·업소록 페이지)만 있으면 됩니다." },
  { title: "게재 시작", desc: "확인 후 앱에 바로 올라갑니다. 노출 수와 클릭 수를 알려 드립니다." },
];

const RULES = [
  "사장님·가족 화면에만 나옵니다. 운전 중인 기사님 화면에는 나오지 않습니다.",
  "한 화면에 광고는 하나만, 항상 \"광고\" 표시를 붙입니다.",
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
          <p className="mt-6 text-[13px] font-semibold tracking-wide text-[#F2C230]">BossCall 광고 안내</p>
          <h1 className="mt-2 text-[28px] font-extrabold leading-tight [text-wrap:balance]">
            자카르타 한인 가정이
            <br />
            매일 여는 화면에 우리 가게를
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75">
            BossCall은 자카르타 한인 사장님과 가족이 기사님을 부를 때 쓰는 앱입니다. 어디로 갈지 고르고, 기다리고, 도착하는 순간에
            광고가 함께 보입니다.
          </p>
          <a
            href={inquiryMailto(from)}
            className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-white px-5 text-[15px] font-bold text-navy"
          >
            ✉️ 광고 문의하기
          </a>
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
          <p className="mt-4 rounded-btn bg-surface px-4 py-3 text-sm text-ink-sub ring-1 ring-line">
            광고비는 자리와 기간에 따라 안내해 드립니다.
          </p>
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
          <h2 className="text-lg font-bold">광고 문의</h2>
          <p className="mt-1 text-sm text-white/70">메일 주시면 자리와 일정, 비용을 안내해 드립니다.</p>
          <a
            href={inquiryMailto(from)}
            className="mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-white text-[15px] font-bold text-navy"
          >
            ✉️ 메일 보내기
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
