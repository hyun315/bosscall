import { adminDb } from "@/lib/firebase/admin";
import { isOperator, requireUser } from "@/lib/server/auth";
import { route } from "@/lib/server/http";

/** 운영자 메뉴를 보여줄지 + 검토 대기 광고 신청 수 (설정 화면 배지) */
export const GET = route(async (req) => {
  const user = await requireUser(req);
  if (!isOperator(user)) return { operator: false, pendingAds: 0 };
  const snap = await adminDb().collection("adRequests").where("status", "==", "PENDING").count().get();
  return { operator: true, pendingAds: snap.data().count };
});
