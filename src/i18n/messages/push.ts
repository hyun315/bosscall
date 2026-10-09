import type { Tri } from "@/i18n/core";

/** 푸시 알림·알림함 문구 — 받는 사람의 언어로 보낸다 */
export const pushMsgs = {
  "push.callCreated.title": { ko: "🔔 새로운 호출", id: "🔔 Panggilan baru", en: "🔔 New call" },
  "push.callCreated.body": { ko: "{caller}님이 호출했습니다.", id: "{caller} memanggil Anda.", en: "{caller} is calling you." },
  "push.accepted.title": { ko: "✓ 호출 수락", id: "✓ Panggilan diterima", en: "✓ Call accepted" },
  "push.accepted.body": {
    ko: "{driver} 기사님이 {caller}님의 호출을 수락했습니다.",
    id: "Sopir {driver} menerima panggilan dari {caller}.",
    en: "Driver {driver} accepted {caller}'s call.",
  },
  "push.declined.title": { ko: "호출 거절", id: "Panggilan ditolak", en: "Call declined" },
  "push.declined.body": {
    ko: "{driver} 기사님이 지금은 어렵다고 응답했습니다.",
    id: "Sopir {driver} sedang tidak bisa sekarang.",
    en: "Driver {driver} can't take it right now.",
  },
  "push.cancelled.title": { ko: "호출 취소", id: "Panggilan dibatalkan", en: "Call cancelled" },
  "push.cancelled.body": {
    ko: "{caller}님의 호출이 취소되었습니다.",
    id: "Panggilan dari {caller} dibatalkan.",
    en: "{caller}'s call was cancelled.",
  },
  "push.completed.title": { ko: "운행 완료", id: "Perjalanan selesai", en: "Trip completed" },
  "push.completed.body": {
    ko: "{caller}님의 운행이 완료되었습니다.",
    id: "Perjalanan {caller} telah selesai.",
    en: "{caller}'s trip is complete.",
  },
  "push.clockIn.title": { ko: "🟢 기사 출근", id: "🟢 Sopir mulai kerja", en: "🟢 Driver clocked in" },
  "push.clockIn.body": {
    ko: "{driver} 기사님이 {time}에 출근했습니다.",
    id: "Sopir {driver} mulai kerja pukul {time}.",
    en: "Driver {driver} clocked in at {time}.",
  },
  "push.clockOut.title": { ko: "⚪ 기사 퇴근", id: "⚪ Sopir selesai kerja", en: "⚪ Driver clocked out" },
  "push.clockOut.body": {
    ko: "{driver} 기사님이 {time}에 퇴근했습니다.",
    id: "Sopir {driver} selesai kerja pukul {time}.",
    en: "Driver {driver} clocked out at {time}.",
  },
} satisfies Record<string, Tri>;
