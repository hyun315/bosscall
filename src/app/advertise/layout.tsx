import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "광고 안내",
  description: "자카르타 한인 가족에게 닿는 BossCall 광고 자리 안내와 신청.",
  alternates: { canonical: "/advertise" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
