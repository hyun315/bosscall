import type { Tri } from "@/i18n/core";

/** 서버 오류·입력 검증·입력칸 이름 */
export const errorMsgs = {
  // ── 공통 HTTP
  "err.unauthenticated": { ko: "로그인이 필요합니다.", id: "Silakan masuk terlebih dahulu.", en: "Please sign in." },
  "err.sessionExpired": {
    ko: "로그인이 만료되었습니다. 다시 로그인해주세요.",
    id: "Sesi Anda telah berakhir. Silakan masuk kembali.",
    en: "Your session has expired. Please sign in again.",
  },
  "err.forbidden": { ko: "권한이 없습니다.", id: "Anda tidak memiliki akses.", en: "You don't have permission." },
  "err.notFound": { ko: "찾을 수 없습니다.", id: "Tidak ditemukan.", en: "Not found." },
  "err.tooMany": {
    ko: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    id: "Terlalu banyak permintaan. Coba lagi sebentar lagi.",
    en: "Too many requests. Please try again shortly.",
  },
  "err.badJson": { ko: "요청 형식이 올바르지 않습니다.", id: "Format permintaan tidak valid.", en: "Invalid request format." },
  "err.internal": {
    ko: "일시적인 오류가 발생했습니다. 다시 시도해주세요.",
    id: "Terjadi kesalahan sementara. Silakan coba lagi.",
    en: "Something went wrong. Please try again.",
  },
  "err.network": { ko: "인터넷 연결을 확인해주세요.", id: "Periksa koneksi internet Anda.", en: "Check your internet connection." },
  "err.requestFailed": { ko: "요청을 처리하지 못했습니다.", id: "Permintaan tidak dapat diproses.", en: "Couldn't process the request." },
  "err.unknown": { ko: "알 수 없는 오류가 발생했습니다.", id: "Terjadi kesalahan.", en: "An unknown error occurred." },

  // ── 입력 검증 ({field} 는 아래 field.* 로 번역되어 들어감)
  "val.format": { ko: "{field} 형식이 올바르지 않습니다.", id: "Format {field} tidak valid.", en: "{field} has an invalid format." },
  "val.required": { ko: "{field}을(를) 입력해주세요.", id: "Mohon isi {field}.", en: "Please enter {field}." },
  "val.tooLong": {
    ko: "{field}은(는) {max}자 이하로 입력해주세요.",
    id: "{field} maksimal {max} karakter.",
    en: "{field} must be {max} characters or fewer.",
  },
  "val.invalid": { ko: "{field} 값이 올바르지 않습니다.", id: "Nilai {field} tidak valid.", en: "Invalid {field}." },
  "val.outOfRange": {
    ko: "{field} 값이 허용 범위를 벗어났습니다.",
    id: "{field} di luar batas yang diizinkan.",
    en: "{field} is out of the allowed range.",
  },
  "val.phone": { ko: "전화번호 형식이 올바르지 않습니다.", id: "Format nomor telepon tidak valid.", en: "Invalid phone number." },
  "val.amount": { ko: "{field} 금액이 올바르지 않습니다.", id: "Jumlah {field} tidak valid.", en: "Invalid amount for {field}." },
  "val.regularHours": {
    ko: "기본 근무시간은 1~16시간 사이로 입력해주세요.",
    id: "Jam kerja normal harus antara 1–16 jam.",
    en: "Regular hours must be between 1 and 16.",
  },

  // ── 입력칸 이름
  "field.request": { ko: "요청", id: "permintaan", en: "request" },
  "field.group": { ko: "그룹", id: "grup", en: "group" },
  "field.action": { ko: "동작", id: "aksi", en: "action" },
  "field.call": { ko: "호출", id: "panggilan", en: "call" },
  "field.driver": { ko: "기사", id: "sopir", en: "driver" },
  "field.pickup": { ko: "픽업 위치", id: "titik jemput", en: "pickup location" },
  "field.destination": { ko: "목적지", id: "tujuan", en: "destination" },
  "field.place": { ko: "장소", id: "tempat", en: "place" },
  "field.address": { ko: "주소", id: "alamat", en: "address" },
  "field.placeLabel": { ko: "장소 이름", id: "nama tempat", en: "place name" },
  "field.placeId": { ko: "장소 ID", id: "ID tempat", en: "place ID" },
  "field.coordSource": { ko: "좌표 출처", id: "sumber koordinat", en: "coordinate source" },
  "field.category": { ko: "장소 분류", id: "kategori tempat", en: "place category" },
  "field.position": { ko: "현재 위치", id: "posisi", en: "position" },
  "field.consents": { ko: "동의", id: "persetujuan", en: "consent" },
  "field.latitude": { ko: "위도", id: "lintang", en: "latitude" },
  "field.longitude": { ko: "경도", id: "bujur", en: "longitude" },
  "field.token": { ko: "토큰", id: "token", en: "token" },
  "field.driverName": { ko: "기사 이름", id: "nama sopir", en: "driver name" },
  "field.favorite": { ko: "즐겨찾기", id: "favorit", en: "favorite" },
  "field.groupName": { ko: "가족/조직 이름", id: "nama keluarga/organisasi", en: "family/organization name" },
  "field.timezone": { ko: "시간대", id: "zona waktu", en: "time zone" },
  "field.inviteCode": { ko: "초대 코드", id: "kode undangan", en: "invite code" },
  "field.inviteType": { ko: "초대 유형", id: "jenis undangan", en: "invite type" },
  "field.accuracy": { ko: "정확도", id: "akurasi", en: "accuracy" },
  "field.capturedAt": { ko: "측정 시각", id: "waktu pengukuran", en: "measurement time" },
  "field.setting": { ko: "설정", id: "pengaturan", en: "setting" },
  "field.name": { ko: "이름", id: "nama", en: "name" },
  "field.notifSettings": { ko: "알림 설정", id: "pengaturan notifikasi", en: "notification settings" },
  "field.member": { ko: "구성원", id: "anggota", en: "member" },
  "field.monthlyBase": { ko: "기본급", id: "gaji pokok", en: "base salary" },
  "field.overtimeRate": { ko: "시간외 수당", id: "uang lembur", en: "overtime rate" },
  "field.workdays": { ko: "근무 요일", id: "hari kerja", en: "workdays" },
  "field.rounding": { ko: "시간외 계산 단위", id: "satuan hitung lembur", en: "overtime unit" },
  "field.workSession": { ko: "근무기록", id: "catatan kerja", en: "work record" },
  "field.clockIn": { ko: "출근 시각", id: "waktu masuk", en: "clock-in time" },
  "field.clockOut": { ko: "퇴근 시각", id: "waktu pulang", en: "clock-out time" },
  "field.phone": { ko: "전화번호", id: "nomor telepon", en: "phone number" },
  "field.event": { ko: "이벤트", id: "event", en: "event" },
  "field.locale": { ko: "언어", id: "bahasa", en: "language" },

  // ── 호출 상태머신
  "err.call.invalidAction": { ko: "알 수 없는 동작입니다.", id: "Aksi tidak dikenal.", en: "Unknown action." },
  "err.call.invalidState": {
    ko: "현재 상태({status})에서는 이 동작을 할 수 없습니다.",
    id: "Aksi ini tidak bisa dilakukan saat status {status}.",
    en: "This action isn't allowed while the call is {status}.",
  },
  "err.call.driverOnly": {
    ko: "배정된 기사만 할 수 있습니다.",
    id: "Hanya sopir yang ditugaskan yang bisa melakukan ini.",
    en: "Only the assigned driver can do this.",
  },
  "err.call.cancelForbidden": {
    ko: "호출한 사람 또는 관리자만 취소할 수 있습니다.",
    id: "Hanya pemanggil atau admin yang bisa membatalkan.",
    en: "Only the caller or the owner can cancel.",
  },
  "err.call.notExpired": {
    ko: "아직 응답 대기 시간이 남아 있습니다.",
    id: "Waktu tunggu respons belum habis.",
    en: "The response time hasn't run out yet.",
  },

  // ── 지도
  "err.maps.notConfigured": {
    ko: "지도 서비스가 설정되지 않았습니다.",
    id: "Layanan peta belum diatur.",
    en: "The map service isn't configured.",
  },
  "err.maps.network": {
    ko: "주소를 가져오지 못했습니다. 네트워크를 확인해주세요.",
    id: "Gagal mengambil alamat. Periksa koneksi Anda.",
    en: "Couldn't get the address. Check your connection.",
  },
  "err.maps.key": {
    ko: "지도 API 설정(Key 제한)을 확인해야 합니다. 관리자에게 알려주세요.",
    id: "Pengaturan API peta (batasan Key) perlu diperiksa. Beri tahu admin.",
    en: "The map API key settings need checking. Please tell the admin.",
  },
  "err.maps.quota": {
    ko: "지도 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
    id: "Batas penggunaan peta terlampaui. Coba lagi nanti.",
    en: "Map usage limit reached. Please try again later.",
  },
  "err.maps.failed": { ko: "주소를 가져오지 못했습니다.", id: "Gagal mengambil alamat.", en: "Couldn't get the address." },
  "err.maps.load": {
    ko: "지도를 불러오지 못했습니다. 인터넷 연결을 확인해주세요.",
    id: "Gagal memuat peta. Periksa koneksi internet Anda.",
    en: "Couldn't load the map. Check your internet connection.",
  },

  // ── 그룹·구성원·초대
  "err.groupNotFound": { ko: "그룹을 찾을 수 없습니다.", id: "Grup tidak ditemukan.", en: "Group not found." },
  "err.notMember": { ko: "이 그룹의 구성원이 아닙니다.", id: "Anda bukan anggota grup ini.", en: "You're not a member of this group." },
  "err.userMissing": {
    ko: "사용자 정보가 없습니다. 다시 로그인해주세요.",
    id: "Data pengguna tidak ada. Silakan masuk kembali.",
    en: "User profile missing. Please sign in again.",
  },
  "err.planDriverLimit": {
    ko: "현재 요금제에서는 기사를 {max}명까지 등록할 수 있습니다.",
    id: "Paket saat ini hanya bisa mendaftarkan hingga {max} sopir.",
    en: "Your current plan allows up to {max} driver(s).",
  },
  "err.planMemberLimit": {
    ko: "가족 구성원 수 한도에 도달했습니다. 관리자에게 문의해주세요.",
    id: "Batas jumlah anggota keluarga tercapai. Hubungi admin.",
    en: "Family member limit reached. Please contact the owner.",
  },
  "err.chooseDriver": { ko: "초대할 기사를 선택해주세요.", id: "Pilih sopir yang akan diundang.", en: "Choose a driver to invite." },
  "err.alreadyConnected": {
    ko: "이미 계정이 연결된 기사입니다.",
    id: "Sopir ini sudah terhubung dengan akun.",
    en: "This driver is already linked to an account.",
  },
  "err.inviteInvalid": { ko: "초대 링크가 올바르지 않습니다.", id: "Tautan undangan tidak valid.", en: "Invalid invite link." },
  "err.inviteBroken": { ko: "초대 정보가 올바르지 않습니다.", id: "Data undangan tidak valid.", en: "Invalid invite data." },
  "err.alreadyMember": { ko: "이미 이 그룹의 구성원입니다.", id: "Anda sudah menjadi anggota grup ini.", en: "You're already a member of this group." },
  "err.inviteUsed": { ko: "이미 사용된 초대 링크입니다.", id: "Tautan undangan sudah dipakai.", en: "This invite link has already been used." },
  "err.inviteExpired": {
    ko: "만료된 초대 링크입니다. 새 링크를 요청해주세요.",
    id: "Tautan undangan sudah kedaluwarsa. Minta tautan baru.",
    en: "This invite link has expired. Please ask for a new one.",
  },
  "err.cannotRemoveSelf": { ko: "본인은 삭제할 수 없습니다.", id: "Anda tidak bisa menghapus diri sendiri.", en: "You can't remove yourself." },
  "err.memberNotFound": { ko: "구성원을 찾을 수 없습니다.", id: "Anggota tidak ditemukan.", en: "Member not found." },
  "err.cannotRemoveOwner": { ko: "관리자는 삭제할 수 없습니다.", id: "Admin tidak bisa dihapus.", en: "The owner can't be removed." },
  "err.driverBusyUnlink": {
    ko: "운행 중인 기사는 연결 해제할 수 없습니다.",
    id: "Sopir yang sedang bertugas tidak bisa diputus.",
    en: "A driver on a trip can't be unlinked.",
  },

  // ── 기사·호출
  "err.driverNotFound": { ko: "기사를 찾을 수 없습니다.", id: "Sopir tidak ditemukan.", en: "Driver not found." },
  "err.driverNotConnected": {
    ko: "아직 기사님 계정이 연결되지 않았습니다. 기사님을 먼저 초대해주세요.",
    id: "Akun sopir belum terhubung. Undang sopir terlebih dahulu.",
    en: "The driver's account isn't linked yet. Invite the driver first.",
  },
  "err.driverOffDuty": { ko: "현재 기사님이 근무 중이 아닙니다.", id: "Sopir sedang tidak bertugas.", en: "The driver is not on duty." },
  "err.driverBusyWith": {
    ko: "이미 진행 중인 호출이 있습니다 ({name}님).",
    id: "Sudah ada panggilan yang sedang berjalan ({name}).",
    en: "There's already an active call ({name}).",
  },
  "err.driverBusy": { ko: "이미 진행 중인 호출이 있습니다.", id: "Sudah ada panggilan yang sedang berjalan.", en: "There's already an active call." },
  "err.callNotFound": { ko: "호출을 찾을 수 없습니다.", id: "Panggilan tidak ditemukan.", en: "Call not found." },
  "err.notLinkedDriver": { ko: "연결된 기사 계정이 아닙니다.", id: "Bukan akun sopir yang terhubung.", en: "Not the linked driver account." },

  // ── 즐겨찾기
  "err.favoriteLimit": {
    ko: "즐겨찾기는 최대 {max}개까지 저장할 수 있습니다.",
    id: "Maksimal {max} tempat favorit.",
    en: "You can save up to {max} favorites.",
  },
  "err.favoriteNotFound": { ko: "즐겨찾기를 찾을 수 없습니다.", id: "Favorit tidak ditemukan.", en: "Favorite not found." },
  "err.favoriteOwnOnly": {
    ko: "직접 추가한 장소만 삭제할 수 있습니다.",
    id: "Anda hanya bisa menghapus tempat yang Anda tambahkan.",
    en: "You can only delete places you added.",
  },

  // ── 위치 공유
  "err.driverOnlyLocation": {
    ko: "기사 계정만 위치를 공유할 수 있습니다.",
    id: "Hanya akun sopir yang bisa berbagi lokasi.",
    en: "Only driver accounts can share location.",
  },
  "err.locationOnDutyOnly": { ko: "근무 중에만 위치를 공유합니다.", id: "Lokasi hanya dibagikan saat bertugas.", en: "Location is shared only while on duty." },
  "err.sharingOff": { ko: "위치 공유가 꺼져 있습니다.", id: "Berbagi lokasi sedang mati.", en: "Location sharing is off." },
  "err.driverOnlySetting": { ko: "기사 계정만 설정할 수 있습니다.", id: "Hanya akun sopir yang bisa mengatur ini.", en: "Only driver accounts can change this." },
  "err.clockInFirst": { ko: "출근한 뒤에 켤 수 있습니다.", id: "Bisa dinyalakan setelah mulai kerja.", en: "You can turn this on after clocking in." },

  // ── 근무·급여
  "err.driverOnlyClock": {
    ko: "기사 계정만 출근/퇴근할 수 있습니다.",
    id: "Hanya akun sopir yang bisa absen masuk/pulang.",
    en: "Only driver accounts can clock in or out.",
  },
  "err.alreadyClockedIn": { ko: "이미 출근 상태입니다.", id: "Anda sudah mulai kerja.", en: "You're already clocked in." },
  "err.notClockedIn": { ko: "출근 기록이 없습니다.", id: "Belum ada catatan mulai kerja.", en: "You're not clocked in." },
  "err.finishTripFirst": {
    ko: "운행을 완료한 뒤 퇴근할 수 있습니다.",
    id: "Selesaikan perjalanan dulu sebelum pulang.",
    en: "Finish the trip before clocking out.",
  },
  "err.respondFirst": {
    ko: "응답하지 않은 호출이 있습니다. 먼저 수락 또는 거절해주세요.",
    id: "Ada panggilan yang belum dijawab. Terima atau tolak terlebih dahulu.",
    en: "There's an unanswered call. Accept or decline it first.",
  },
  "err.workNotFound": { ko: "근무기록을 찾을 수 없습니다.", id: "Catatan kerja tidak ditemukan.", en: "Work record not found." },
  "err.clockOutBeforeIn": {
    ko: "퇴근 시각은 출근 시각보다 늦어야 합니다.",
    id: "Waktu pulang harus setelah waktu masuk.",
    en: "Clock-out must be after clock-in.",
  },
  "err.sessionTooLong": {
    ko: "한 번의 근무는 24시간을 넘을 수 없습니다.",
    id: "Satu sesi kerja tidak boleh lebih dari 24 jam.",
    en: "A single shift can't exceed 24 hours.",
  },
  "err.futureTime": { ko: "미래 시각은 입력할 수 없습니다.", id: "Waktu di masa depan tidak bisa dimasukkan.", en: "Future times aren't allowed." },
  "err.overlap": {
    ko: "이미 기록된 근무 시간과 겹칩니다. 기존 기록을 수정해주세요.",
    id: "Bertabrakan dengan catatan kerja yang ada. Ubah catatan yang lama.",
    en: "This overlaps an existing record. Edit that record instead.",
  },
  "err.closedNeedsOut": {
    ko: "종료된 근무기록의 퇴근 시각은 비울 수 없습니다.",
    id: "Waktu pulang pada catatan yang sudah selesai tidak boleh kosong.",
    en: "A finished record must have a clock-out time.",
  },
  "err.busyCantClockOut": {
    ko: "운행 중에는 퇴근 처리할 수 없습니다.",
    id: "Tidak bisa pulang saat sedang bertugas.",
    en: "Can't clock out during a trip.",
  },
} satisfies Record<string, Tri>;
