"use client";
import { AdApplyForm } from "@/components/ads/AdApplyForm";

/** 운영자 도구 › 광고 직접 올리기 — 광고주 신청서와 같은 화면 + 상품·자리 번호, 저장하면 바로 게재 */
export default function OperatorNewAdPage() {
  return <AdApplyForm mode="operator" />;
}
