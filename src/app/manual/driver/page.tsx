"use client";
/**
 * 기사용 사용 설명서 — 인도네시아어 기본, 한국어 전환(사장님이 같이 보면서 설명할 때). /manual/driver
 * ?os=ios|android, ?lang=ko 로 지정 가능. 로그인 없이 열림.
 */
import { useEffect, useState } from "react";
import {
  AndroidInstallMock,
  B,
  HL,
  IosAddToHomeMock,
  ManualShell,
  MockCard,
  Phone,
  PermissionMock,
  SettingsMock,
  useOs,
  type ManualFaq,
  type ManualSection,
} from "@/components/manual/kit";

type Lang = "id" | "ko";

export default function DriverManualPage() {
  const [os, setOs] = useOs();
  const [lang, setLangState] = useState<Lang>("id");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("lang") === "ko") setLangState("ko");
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("lang", l);
      window.history.replaceState(null, "", u.toString());
    } catch {
      /* 무시 */
    }
  };
  const t = <T,>(id: T, ko: T): T => (lang === "id" ? id : ko);

  return (
    <ManualShell
      lang={lang}
      os={os}
      setOs={setOs}
      sections={sections(t)}
      faq={faq(t)}
      top={
        <div className="flex rounded-full bg-white/10 p-0.5 text-[13px] font-bold">
          {(["id", "ko"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-full px-3 py-1.5 ${lang === l ? "bg-white text-navy" : "text-white/70"}`}
            >
              {l === "id" ? "Indonesia" : "한국어"}
            </button>
          ))}
        </div>
      }
      text={{
        kicker: t("BossCall · Panduan Sopir", "BossCall 사용 설명서 · 기사용"),
        title: t("HP Anda akan berbunyi saat dipanggil", "부르면 기사님 휴대폰이 울립니다"),
        lead: t(
          "Ikuti langkah di bawah. Tekan tombol yang bergaris kuning.",
          "아래 순서대로 하세요. 노란 테두리 단추를 누르면 됩니다.",
        ),
        osAsk: t("HP Anda?", "기사님 휴대폰은?"),
        ios: "iPhone",
        android: "Android",
        faqTitle: t("Jika ada masalah", "문제가 생겼을 때"),
        print: t("Cetak halaman ini", "이 화면 인쇄하기"),
      }}
    />
  );
}

type T = <V>(id: V, ko: V) => V;

/* ───────── 화면 그림 ───────── */

function SetupMock({ t }: { t: T }) {
  return (
    <Phone title="BossCall">
      <MockCard>
        <p className="text-[10px] font-bold text-action">{t("Siapkan HP 2/3", "휴대폰 준비 2/3")}</p>
        <p className="mt-0.5 text-[12px] font-bold text-ink">{t("Nyalakan notifikasi", "알림을 켜 주세요")}</p>
        <div className={`mt-2 rounded-lg bg-success py-2 text-center text-[11px] font-bold text-white ${HL}`}>
          🔔 {t("Nyalakan notifikasi", "알림 켜기")}
        </div>
      </MockCard>
      <div className="h-9 rounded-xl bg-surface ring-1 ring-line" />
    </Phone>
  );
}

function ClockInMock({ t }: { t: T }) {
  return (
    <Phone title="BossCall">
      <MockCard>
        <span className="rounded-full bg-line px-1.5 py-0.5 text-[10px] font-bold text-ink-sub">● {t("Belum kerja", "퇴근")}</span>
        <p className="mt-1 text-[13px] font-bold text-ink">Budi</p>
      </MockCard>
      <div className={`flex h-11 items-center justify-center rounded-xl bg-success text-[13px] font-extrabold text-white ${HL}`}>
        {t("Mulai Kerja", "출근하기")}
      </div>
    </Phone>
  );
}

function CallMock({ t }: { t: T }) {
  return (
    <Phone title={<span className="text-danger">🔔 {t("Panggilan baru", "새 호출")}</span>}>
      <MockCard>
        <p className="text-ink">📍 {t("Rumah", "집")}</p>
        <p className="text-ink">🎯 Grand Indonesia</p>
      </MockCard>
      <div className={`rounded-xl bg-success py-2.5 text-center text-[12px] font-extrabold text-white ${HL}`}>✓ {t("Terima panggilan", "호출 수락")}</div>
      <div className="rounded-xl bg-surface py-2 text-center font-semibold text-ink ring-1 ring-line">{t("Tidak bisa sekarang", "지금은 어려워요")}</div>
    </Phone>
  );
}

function TripMock({ t }: { t: T }) {
  return (
    <Phone title={t("‹  Panggilan", "‹  호출")}>
      <div className="flex items-center justify-between rounded-xl bg-surface px-2 py-2 ring-1 ring-line">
        {(isId(t) ? ["Terima", "Jalan", "Tiba", "Antar", "Selesai"] : ["수락", "이동", "도착", "운행", "완료"]).map((s, i) => (
          <span key={s} className={`text-[9px] font-bold ${i <= 1 ? "text-action" : "text-ink-faint"}`}>
            {s}
          </span>
        ))}
      </div>
      <div className={`rounded-xl bg-action py-2.5 text-center text-[12px] font-extrabold text-white ${HL}`}>{t("Saya sudah tiba", "도착했어요")}</div>
      <MockCard>
        <p className="text-ink">📍 {t("Rumah", "집")}</p>
      </MockCard>
    </Phone>
  );
}
const isId = (t: T) => t(true, false);

function CancelMock({ t }: { t: T }) {
  return (
    <div className="overflow-hidden rounded-[26px] border-[6px] border-navy bg-danger p-3 text-center text-white shadow-modal" aria-hidden>
      <p className="text-3xl">🚫</p>
      <p className="mt-1 text-[14px] font-extrabold">{t("Panggilan dibatalkan", "호출이 취소되었습니다")}</p>
      <p className="mt-1 text-[10px] text-white/80">{t("Tidak perlu berangkat.", "출발하지 않아도 됩니다.")}</p>
      <div className={`mt-3 rounded-xl bg-white py-2 text-[12px] font-extrabold text-danger ${HL}`}>{t("OK, mengerti", "확인")}</div>
    </div>
  );
}

/* ───────── 내용 ───────── */

function sections(t: T): ManualSection[] {
  return [
    {
      id: "daftar",
      icon: "✍️",
      title: t("Daftar", "가입하기"),
      lead: t("Bapak/Ibu mengirim link undangan lewat WhatsApp.", "사장님이 왓츠앱으로 초대 링크를 보내 줍니다."),
      steps: {
        ios: [
          <>{t("Buka link undangan di WhatsApp", "왓츠앱에서 초대 링크 열기")}</>,
          <>
            {t("Jika terbuka di dalam WhatsApp, tekan", "왓츠앱 안에서 열렸다면")} <B>⋯</B> → <B>{t("Buka di Safari", "Safari로 열기")}</B>
          </>,
          <>
            <B>{t("Lanjut dengan Google", "Google로 계속")}</B> → {t("pilih akun Google Anda", "구글 계정 고르기")}
          </>,
        ],
        android: [
          <>{t("Buka link undangan di WhatsApp", "왓츠앱에서 초대 링크 열기")}</>,
          <>
            {t("Jika terbuka di dalam WhatsApp, tekan", "왓츠앱 안에서 열렸다면")} <B>⋮</B> → <B>{t("Buka di Chrome", "Chrome으로 열기")}</B>
          </>,
          <>
            <B>{t("Lanjut dengan Google", "Google로 계속")}</B> → {t("pilih akun Google Anda", "구글 계정 고르기")}
          </>,
        ],
      },
      tip: t(
        <>Belum punya akun Google? Minta tolong Bapak/Ibu, atau buat di HP: Pengaturan › Google › Tambah akun.</>,
        <>구글 계정이 없으면 휴대폰 설정 › Google › 계정 추가에서 만들 수 있어요.</>,
      ),
    },
    {
      id: "pasang",
      icon: "📲",
      title: t("Pasang di layar utama", "홈 화면에 추가"),
      lead: t("Supaya BossCall jadi seperti aplikasi dan bisa berbunyi.", "앱처럼 쓰고, 알림이 오게 하려면 꼭 해야 합니다."),
      steps: {
        ios: [
          <>
            {t("Di Safari, tekan tombol", "Safari 아래쪽")} <B>{t("Bagikan ⬆︎", "공유 ⬆︎")}</B> {t("(bawah)", "단추")}
          </>,
          <>
            {t("Geser ke bawah, pilih", "아래로 내려서")} <B>{t("Tambah ke Layar Utama", "홈 화면에 추가")}</B> → <B>{t("Tambah", "추가")}</B>
          </>,
          <>{t("Mulai sekarang, selalu buka BossCall dari ikon di layar utama", "이제부터는 항상 홈 화면 아이콘으로 BossCall을 여세요")}</>,
        ],
        android: [
          <>
            {t("Di Chrome, tekan", "Chrome 오른쪽 위")} <B>⋮</B> {t("(kanan atas)", "")}
          </>,
          <>
            <B>{t("Instal aplikasi", "앱 설치")}</B> {t("atau", "또는")} <b>{t("Tambahkan ke layar utama", "홈 화면에 추가")}</b> → <B>{t("Instal", "설치")}</B>
          </>,
          <>{t("Mulai sekarang, selalu buka BossCall dari ikon di layar utama", "이제부터는 항상 홈 화면 아이콘으로 BossCall을 여세요")}</>,
        ],
      },
      mock: {
        ios: (
          <IosAddToHomeMock
            share={t("Bagikan", "공유")}
            add={t("Tambah ke Layar Utama", "홈 화면에 추가")}
            more={t("⬆︎ Bagikan → geser ke bawah", "⬆︎ 공유 → 아래로 내리기")}
          />
        ),
        android: <AndroidInstallMock install={t("Instal aplikasi", "앱 설치")} home={t("Tambahkan ke layar utama", "홈 화면에 추가")} />,
      },
      tip: {
        ios: t(
          <>Tombol Bagikan tidak terlihat? Geser layar sedikit ke bawah, atau tekan ⋯ di samping alamat → Bagikan.</>,
          <>공유 단추가 안 보이면 화면을 살짝 내리거나, 주소창 옆 ⋯ → 공유를 누르세요.</>,
        ),
        android: t(
          <>Pakai Chrome, JANGAN Samsung Internet — akan diblokir Google Play Protect.</>,
          <>꼭 Chrome으로 설치하세요. 삼성 인터넷으로 설치하면 Play 프로텍트가 막습니다.</>,
        ),
      },
    },
    {
      id: "siapkan",
      icon: "🔔",
      title: t("Siapkan HP (WAJIB)", "휴대폰 준비 (꼭!)"),
      lead: t(
        "Tanpa ini HP tidak berbunyi saat dipanggil. Cukup sekali.",
        "이걸 안 하면 호출이 와도 소리가 안 납니다. 한 번만 하면 돼요.",
      ),
      warn: true,
      steps: [
        <>{t("Buka BossCall dari ikon. Di beranda ada kartu “Siapkan HP”", "홈 화면 아이콘으로 BossCall을 열면 '휴대폰 준비' 카드가 있습니다")}</>,
        <>
          <B tone="green">🔔 {t("Nyalakan notifikasi", "알림 켜기")}</B> → <B>{t("Izinkan", "허용")}</B>
        </>,
        <>
          <B tone="green">🔊 {t("Kirim tes bunyi", "테스트 소리 받기")}</B> → {t("matikan layar, tunggu 5 detik", "화면을 끄고 5초 기다리기")}
        </>,
        <>
          {t("Jika berbunyi, tekan", "소리가 나면")} <B tone="green">{t("Ya, berbunyi ✓", "소리 났어요 ✓")}</B>
        </>,
      ],
      mock: {
        ios: (
          <div className="space-y-3">
            <SetupMock t={t} />
            <PermissionMock os="ios" q={t("“BossCall” Ingin Mengirimi Anda Pemberitahuan", "“BossCall”에서 알림을 보내고자 합니다")} allow={t("Izinkan", "허용")} deny={t("Jangan Izinkan", "허용 안 함")} />
          </div>
        ),
        android: (
          <div className="space-y-3">
            <SetupMock t={t} />
            <PermissionMock os="android" q={t("Izinkan BossCall mengirim notifikasi?", "BossCall에서 알림을 보내도록 허용하시겠습니까?")} allow={t("Izinkan", "허용")} deny={t("Jangan izinkan", "허용 안함")} />
          </div>
        ),
      },
      tip: t(
        <>Tidak berbunyi? Lihat “Jika ada masalah › HP tidak berbunyi” di bawah.</>,
        <>소리가 안 나면 아래 &quot;문제가 생겼을 때 › 소리가 안 나요&quot;를 보세요.</>,
      ),
    },
    {
      id: "kerja",
      icon: "🕘",
      title: t("Mulai kerja setiap hari", "매일 출근하기"),
      lead: t("Bapak/Ibu hanya bisa memanggil setelah Anda menekan Mulai Kerja.", "기사님이 출근을 눌러야 사장님이 부를 수 있습니다."),
      mock: <ClockInMock t={t} />,
      steps: [
        <>
          {t("Pagi hari tekan", "아침에")} <B tone="green">{t("Mulai Kerja", "출근하기")}</B>
        </>,
        <>
          {t("Pertama kali ditanya soal berbagi lokasi — pilih sekali saja, berikutnya langsung", "처음 한 번만 위치 공유를 물어봅니다. 그다음부터는 한 번 누르면 바로 출근")}
        </>,
        <>
          {t("Pulang: tekan", "퇴근할 때")} <B tone="dark">{t("Selesai Kerja", "퇴근하기")}</B>
        </>,
      ],
      tip: t(
        <>Lokasi hanya dibagikan saat jam kerja, dan hanya jika Anda menyalakannya.</>,
        <>위치는 근무 시간에만, 기사님이 켰을 때만 공유됩니다.</>,
      ),
    },
    {
      id: "panggilan",
      icon: "🚗",
      title: t("Saat ada panggilan", "호출이 오면"),
      lead: t("HP berbunyi terus sampai Anda menjawab.", "응답할 때까지 휴대폰이 계속 울립니다."),
      mock: (
        <div className="space-y-3">
          <CallMock t={t} />
          <TripMock t={t} />
        </div>
      ),
      steps: [
        <>
          {t("Buka notifikasi, lalu tekan", "알림을 눌러 열고")} <B tone="green">✓ {t("Terima panggilan", "호출 수락")}</B>{" "}
          {t("atau", "또는")} <B>{t("Tidak bisa sekarang", "지금은 어려워요")}</B>
        </>,
        <>{t("Setelah menerima, langsung berangkat", "수락하면 바로 출발합니다")}</>,
        <>
          {t("Sampai di lokasi jemput:", "픽업 장소에 도착하면")} <B tone="blue">{t("Saya sudah tiba", "도착했어요")}</B>
        </>,
        <>
          {t("Penumpang naik:", "손님이 타면")} <B tone="blue">{t("Mulai perjalanan", "운행 시작")}</B>
        </>,
        <>
          {t("Sampai tujuan:", "목적지에 도착하면")} <B tone="blue">{t("Selesaikan perjalanan", "운행 완료")}</B>
        </>,
      ],
      tip: {
        ios: t(
          <>iPhone: jika BossCall tertutup, hanya bunyi notifikasi singkat. Biarkan BossCall terbuka saat menunggu supaya berbunyi terus.</>,
          <>아이폰은 앱이 닫혀 있으면 짧은 알림 소리만 납니다. 대기할 때는 BossCall을 화면에 열어 두면 계속 울립니다.</>,
        ),
        android: t(
          <>Jika layar mati, notifikasi tetap berbunyi. Tekan notifikasi untuk membuka panggilan.</>,
          <>화면이 꺼져 있어도 알림이 울립니다. 알림을 누르면 호출 화면이 열립니다.</>,
        ),
      },
    },
    {
      id: "batal",
      icon: "🚫",
      title: t("Jika panggilan dibatalkan", "호출이 취소되면"),
      lead: t(
        "Layar merah muncul dan HP berbunyi sampai Anda menekan OK.",
        "빨간 화면이 나오고, 확인을 누를 때까지 휴대폰이 울립니다.",
      ),
      warn: true,
      mock: <CancelMock t={t} />,
      steps: [
        <>
          <B tone="red">{t("Panggilan dibatalkan", "호출이 취소되었습니다")}</B> {t("muncul", "화면이 나오면")}
        </>,
        <>
          <B>{t("OK, mengerti", "확인")}</B> {t("— bunyi berhenti. Tidak perlu berangkat.", "— 소리가 멈춥니다. 출발하지 않아도 됩니다.")}
        </>,
      ],
    },
  ];
}

function faq(t: T): ManualFaq[] {
  return [
    {
      icon: "🔕",
      q: t("HP tidak berbunyi", "소리가 안 나요"),
      a: {
        ios: (
          <>
            <p>{t("① Matikan mode senyap (tombol samping iPhone) dan Fokus/Jangan Ganggu 🌙.", "① 아이폰 옆 무음 스위치를 올리고, 집중 모드(🌙)를 끄세요.")}</p>
            <p>{t("② Pengaturan › Notifikasi › BossCall › nyalakan:", "② 설정 › 알림 › BossCall에서 켜기:")}</p>
            <SettingsMock
              path={t("Pengaturan › Notifikasi › BossCall", "설정 › 알림 › BossCall")}
              rows={[
                { label: t("Izinkan Notifikasi", "알림 허용"), on: true, hl: true },
                { label: t("Suara", "사운드"), on: true, hl: true },
              ]}
            />
            <p>{t("③ Buka BossCall dari ikon layar utama, bukan dari Safari.", "③ Safari가 아니라 홈 화면 아이콘으로 여세요.")}</p>
            <p>
              {t("④ Di BossCall: Pengaturan › Pengaturan notifikasi ›", "④ BossCall 설정 › 알림 설정 ›")} <B>{t("Kirim tes dalam 5 detik", "5초 뒤 테스트 알림 받기")}</B>.{" "}
              {t("Jika hasilnya ✗, tekan", "결과가 ✗이면")} <B>{t("Daftarkan ulang perangkat ini", "이 기기 다시 등록")}</B>
            </p>
          </>
        ),
        android: (
          <>
            <p>{t("① Matikan mode senyap/getar dan Jangan Ganggu.", "① 무음·진동, 방해 금지를 끄세요.")}</p>
            <p>{t("② Pengaturan › Aplikasi › BossCall (atau Chrome) › Notifikasi › nyalakan:", "② 설정 › 애플리케이션 › BossCall(또는 Chrome) › 알림에서 켜기:")}</p>
            <SettingsMock
              path={t("Aplikasi › BossCall › Notifikasi", "애플리케이션 › BossCall › 알림")}
              rows={[
                { label: t("Izinkan notifikasi", "알림 허용"), on: true, hl: true },
                { label: t("Suara", "소리"), on: true, hl: true },
                { label: t("Tampilkan sebagai pop-up", "팝업으로 표시"), on: true, hl: true },
              ]}
            />
            <p>
              {t("③ Pengaturan › Aplikasi › Chrome › Baterai ›", "③ 설정 › 애플리케이션 › Chrome › 배터리 ›")} <b>{t("Tidak dibatasi", "제한 없음")}</b>
            </p>
            <p>
              {t("④ Di BossCall: Pengaturan › Pengaturan notifikasi ›", "④ BossCall 설정 › 알림 설정 ›")} <B>{t("Kirim tes dalam 5 detik", "5초 뒤 테스트 알림 받기")}</B>.{" "}
              {t("Jika hasilnya ✗, tekan", "결과가 ✗이면")} <B>{t("Daftarkan ulang perangkat ini", "이 기기 다시 등록")}</B>
            </p>
          </>
        ),
      },
    },
    {
      icon: "⚠️",
      q: t("Muncul “Aplikasi tidak aman diblokir”", "\"안전하지 않은 앱 차단됨\"이 떠요"),
      only: "android",
      a: (
        <p>
          {t(
            "Itu karena dipasang lewat Samsung Internet. Tekan OK, buka BossCall di Chrome, lalu ⋮ › Instal aplikasi.",
            "삼성 인터넷으로 설치해서 생깁니다. 확인을 눌러 닫고, Chrome에서 BossCall을 열어 ⋮ › 앱 설치로 다시 설치하세요.",
          )}
        </p>
      ),
    },
    {
      icon: "🔑",
      q: t("Tidak bisa masuk dengan Google", "구글 로그인이 안 돼요"),
      a: (
        <p>
          {t(
            "Link dibuka di dalam WhatsApp/KakaoTalk. Buka di browser biasa (Chrome / Safari), lalu coba lagi.",
            "왓츠앱·카톡 안의 화면에서 열려서 그렇습니다. Chrome·Safari로 다시 열어 주세요.",
          )}
        </p>
      ),
    },
    {
      icon: "📍",
      q: t("Ditanya izin lokasi", "위치 허용을 물어봐요"),
      a: (
        <p>
          {t(
            "Pilih “Izinkan saat menggunakan aplikasi”. Lokasi hanya dibagikan saat jam kerja.",
            "'앱 사용 중에만 허용'을 고르세요. 위치는 근무 시간에만 공유됩니다.",
          )}
        </p>
      ),
    },
    {
      icon: "🔤",
      q: t("Ganti bahasa", "언어 바꾸기"),
      a: <p>{t("Pengaturan › Bahasa › Indonesia · 한국어 · English", "설정 › 언어 › Indonesia · 한국어 · English")}</p>,
    },
  ];
}
