import type { Tri } from "@/i18n/core";

/** 개인정보·데이터 활용 동의 · 장소 분류 */
export const privacyMsgs = {
  "settings.privacy": { ko: "개인정보·데이터 활용", id: "Privasi & penggunaan data", en: "Privacy & data use" },
  "privacy.sheetTitle": {
    ko: "더 나은 서비스를 위한 선택 동의",
    id: "Persetujuan opsional untuk layanan yang lebih baik",
    en: "Optional consent for a better service",
  },
  "privacy.intro": {
    ko: "아래 두 항목은 선택입니다. 동의하지 않아도 모든 기능을 그대로 쓸 수 있고, 설정 › 개인정보·데이터 활용에서 언제든 바꿀 수 있습니다.",
    id: "Kedua pilihan di bawah bersifat opsional. Semua fitur tetap bisa dipakai tanpa persetujuan, dan Anda bisa mengubahnya kapan saja di Pengaturan › Privasi & penggunaan data.",
    en: "Both items below are optional. Every feature works without them, and you can change them anytime in Settings › Privacy & data use.",
  },
  "privacy.analyticsTitle": { ko: "이동 통계 활용 (선택)", id: "Statistik perjalanan (opsional)", en: "Trip statistics (optional)" },
  "privacy.analyticsDesc": {
    ko: "운행 기록을 이름·연락처·정확한 위치 없이 약 1km 구역과 시간대 단위의 통계로 바꿔, 서비스 개선과 지역 동향 분석(제휴사에 제공하는 통계 포함)에 씁니다. 같은 묶음이 5건 미만이면 통계에서 뺍니다.",
    id: "Riwayat perjalanan diubah menjadi statistik per area ±1 km dan rentang jam, tanpa nama, kontak, atau lokasi persis, untuk peningkatan layanan dan analisis tren wilayah (termasuk statistik untuk mitra). Kelompok dengan kurang dari 5 perjalanan tidak disertakan.",
    en: "Trips are turned into statistics by ~1 km area and time band — no names, contacts or exact locations — for service improvement and area trend analysis (including statistics shared with partners). Groups with fewer than 5 trips are left out.",
  },
  "privacy.marketingTitle": { ko: "맞춤 혜택 받기 (선택)", id: "Promo yang sesuai (opsional)", en: "Personalized offers (optional)" },
  "privacy.marketingDesc": {
    ko: "자주 가는 장소의 종류(골프장·식당·쇼핑몰 등)를 세어, 관심 있을 만한 혜택과 광고를 보여드립니다. 집·회사는 세지 않으며, 동의를 끄면 바로 삭제됩니다.",
    id: "Kami menghitung jenis tempat yang sering Anda kunjungi (lapangan golf, restoran, mal, dll.) untuk menampilkan promo dan iklan yang relevan. Rumah dan kantor tidak dihitung, dan data langsung dihapus saat persetujuan dimatikan.",
    en: "We count the kinds of places you often visit (golf, restaurants, malls, etc.) to show relevant offers and ads. Home and office aren't counted, and the data is deleted as soon as you turn this off.",
  },
  "privacy.continue": { ko: "선택한 항목으로 계속", id: "Lanjut dengan pilihan ini", en: "Continue with these choices" },
  "privacy.saved": { ko: "저장했습니다.", id: "Tersimpan.", en: "Saved." },
  "privacy.serviceNote": {
    ko: "출발지·목적지와 기사 GPS로 확인한 실제 승하차 지점은 호출·기록 기능을 위해 가족 그룹 안에서만 보관됩니다.",
    id: "Titik jemput, tujuan, dan titik naik/turun aktual dari GPS sopir disimpan hanya di dalam grup keluarga untuk fitur panggilan dan riwayat.",
    en: "Pickup, destination and the actual pickup/drop-off points from the driver's GPS are kept only within your family group for calls and history.",
  },
  "privacy.googleNote": {
    ko: "구글 지도에서 받은 좌표는 구글 약관에 따라 30일 뒤 자동으로 지우고, 다시 쓸 때 새로 받아옵니다.",
    id: "Koordinat dari Google Maps dihapus otomatis setelah 30 hari sesuai ketentuan Google, dan diambil ulang saat dipakai lagi.",
    en: "Coordinates from Google Maps are deleted automatically after 30 days per Google's terms and fetched again when reused.",
  },
  "privacy.updatedAt": { ko: "마지막 변경: {date}", id: "Terakhir diubah: {date}", en: "Last changed: {date}" },

  // ── 기사: 운행 지점 기록 안내 (출근 시트)
  "dhome.consent5": {
    ko: "위치 권한을 허용한 경우, 운행 시작·완료 지점이 운행 기록에 남습니다.",
    id: "Jika izin lokasi diberikan, titik mulai dan selesai perjalanan tercatat di riwayat perjalanan.",
    en: "If location permission is allowed, the trip start and end points are saved in the trip record.",
  },

  // ── 장소 분류 (즐겨찾기)
  "cat.label": { ko: "장소 종류", id: "Jenis tempat", en: "Place type" },
  "cat.HOME": { ko: "집", id: "Rumah", en: "Home" },
  "cat.OFFICE": { ko: "회사", id: "Kantor", en: "Office" },
  "cat.SCHOOL": { ko: "학교", id: "Sekolah", en: "School" },
  "cat.GOLF": { ko: "골프장", id: "Lapangan golf", en: "Golf" },
  "cat.RESTAURANT": { ko: "식당", id: "Restoran", en: "Restaurant" },
  "cat.MALL": { ko: "쇼핑몰", id: "Mal", en: "Mall" },
  "cat.HOTEL": { ko: "호텔", id: "Hotel", en: "Hotel" },
  "cat.AIRPORT": { ko: "공항", id: "Bandara", en: "Airport" },
  "cat.LEISURE": { ko: "여가", id: "Rekreasi", en: "Leisure" },
  "cat.OTHER": { ko: "기타", id: "Lainnya", en: "Other" },
} satisfies Record<string, Tri>;
