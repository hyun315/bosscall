"use client";
/**
 * 기사용 안내장 (인도네시아어) — 사장님이 왓츠앱으로 보내거나 인쇄해서 건넨다. 로그인 없이 열림.
 * 단추 모양은 실제 앱 단추와 같게 그려서 "이걸 누르세요"를 바로 알 수 있게.
 */
import type { ReactNode } from "react";

const APP_HOST = "bosscall-ten.vercel.app";

export default function DriverGuidePage() {
  return (
    <main lang="id" className="min-h-dvh bg-bg pb-[calc(40px+var(--safe-bottom))] print:min-h-0 print:bg-white print:pb-0">
      <header className="bg-navy px-5 pb-7 pt-[calc(24px+var(--safe-top))] text-white print:px-8 print:pb-4 print:pt-5">
        <div className="mx-auto max-w-md print:max-w-none">
          <p className="text-[13px] font-semibold tracking-wide text-[#F2C230]">BossCall · Panduan untuk Sopir</p>
          <h1 className="mt-2 text-[26px] font-extrabold leading-tight [text-wrap:balance] print:text-[24px]">
            Bapak/Ibu akan memanggil Anda lewat BossCall
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-white/80 print:text-[13px]">
            HP Anda akan berbunyi terus sampai Anda menjawab. Siapkan HP dengan 4 langkah di bawah.
          </p>
          <p className="mt-2 text-[12px] text-white/50 print:hidden">기사님용 안내 (인도네시아어)</p>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-7 px-5 pt-6 print:max-w-none print:space-y-4 print:px-8 print:pt-4">
        <section className="space-y-5 print:grid print:grid-cols-2 print:gap-x-6 print:gap-y-4 print:space-y-0">
          <Step n={1} title="Daftar">
            Buka link undangan dari Bapak/Ibu di WhatsApp, lalu tekan <Btn>Lanjut dengan Google</Btn>.
          </Step>

          <Step n={2} title="Pasang di layar utama">
            <b>Android:</b> di Chrome ketuk <b>⋮</b> (kanan atas) › <b>Instal aplikasi</b> atau <b>Tambahkan ke Layar utama</b>.
            <br />
            <b>iPhone:</b> di Safari ketuk tombol <b>Bagikan</b> › <b>Tambah ke Layar Utama</b>.
            <br />
            Setelah itu <b>selalu buka BossCall dari ikon</b> di layar utama.
          </Step>

          <Step n={3} title="Nyalakan notifikasi (WAJIB)" warn>
            Tekan <Btn>Nyalakan notifikasi di perangkat ini</Btn> lalu pilih <b>Izinkan</b>. Tanpa ini HP <b>tidak berbunyi</b> saat layar mati.
            <br />
            Cek: <b>Pengaturan › Pengaturan notifikasi</b> › <Btn>Kirim tes dalam 5 detik</Btn>, lalu matikan layar.
          </Step>

          <Step n={4} title="Absen setiap hari">
            Mulai kerja: <Btn tone="green">Mulai Kerja</Btn> &nbsp; Pulang: <Btn tone="dark">Selesai Kerja</Btn>
            <br />
            Bapak/Ibu <b>hanya bisa memanggil</b> setelah Anda menekan Mulai Kerja.
          </Step>
        </section>

        <section className="rounded-card border-2 border-action bg-action-soft/60 p-4 print:p-3">
          <h2 className="text-[17px] font-extrabold text-ink print:text-[15px]">🔔 Saat ada panggilan</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink print:text-[12px]">
            HP berbunyi terus sampai Anda menjawab. Tekan salah satu:
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <span className="flex min-h-[48px] items-center justify-center rounded-btn bg-success text-[15px] font-bold text-white print:min-h-[38px] print:text-[13px]">
              ✓ Terima panggilan
            </span>
            <span className="flex min-h-[48px] items-center justify-center rounded-btn border border-line bg-surface text-[15px] font-semibold text-ink print:min-h-[38px] print:text-[13px]">
              Tidak bisa sekarang
            </span>
          </div>
          <p className="mt-3 text-sm text-ink print:mt-2 print:text-[12px]">Setelah menerima, tekan sesuai urutan:</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px] print:text-[11px]">
            <Btn tone="blue">Saya berangkat</Btn>›<Btn tone="blue">Saya sudah tiba</Btn>›<Btn tone="blue">Mulai perjalanan</Btn>›
            <Btn tone="blue">Selesaikan perjalanan</Btn>
          </div>
        </section>

        <section className="rounded-card border-2 border-danger/60 bg-danger-soft p-4 print:p-3">
          <h2 className="text-[17px] font-extrabold text-ink print:text-[15px]">🚫 Jika panggilan dibatalkan</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink print:text-[12px]">
            Layar merah <b>&quot;Panggilan dibatalkan&quot;</b> muncul dan HP berbunyi. Tekan <Btn tone="dark">OK, mengerti</Btn> supaya
            bunyinya berhenti.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-bold text-ink print:text-[14px]">Penting</h2>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink print:space-y-0.5 print:text-[12px]">
            <Li>Jangan matikan notifikasi BossCall dan jangan mode senyap untuk BossCall.</Li>
            <Li>Android: matikan &quot;hemat baterai / optimasi baterai&quot; untuk Chrome supaya notifikasi tidak terlambat.</Li>
            <Li>Berbagi lokasi hanya saat jam kerja, dan hanya jika Anda menyalakannya.</Li>
            <Li>Bahasa aplikasi bisa diganti di Pengaturan (Indonesia · 한국어 · English).</Li>
          </ul>
        </section>

        <button
          type="button"
          onClick={() => window.print()}
          className="w-full rounded-btn border border-line bg-surface py-3 text-sm font-semibold text-ink print:hidden"
        >
          🖨 Cetak halaman ini
        </button>
        <a
          href="/guide/bosscall-guide-driver-id.pdf"
          download
          className="-mt-5 block text-center text-sm font-semibold text-action print:hidden"
        >
          Unduh PDF A4
        </a>

        <section className="hidden items-center gap-5 rounded-card border border-line p-4 print:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/guide/qr-driver.svg" alt="" className="h-24 w-24" />
          <div className="text-[12px] leading-relaxed text-ink">
            <p className="text-[15px] font-bold">Scan dengan kamera HP untuk membuka panduan ini</p>
            <p className="mt-1">
              <b>{APP_HOST}/guide/driver</b>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Step({ n, title, warn, children }: { n: number; title: string; warn?: boolean; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white ${warn ? "bg-danger" : "bg-navy"}`}
      >
        {n}
      </span>
      <div className="min-w-0 pt-1">
        <p className="text-[16px] font-bold text-ink print:text-[14px]">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-sub print:text-[12px]">{children}</p>
      </div>
    </div>
  );
}

function Btn({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "green" | "dark" | "blue" }) {
  const cls = {
    gray: "bg-surface text-ink ring-1 ring-line",
    green: "bg-success text-white",
    dark: "bg-navy text-white",
    blue: "bg-action text-white",
  }[tone];
  return <span className={`mx-0.5 inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[0.92em] font-bold ${cls}`}>{children}</span>;
}

function Li({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-success" aria-hidden>
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
