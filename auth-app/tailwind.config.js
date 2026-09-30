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
        background: "hsl(201 100% 13%)",
        foreground: "hsl(0 0% 100%)",
        muted: {
          DEFAULT: "hsl(0 0% 10%)",
          foreground: "hsl(240 4% 66%)",
        },
        primary: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(0 0% 4%)",
        },
        secondary: "hsl(0 0% 10%)",
        accent: "hsl(0 0% 10%)",
        border: "hsl(0 0% 18%)",
        input: "hsl(0 0% 18%)",
      },
      fontFamily: {
        display: ["'Instrument Serif'", "serif"],
        body: ["'Inter'", "sans-serif"],
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
