import type { Config } from "tailwindcss";

/** 명세 §17 DESIGN SYSTEM */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // 색은 globals.css 의 CSS 변수 (밝은 화면 / 휴대폰 다크 모드)
      colors: {
        // 브랜드 컬러 — 로고·일러스트·장식 전용. 값을 바꾸지 않는다 (teal 은 흰 바탕 2.39:1 → 글자·기능 아이콘에 쓰지 않음)
        // brand(DEFAULT): 제목 글자 (밝은 화면 남색, 다크 모드 밝은 색)
        brand: {
          DEFAULT: "rgb(var(--c-brand) / <alpha-value>)",
          blue: "#1479C9",
          navy: "#102A43",
          teal: "#55B8A5",
          gray: "#F4F7FA",
        },
        // 이하 UI 컬러 — 접근성 대비를 계산한 값 (globals.css)
        navy: "rgb(var(--c-navy) / <alpha-value>)",
        "logo-word": "rgb(var(--c-logo-word) / <alpha-value>)",
        link: "rgb(var(--c-link) / <alpha-value>)",
        teal: { DEFAULT: "rgb(var(--c-teal) / <alpha-value>)", soft: "rgb(var(--c-teal-soft) / <alpha-value>)" },
        action: {
          DEFAULT: "rgb(var(--c-action) / <alpha-value>)",
          dark: "rgb(var(--c-action-dark) / <alpha-value>)",
          soft: "rgb(var(--c-action-soft) / <alpha-value>)",
        },
        // solid: 흰 글자를 얹는 바탕 — 두 모드 모두 같은 진한 색 (흰 글자 5.0:1)
        success: { DEFAULT: "rgb(var(--c-success) / <alpha-value>)", soft: "rgb(var(--c-success-soft) / <alpha-value>)", solid: "#15803D" },
        warning: {
          DEFAULT: "rgb(var(--c-warning) / <alpha-value>)",
          soft: "rgb(var(--c-warning-soft) / <alpha-value>)",
          text: "rgb(var(--c-warning-text) / <alpha-value>)",
        },
        danger: { DEFAULT: "rgb(var(--c-danger) / <alpha-value>)", soft: "rgb(var(--c-danger-soft) / <alpha-value>)", solid: "#C62828" },
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          sub: "rgb(var(--c-ink-sub) / <alpha-value>)",
          faint: "rgb(var(--c-ink-faint) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--c-line) / <alpha-value>)",
          strong: "rgb(var(--c-line-strong) / <alpha-value>)",
        },
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
