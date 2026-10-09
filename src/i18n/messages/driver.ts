import type { Tri } from "@/i18n/core";

/** 기사 카드·기사 홈·위치 공유·기사 관리 */
export const driverMsgs = {
  // ── 기사 표시
  "driver.nameTitle": { ko: "{name} 기사", id: "{name}", en: "{name}" },
  "driver.waitingLink": { ko: "앱 연결 대기 중", id: "Menunggu terhubung ke aplikasi", en: "Waiting to link the app" },
  "driver.clockedInToday": { ko: "오늘 {time} 출근", id: "Mulai kerja hari ini {time}", en: "Clocked in today at {time}" },
  "driver.offDutyState": { ko: "퇴근 상태", id: "Sedang tidak bertugas", en: "Off duty" },
  "driver.clockedInFor": { ko: "{time} 출근 · {dur}", id: "Mulai {time} · {dur}", en: "In at {time} · {dur}" },
  "driver.notClockedIn": { ko: "출근 전입니다", id: "Belum mulai kerja", en: "Not clocked in yet" },

  // ── 기사 홈 (D01)
  "dhome.askReinvite": {
    ko: "관리자에게 다시 초대를 요청해주세요.",
    id: "Minta undangan baru kepada admin.",
    en: "Ask the owner to invite you again.",
  },
  "dhome.clockedIn": { ko: "출근했습니다.", id: "Mulai kerja tercatat.", en: "Clocked in." },
  "dhome.clockedOut": {
    ko: "퇴근했습니다. 수고하셨습니다!",
    id: "Selesai kerja tercatat. Terima kasih atas kerja kerasnya!",
    en: "Clocked out. Thanks for your work!",
  },
  "dhome.noCall": { ko: "현재 호출 없음", id: "Belum ada panggilan", en: "No calls right now" },
  "dhome.clockInToReceive": {
    ko: "출근하면 호출을 받을 수 있습니다",
    id: "Mulai kerja untuk menerima panggilan",
    en: "Clock in to start receiving calls",
  },
  "dhome.clockIn": { ko: "출근하기", id: "Mulai Kerja", en: "Clock in" },
  "dhome.clockOut": { ko: "퇴근하기", id: "Selesai Kerja", en: "Clock out" },
  "dhome.finishFirst": {
    ko: "진행 중인 호출을 마친 뒤 퇴근할 수 있습니다.",
    id: "Selesaikan panggilan yang sedang berjalan sebelum pulang.",
    en: "Finish the current call before clocking out.",
  },
  "dhome.confirmOutTitle": { ko: "퇴근하시겠어요?", id: "Selesai kerja sekarang?", en: "Clock out now?" },
  "dhome.confirmOutBody": {
    ko: "퇴근하면 더 이상 호출을 받지 않습니다.",
    id: "Setelah selesai kerja, Anda tidak akan menerima panggilan lagi.",
    en: "You won't receive calls after clocking out.",
  },
  "dhome.consent1": {
    ko: "근무 중에만 사장님·가족에게 현재 위치가 보입니다.",
    id: "Lokasi Anda hanya terlihat oleh majikan dan keluarganya selama bertugas.",
    en: "Your location is visible to your employer and their family only while on duty.",
  },
  "dhome.consent2": {
    ko: "앱을 화면에 켜 두는 동안 1분 또는 100m 이동마다 전송됩니다.",
    id: "Dikirim setiap 1 menit atau setiap pindah 100 m, selama aplikasi terbuka di layar.",
    en: "Sent every minute or every 100 m moved, while the app is open on screen.",
  },
  "dhome.consent3": {
    ko: "이동 경로는 저장하지 않고, 퇴근하면 위치가 바로 삭제됩니다.",
    id: "Rute perjalanan tidak disimpan, dan lokasi langsung dihapus saat selesai kerja.",
    en: "Your route isn't saved, and your location is deleted when you clock out.",
  },
  "dhome.consent4": {
    ko: "근무 중에도 언제든 끌 수 있습니다.",
    id: "Anda bisa mematikannya kapan saja, bahkan saat bertugas.",
    en: "You can turn it off at any time, even while on duty.",
  },
  "dhome.clockInShare": { ko: "위치 공유하고 출근", id: "Mulai kerja & bagikan lokasi", en: "Clock in & share location" },
  "dhome.clockInNoShare": { ko: "위치 공유 없이 출근", id: "Mulai kerja tanpa berbagi lokasi", en: "Clock in without sharing location" },

  // ── 위치 공유 카드 (기사)
  "share.titleOn": { ko: "근무 중 위치 공유", id: "Berbagi lokasi saat bertugas", en: "Location sharing on duty" },
  "share.titleOff": { ko: "위치 공유 안 함", id: "Tidak berbagi lokasi", en: "Not sharing location" },
  "share.turnedOn": { ko: "위치 공유를 켰습니다.", id: "Berbagi lokasi dinyalakan.", en: "Location sharing turned on." },
  "share.turnedOff": { ko: "위치 공유를 껐습니다.", id: "Berbagi lokasi dimatikan.", en: "Location sharing turned off." },
  "share.lineOff": {
    ko: "위치 공유 꺼짐 — 사장님·가족이 기사님 위치를 볼 수 없습니다.",
    id: "Berbagi lokasi mati — majikan dan keluarga tidak bisa melihat lokasi Anda.",
    en: "Sharing is off — your employer and family can't see your location.",
  },
  "share.lineDenied": {
    ko: "위치 권한이 거부되어 있습니다. 휴대폰 설정에서 위치 권한을 허용해주세요.",
    id: "Izin lokasi ditolak. Izinkan akses lokasi di pengaturan HP.",
    en: "Location permission is denied. Allow it in your phone settings.",
  },
  "share.lineError": {
    ko: "위치를 보내지 못하고 있습니다. GPS와 인터넷을 확인해주세요.",
    id: "Lokasi gagal dikirim. Periksa GPS dan internet.",
    en: "Couldn't send your location. Check GPS and internet.",
  },
  "share.lineSent": { ko: "공유 중 · 마지막 전송 {ago}", id: "Dibagikan · terakhir dikirim {ago}", en: "Sharing · last sent {ago}" },
  "share.lineLocating": { ko: "공유 중 · 위치 확인 중…", id: "Dibagikan · mencari lokasi…", en: "Sharing · finding location…" },
  "share.note": {
    ko: "앱을 화면에 켜 두는 동안 전송되며, 퇴근하면 위치가 삭제됩니다.",
    id: "Dikirim selama aplikasi terbuka di layar, dan dihapus saat selesai kerja.",
    en: "Sent while the app is open on screen; deleted when you clock out.",
  },

  // ── 기사 위치 지도 (사장님·가족)
  "dloc.aria": { ko: "기사 위치", id: "Lokasi sopir", en: "Driver location" },
  "dloc.offDuty": {
    ko: "퇴근 상태에서는 위치가 공유되지 않습니다.",
    id: "Lokasi tidak dibagikan saat sopir tidak bertugas.",
    en: "Location isn't shared while off duty.",
  },
  "dloc.sharingOff": {
    ko: "기사님이 위치 공유를 꺼 두었습니다.",
    id: "Sopir mematikan berbagi lokasi.",
    en: "The driver has turned off location sharing.",
  },
  "dloc.waiting": {
    ko: "위치 확인 중 — 기사님 앱이 열리면 표시됩니다.",
    id: "Mencari lokasi — akan tampil saat aplikasi sopir terbuka.",
    en: "Finding location — it appears when the driver's app is open.",
  },
  "dloc.agoLabel": { ko: "{ago} 위치", id: "Lokasi {ago}", en: "Location {ago}" },
  "dloc.accuracy": { ko: "(오차 약 {m}m)", id: "(akurasi ±{m} m)", en: "(±{m} m)" },
  "dloc.staleNote": {
    ko: "기사님 앱이 닫혀 있거나 화면이 꺼져 있어 위치가 갱신되지 않고 있습니다.",
    id: "Lokasi tidak diperbarui karena aplikasi sopir tertutup atau layarnya mati.",
    en: "The location isn't updating — the driver's app may be closed or the screen off.",
  },
  "dloc.showAddress": { ko: "주소 보기", id: "Lihat alamat", en: "Show address" },

  // ── 기사 관리 (§9)
  "drivers.title": { ko: "우리 기사", id: "Sopir kami", en: "Our drivers" },
  "drivers.add": { ko: "기사 추가", id: "Tambah sopir", en: "Add driver" },
  "drivers.addedToast": {
    ko: "기사를 추가했습니다. 초대 링크를 보내주세요.",
    id: "Sopir ditambahkan. Kirimkan tautan undangan.",
    en: "Driver added. Send them the invite link.",
  },
  "drivers.planLimit": {
    ko: "무료 요금제는 기사 {n}명까지 등록할 수 있습니다.",
    id: "Paket gratis bisa mendaftarkan hingga {n} sopir.",
    en: "The free plan allows up to {n} driver(s).",
  },
  "drivers.nameLabel": { ko: "기사 이름", id: "Nama sopir", en: "Driver name" },
  "drivers.phoneLabel": { ko: "전화번호", id: "Nomor telepon", en: "Phone number" },
  "drivers.status": { ko: "상태", id: "Status", en: "Status" },
  "drivers.monthCalls": { ko: "이번달 호출", id: "Panggilan bulan ini", en: "Calls this month" },
  "drivers.tabWork": { ko: "근무기록", id: "Catatan kerja", en: "Work log" },
  "drivers.tabCalls": { ko: "호출기록", id: "Riwayat panggilan", en: "Calls" },
  "drivers.tabPay": { ko: "급여", id: "Gaji", en: "Pay" },
  "drivers.tabInfo": { ko: "기본정보", id: "Info", en: "Info" },
  "drivers.noWork30": {
    ko: "최근 30일 근무 기록이 없습니다.",
    id: "Tidak ada catatan kerja 30 hari terakhir.",
    en: "No work records in the last 30 days.",
  },
  "drivers.noCallsMonth": { ko: "이번 달 호출 기록이 없습니다.", id: "Belum ada panggilan bulan ini.", en: "No calls this month." },
  "drivers.appLink": { ko: "앱 연결", id: "Koneksi aplikasi", en: "App connection" },
  "drivers.linked": { ko: "기사님 계정이 연결되어 있습니다.", id: "Akun sopir sudah terhubung.", en: "The driver's account is linked." },
  "drivers.unlink": { ko: "연결 해제", id: "Putuskan", en: "Unlink" },
  "drivers.unlinkedToast": { ko: "기사 계정 연결을 해제했습니다.", id: "Akun sopir diputus.", en: "Driver account unlinked." },
  "drivers.inviteHint": {
    ko: "초대 링크를 보내면 기사님이 Google로 로그인해 연결합니다.",
    id: "Kirim tautan undangan, lalu sopir masuk dengan Google untuk terhubung.",
    en: "Send the invite link; the driver signs in with Google to connect.",
  },
  "drivers.unlinkConfirmTitle": { ko: "기사 계정 연결을 해제할까요?", id: "Putuskan akun sopir?", en: "Unlink the driver's account?" },
  "drivers.unlinkConfirmBody": {
    ko: "해제하면 기사님은 더 이상 호출을 받을 수 없습니다. 기록은 유지됩니다.",
    id: "Setelah diputus, sopir tidak bisa menerima panggilan lagi. Riwayat tetap tersimpan.",
    en: "The driver won't receive calls anymore. Records are kept.",
  },
} satisfies Record<string, Tri>;
