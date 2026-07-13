import type { Config } from "tailwindcss";

/**
 * Colors map to the CSS variables in app/globals.css. Re-skin there, not here.
 * Verdict colors are handled in components/ui/verdict-badge.tsx (explicit triples).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        "mono-muted": "var(--mono-muted)",
        card: "var(--card)",
        "card-border": "var(--card-border)",
        divider: "var(--divider)",
        panel: "var(--panel)",
        field: "var(--field)",
        "field-border": "var(--field-border)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        nav: "var(--nav)",
        "nav-deep": "var(--nav-deep)",
        "nav-border": "var(--nav-border)",
        "nav-text": "var(--nav-text)",
        "nav-muted": "var(--nav-muted)",
        good: "var(--good)",
        near: "var(--near)",
        over: "var(--over)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 7px)",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
