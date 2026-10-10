import type { Tri } from "@/i18n/core";

/** 호출 만들기·호출 화면·진행 기록 */
export const callMsgs = {
  // ── 새 호출 (C01~C03)
  "newCall.whereMeet": { ko: "어디에서 만날까요?", id: "Dijemput di mana?", en: "Where should we meet?" },
  "newCall.whereGo": { ko: "어디로 갈까요?", id: "Mau ke mana?", en: "Where to?" },
  "newCall.confirm": { ko: "호출 내용을 확인하세요", id: "Periksa detail panggilan", en: "Review your call" },
  "newCall.driverCannotCall": {
    ko: "기사 계정은 호출할 수 없습니다.",
    id: "Akun sopir tidak bisa membuat panggilan.",
    en: "Driver accounts can't make calls.",
  },
  "newCall.offDuty": {
    ko: "현재 기사님이 근무 중이 아닙니다. 기사님이 출근하면 호출할 수 있습니다.",
    id: "Sopir sedang tidak bertugas. Anda bisa memanggil setelah sopir mulai kerja.",
    en: "The driver isn't on duty. You can call once they clock in.",
  },
  "newCall.noDriverOnDuty": { ko: "근무 중인 기사 없음", id: "Tidak ada sopir yang bertugas", en: "No driver on duty" },
  "newCall.destPreset": {
    ko: "목적지: {name} — 만날 곳만 고르시면 됩니다.",
    id: "Tujuan: {name} — tinggal pilih titik jemput.",
    en: "Destination: {name} — just pick where to meet.",
  },
  "newCall.destPresetFailed": {
    ko: "링크로 받은 목적지를 불러오지 못했습니다. 직접 골라 주세요.",
    id: "Tujuan dari tautan gagal dimuat. Silakan pilih sendiri.",
    en: "Couldn't load the destination from the link. Please pick it yourself.",
  },

  // ── 호출 화면 공통
  "call.titleCall": { ko: "호출", id: "Panggilan", en: "Call" },
  "call.caller": { ko: "호출자", id: "Pemanggil", en: "Caller" },
  "call.callerLine": { ko: "호출자: {name}", id: "Pemanggil: {name}", en: "Caller: {name}" },
  "call.callFrom": { ko: "{name}님 호출", id: "Panggilan dari {name}", en: "Call from {name}" },
  "call.callerToDriver": { ko: "{caller}님 → {driver} 기사", id: "{caller} → {driver}", en: "{caller} → {driver}" },
  "call.honorific": { ko: "{name}님", id: "{name}", en: "{name}" },
  "call.calledAt": { ko: "{time} 호출", id: "Dipanggil {time}", en: "Called at {time}" },
  "call.timeline": { ko: "진행 기록", id: "Riwayat proses", en: "Timeline" },
  "call.cancel": { ko: "호출 취소", id: "Batalkan panggilan", en: "Cancel call" },
  "call.cancelConfirmTitle": { ko: "호출을 취소할까요?", id: "Batalkan panggilan ini?", en: "Cancel this call?" },
  "call.cancelAcceptedNote": {
    ko: "기사님이 이미 수락했습니다. 취소하면 기사님께 알림이 갑니다.",
    id: "Sopir sudah menerima. Jika dibatalkan, sopir akan diberi tahu.",
    en: "The driver already accepted. They'll be notified if you cancel.",
  },

  // ── 사장님·가족: 호출 중 (C04)
  "call.calling": { ko: "기사 호출 중...", id: "Memanggil sopir...", en: "Calling your driver..." },
  "call.seen": {
    ko: "✓ 기사님 화면에 호출이 표시되었습니다.",
    id: "✓ Panggilan sudah tampil di layar sopir.",
    en: "✓ The call is showing on the driver's screen.",
  },
  "call.delivering": { ko: "호출을 전달하고 있습니다.", id: "Sedang mengirim panggilan.", en: "Delivering the call." },
  "call.waitingSeconds": { ko: "응답 대기 {s}초", id: "Menunggu respons {s} detik", en: "Waiting for response · {s}s" },

  // ── 수락 이후 (C05)
  "call.hlAcceptedMine": {
    ko: "{driver} 기사님이\n호출을 수락했습니다.",
    id: "Sopir {driver}\nmenerima panggilan Anda.",
    en: "Driver {driver}\naccepted your call.",
  },
  "call.hlAcceptedOther": {
    ko: "{driver} 기사님이\n{caller}님의 호출을 수락했습니다.",
    id: "Sopir {driver}\nmenerima panggilan dari {caller}.",
    en: "Driver {driver}\naccepted {caller}'s call.",
  },
  "call.hlOnTheWay": {
    ko: "{driver} 기사님이\n픽업 장소로 이동 중입니다.",
    id: "Sopir {driver}\nsedang menuju titik jemput.",
    en: "Driver {driver}\nis heading to the pickup point.",
  },
  "call.hlArrived": {
    ko: "{driver} 기사님이\n픽업 장소에 도착했습니다.",
    id: "Sopir {driver}\nsudah tiba di titik jemput.",
    en: "Driver {driver}\nhas arrived at the pickup point.",
  },
  "call.hlTrip": { ko: "운행 중입니다.", id: "Sedang dalam perjalanan.", en: "Trip in progress." },

  // ── 완료·종료 (C06)
  "call.completedTitle": { ko: "운행 완료", id: "Perjalanan selesai", en: "Trip completed" },
  "call.completedSaved": {
    ko: "오늘 호출 기록에 저장되었습니다.",
    id: "Tersimpan di riwayat panggilan hari ini.",
    en: "Saved to today's call history.",
  },
  "call.declinedTitle": {
    ko: "기사님이 지금은 어렵다고 응답했습니다.",
    id: "Sopir sedang tidak bisa sekarang.",
    en: "The driver can't take it right now.",
  },
  "call.declinedDesc": {
    ko: "전화로 직접 확인하거나 잠시 후 다시 호출해주세요.",
    id: "Hubungi langsung lewat telepon atau panggil lagi sebentar lagi.",
    en: "Call them directly or try again in a moment.",
  },
  "call.timeoutTitle": { ko: "기사님의 응답이 없습니다.", id: "Sopir tidak merespons.", en: "The driver didn't respond." },
  "call.timeoutDesc": {
    ko: "기사님이 알림을 못 봤을 수 있습니다. 다시 호출하거나 전화해주세요.",
    id: "Mungkin sopir tidak melihat notifikasinya. Panggil lagi atau telepon.",
    en: "They may have missed the notification. Call again or phone them.",
  },
  "call.cancelledTitle": { ko: "호출이 취소되었습니다.", id: "Panggilan dibatalkan.", en: "The call was cancelled." },
  "call.callAgain": { ko: "다시 호출", id: "Panggil lagi", en: "Call again" },
  "call.callDriverPhone": { ko: "📞 기사님께 전화", id: "📞 Telepon sopir", en: "📞 Phone the driver" },

  // ── 기사 화면 (D02)
  "call.respondWithin": { ko: "{s}초 안에 응답해주세요", id: "Jawab dalam {s} detik", en: "Respond within {s}s" },
  "call.accept": { ko: "호출 수락", id: "Terima panggilan", en: "Accept call" },
  "call.decline": { ko: "지금은 어려워요", id: "Tidak bisa sekarang", en: "Can't right now" },
  "call.declineConfirmTitle": {
    ko: "지금은 어렵다고 응답할까요?",
    id: "Jawab tidak bisa sekarang?",
    en: "Reply that you can't right now?",
  },
  "call.declineConfirmBody": { ko: "{name}님께 바로 알려드립니다.", id: "{name} akan langsung diberi tahu.", en: "{name} will be notified right away." },
  "call.depart": { ko: "출발했어요", id: "Saya berangkat", en: "I'm on my way" },
  "call.arrive": { ko: "도착했어요", id: "Saya sudah tiba", en: "I've arrived" },
  "call.startTrip": { ko: "운행 시작", id: "Mulai perjalanan", en: "Start trip" },
  "call.complete": { ko: "운행 완료", id: "Selesaikan perjalanan", en: "Complete trip" },
  "call.completeConfirmTitle": { ko: "운행을 완료할까요?", id: "Selesaikan perjalanan?", en: "Complete this trip?" },
  "call.navPickup": { ko: "픽업 장소 길안내", id: "Navigasi ke titik jemput", en: "Navigate to pickup" },
  "call.navDestination": { ko: "목적지 길안내", id: "Navigasi ke tujuan", en: "Navigate to destination" },
  "call.dDone": {
    ko: "운행을 완료했습니다. 수고하셨습니다!",
    id: "Perjalanan selesai. Terima kasih!",
    en: "Trip completed. Thank you!",
  },
  "call.dDeclined": { ko: "거절했습니다.", id: "Anda menolak panggilan ini.", en: "You declined this call." },
  "call.dTimeout": {
    ko: "응답 시간이 지나 호출이 종료되었습니다.",
    id: "Waktu respons habis, panggilan berakhir.",
    en: "The response time ran out and the call ended.",
  },
  "call.dCancelled": { ko: "{name}님이 호출을 취소했습니다.", id: "{name} membatalkan panggilan.", en: "{name} cancelled the call." },

  // ── 진행 단계
  "step.aria": { ko: "진행 단계", id: "Tahap perjalanan", en: "Progress" },
  "step.accepted": { ko: "수락", id: "Diterima", en: "Accepted" },
  "step.onTheWay": { ko: "이동", id: "Jalan", en: "En route" },
  "step.arrived": { ko: "도착", id: "Tiba", en: "Arrived" },
  "step.trip": { ko: "운행", id: "Perjalanan", en: "Trip" },
  "step.done": { ko: "완료", id: "Selesai", en: "Done" },

  // ── 진행 기록 (call_events)
  "event.CREATED": { ko: "호출 생성", id: "Panggilan dibuat", en: "Call created" },
  "event.CALLING": { ko: "기사님께 호출 전달 중", id: "Mengirim ke sopir", en: "Sending to driver" },
  "event.RECEIVED": { ko: "기사님 화면에 호출 표시됨", id: "Tampil di layar sopir", en: "Shown on driver's screen" },
  "event.ACCEPTED": { ko: "기사님이 수락", id: "Diterima sopir", en: "Accepted by driver" },
  "event.ON_THE_WAY": { ko: "기사님 출발", id: "Sopir berangkat", en: "Driver departed" },
  "event.ARRIVED": { ko: "픽업 장소 도착", id: "Tiba di titik jemput", en: "Arrived at pickup" },
  "event.TRIP_STARTED": { ko: "운행 시작", id: "Perjalanan dimulai", en: "Trip started" },
  "event.COMPLETED": { ko: "운행 완료", id: "Perjalanan selesai", en: "Trip completed" },
  "event.DECLINED": { ko: "기사님이 거절", id: "Ditolak sopir", en: "Declined by driver" },
  "event.TIMEOUT": { ko: "응답 없음 (시간 초과)", id: "Tidak dijawab (waktu habis)", en: "No response (timed out)" },
  "event.CANCELLED": { ko: "호출 취소", id: "Panggilan dibatalkan", en: "Call cancelled" },
} satisfies Record<string, Tri>;
