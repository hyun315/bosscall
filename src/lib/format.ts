/** 화면 표시용 라벨 — 색상만으로 상태를 전달하지 않기 위해 항상 텍스트와 함께 쓴다 (명세 §6). */
import type { MsgKey } from "@/i18n/index";
import type { CallStatus, DriverStatus } from "@/types/domain";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export const CALL_STATUS_LABEL: Readonly<Record<CallStatus, { key: MsgKey; tone: Tone }>> = {
  CREATED: { key: "callStatus.CREATED", tone: "info" },
  CALLING: { key: "callStatus.CALLING", tone: "info" },
  RECEIVED: { key: "callStatus.RECEIVED", tone: "info" },
  ACCEPTED: { key: "callStatus.ACCEPTED", tone: "success" },
  ON_THE_WAY: { key: "callStatus.ON_THE_WAY", tone: "success" },
  ARRIVED: { key: "callStatus.ARRIVED", tone: "success" },
  TRIP_STARTED: { key: "callStatus.TRIP_STARTED", tone: "success" },
  COMPLETED: { key: "callStatus.COMPLETED", tone: "neutral" },
  DECLINED: { key: "callStatus.DECLINED", tone: "danger" },
  TIMEOUT: { key: "callStatus.TIMEOUT", tone: "warning" },
  CANCELLED: { key: "callStatus.CANCELLED", tone: "neutral" },
};

export const DRIVER_STATUS_LABEL: Readonly<Record<DriverStatus, { key: MsgKey; tone: Tone; dot: string }>> = {
  ON_DUTY: { key: "driverStatus.ON_DUTY", tone: "success", dot: "🟢" },
  BUSY: { key: "driverStatus.BUSY", tone: "warning", dot: "🟠" },
  OFF_DUTY: { key: "driverStatus.OFF_DUTY", tone: "neutral", dot: "⚪" },
  INACTIVE: { key: "driverStatus.INACTIVE", tone: "neutral", dot: "⚪" },
};

/** 목록에 쓰는 짧은 장소명: 이름 > 주소 첫 부분 */
export function shortPlace(name: string | null, address: string): string {
  if (name) return name;
  const first = address.split(",")[0]?.trim();
  return first && first.length > 0 ? first : address;
}

/** WhatsApp 링크용 숫자만. 0으로 시작하면 인도네시아(62)로 변환 */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (phone.trim().startsWith("+")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function googleMapsViewUrl(lat: number, lng: number, placeId: string | null): string {
  const base = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  return placeId ? `${base}&query_place_id=${encodeURIComponent(placeId)}` : base;
}

export function googleMapsDirectionsUrl(lat: number, lng: number, placeId: string | null): string {
  const base = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  return placeId ? `${base}&destination_place_id=${encodeURIComponent(placeId)}` : base;
}
