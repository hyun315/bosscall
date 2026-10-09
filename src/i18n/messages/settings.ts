import type { Tri } from "@/i18n/core";

/** 설정·가족·장소·알림 설정·프로필 */
export const settingsMsgs = {
  "settings.family": { ko: "가족 구성원", id: "Anggota keluarga", en: "Family members" },
  "settings.places": { ko: "장소 관리", id: "Kelola tempat", en: "Places" },
  "settings.notifications": { ko: "알림 설정", id: "Pengaturan notifikasi", en: "Notification settings" },
  "settings.language": { ko: "언어", id: "Bahasa", en: "Language" },
  "settings.account": { ko: "계정", id: "Akun", en: "Account" },
  "settings.groupTitle": { ko: "가족/조직 설정", id: "Pengaturan keluarga/organisasi", en: "Family/organization settings" },
  "settings.groupName": { ko: "이름", id: "Nama", en: "Name" },
  "settings.timezone": { ko: "시간대", id: "Zona waktu", en: "Time zone" },

  // ── 가족 (§8)
  "family.invite": { ko: "가족 초대", id: "Undang keluarga", en: "Invite family" },
  "family.inviteDesc": {
    ko: "초대받은 가족은 같은 기사님을 직접 호출하고, 호출 기록과 기사 상태를 함께 볼 수 있습니다.",
    id: "Anggota keluarga yang diundang bisa memanggil sopir yang sama serta melihat riwayat panggilan dan status sopir.",
    en: "Invited family can call the same driver and see the call history and driver status.",
  },
  "family.remove": { ko: "내보내기", id: "Keluarkan", en: "Remove" },
  "family.removedToast": { ko: "{name}님을 내보냈습니다.", id: "{name} telah dikeluarkan.", en: "{name} was removed." },
  "family.removeConfirmTitle": { ko: "{name}님을 내보낼까요?", id: "Keluarkan {name}?", en: "Remove {name}?" },
  "family.removeConfirmBody": {
    ko: "더 이상 기사를 호출하거나 기록을 볼 수 없습니다. 기존 호출 기록은 유지됩니다.",
    id: "Tidak bisa lagi memanggil sopir atau melihat riwayat. Riwayat panggilan lama tetap tersimpan.",
    en: "They can no longer call the driver or view history. Past calls are kept.",
  },
  "family.limitReached": {
    ko: "현재 요금제의 가족 구성원 한도({n}명)에 도달했습니다.",
    id: "Batas anggota keluarga paket ini ({n}) sudah tercapai.",
    en: "You've reached your plan's family limit ({n}).",
  },
  "family.ownerOnly": { ko: "가족 초대는 관리자만 할 수 있습니다.", id: "Hanya admin yang bisa mengundang keluarga.", en: "Only the owner can invite family." },

  // ── 장소 (§11)
  "places.empty": { ko: "즐겨찾는 장소가 없습니다.", id: "Belum ada tempat favorit.", en: "No favorite places yet." },
  "places.emptyDesc": {
    ko: "집·회사·학교를 등록하면 한 번에 호출할 수 있습니다.",
    id: "Simpan rumah, kantor, atau sekolah untuk memanggil sekali tekan.",
    en: "Save home, office or school to call in one tap.",
  },
  "places.add": { ko: "장소 추가", id: "Tambah tempat", en: "Add place" },
  "places.deleteConfirm": { ko: "'{name}'을(를) 삭제할까요?", id: "Hapus '{name}'?", en: "Delete '{name}'?" },
  "places.savedToast": { ko: "장소를 저장했습니다.", id: "Tempat disimpan.", en: "Place saved." },
  "places.nameLabel": { ko: "이름", id: "Nama", en: "Name" },
  "places.namePlaceholder": { ko: "예: Home", id: "Contoh: Rumah", en: "e.g. Home" },

  // ── 알림 설정
  "notifSet.driverCancel": { ko: "호출 취소 알림", id: "Notifikasi pembatalan", en: "Cancellation alerts" },
  "notifSet.driverCancelDesc": {
    ko: "호출자가 호출을 취소하면 알려드립니다.",
    id: "Diberi tahu saat pemanggil membatalkan.",
    en: "Get notified when a caller cancels.",
  },
  "notifSet.callResults": { ko: "호출 결과 알림", id: "Notifikasi hasil panggilan", en: "Call updates" },
  "notifSet.callResultsDesc": {
    ko: "수락·거절·취소·운행 완료",
    id: "Diterima · ditolak · dibatalkan · selesai",
    en: "Accepted · declined · cancelled · completed",
  },
  "notifSet.work": { ko: "기사 출근/퇴근 알림", id: "Notifikasi masuk/pulang sopir", en: "Driver clock-in/out alerts" },
  "notifSet.workDesc": {
    ko: "기사님이 출근·퇴근하면 알려드립니다.",
    id: "Diberi tahu saat sopir mulai atau selesai kerja.",
    en: "Get notified when the driver clocks in or out.",
  },
  "notifSet.driverNote": {
    ko: "새 호출 알림은 끌 수 없습니다. 호출을 놓치지 마세요.",
    id: "Notifikasi panggilan baru tidak bisa dimatikan. Jangan sampai terlewat!",
    en: "New-call alerts can't be turned off. Don't miss a call!",
  },

  // ── 기사 프로필
  "profile.group": { ko: "소속", id: "Grup", en: "Group" },
  "profile.phone": { ko: "등록 전화번호", id: "Nomor terdaftar", en: "Registered phone" },
} satisfies Record<string, Tri>;
