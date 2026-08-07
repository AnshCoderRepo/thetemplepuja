import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: "#FFF8EB",
          100: "#FFEFD0",
          200: "#FFDCA1",
          300: "#FFC366",
          400: "#FFA62E",
          500: "#F97D14",
          600: "#E96109",
          700: "#C14A0A",
          800: "#993A10",
          900: "#7C3210",
        },
        maroon: {
          50: "#FDF2F4",
          100: "#FBE6EA",
          200: "#F5CBD4",
          300: "#EFA3B2",
          400: "#E56F88",
          500: "#D44563",
          600: "#B92A4B",
          700: "#9C1E3D",
          800: "#7C1832",
          900: "#5C1226",
        },
        cream: "#FFFBF4",
        ink: "#2A1B12",
        "ink-soft": "#5C4A3E",
        gold: "#D9A441",
        // shadcn-style semantic tokens used by components/ui/*
        background: "#FFFBF4",
        foreground: "#2A1B12",
        muted: "#FFEFD0",
        "muted-foreground": "#5C4A3E",
        ring: "#F97D14",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        devanagari: ["var(--font-devanagari)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -6px rgba(122, 61, 24, 0.12)",
        glow: "0 8px 40px -8px rgba(249, 125, 20, 0.45)",
        card: "0 10px 40px -12px rgba(92, 26, 18, 0.18)",
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,166,46,0.22), transparent 60%)",
        "mandala-fade":
          "radial-gradient(circle at 50% 0%, rgba(217,164,65,0.14), transparent 55%)",
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease-out both",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulseSlow 3.5s ease-in-out infinite",
        "shimmer": "shimmer 2.8s linear infinite",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
