import type { Tri } from "@/i18n/core";

/** 사장님·가족 홈 (§4) */
export const homeMsgs = {
  "home.greeting": { ko: "안녕하세요, {name}님", id: "Halo, {name}", en: "Hello, {name}" },
  "home.gettingStarted": { ko: "BossCall 시작하기", id: "Mulai pakai BossCall", en: "Get started with BossCall" },
  "home.stepGroup": { ko: "{group} 만들기", id: "Buat {group}", en: "Create {group}" },
  "home.stepDriver": { ko: "기사 연결", id: "Hubungkan sopir", en: "Connect driver" },
  "home.stepFirstCall": { ko: "첫 호출", id: "Panggilan pertama", en: "First call" },
  "home.invite": { ko: "초대하기", id: "Undang", en: "Invite" },
  "home.noDriverTitle": { ko: "아직 연결된 기사가 없습니다.", id: "Belum ada sopir yang terhubung.", en: "No driver connected yet." },
  "home.noDriverDesc": {
    ko: "기사님을 초대하면\n바로 BossCall을 사용할 수 있습니다.",
    id: "Undang sopir Anda\nuntuk langsung memakai BossCall.",
    en: "Invite your driver\nto start using BossCall right away.",
  },
  "home.inviteDriver": { ko: "기사 초대", id: "Undang sopir", en: "Invite driver" },
  "home.driverLocation": { ko: "기사 위치 보기", id: "Lihat lokasi sopir", en: "View driver location" },
  "home.sharingOff": { ko: "공유 꺼짐", id: "Tidak dibagikan", en: "Sharing off" },
  "home.locating": { ko: "확인 중", id: "Mencari…", en: "Locating…" },
  "home.waitForLink": {
    ko: "기사님이 초대 링크로 앱에 연결되면 호출할 수 있습니다.",
    id: "Anda bisa memanggil setelah sopir terhubung lewat tautan undangan.",
    en: "You can call once the driver connects via the invite link.",
  },
  "home.contactDriver": { ko: "기사에게 연락하기", id: "Hubungi sopir", en: "Contact driver" },
  "home.busyNote": {
    ko: "진행 중인 호출이 끝나면 새로 호출할 수 있습니다.",
    id: "Anda bisa memanggil lagi setelah panggilan saat ini selesai.",
    en: "You can make a new call once the current one ends.",
  },
  "home.callDriver": { ko: "기사 호출", id: "Panggil Sopir", en: "Call Driver" },
  "home.todayCalls": { ko: "오늘 호출", id: "Panggilan hari ini", en: "Calls today" },
  "home.workHours": { ko: "근무시간", id: "Jam kerja", en: "Work hours" },
  "home.recentCalls": { ko: "최근 호출", id: "Panggilan terakhir", en: "Recent calls" },
  "home.noCalls": { ko: "아직 호출 기록이 없습니다.", id: "Belum ada riwayat panggilan.", en: "No calls yet." },
} satisfies Record<string, Tri>;
