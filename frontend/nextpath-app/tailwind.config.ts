import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Brand
        indigo: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        // Verdict
        emerald: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        red: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        violet: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        // Surfaces
        slate: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 2px 8px rgba(15, 23, 42, 0.04)",
        elevated:
          "0 4px 12px rgba(15, 23, 42, 0.06), 0 12px 32px rgba(15, 23, 42, 0.08)",
        glass:
          "0 8px 32px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255,255,255,0.4)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "draw-circle": {
          from: { strokeDashoffset: "var(--circumference)" },
          to: { strokeDashoffset: "var(--offset)" },
        },
      },
      animation: {
        "fade-in": "fade-in 240ms ease-out",
        shimmer: "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 1.8s ease-in-out infinite",
        "slide-in-right": "slide-in-right 280ms cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
