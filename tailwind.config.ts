import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#07090A",
        panel: "#0C1311",
        panel2: "#0F1714",
        line: "#1A2520",
        line2: "#243530",
        dim: "#5A6B62",
        dim2: "#8194A8",
        ink: "#D4E4DA",
        ember: "#9FFF3C",
        emberDim: "#5FAA22",
        emberMute: "#2E4A18",
        spark: "#3DD9FF",
        warn: "#FF6B35",
        danger: "#FF4757",
        // legacy brand palette (kept so any leftover utilities still resolve)
        brand: {
          50: "#eef9ff",
          100: "#dcf3ff",
          500: "#9FFF3C",
          600: "#5FAA22",
          700: "#2E4A18",
          900: "#0c4a6e",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        ember: "0 0 0 1px #9FFF3C, 0 0 24px -4px rgba(159,255,60,0.45)",
        emberSoft: "0 0 32px -8px rgba(159,255,60,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
