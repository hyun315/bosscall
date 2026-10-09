import type { Tri } from "@/i18n/core";

/** 급여 (보스첵 통합) · 근무기록 편집 */
export const payrollMsgs = {
  // ── 급여 화면
  "pay.setupTitle": { ko: "급여 조건을 먼저 설정해주세요", id: "Atur ketentuan gaji terlebih dahulu", en: "Set up pay terms first" },
  "pay.setupDesc": {
    ko: "월 기본급과 시간외 수당(시간당)을 입력하면\n출퇴근 기록으로 매달 급여가 자동 계산됩니다.",
    id: "Masukkan gaji pokok bulanan dan uang lembur per jam,\nlalu gaji dihitung otomatis dari catatan kerja setiap bulan.",
    en: "Enter the monthly base and hourly overtime rate,\nand pay is calculated from work records every month.",
  },
  "pay.setupButton": { ko: "급여 조건 설정", id: "Atur ketentuan gaji", en: "Set up pay" },
  "pay.notShared": { ko: "급여 내역이 공개되지 않았습니다.", id: "Rincian gaji belum dibagikan.", en: "Pay details haven't been shared." },
  "pay.slipCopied": { ko: "급여명세를 복사했습니다.", id: "Slip gaji disalin.", en: "Payslip copied." },
  "pay.copyFailed": { ko: "복사하지 못했습니다.", id: "Gagal menyalin.", en: "Couldn't copy." },
  "pay.prevMonth": { ko: "이전 달", id: "Bulan sebelumnya", en: "Previous month" },
  "pay.nextMonth": { ko: "다음 달", id: "Bulan berikutnya", en: "Next month" },
  "pay.expectedThisMonth": { ko: "이번 달 예상 급여", id: "Perkiraan gaji bulan ini", en: "Estimated pay this month" },
  "pay.total": { ko: "급여 합계", id: "Total gaji", en: "Total pay" },
  "pay.openNote": {
    ko: "근무 중인 기록이 있어 금액이 바뀔 수 있습니다.",
    id: "Ada jam kerja yang masih berjalan, jumlah bisa berubah.",
    en: "A shift is still open, so the amount may change.",
  },
  "pay.base": { ko: "기본급", id: "Gaji pokok", en: "Base pay" },
  "pay.overtimeLine": { ko: "시간외 {dur} × {rate}", id: "Lembur {dur} × {rate}", en: "Overtime {dur} × {rate}" },
  "pay.daysAndHours": { ko: "근무일 · 총 근무시간", id: "Hari kerja · total jam", en: "Days worked · total hours" },
  "pay.daysValue": { ko: "{days}일 · {dur}", id: "{days} hari · {dur}", en: "{days} days · {dur}" },
  "pay.sendWhatsApp": { ko: "WhatsApp으로 명세 보내기", id: "Kirim slip via WhatsApp", en: "Send payslip via WhatsApp" },
  "pay.shareWhatsApp": { ko: "WhatsApp 공유", id: "Bagikan via WhatsApp", en: "Share on WhatsApp" },
  "pay.copySlip": { ko: "명세 복사", id: "Salin slip", en: "Copy payslip" },
  "pay.byDate": { ko: "날짜별 근무", id: "Kerja per tanggal", en: "Work by date" },
  "pay.noRecords": { ko: "이 달의 근무 기록이 없습니다.", id: "Tidak ada catatan kerja bulan ini.", en: "No work records this month." },
  "pay.dayOffWork": { ko: "휴무일 근무", id: "Kerja di hari libur", en: "Worked on day off" },
  "pay.overtimeShort": { ko: "시간외 {dur}", id: "Lembur {dur}", en: "OT {dur}" },
  "pay.ruleNote": {
    ko: "하루 {hours}시간 초과분과 쉬는 날({off}) 근무를 시간외로 계산하며, 하루 시간외는 {rounding}합니다.",
    id: "Kerja lebih dari {hours} jam per hari dan kerja di hari libur ({off}) dihitung lembur; lembur harian {rounding}.",
    en: "Hours beyond {hours}/day and work on days off ({off}) count as overtime; daily overtime is {rounding}.",
  },
  "pay.roundingExact": { ko: "분 단위 그대로 계산", id: "dihitung per menit", en: "counted to the minute" },
  "pay.roundingDown": { ko: "{n}분 단위로 내림", id: "dibulatkan ke bawah per {n} menit", en: "rounded down to {n}-minute units" },
  "pay.editSettings": { ko: "급여 조건 수정", id: "Ubah ketentuan gaji", en: "Edit pay terms" },

  // ── 급여 조건 설정
  "pay.settingsTitle": { ko: "{name} 기사 급여 조건", id: "Ketentuan gaji {name}", en: "Pay terms for {name}" },
  "pay.savedToast": { ko: "급여 조건을 저장했습니다.", id: "Ketentuan gaji disimpan.", en: "Pay terms saved." },
  "pay.baseLabel": { ko: "월 기본급 (Rp)", id: "Gaji pokok bulanan (Rp)", en: "Monthly base (Rp)" },
  "pay.basePlaceholder": { ko: "예: 5.000.000", id: "Contoh: 5.000.000", en: "e.g. 5.000.000" },
  "pay.rateLabel": { ko: "시간외 수당 (시간당 Rp)", id: "Uang lembur (Rp per jam)", en: "Overtime rate (Rp per hour)" },
  "pay.ratePlaceholder": { ko: "예: 25.000", id: "Contoh: 25.000", en: "e.g. 25.000" },
  "pay.hoursLabel": { ko: "하루 기본 근무시간", id: "Jam kerja normal per hari", en: "Regular hours per day" },
  "pay.hoursSuffix": { ko: "시간 — 넘는 시간이 시간외", id: "jam — kelebihannya dihitung lembur", en: "hours — anything beyond is overtime" },
  "pay.workdaysLabel": {
    ko: "근무 요일 (쉬는 날 근무는 전부 시간외)",
    id: "Hari kerja (kerja di hari libur seluruhnya lembur)",
    en: "Workdays (all work on days off is overtime)",
  },
  "pay.roundLabel": {
    ko: "시간외 계산 단위 (하루 합계를 내림)",
    id: "Satuan hitung lembur (total harian dibulatkan ke bawah)",
    en: "Overtime unit (daily total rounded down)",
  },
  "pay.round1": { ko: "1분 (그대로)", id: "1 menit (apa adanya)", en: "1 minute (exact)" },
  "pay.roundN": { ko: "{n}분", id: "{n} menit", en: "{n} minutes" },
  "pay.round60": { ko: "1시간", id: "1 jam", en: "1 hour" },
  "pay.shareLabel": { ko: "기사에게 급여 내역 공개", id: "Tampilkan rincian gaji ke sopir", en: "Show pay details to the driver" },
  "pay.shareHint": {
    ko: "기사 앱 ‘기록 › 급여’에서 본인 내역을 볼 수 있습니다.",
    id: "Sopir bisa melihat rinciannya di aplikasi: ‘Riwayat › Gaji’.",
    en: "The driver can see their own details under ‘History › Pay’.",
  },
  "pay.example": {
    ko: "예) 기본급 {base}, 하루 {hours}시간 초과분 × {rate}/시간. 계산은 참고용이며 법정 수당 기준과 다를 수 있습니다.",
    id: "Contoh: gaji pokok {base}, kelebihan dari {hours} jam/hari × {rate}/jam. Perhitungan ini hanya acuan dan bisa berbeda dari ketentuan lembur resmi.",
    en: "e.g. base {base}, hours over {hours}/day × {rate}/hour. For reference only; may differ from statutory overtime rules.",
  },

  // ── 근무기록 편집·추가
  "work.clockIn": { ko: "출근", id: "Masuk", en: "Clock in" },
  "work.clockOut": { ko: "퇴근", id: "Pulang", en: "Clock out" },
  "work.edited": { ko: "수정됨", id: "diubah", en: "edited" },
  "work.editAria": { ko: "{name} 근무기록 수정", id: "Ubah catatan kerja {name}", en: "Edit {name}'s work record" },
  "work.editTitle": { ko: "근무기록 수정", id: "Ubah catatan kerja", en: "Edit work record" },
  "work.addTitle": { ko: "근무기록 추가", id: "Tambah catatan kerja", en: "Add work record" },
  "work.badTime": { ko: "시각 형식이 올바르지 않습니다.", id: "Format waktu tidak valid.", en: "Invalid time format." },
  "work.needBoth": {
    ko: "출근·퇴근 시각을 모두 입력해주세요.",
    id: "Isi waktu masuk dan pulang.",
    en: "Enter both clock-in and clock-out times.",
  },
  "work.editedToast": { ko: "근무기록을 수정했습니다.", id: "Catatan kerja diubah.", en: "Work record updated." },
  "work.addedToast": { ko: "근무기록을 추가했습니다.", id: "Catatan kerja ditambahkan.", en: "Work record added." },
  "work.keepOpenHint": {
    ko: "(비워두면 근무 중 유지)",
    id: "(kosongkan agar tetap bertugas)",
    en: "(leave empty to keep the shift open)",
  },
  "work.tzNoteEdit": {
    ko: "시각은 그룹 시간대({tz}) 기준입니다. 수정 내역은 기록으로 남습니다.",
    id: "Waktu mengikuti zona waktu grup ({tz}). Perubahan tercatat.",
    en: "Times use the group time zone ({tz}). Changes are logged.",
  },
  "work.tzNoteAdd": {
    ko: "그룹 시간대({tz}) 기준입니다. 추가 내역은 기록으로 남습니다.",
    id: "Mengikuti zona waktu grup ({tz}). Penambahan tercatat.",
    en: "Uses the group time zone ({tz}). Additions are logged.",
  },
} satisfies Record<string, Tri>;
