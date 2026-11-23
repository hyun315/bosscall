import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "사용 설명서",
  description: "기사 부르기, 진행 확인, 출퇴근·급여, 문제 해결까지 BossCall 사용 설명서.",
  alternates: { canonical: "/manual" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
