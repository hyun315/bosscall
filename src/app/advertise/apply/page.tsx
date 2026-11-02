"use client";
import { AdApplyForm } from "@/components/ads/AdApplyForm";

/** 광고 신청서 — 로그인 없이 광고주가 직접 작성 */
export default function AdApplyPage() {
  return <AdApplyForm mode="public" />;
}
