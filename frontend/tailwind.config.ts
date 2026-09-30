import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        page: "#F5F5F5",
        surface: "#FFFFFF",
        "surface-2": "#F9F9F9",
        border: "#E4E4E7",
        "border-focus": "#6D28D9",
        ink: "#18181B",
        "ink-2": "#52525B",
        "ink-3": "#A1A1AA",
        violet: "#6D28D9",
        "violet-hover": "#5B21B6",
        "violet-light": "#EDE9FE",
      },
      fontSize: {
        "score": ["8rem", { lineHeight: "1", fontWeight: "800", letterSpacing: "-0.05em" }],
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease-out both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
