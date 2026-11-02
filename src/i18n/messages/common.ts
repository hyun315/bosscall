import type { Tri } from "@/i18n/core";

/** 공통 단어·상태·역할·내비게이션·알림 권한·초대·계정 */
export const commonMsgs = {
  // ── 공통 버튼·단어
  "common.close": { ko: "닫기", id: "Tutup", en: "Close" },
  "common.confirm": { ko: "확인", id: "OK", en: "OK" },
  "common.cancel": { ko: "취소", id: "Batal", en: "Cancel" },
  "common.goBack": { ko: "돌아가기", id: "Kembali", en: "Go back" },
  "common.loading": { ko: "불러오는 중…", id: "Memuat…", en: "Loading…" },
  "common.retry": { ko: "다시 시도", id: "Coba lagi", en: "Try again" },
  "common.back": { ko: "뒤로", id: "Kembali", en: "Back" },
  "common.save": { ko: "저장", id: "Simpan", en: "Save" },
  "common.saved": { ko: "저장했습니다.", id: "Tersimpan.", en: "Saved." },
  "common.add": { ko: "추가", id: "Tambah", en: "Add" },
  "common.delete": { ko: "삭제", id: "Hapus", en: "Delete" },
  "common.deleted": { ko: "삭제했습니다.", id: "Terhapus.", en: "Deleted." },
  "common.edit": { ko: "수정", id: "Ubah", en: "Edit" },
  "common.change": { ko: "변경", id: "Ganti", en: "Change" },
  "common.turnOn": { ko: "켜기", id: "Nyalakan", en: "Turn on" },
  "common.turnOff": { ko: "끄기", id: "Matikan", en: "Turn off" },
  "common.home": { ko: "홈으로", id: "Ke Beranda", en: "Go home" },
  "common.all": { ko: "전체", id: "Semua", en: "All" },
  "common.open": { ko: "열기", id: "Buka", en: "Open" },
  "common.phoneCall": { ko: "📞 전화", id: "📞 Telepon", en: "📞 Call" },
  "common.none": { ko: "없음", id: "Tidak ada", en: "None" },
  "common.me": { ko: "(나)", id: "(saya)", en: "(me)" },
  "common.defaultUserName": { ko: "사용자", id: "Pengguna", en: "User" },
  "common.viewOnMap": { ko: "지도에서 보기 ↗", id: "Lihat di peta ↗", en: "View on map ↗" },
  "common.googleMaps": { ko: "Google 지도 ↗", id: "Google Maps ↗", en: "Google Maps ↗" },
  "common.logout": { ko: "로그아웃", id: "Keluar", en: "Sign out" },
  "common.otherAccount": { ko: "다른 계정으로 로그인", id: "Masuk dengan akun lain", en: "Use a different account" },
  "common.inProgress": { ko: "근무 중", id: "Sedang kerja", en: "On duty" },

  // ── 헤더·내비게이션
  "header.notifications": { ko: "알림", id: "Notifikasi", en: "Notifications" },
  "header.notificationsCount": { ko: "알림 {n}개", id: "{n} notifikasi", en: "{n} notifications" },
  "nav.main": { ko: "주요 메뉴", id: "Menu utama", en: "Main menu" },
  "nav.home": { ko: "홈", id: "Beranda", en: "Home" },
  "nav.history": { ko: "기록", id: "Riwayat", en: "History" },
  "nav.drivers": { ko: "기사", id: "Sopir", en: "Drivers" },
  "nav.settings": { ko: "설정", id: "Pengaturan", en: "Settings" },
  "nav.profile": { ko: "프로필", id: "Profil", en: "Profile" },

  // ── 호출 상태
  "callStatus.CREATED": { ko: "호출 생성", id: "Dibuat", en: "Created" },
  "callStatus.CALLING": { ko: "호출 중", id: "Memanggil", en: "Calling" },
  "callStatus.RECEIVED": { ko: "기사 확인 중", id: "Dilihat sopir", en: "Seen by driver" },
  "callStatus.ACCEPTED": { ko: "수락됨", id: "Diterima", en: "Accepted" },
  "callStatus.ON_THE_WAY": { ko: "이동 중", id: "Dalam perjalanan", en: "On the way" },
  "callStatus.ARRIVED": { ko: "도착", id: "Sudah tiba", en: "Arrived" },
  "callStatus.TRIP_STARTED": { ko: "운행 중", id: "Sedang jalan", en: "In trip" },
  "callStatus.COMPLETED": { ko: "완료", id: "Selesai", en: "Completed" },
  "callStatus.DECLINED": { ko: "거절", id: "Ditolak", en: "Declined" },
  "callStatus.TIMEOUT": { ko: "응답 없음", id: "Tidak dijawab", en: "No response" },
  "callStatus.CANCELLED": { ko: "취소", id: "Dibatalkan", en: "Cancelled" },

  // ── 기사 상태
  "driverStatus.ON_DUTY": { ko: "근무 중", id: "Bertugas", en: "On duty" },
  "driverStatus.BUSY": { ko: "운행 중", id: "Sedang jalan", en: "On a trip" },
  "driverStatus.OFF_DUTY": { ko: "퇴근", id: "Selesai kerja", en: "Off duty" },
  "driverStatus.INACTIVE": { ko: "미연결", id: "Belum terhubung", en: "Not linked" },

  // ── 역할
  "role.OWNER": { ko: "관리자", id: "Admin", en: "Owner" },
  "role.MEMBER": { ko: "가족", id: "Keluarga", en: "Family" },
  "role.DRIVER": { ko: "기사", id: "Sopir", en: "Driver" },
  "role.ADMIN": { ko: "운영자", id: "Operator", en: "Operator" },

  // ── 시간 표시
  "time.justNow": { ko: "방금 전", id: "baru saja", en: "just now" },
  "time.ago": { ko: "{t} 전", id: "{t} lalu", en: "{t} ago" },

  // ── 실시간 데이터 오류
  "live.permission": { ko: "이 정보를 볼 권한이 없습니다.", id: "Anda tidak punya akses ke data ini.", en: "You don't have access to this." },
  "live.index": {
    ko: "데이터베이스 색인을 준비 중입니다. 잠시 후 다시 시도해주세요.",
    id: "Indeks database sedang disiapkan. Coba lagi sebentar lagi.",
    en: "The database index is being prepared. Please try again shortly.",
  },
  "live.failed": { ko: "정보를 불러오지 못했습니다.", id: "Gagal memuat data.", en: "Couldn't load data." },

  // ── 푸시 알림 권한
  "pushp.enabled": { ko: "알림을 켰습니다.", id: "Notifikasi dinyalakan.", en: "Notifications turned on." },
  "pushp.blockedToast": {
    ko: "알림이 차단되어 있습니다. 기기 설정에서 허용해주세요.",
    id: "Notifikasi diblokir. Izinkan di pengaturan perangkat.",
    en: "Notifications are blocked. Allow them in your device settings.",
  },
  "pushp.granted": { ko: "이 기기에서 알림을 받고 있습니다.", id: "Perangkat ini menerima notifikasi.", en: "This device receives notifications." },
  "pushp.default": {
    ko: "알림을 켜야 앱을 닫아도 호출을 받을 수 있습니다.",
    id: "Nyalakan notifikasi agar tetap menerima panggilan saat aplikasi ditutup.",
    en: "Turn on notifications to receive calls even when the app is closed.",
  },
  "pushp.denied": {
    ko: "알림이 차단되어 있습니다. 휴대폰 설정 › 알림에서 BossCall(또는 브라우저)을 허용해주세요.",
    id: "Notifikasi diblokir. Buka Pengaturan HP › Notifikasi dan izinkan BossCall (atau browser).",
    en: "Notifications are blocked. Go to phone Settings › Notifications and allow BossCall (or the browser).",
  },
  "pushp.needsInstall": {
    ko: "iPhone은 Safari 공유 버튼 › ‘홈 화면에 추가’로 설치한 뒤, 설치된 앱에서 알림을 켤 수 있습니다.",
    id: "Di iPhone, pasang dulu lewat tombol Bagikan di Safari › ‘Tambah ke Layar Utama’, lalu nyalakan notifikasi dari aplikasinya.",
    en: "On iPhone, install via Safari's Share button › ‘Add to Home Screen’, then turn on notifications in the installed app.",
  },
  "pushp.unsupported": {
    ko: "이 브라우저는 푸시 알림을 지원하지 않습니다. Chrome(안드로이드) 또는 홈 화면 앱(iPhone)을 사용해주세요.",
    id: "Browser ini tidak mendukung notifikasi. Gunakan Chrome (Android) atau aplikasi di layar utama (iPhone).",
    en: "This browser doesn't support push notifications. Use Chrome (Android) or the home-screen app (iPhone).",
  },
  "pushp.on": { ko: "🔔 알림 켜짐", id: "🔔 Notifikasi aktif", en: "🔔 Notifications on" },
  "pushp.off": { ko: "🔕 알림 꺼짐", id: "🔕 Notifikasi mati", en: "🔕 Notifications off" },
  "pushp.enableHere": { ko: "이 기기에서 알림 켜기", id: "Nyalakan notifikasi di perangkat ini", en: "Turn on notifications on this device" },
  "pushp.noVapid": { ko: "푸시 설정(VAPID 키)이 없습니다.", id: "Pengaturan push (kunci VAPID) belum ada.", en: "Push settings (VAPID key) are missing." },
  "pushp.noToken": { ko: "알림 토큰을 받지 못했습니다.", id: "Gagal mendapatkan token notifikasi.", en: "Couldn't get a notification token." },

  // ── 초대 링크
  "invite.msgDriver": {
    ko: "[BossCall] {group}에서 {name} 기사님을 초대합니다. 아래 링크를 열고 Google로 로그인해주세요.",
    id: "[BossCall] {group} mengundang Anda, {name}, sebagai sopir. Buka tautan di bawah dan masuk dengan Google.",
    en: "[BossCall] {group} invites {name} to join as their driver. Open the link below and sign in with Google.",
  },
  "invite.msgMember": {
    ko: "[BossCall] {group} 가족으로 초대합니다. 우리 가족의 기사를 함께 사용하세요.",
    id: "[BossCall] Anda diundang ke keluarga {group}. Gunakan sopir keluarga bersama-sama.",
    en: "[BossCall] You're invited to join {group}. Share the family driver together.",
  },
  "invite.copied": { ko: "링크를 복사했습니다.", id: "Tautan disalin.", en: "Link copied." },
  "invite.copyFailed": {
    ko: "복사하지 못했습니다. 링크를 길게 눌러 복사해주세요.",
    id: "Gagal menyalin. Tekan lama tautannya untuk menyalin.",
    en: "Couldn't copy. Long-press the link to copy it.",
  },
  "invite.shareTitle": { ko: "BossCall 초대", id: "Undangan BossCall", en: "BossCall invite" },
  "invite.makeDriver": { ko: "기사 초대 링크 만들기", id: "Buat tautan undangan sopir", en: "Create driver invite link" },
  "invite.makeMember": { ko: "가족 초대 링크 만들기", id: "Buat tautan undangan keluarga", en: "Create family invite link" },
  "invite.validity": { ko: "7일간 유효 · 1회용", id: "Berlaku 7 hari · sekali pakai", en: "Valid 7 days · single use" },
  "invite.shareCopy": { ko: "공유 / 복사", id: "Bagikan / Salin", en: "Share / Copy" },

  // ── 계정
  "account.nameLabel": {
    ko: "이름 (호출자·기사 표시에 사용)",
    id: "Nama (ditampilkan sebagai pemanggil/sopir)",
    en: "Name (shown as caller/driver)",
  },
  "account.phoneLabel": { ko: "전화번호 (선택)", id: "Nomor telepon (opsional)", en: "Phone number (optional)" },

  // ── 홈 화면에 추가 (PWA 설치)
  "install.title": { ko: "홈 화면에 BossCall 추가하기", id: "Tambahkan BossCall ke layar utama", en: "Add BossCall to your home screen" },
  "install.whyDriver": {
    ko: "홈 화면 앱으로 써야 화면이 꺼져 있어도 호출 알림이 옵니다. 꼭 해주세요.",
    id: "Pakai dari layar utama agar notifikasi panggilan tetap masuk walau layar mati. Wajib dilakukan.",
    en: "Use it from the home screen so call alerts arrive even with the screen off. Please do this.",
  },
  "install.whyOwner": {
    ko: "앱처럼 아이콘으로 바로 열고, 기사님 수락·도착 알림을 받을 수 있습니다.",
    id: "Buka langsung dari ikon seperti aplikasi dan terima notifikasi sopir.",
    en: "Open it from an icon like an app and get driver updates.",
  },
  "install.iosOpenSafari": {
    ko: "지금 브라우저에서는 추가할 수 없을 수 있습니다. 주소를 복사해 Safari에서 열어주세요.",
    id: "Browser ini mungkin tidak bisa menambahkan. Salin alamat dan buka di Safari.",
    en: "This browser may not support it. Copy the address and open it in Safari.",
  },
  "install.iosStep1a": { ko: "Safari 아래쪽", id: "Di bawah Safari, ketuk", en: "In Safari, tap" },
  "install.iosStep1b": { ko: "공유 버튼을 누릅니다", id: "tombol Bagikan", en: "the Share button" },
  "install.iosStep2": {
    ko: "목록을 내려 '홈 화면에 추가'를 누릅니다",
    id: "Gulir ke bawah, ketuk 'Tambah ke Layar Utama'",
    en: "Scroll down and tap 'Add to Home Screen'",
  },
  "install.iosStep3": {
    ko: "홈 화면에 생긴 BossCall 아이콘으로 열고 알림을 켭니다",
    id: "Buka BossCall dari ikon di layar utama, lalu nyalakan notifikasi",
    en: "Open BossCall from the new home-screen icon and turn on notifications",
  },
  "install.androidButton": { ko: "📲 앱 설치", id: "📲 Pasang aplikasi", en: "📲 Install app" },
  "install.androidManual": {
    ko: "Chrome 오른쪽 위 ⋮ 메뉴 › '앱 설치' 또는 '홈 화면에 추가'를 누르세요.",
    id: "Ketuk menu ⋮ di kanan atas Chrome › 'Instal aplikasi' atau 'Tambahkan ke Layar utama'.",
    en: "Tap Chrome's ⋮ menu (top right) › 'Install app' or 'Add to Home screen'.",
  },
  "install.desktopManual": {
    ko: "휴대폰에서 이 주소를 열면 홈 화면에 추가할 수 있습니다.",
    id: "Buka alamat ini di HP untuk menambahkannya ke layar utama.",
    en: "Open this address on your phone to add it to the home screen.",
  },
  "install.later": { ko: "나중에", id: "Nanti", en: "Later" },
  "install.using": { ko: "홈 화면 앱으로 사용 중입니다", id: "Sedang dipakai sebagai aplikasi layar utama", en: "You're using the home-screen app" },

  // ── 광고 칸
  "ad.label": { ko: "광고", id: "Iklan", en: "Ad" },
  "ad.openLink": { ko: "자세히 보기", id: "Lihat selengkapnya", en: "Learn more" },
  "ad.setPickup": { ko: "출발지로 설정", id: "Jadikan penjemputan", en: "Set as pickup" },
  "ad.setDestination": { ko: "목적지로 설정", id: "Jadikan tujuan", en: "Set as destination" },
  "ad.emptyTitle": {
    ko: "광고 자리 {n} · 우리 가게를 알리세요",
    id: "Slot iklan {n} · Promosikan usaha Anda",
    en: "Ad slot {n} · Advertise here",
  },
  "ad.inquiryShort": {
    ko: "🎉 신규 출시 기념 · 2027년 3월 31일까지 광고 무료",
    id: "🎉 Promo peluncuran · iklan gratis s.d. 31 Maret 2027",
    en: "🎉 Launch offer · free ads until March 31, 2027",
  },
  "ad.inquiryMore": { ko: "광고 안내", id: "Info iklan", en: "Learn more" },
  "ad.inquiryLine": {
    ko: "광고 신청 · 문의 — 2027년 3월까지 무료",
    id: "Pasang iklan · tanya iklan — gratis s.d. Maret 2027",
    en: "Advertise · ask about ads — free until March 2027",
  },
} satisfies Record<string, Tri>;
