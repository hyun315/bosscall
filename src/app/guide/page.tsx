"use client";
/**
 * 사장님용 안내장 (한국어) — 로그인 없이 열림. 카톡·왓츠앱으로 링크 공유, 인쇄(A4)도 됨.
 * 끝에 "기사님께 안내 보내기" — 인도네시아어 기사용 안내(/guide/driver)를 왓츠앱으로.
 */
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

const APP_HOST = "bosscall-ten.vercel.app";

const FEATURES = [
  { icon: "🔔", title: "버튼 한 번으로 호출", desc: "기사님 휴대폰은 응답할 때까지 알람이 계속 울립니다." },
  { icon: "📍", title: "어디쯤 왔는지 한눈에", desc: "출발 · 도착 · 운행 상태가 실시간으로 보입니다." },
  { icon: "🕘", title: "출퇴근 · 급여 자동 계산", desc: "근무 시간과 초과근무를 알아서 계산합니다." },
  { icon: "👨‍👩‍👧", title: "가족도 함께", desc: "사모님 · 자녀도 같은 기사님을 부를 수 있습니다." },
];

const STEPS: Array<{ title: string; body: ReactNode }> = [
  {
    title: "가입하기",
    body: (
      <>
        <b>{APP_HOST}</b> 접속 → <Chip>Google로 계속</Chip> → 우리 가족 이름, 기사님 이름·전화번호를 입력합니다.
      </>
    ),
  },
  {
    title: "홈 화면에 추가 · 알림 켜기",
    body: (
      <>
        아이폰은 Safari <b>공유 버튼 → 홈 화면에 추가</b>, 안드로이드는 <b>꼭 Chrome</b>에서 <b>⋮ → 앱 설치</b> (삼성 인터넷으로 설치하면
        Play 프로텍트가 막습니다). 홈 화면 아이콘으로 열고 알림을 허용하세요.
      </>
    ),
  },
  {
    title: "기사님 초대",
    body: (
      <>
        가입 직후 화면(나중에는 <Chip>기사</Chip> 탭 → 기사님)에서 <Chip>기사 초대 링크 만들기</Chip> → <Chip>공유 / 복사</Chip> →
        왓츠앱. 인도네시아어 안내와 기사용 설명서 링크가 함께 갑니다.
      </>
    ),
  },
  {
    title: "기사님 부르기",
    body: (
      <>
        홈 <Chip tone="blue">기사 호출</Chip> → 픽업 위치 → 목적지 → 확인 화면에서 <Chip tone="blue">🚗 기사 호출</Chip>. 기사님이
        수락하면 바로 출발하고, 알림이 옵니다.
      </>
    ),
  },
];

const TIPS = [
  "기사님이 출근을 눌러야 호출할 수 있습니다. 깜빡했다면 기사 탭에서 사장님이 대신 출근·퇴근 처리할 수 있습니다.",
  "호출을 취소하면 기사님 휴대폰에 [확인]을 누를 때까지 알람이 울려 헛걸음을 막습니다.",
  "자주 가는 곳은 즐겨찾기에 저장해 두면 더 빨리 부를 수 있습니다.",
  "급여는 기사 탭 → 기사님 → 급여에서 근무 기록으로 자동 계산됩니다.",
  "화면 언어는 한국어 · 인도네시아어 · 영어 중에서 고를 수 있습니다 (설정).",
];

