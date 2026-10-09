import type { Tri } from "@/i18n/core";

/** 브랜드·로그인·온보딩·초대 수락·시간대·언어 */
export const authMsgs = {
  // ── 브랜드 (명세 §31)
  "brand.tagline": { ko: "내 기사, 한 번에 호출.", id: "Sopir Anda, sekali tekan.", en: "Your driver, one tap away." },
  "brand.desc1": {
    ko: "전화도, 주소 설명도 필요 없습니다.",
    id: "Tidak perlu menelepon atau menjelaskan alamat.",
    en: "No phone calls, no explaining addresses.",
  },
  "brand.desc2": {
    ko: "위치를 선택하고 버튼 한 번이면 됩니다.",
    id: "Pilih lokasi, lalu tekan satu tombol.",
    en: "Pick a location and tap once.",
  },

  // ── 로그인
  "login.google": { ko: "Google로 계속", id: "Lanjut dengan Google", en: "Continue with Google" },
  "login.failed": {
    ko: "로그인하지 못했습니다. 잠시 후 다시 시도해주세요.",
    id: "Gagal masuk. Silakan coba lagi sebentar lagi.",
    en: "Couldn't sign in. Please try again shortly.",
  },
  "login.driverHint": {
    ko: "기사님도 같은 방법으로 로그인한 뒤, 사장님이 보낸 초대 링크를 열면 연결됩니다.",
    id: "Sopir juga masuk dengan cara yang sama, lalu buka tautan undangan dari majikan untuk terhubung.",
    en: "Drivers sign in the same way, then open the invite link from their employer to connect.",
  },

  // ── 언어
  "lang.title": { ko: "언어", id: "Bahasa", en: "Language" },
  "lang.desc": {
    ko: "화면과 알림에 쓰이는 언어입니다.",
    id: "Bahasa untuk tampilan dan notifikasi.",
    en: "Used for screens and notifications.",
  },

  // ── 시간대
  "tz.jakarta": { ko: "자카르타 (WIB, UTC+7)", id: "Jakarta (WIB, UTC+7)", en: "Jakarta (WIB, UTC+7)" },
  "tz.makassar": { ko: "발리·마카사르 (WITA, UTC+8)", id: "Bali·Makassar (WITA, UTC+8)", en: "Bali·Makassar (WITA, UTC+8)" },
  "tz.jayapura": { ko: "자야뿌라 (WIT, UTC+9)", id: "Jayapura (WIT, UTC+9)", en: "Jayapura (WIT, UTC+9)" },
  "tz.seoul": { ko: "서울 (KST, UTC+9)", id: "Seoul (KST, UTC+9)", en: "Seoul (KST, UTC+9)" },
  "tz.singapore": { ko: "싱가포르 (UTC+8)", id: "Singapura (UTC+8)", en: "Singapore (UTC+8)" },
  "tz.hcm": { ko: "호찌민 (UTC+7)", id: "Ho Chi Minh (UTC+7)", en: "Ho Chi Minh City (UTC+7)" },

  // ── 온보딩 (§20)
  "onb.steps": { ko: "시작 단계", id: "Langkah awal", en: "Getting started" },
  "onb.step1": { ko: "가족 만들기", id: "Buat keluarga", en: "Create family" },
  "onb.title": { ko: "시작해볼까요?", id: "Ayo mulai!", en: "Let's get started" },
  "onb.subtitle": {
    ko: "우리 가족의 기사를 함께 사용하세요.",
    id: "Gunakan sopir keluarga bersama-sama.",
    en: "Share your family driver together.",
  },
  "onb.defaultGroupName": { ko: "{name} Family", id: "Keluarga {name}", en: "{name} Family" },
  "onb.groupName": { ko: "우리 가족/조직 이름", id: "Nama keluarga/organisasi", en: "Family/organization name" },
  "onb.driverPlaceholder": { ko: "예: Pak Budi", id: "Contoh: Pak Budi", en: "e.g. Pak Budi" },
  "onb.driverPhone": {
    ko: "기사 전화번호 (선택 · 전화/WhatsApp 연결용)",
    id: "Nomor telepon sopir (opsional · untuk telepon/WhatsApp)",
    en: "Driver phone (optional · for calls/WhatsApp)",
  },
  "onb.timezone": {
    ko: "시간대 (근무시간 계산 기준)",
    id: "Zona waktu (dasar perhitungan jam kerja)",
    en: "Time zone (used for work hours)",
  },
  "onb.start": { ko: "시작하기", id: "Mulai", en: "Start" },
  "onb.gotInvite": { ko: "초대 링크를 받으셨나요?", id: "Sudah menerima tautan undangan?", en: "Got an invite link?" },
  "onb.gotInviteDesc": {
    ko: "기사님이나 가족 구성원은 새로 만들지 말고, 받은 초대 링크를 그대로 열어주세요.",
    id: "Sopir dan anggota keluarga tidak perlu membuat grup baru — cukup buka tautan undangan yang diterima.",
    en: "Drivers and family members shouldn't create a new group — just open the invite link you received.",
  },
  "onb.connectTitle": { ko: "{name} 기사님을 연결하세요", id: "Hubungkan sopir {name}", en: "Connect your driver, {name}" },
  "onb.connectDesc": {
    ko: "초대 링크를 WhatsApp으로 보내주세요. 기사님이 링크를 열고 Google로 로그인하면 바로 연결됩니다.",
    id: "Kirim tautan undangan lewat WhatsApp. Setelah sopir membuka tautan dan masuk dengan Google, langsung terhubung.",
    en: "Send the invite link via WhatsApp. Once the driver opens it and signs in with Google, you're connected.",
  },
  "onb.later": { ko: "홈으로 이동 (나중에 연결하기)", id: "Ke Beranda (hubungkan nanti)", en: "Go home (connect later)" },

  // ── 초대 수락 화면
  "inv.connected": { ko: "연결되었습니다!", id: "Berhasil terhubung!", en: "Connected!" },
  "inv.cannotCheck": { ko: "초대 링크를 확인할 수 없습니다", id: "Tautan undangan tidak dapat diperiksa", en: "Couldn't check the invite link" },
  "inv.alreadyIn": { ko: "이미 {group}에 연결되어 있습니다", id: "Anda sudah terhubung ke {group}", en: "You're already in {group}" },
  "inv.expired": { ko: "만료된 초대 링크입니다", id: "Tautan undangan sudah kedaluwarsa", en: "This invite link has expired" },
  "inv.askNew": { ko: "{name}님에게 새 링크를 요청해주세요.", id: "Minta tautan baru kepada {name}.", en: "Ask {name} for a new link." },
  "inv.joinAsDriver": { ko: "{group}의 기사로 연결합니다", id: "Bergabung sebagai sopir {group}", en: "Join {group} as their driver" },
  "inv.joinAsMember": { ko: "{group}에 가족으로 참여합니다", id: "Bergabung ke {group} sebagai keluarga", en: "Join {group} as family" },
  "inv.inviter": { ko: "초대한 사람", id: "Diundang oleh", en: "Invited by" },
  "inv.myAccount": { ko: "내 계정", id: "Akun saya", en: "My account" },
  "inv.driverNote": {
    ko: "연결 후 출근하기를 누르면 호출을 받을 수 있습니다. 호출을 놓치지 않도록 알림을 꼭 켜주세요.",
    id: "Setelah terhubung, tekan Mulai Kerja untuk menerima panggilan. Nyalakan notifikasi agar tidak ada panggilan yang terlewat.",
    en: "After connecting, tap Clock in to start receiving calls. Turn on notifications so you don't miss any.",
  },
  "inv.memberNote": {
    ko: "연결 후 같은 기사님을 직접 호출하고 호출 기록을 함께 볼 수 있습니다.",
    id: "Setelah terhubung, Anda bisa memanggil sopir yang sama dan melihat riwayat panggilan bersama.",
    en: "After connecting, you can call the same driver and see the shared call history.",
  },
  "inv.connect": { ko: "연결하기", id: "Hubungkan", en: "Connect" },
} satisfies Record<string, Tri>;
