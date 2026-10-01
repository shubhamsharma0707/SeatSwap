/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(45 33% 94%)",
        foreground: "hsl(30 12% 5%)",
        muted: {
          DEFAULT: "hsl(45 20% 88%)",
          foreground: "hsl(30 12% 40%)",
        },
        primary: {
          DEFAULT: "hsl(30 12% 5%)",
          foreground: "hsl(45 33% 94%)",
        },
        secondary: "hsl(45 20% 88%)",
        accent: "hsl(60 38% 88%)",
        border: "hsl(30 12% 5% / 0.16)",
        input: "hsl(30 12% 5% / 0.16)",
      },
      fontFamily: {
        display: ["'Inter Tight'", "sans-serif"],
        body: ["'Inter Tight'", "sans-serif"],
      },
      keyframes: {
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 0.8s ease-out both",
        "fade-rise-delay": "fade-rise 0.8s ease-out 0.2s both",
        "fade-rise-delay-2": "fade-rise 0.8s ease-out 0.4s both",
      },
    },
  },
  plugins: [],
}