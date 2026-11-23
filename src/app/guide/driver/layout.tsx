import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Panduan sopir BossCall",
  description: "Panduan untuk sopir: daftar, tambahkan ke layar utama, izinkan notifikasi, mulai kerja dan terima panggilan.",
  alternates: { canonical: "/guide/driver" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
