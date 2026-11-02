import type { Tri } from "@/i18n/core";

/** 푸시 알림·알림함 문구 — 받는 사람의 언어로 보낸다 */
export const pushMsgs = {
  "push.callCreated.title": { ko: "🔔 새로운 호출", id: "🔔 Panggilan baru", en: "🔔 New call" },
  "push.callCreated.body": { ko: "{caller}님이 호출했습니다.", id: "{caller} memanggil Anda.", en: "{caller} is calling you." },
  "push.test.title": { ko: "🔔 알림 테스트", id: "🔔 Tes notifikasi", en: "🔔 Notification test" },
  "push.test.body": {
    ko: "이 소리가 들리면 화면이 꺼져 있어도 호출을 받을 수 있습니다.",
    id: "Jika suara ini terdengar, panggilan tetap diterima walau layar mati.",
    en: "If you hear this, you'll get calls even with the screen off.",
  },
  "push.clockInByOwner.title": { ko: "🟢 출근 처리됨", id: "🟢 Masuk kerja dicatat", en: "🟢 Clocked in for you" },
  "push.clockInByOwner.body": {
    ko: "{owner}님이 {time}에 출근 처리했습니다.",
    id: "{owner} mencatat Anda masuk kerja pukul {time}.",
    en: "{owner} clocked you in at {time}.",
  },
  "push.clockOutByOwner.title": { ko: "⚪ 퇴근 처리됨", id: "⚪ Pulang kerja dicatat", en: "⚪ Clocked out for you" },
  "push.clockOutByOwner.body": {
    ko: "{owner}님이 {time}에 퇴근 처리했습니다.",
    id: "{owner} mencatat Anda pulang kerja pukul {time}.",
    en: "{owner} clocked you out at {time}.",
  },
  "push.callReminder.title": { ko: "🔔 호출 응답을 기다리고 있어요", id: "🔔 Panggilan menunggu jawaban", en: "🔔 A call is waiting for you" },
  "push.callReminder.body": {
    ko: "{caller}님이 기다리고 있습니다. 앱을 열어 응답해주세요.",
    id: "{caller} sedang menunggu. Buka aplikasi untuk menjawab.",
    en: "{caller} is waiting. Open the app to respond.",
  },
  "push.accepted.title": { ko: "✓ 호출 수락", id: "✓ Panggilan diterima", en: "✓ Call accepted" },
  "push.accepted.body": {
    ko: "{driver} 기사님이 {caller}님의 호출을 수락하고 출발했습니다.",
    id: "Sopir {driver} menerima panggilan dari {caller} dan sudah berangkat.",
    en: "Driver {driver} accepted {caller}'s call and is on the way.",
  },
  "push.declined.title": { ko: "호출 거절", id: "Panggilan ditolak", en: "Call declined" },
  "push.declined.body": {
    ko: "{driver} 기사님이 지금은 어렵다고 응답했습니다.",
    id: "Sopir {driver} sedang tidak bisa sekarang.",
    en: "Driver {driver} can't take it right now.",
  },
  "push.cancelled.title": { ko: "호출 취소", id: "Panggilan dibatalkan", en: "Call cancelled" },
  "push.adRequest.title": { ko: "📣 새 광고 신청", id: "📣 Pengajuan iklan baru", en: "📣 New ad request" },
  "push.adRequest.body": {
    ko: "{company} ({industry}) — 운영자 도구에서 검토해 주세요.",
    id: "{company} ({industry}) — tinjau di Alat operator.",
    en: "{company} ({industry}) — review it in Operator tools.",
  },
  "push.cancelledDriver.title": { ko: "🚫 호출이 취소되었습니다", id: "🚫 Panggilan dibatalkan", en: "🚫 Call cancelled" },
  "push.cancelledDriver.body": {
    ko: "{caller}님이 호출을 취소했습니다. 앱에서 [확인]을 눌러주세요.",
    id: "{caller} membatalkan panggilan. Tekan [OK] di aplikasi.",
    en: "{caller} cancelled the call. Tap [OK] in the app.",
  },
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
