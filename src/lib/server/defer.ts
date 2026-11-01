import "server-only";
import { after } from "next/server";

/**
 * 응답을 먼저 돌려주고, 알림·분석 같은 부수 작업은 그 뒤에 처리한다.
 * 요청 처리 중이 아닌 곳(이미 after 안 등)에서 불리면 바로 실행해 기다린다.
 */
export async function runAfterResponse(task: () => Promise<unknown>): Promise<void> {
  const safe = () =>
    task().catch((e) => {
      console.error("[after] task failed", e);
    });
  try {
    after(safe);
  } catch {
    await safe();
  }
}
