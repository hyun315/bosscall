"use client";
/**
 * 광고 신청서 — 로그인 없이 광고주가 직접 작성 (한국어 전용).
 * 신청 → 운영자 검토(운영자 도구) → 승인되면 시작일에 자동 게재, 종료일에 자동 종료.
 * 결제는 신규 출시 무료 기간(2027-03-31)이라 아직 없다. 유료 전환 시 제출과 검토 사이에 결제 단계를 넣는다.
 */
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { PaidBanner } from "@/components/ads/AdSlot";
import { ImageCropper } from "@/components/ads/ImageCropper";
import { AdPlaceField } from "@/components/ads/AdPlaceField";
import { BANNER_SAFE, BannerSpecGuide } from "@/components/ads/BannerSpecGuide";
import {
  AD_INDUSTRIES,
  AD_MONTHS,
  AD_PRODUCTS,
  BANNER_SPEC,
  DETAIL_SPEC,
  PRODUCT_INFO,
  SLOT_INFO,
  campaignWindow,
  type AdMonths,
  type AdPlace,
  type AdProduct,
} from "@/lib/ads";
import { useSearchParam } from "@/hooks/useSearchParam";

function jakartaToday(): string {
  return new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
}

function fmtDate(ms: number): string {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Jakarta", year: "numeric", month: "long", day: "numeric" }).format(ms);
}

