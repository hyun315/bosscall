import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "사장님용 한 장 안내",
  description: "BossCall 시작 4단계와 알아두면 좋은 것 — 가입, 기사님 연결, 호출, 출퇴근 기록.",
  alternates: { canonical: "/guide" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
