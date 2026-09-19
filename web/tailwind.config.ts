import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      { 950: "#050807", 900: "#0B100E", 800: "#101713", 700: "#151D18" },
        line:    "#1D2A23",
        green:   { DEFAULT: "#22C55E", bright: "#39FF88", muted: "#167A42" },
        red:     { DEFAULT: "#EF4444", bright: "#FF6B6B" },
        amber:   "#F59E0B",
        ink:     "#F5F7F6",
        muted:   "#8D9A93",
      },
      fontFamily: {
        sans:      ['var(--font-instrument)', 'system-ui', 'sans-serif'],
        display:   ['var(--font-syne)', 'system-ui', 'sans-serif'],
        script:    ['var(--font-caveat)', 'cursive'],
        mono:      ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-up':       'fadeUp 0.6s ease-out both',
        'fade-in':       'fadeIn 0.6s ease-out both',
        'pulse-soft':    'pulseSoft 2.4s ease-in-out infinite',
        'rise':          'rise 0.4s ease-out both',
        'tick':          'tickFade 0.5s ease-out both',
        'draw-stroke':   'drawStroke 0.8s ease-out both',
      },
      keyframes: {
        fadeUp:    { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pulseSoft: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        rise:      { '0%': { transform: 'translateY(4px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        tickFade:  { '0%': { opacity: '0.4' }, '100%': { opacity: '1' } },
        drawStroke:{ '0%': { strokeDashoffset: '300' }, '100%': { strokeDashoffset: '0' } },
      },
    },
  },
  plugins: [],
};
export default config;
