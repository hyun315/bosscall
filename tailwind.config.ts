import type { Config } from "tailwindcss";

/** 명세 §17 DESIGN SYSTEM */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // 색은 globals.css 의 CSS 변수 (밝은 화면 / 휴대폰 다크 모드)
      colors: {
        // navy 는 두 모드 모두 같은 남색 (헤더·배너 바탕, 흰 단추 위 글자)
        navy: "#0B1736",
        // brand: 로고·제목 글자 — 밝은 화면 남색, 다크 모드 밝은 색
        brand: "rgb(var(--c-brand) / <alpha-value>)",
        action: {
          DEFAULT: "rgb(var(--c-action) / <alpha-value>)",
          dark: "rgb(var(--c-action-dark) / <alpha-value>)",
          soft: "rgb(var(--c-action-soft) / <alpha-value>)",
        },
        success: { DEFAULT: "rgb(var(--c-success) / <alpha-value>)", soft: "rgb(var(--c-success-soft) / <alpha-value>)" },
        warning: {
          DEFAULT: "rgb(var(--c-warning) / <alpha-value>)",
          soft: "rgb(var(--c-warning-soft) / <alpha-value>)",
          text: "rgb(var(--c-warning-text) / <alpha-value>)",
        },
        danger: { DEFAULT: "rgb(var(--c-danger) / <alpha-value>)", soft: "rgb(var(--c-danger-soft) / <alpha-value>)" },
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          sub: "rgb(var(--c-ink-sub) / <alpha-value>)",
          faint: "rgb(var(--c-ink-faint) / <alpha-value>)",
        },
        line: "rgb(var(--c-line) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        btn: "12px",
        card: "16px",
        modal: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,24,39,0.04)",
        modal: "0 8px 24px rgba(17,24,39,0.10)",
      },
      minHeight: { cta: "56px" },
    },
  },
  plugins: [],
};
export default config;
