import type { Config } from "tailwindcss";

// Brand tokens are defined as CSS variables in app/globals.css (light + dark).
// Tailwind maps names to those variables so utilities like `bg-cream text-ink` work in both themes.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: "var(--green)",
        green2: "var(--green2)",
        ember: "var(--ember)",
        gold: "var(--gold)",
        sienna: "var(--sienna)",
        cream: "var(--cream)",
        paper: "var(--paper)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        rule: "var(--rule)",
        line: "var(--line)",
        ground: "var(--ground)",
        field: "var(--field)",
        fieldb: "var(--field-b)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(36,30,23,.05), 0 8px 24px rgba(36,30,23,.06)",
      },
    },
  },
  plugins: [],
};
export default config;
