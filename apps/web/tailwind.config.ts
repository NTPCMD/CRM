import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        card: "var(--card)",
        card2: "var(--card-2)",
        border: "var(--border)",
        borderStrong: "var(--border-strong)",
        text: "var(--text)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        primary: "var(--primary)",
        primarySoft: "var(--primary-soft)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        violet: "var(--violet)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.26)",
      },
    },
  },
  plugins: [],
};

export default config;
