import type { Config } from "tailwindcss";

/** 명세 §17 DESIGN SYSTEM */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1736",
        action: { DEFAULT: "#2563EB", dark: "#1D4ED8", soft: "#EFF4FF" },
        success: { DEFAULT: "#16A34A", soft: "#ECFDF3" },
        warning: { DEFAULT: "#F59E0B", soft: "#FFF8E6", text: "#B45309" },
        danger: { DEFAULT: "#DC2626", soft: "#FEF2F2" },
        bg: "#F7F8FA",
        surface: "#FFFFFF",
        ink: { DEFAULT: "#111827", sub: "#6B7280", faint: "#9CA3AF" },
        line: "#E5E7EB",
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
