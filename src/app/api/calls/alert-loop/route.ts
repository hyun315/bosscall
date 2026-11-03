import { after } from "next/server";
import { readJson, route } from "@/lib/server/http";
import { forbidden } from "@/lib/server/http";
import { requireId, requireRecord } from "@/lib/validation";
import { runAlertSlice, verifyAlertToken } from "@/services/server/driverAlerts";

/**
 * 기사 알림 반복 이어 달리기 — 서버가 자기 자신만 부른다 (서명 확인). 사용자가 부르는 곳이 아니다.
 * 서버 함수 실행 시간(60초) 제한 때문에 48초씩 끊어서 이어 간다.
 */
export const maxDuration = 60;

export const POST = route(async (req) => {
  const body = requireRecord(await readJson(req));
  const groupId = requireId(body.groupId, "field.group");
  const callId = requireId(body.callId, "field.call");
  const loopId = typeof body.loopId === "string" ? body.loopId : "";
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  const token = typeof body.token === "string" ? body.token : "";
  if (!loopId || !verifyAlertToken(groupId, callId, loopId, startedAt, token)) throw forbidden();
  after(() => runAlertSlice(groupId, callId, loopId, startedAt));
  return { ok: true };
});