export default function AdApplyPage() {
  const initialProduct = useSearchParam("product");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [contactName, setContactName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [kakaoId, setKakaoId] = useState("");
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState<AdProduct | null>(null);
  const [months, setMonths] = useState<AdMonths>(1);
  const [startDate, setStartDate] = useState(jakartaToday());
  const [banner, setBanner] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [place, setPlace] = useState<AdPlace | null>(null);
  const [agree, setAgree] = useState(false);
  const [website, setWebsite] = useState(""); // 숨은 칸 (자동 입력 프로그램 차단)
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const chosen: AdProduct | null = product ?? (AD_PRODUCTS.find((p) => p === initialProduct) ?? null);
  const win = useMemo(() => campaignWindow(startDate, months), [startDate, months]);
  const link = linkUrl.trim() ? (/^https?:\/\//.test(linkUrl.trim()) ? linkUrl.trim() : `https://${linkUrl.trim()}`) : null;

  const missing: string[] = [];
  if (!company.trim()) missing.push("업체명");
  if (!industry) missing.push("업종");
  if (!contactName.trim()) missing.push("담당자");
  if (!whatsapp.trim() && !kakaoId.trim()) missing.push("왓츠앱 또는 카카오톡");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) missing.push("이메일");
  if (!chosen) missing.push("광고 상품");
  if (!win || startDate < jakartaToday()) missing.push("시작일");
  if (!banner) missing.push("배너 이미지");
  if (!detail) missing.push("상세 이미지");
  if (!agree) missing.push("확인 체크");

  const submit = async () => {
    if (missing.length > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ad-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-BossCall-Locale": "ko" },
        body: JSON.stringify({
          company,
          industry,
          contactName,
          whatsapp,
          kakaoId,
          email,
          product: chosen,
          months,
          startDate,
          linkUrl: link ?? "",
          place,
          bannerImage: banner,
          detailImage: detail,
          website,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!res.ok) throw new Error(data?.error?.message ?? "신청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "인터넷 연결을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg px-6">
        <div className="max-w-sm text-center">
          <p className="text-5xl" aria-hidden>
            🎉
          </p>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">신청이 접수되었습니다</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-sub">
            내용을 검토한 뒤 {whatsapp ? "WhatsApp" : "카카오톡"} 또는 이메일로 연락드립니다. 승인되면 시작일에 앱에 자동으로 올라갑니다.
          </p>
          <Link href="/advertise" className="mt-6 inline-flex min-h-[48px] items-center rounded-btn bg-navy px-5 font-bold text-white">
            광고 안내로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-bg pb-[calc(40px+var(--safe-bottom))]">
      <header className="bg-navy px-5 pb-6 pt-[calc(20px+var(--safe-top))] text-white">
        <div className="mx-auto max-w-md">
          <Link href="/advertise" className="text-sm font-semibold text-white/70">
            ← 광고 안내
          </Link>
          <h1 className="mt-4 text-[24px] font-extrabold">BossCall 광고 신청</h1>
          <p className="mt-1 text-sm text-white/70">작성 5분 · 검토 후 승인되면 자동 게재</p>
          <span className="mt-3 inline-block rounded-full bg-[#F2C230] px-2.5 py-0.5 text-[12px] font-bold text-navy">
            🎉 신규 출시 기념 · 2027년 3월 31일까지 무료
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-8 px-5 pt-6">
        {/* 1. 업체 정보 */}
        <Section n={1} title="업체 정보">
          <Field label="업체명">
            <input className="field" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={60} placeholder="예: 한식당 서울가든" />
          </Field>
          <Field label="업종">
            <select className="field" value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">선택해 주세요</option>
              {AD_INDUSTRIES.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>
          <Field label="담당자">
            <input className="field" value={contactName} onChange={(e) => setContactName(e.target.value)} maxLength={40} placeholder="이름" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="WhatsApp">
              <input
                className="field"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                inputMode="tel"
                maxLength={20}
                placeholder="+62 812…"
              />
            </Field>
            <Field label="카카오톡 ID">
              <input className="field" value={kakaoId} onChange={(e) => setKakaoId(e.target.value)} maxLength={40} placeholder="kakao_id" />
            </Field>
          </div>
          <p className="-mt-1 text-xs text-ink-sub">둘 중 하나 이상 적어 주세요.</p>
          <Field label="이메일">
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
              autoComplete="email"
              placeholder="name@example.com"
            />
          </Field>
          <input
            tabIndex={-1}
            aria-hidden
            autoComplete="off"
            className="hidden"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </Section>

        {/* 2. 상품 · 기간 */}
        <Section n={2} title="광고 위치와 기간">
          <div className="space-y-3">
            {AD_PRODUCTS.map((p) => {
              const info = PRODUCT_INFO[p];
              const on = chosen === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProduct(p)}
                  aria-pressed={on}
                  className={`w-full rounded-card border bg-surface p-4 text-left transition ${on ? "border-action ring-2 ring-action/25" : "border-line"}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[17px] font-extrabold text-ink">{info.name}</span>
                    <span className={`h-5 w-5 rounded-full border-2 ${on ? "border-action bg-action shadow-[inset_0_0_0_3px_#fff]" : "border-line"}`} />
                  </span>
                  <span className="mt-1 block text-sm text-ink-sub">{info.desc}</span>
                  <span className="mt-3 flex flex-wrap gap-1.5">
                    {info.slots.map((s) => {
                      const si = SLOT_INFO.find((x) => x.slot === s);
                      return (
                        <span key={s} className="rounded-full bg-action-soft px-2.5 py-1 text-xs font-semibold text-action">
                          {si?.icon} {si?.title}
                        </span>
                      );
                    })}
                  </span>
                </button>
              );
            })}
          </div>

          <Field label="기간">
            <div className="grid grid-cols-3 gap-2">
              {AD_MONTHS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  aria-pressed={months === m}
                  className={`min-h-[48px] rounded-btn border text-[15px] font-bold ${months === m ? "border-action bg-action text-white" : "border-line bg-surface text-ink"}`}
                >
                  {m}개월
                </button>
              ))}
            </div>
          </Field>
          <Field label="시작일 (자카르타 기준)">
            <input className="field" type="date" value={startDate} min={jakartaToday()} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          {win && (
            <p className="rounded-btn bg-surface px-4 py-3 text-sm text-ink ring-1 ring-line">
              {fmtDate(win.startAt)} ~ {fmtDate(win.endAt - 1)}
              <span className="ml-2 font-bold text-success">무료</span>
            </p>
          )}
          <p className="text-xs leading-relaxed text-ink-sub">
            한 자리에는 최대 3곳의 광고가 돌아가며 나옵니다. 자리가 찬 기간이면 시작일 조정을 연락드립니다.
          </p>
        </Section>

        {/* 3. 이미지 */}
        <Section n={3} title="광고 이미지">
          <BannerSpecGuide />
          <Field label={`① 배너 (${BANNER_SPEC.w} × ${BANNER_SPEC.h})`}>
            <ImageCropper spec={BANNER_SPEC} value={banner} onChange={setBanner} safe={BANNER_SAFE} />
          </Field>
          <Field label={`② 눌렀을 때 나오는 상세 이미지 (${DETAIL_SPEC.w} × ${DETAIL_SPEC.h})`}>
            <div className="mx-auto w-3/4">
              <ImageCropper spec={DETAIL_SPEC} value={detail} onChange={setDetail} />
            </div>
          </Field>
          <Field label="연결 링크 (선택)">
            <input
              className="field"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              inputMode="url"
              autoCapitalize="none"
              maxLength={500}
              placeholder="https://instagram.com/… 또는 wa.me/62…"
            />
            <p className="mt-1 text-xs text-ink-sub">넣으면 상세 이미지 아래에 [자세히 보기] 버튼이 생깁니다.</p>
          </Field>
          <Field label="업소 위치 (선택)">
            <AdPlaceField value={place} onChange={setPlace} />
            <p className="mt-1 text-xs text-ink-sub">
              넣으면 배너에 <b>🚗 여기로 가기</b> 단추가 생겨, 사장님이 누르면 바로 이곳을 목적지로 기사님을 부릅니다.
            </p>
          </Field>
        </Section>

        {/* 4. 미리보기 */}
        <Section n={4} title="앱에서 이렇게 보입니다">
          <div className="mx-auto w-full max-w-[340px] rounded-[28px] border-[6px] border-navy bg-bg p-3 shadow-modal">
            <p className="px-1 text-xs font-semibold text-ink-sub">목적지 · 최근 장소</p>
            <div className="mt-2 space-y-2">
              {["🏠 집", "🏢 사무실"].map((x) => (
                <div key={x} className="rounded-btn bg-surface px-3 py-2.5 text-sm text-ink shadow-card">
                  {x}
                </div>
              ))}
            </div>
            <div className="mt-3">
              {banner ? (
                <PaidBanner
                  company={company || "업체명"}
                  bannerUrl={banner}
                  detailUrl={detail}
                  linkUrl={link}
                  onGo={place ? () => window.alert(`앱에서는 "${place.name}"이(가) 고른 대로 출발지 또는 목적지로 들어갑니다.`) : undefined}
                />
              ) : (
                <div className="flex aspect-[3/1] items-center justify-center rounded-card border-2 border-dashed border-line text-xs text-ink-faint">
                  배너를 올리면 여기에 보입니다
                </div>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-ink-sub">배너를 눌러 상세 이미지도 확인해 보세요.</p>
        </Section>

        {/* 제출 */}
        <section className="space-y-4">
          <label className="flex items-start gap-3 rounded-card bg-surface p-4 text-sm leading-relaxed text-ink ring-1 ring-line">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 accent-action" />
            <span>
              광고 내용은 검토 후 게재되며, 사실과 다르거나 부적절한 광고(성인·도박·불법 등)는 반려될 수 있습니다. 연락을 위해 입력한 정보를
              보관합니다.
            </span>
          </label>
          {error && <p className="rounded-btn bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
          {missing.length > 0 && <p className="text-center text-xs text-ink-sub">남은 항목: {missing.join(", ")}</p>}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={missing.length > 0 || busy}
            className="flex min-h-[56px] w-full items-center justify-center rounded-btn bg-action text-[16px] font-bold text-white disabled:bg-line disabled:text-ink-faint"
          >
            {busy ? "보내는 중…" : "무료로 광고 신청하기"}
          </button>
        </section>
      </div>
    </main>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}
