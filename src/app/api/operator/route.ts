import { isOperator, requireUser } from "@/lib/server/auth";
import { route } from "@/lib/server/http";

/** 운영자 메뉴를 보여줄지 */
export const GET = route(async (req) => {
  const user = await requireUser(req);
  return { operator: isOperator(user) };
});