export default function OwnerGuidePage() {
  const [origin, setOrigin] = useState(`https://${APP_HOST}`);
  useEffect(() => setOrigin(window.location.origin), []);
  const driverGuide = `${origin}/manual/driver`;
  const waText = [
    "Pak/Bu sopir, mulai sekarang saya akan memanggil lewat aplikasi BossCall.",
    "Tolong baca panduan ini dan siapkan HP Anda:",
    driverGuide,
  ].join("\n");

  return (
    <main className="min-h-dvh bg-bg pb-[calc(40px+var(--safe-bottom))] print:min-h-0 print:bg-white print:pb-0">
      {/* 머리 */}
      <header className="relative overflow-hidden bg-navy px-5 pb-8 pt-[calc(24px+var(--safe-top))] text-white print:px-8 print:pb-5 print:pt-6">
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-action/40 blur-3xl print:hidden" />
        <div className="relative mx-auto max-w-md print:max-w-none">
          <p className="text-[13px] font-semibold tracking-wide text-[#F2C230]">BossCall 사용 안내 · 사장님용</p>
          <h1 className="mt-2 text-[28px] font-extrabold leading-tight [text-wrap:balance] print:text-[26px]">
            기사님 부를 때,
            <br />
            전화 대신 버튼 하나
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75 print:text-[13px]">
            자카르타 한인 가정을 위한 기사 호출 · 출퇴근 · 급여 앱. 앱스토어 설치 없이 휴대폰 브라우저에서 바로 씁니다.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-[52px] items-center rounded-btn bg-white px-5 text-[15px] font-bold text-navy print:hidden"
          >
            BossCall 시작하기 →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-8 px-5 pt-7 print:max-w-none print:space-y-5 print:px-8 print:pt-5">
        {/* 좋은 점 */}
        <section className="grid grid-cols-2 gap-3 print:grid-cols-4 print:gap-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-card border border-line bg-surface p-4 print:p-3">
              <p className="text-2xl" aria-hidden>
                {f.icon}
              </p>
              <p className="mt-2 text-[15px] font-bold text-ink print:text-[13px]">{f.title}</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-sub print:text-[11px]">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* 시작 4단계 */}
        <section>
          <h2 className="text-lg font-bold text-ink print:text-base">시작하기 — 4단계</h2>
          <ol className="mt-4 space-y-4 print:mt-2 print:grid print:grid-cols-2 print:gap-x-6 print:gap-y-3 print:space-y-0">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="min-w-0 pt-1">
                  <span className="block text-[15px] font-bold text-ink print:text-[13px]">{s.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink-sub print:text-[12px]">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* 알아두면 좋은 것 */}
        <section>
          <h2 className="text-lg font-bold text-ink print:text-base">알아두면 좋은 것</h2>
          <ul className="mt-3 space-y-2 print:mt-2 print:space-y-1">
            {TIPS.map((t) => (
              <li key={t} className="flex gap-2 text-sm leading-relaxed text-ink print:text-[12px]">
                <span className="text-success" aria-hidden>
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* 기사님께 보내기 */}
        <section className="rounded-card bg-action-soft p-5 ring-1 ring-action/20 print:hidden">
          <h2 className="text-lg font-bold text-ink">기사님께 안내 보내기</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-sub">
            기사님이 해야 할 일(홈 화면 추가 · 알림 허용 · 출근 · 호출 받기)을 인도네시아어로 정리한 안내입니다.
          </p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener"
            className="mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-btn bg-[#25D366] text-[15px] font-bold text-white"
          >
            WhatsApp으로 기사님께 보내기
          </a>
          <Link href="/manual/driver" className="mt-2 block text-center text-sm font-semibold text-action">
            기사용 설명서 미리 보기 ›
          </Link>
        </section>

        <button
          type="button"
          onClick={() => window.print()}
          className="w-full rounded-btn border border-line bg-surface py-3 text-sm font-semibold text-ink print:hidden"
        >
          🖨 이 화면 인쇄하기
        </button>
        <Link href="/manual" className="-mt-4 block text-center text-[15px] font-bold text-action print:hidden">
          📖 자세한 사용 설명서 (이럴 땐 이렇게 · 문제 해결) ›
        </Link>
        <a
          href="/guide/bosscall-guide-owner.pdf"
          download
          className="-mt-5 block text-center text-sm font-semibold text-action print:hidden"
        >
          A4 인쇄용 PDF 내려받기 (사장님용)
        </a>
        <a href="/guide/bosscall-guide-driver-id.pdf" download className="-mt-6 block text-center text-sm text-ink-sub print:hidden">
          기사님용 PDF만 받기
        </a>

        {/* 인쇄용: QR */}
        <section className="hidden items-center gap-5 rounded-card border border-line p-4 print:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/guide/qr-owner.svg" alt="" className="h-24 w-24" />
          <div className="text-[12px] leading-relaxed text-ink">
            <p className="text-[15px] font-bold">휴대폰 카메라로 찍으면 바로 열립니다</p>
            <p className="mt-1">
              <b>{APP_HOST}</b>
            </p>
            <p className="text-ink-sub">기사님용 인도네시아어 안내: {APP_HOST}/guide/driver</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Chip({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "blue" }) {
  return (
    <span
      className={`mx-0.5 inline-block rounded-md px-1.5 py-px text-[0.92em] font-semibold ${
        tone === "blue" ? "bg-action text-white" : "bg-line text-ink"
      }`}
    >
      {children}
    </span>
  );
}
