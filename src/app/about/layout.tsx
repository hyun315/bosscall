import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "BossCall 소개 — Our Story",
  description: "2018년 자카르타 주재원 가족의 경험에서 시작된 BossCall 이야기와 문의처.",
  alternates: { canonical: "/about" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
