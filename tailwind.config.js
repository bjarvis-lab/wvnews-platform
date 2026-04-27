/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // WV News brand — navy blue from the wordmark + banner.
        // Primary (logo color) lives at 900/950; lighter tints scale up from there.
        brand: {
          50: '#f3f6fb',
          100: '#e5ecf7',
          200: '#c7d4ec',
          300: '#9cb0e0',
          400: '#7a95d6',
          500: '#5572b8',
          600: '#3b5594',
          700: '#2b4079',
          800: '#1f2f5f',
          900: '#1a2c5b',
          950: '#0f1d3d',
        },
        // WV News old gold — the warm amber gradient in the logo mark.
        // 400 is the primary "old gold"; gradient uses 300→500 for the circle fill.
        gold: {
          50: '#fdf6e8',
          100: '#faeacc',
          200: '#f5d99a',
          300: '#e8c179',
          400: '#d4a84c',
          500: '#c08f2e',
          600: '#a07620',
          700: '#7e5a18',
          800: '#5d4212',
          900: '#3e2c0c',
        },
        ink: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
      },
      fontFamily: {
        // Source Serif 4 — Atlantic-clean newsy serif for headlines + lead text.
        // CSS var is supplied by next/font in src/app/layout.js.
        display: ['var(--font-display)', 'Source Serif Pro', 'Charter', 'Georgia', 'serif'],
        // Inter for body, UI, captions.
        body:    ['var(--font-body)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      // News-site-friendly type ramp + tracking. Tailwind's defaults are
      // good for product UI but a touch loose for editorial.
      letterSpacing: {
        eyebrow: '0.14em',
      },
      maxWidth: {
        prose: '40rem', // 640px — comfortable single-column reading width
      },
    },
  },
  plugins: [],
};
