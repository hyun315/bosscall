import type { Tri } from "@/i18n/core";

/** 기록 (§12) · 알림함 */
export const historyMsgs = {
  "hist.today": { ko: "오늘", id: "Hari ini", en: "Today" },
  "hist.7d": { ko: "7일", id: "7 hari", en: "7 days" },
  "hist.30d": { ko: "30일", id: "30 hari", en: "30 days" },
  "hist.month": { ko: "이번 달", id: "Bulan ini", en: "This month" },
  "hist.period": { ko: "기간", id: "Periode", en: "Period" },
  "hist.tabCalls": { ko: "호출", id: "Panggilan", en: "Calls" },
  "hist.tabTrips": { ko: "운행", id: "Perjalanan", en: "Trips" },
  "hist.tabWork": { ko: "근무", id: "Kerja", en: "Work" },
  "hist.tabAllCalls": { ko: "전체 호출", id: "Semua panggilan", en: "All calls" },
  "hist.allCallers": { ko: "호출자 전체", id: "Semua pemanggil", en: "All callers" },
  "hist.allDrivers": { ko: "기사 전체", id: "Semua sopir", en: "All drivers" },
  "hist.allStatuses": { ko: "상태 전체", id: "Semua status", en: "All statuses" },
  "hist.noTrips": { ko: "운행 기록이 없습니다.", id: "Belum ada riwayat perjalanan.", en: "No trips yet." },
  "hist.noCalls": { ko: "호출 기록이 없습니다.", id: "Belum ada riwayat panggilan.", en: "No calls yet." },
  "hist.count": { ko: "총 {n}건", id: "Total {n}", en: "{n} total" },
  "hist.noWork": { ko: "근무 기록이 없습니다.", id: "Belum ada catatan kerja.", en: "No work records." },
  "hist.noWorkDesc": {
    ko: "기사님이 출근하기를 누르면 자동으로 기록됩니다.",
    id: "Tercatat otomatis saat sopir menekan Mulai Kerja.",
    en: "Recorded automatically when the driver taps Clock in.",
  },
  "hist.totalWork": { ko: "{range} 총 근무시간", id: "Total jam kerja ({range})", en: "Total work ({range})" },

  "notif.empty": { ko: "새 알림이 없습니다.", id: "Tidak ada notifikasi baru.", en: "No new notifications." },
} satisfies Record<string, Tri>;
