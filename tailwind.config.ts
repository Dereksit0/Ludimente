import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // ── Paleta de marca Ludimente (hex exactos del brief) ──
        luda: {
          lila: "#C9A8E0",
          "lila-dark": "#9B70C4",
          "lila-light": "#EDE0F8",
          rosa: "#F2B5C8",
          "rosa-light": "#FDEEF3",
          azul: "#A8C8E8",
          "azul-light": "#E0F0FA",
          amarillo: "#F7D98B",
          "amarillo-light": "#FFFBE6",
          blanco: "#FDFAF6",
          fondo: "#F5F0FF",
          gris: "#4A4A5A",
          "gris-light": "#7A7A8A",
        },
        // ── Tokens shadcn/ui mapeados a la marca (vía CSS vars) ──
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        fredoka: ["var(--font-fredoka)", "cursive"],
        nunito: ["var(--font-nunito)", "sans-serif"],
      },
      boxShadow: {
        luda: "0 4px 20px -2px rgba(155, 112, 196, 0.15)",
        "luda-md": "0 8px 30px -4px rgba(155, 112, 196, 0.22)",
      },
      keyframes: {
        "estrella-twinkle": {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        "ping-luda": {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "estrella-twinkle": "estrella-twinkle 3s ease-in-out infinite",
        "ping-luda": "ping-luda 1.2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
