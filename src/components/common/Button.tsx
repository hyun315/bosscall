"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost";
type Size = "cta" | "lg" | "md" | "sm";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  icon?: ReactNode;
}

const VARIANT: Record<Variant, string> = {
  primary: "bg-action text-white active:bg-action-dark disabled:bg-action/40",
  secondary: "bg-surface text-ink border border-line active:bg-bg disabled:text-ink-faint",
  danger: "bg-danger text-white active:brightness-95 disabled:bg-danger/40",
  success: "bg-success text-white active:brightness-95 disabled:bg-success/40",
  ghost: "bg-transparent text-action active:bg-action-soft disabled:text-ink-faint",
};

const SIZE: Record<Size, string> = {
  cta: "min-h-[64px] px-6 text-lg font-bold", // 홈 CTA·기사 수락 (최소 56px 이상, §4)
  lg: "min-h-cta px-5 text-base font-semibold",
  md: "min-h-[48px] px-4 text-[15px] font-semibold",
  sm: "min-h-[36px] px-3 text-sm font-medium",
};

/**
 * 공통 버튼 — 상태: default / pressed(active:) / disabled / loading (§18).
 * success/error 상태는 Toast·ErrorState 로 표현한다.
 */
export function Button({
  variant = "primary",
  size = "lg",
  loading = false,
  block = false,
  icon,
  className = "",
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex select-none items-center justify-center gap-2 rounded-btn transition-transform duration-75 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANT[variant]} ${SIZE[size]} ${block ? "w-full" : ""} ${className}`}
    >
      {loading ? <Spinner /> : icon}
      <span>{children}</span>
    </button>
  );
}

export function PrimaryButton(props: Omit<Props, "variant">) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: Omit<Props, "variant">) {
  return <Button {...props} variant="secondary" />;
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
