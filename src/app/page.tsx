import type { Metadata } from "next";
import { Splash } from "./Splash";

/**
 * 첫 주소(/)는 로그인 상태를 확인하고 바로 /login·/home 으로 넘기는 화면이라,
 * 검색엔진이 보면 /login 과 같은 페이지로 판단한다.
 * 그래서 대표 주소를 /login 으로 미리 밝혀 둔다 — Search Console 의
 * 「중복 페이지, Google에서 사용자와 다른 표준을 선택함」 경고를 없애기 위함.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/login" },
};

export default function Page() {
  return <Splash />;
}
