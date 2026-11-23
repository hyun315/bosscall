import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Panduan lengkap sopir",
  description: "Panduan lengkap BossCall untuk sopir dalam Bahasa Indonesia.",
  alternates: { canonical: "/manual/driver" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
