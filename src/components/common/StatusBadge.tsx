import type { Tone } from "@/lib/format";

const TONE: Record<Tone, { box: string; dot: string }> = {
  success: { box: "bg-success-soft text-success", dot: "bg-success-solid" },
  warning: { box: "bg-warning-soft text-warning-text", dot: "bg-warning" },
  danger: { box: "bg-danger-soft text-danger", dot: "bg-danger-solid" },
  info: { box: "bg-action-soft text-link", dot: "bg-action" },
  neutral: { box: "bg-bg text-ink-sub border border-line", dot: "bg-ink-faint" },
  // 연결·근무 중 — 진한 틸 (브랜드 틸은 장식용이라 글자에 쓰지 않음)
  connected: { box: "bg-teal-soft text-teal", dot: "bg-teal" },
};

/** 상태 배지 — 점(색) + 텍스트를 함께 표시해 색상만으로 전달하지 않는다 (§6) */
export function StatusBadge({ label, tone, size = "md" }: { label: string; tone: Tone; size?: "md" | "lg" }) {
  const t = TONE[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${t.box} ${
        size === "lg" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
      }`}
    >
      <span className={`inline-block rounded-full ${t.dot} ${size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2"}`} aria-hidden />
      {label}
    </span>
  );
}
