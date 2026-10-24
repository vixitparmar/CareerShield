/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#F8F7F4',             // Warm off-white / light parchment
        card: '#FFFFFF',             // Pure solid white
        borderDefault: '#E5E0D8',    // Thin subtle warm gray-beige
        borderSubtle: '#EDE8E1',
        textPrimary: '#1F1D1A',      // Deep charcoal brown
        textSecondary: '#5C554E',    // Muted coffee / slate
        textMuted: '#8C8479',        // Muted warm stone
        espresso: {
          DEFAULT: '#2A2521',
          hover: '#1F1D1A',
          active: '#141210'
        },
        badge: {
          scamBg: '#FEE2E2',
          scamBorder: '#FCA5A5',
          scamText: '#991B1B',
          followupBg: '#FEF3C7',
          followupBorder: '#FCD34D',
          followupText: '#92400E',
          successBg: '#DCFCE7',
          successBorder: '#86EFAC',
          successText: '#166534',
          appliedBg: '#F1EFEA',
          appliedBorder: '#E2DED6',
          appliedText: '#44403C'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
