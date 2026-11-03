import { route } from "@/lib/server/http";
import { runClockInReminders } from "@/services/server/driverNudges";

/**
 * 출근 깜빡 알림 정기 실행 — GitHub Actions(.github/workflows/clockin-reminders.yml)가 10분마다 부른다.
 * 기사마다 하루 한 번만 보내므로 누가 여러 번 불러도 알림이 더 가지 않는다 (비밀값 불필요).
 */
export const GET = route(async () => ({ sent: await runClockInReminders() }));
