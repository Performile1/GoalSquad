import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Design System: Standard/Admin context (light bg) ───
        primary: {
          50:  '#e6f0f0',
          100: '#cce0e1',
          200: '#99c1c2',
          300: '#66a3a5',
          400: '#338487',
          500: '#005759',
          600: '#004A4C',  // Petrol Light — accent & hover
          700: '#003F41',
          800: '#003B3D',  // Petrol — main brand color
          900: '#003B3D',  // Petrol — kept at 900 for backward compat
          950: '#002829',
        },
        // ─── Design System: Action/Gamified context (dark bg) ───
        gold: {
          50:  '#FFFDE0',
          100: '#FFF9B3',
          200: '#FFF280',
          300: '#FFEB4D',
          400: '#FFE41A',
          DEFAULT: '#FFD700',  // Electric Gold — hero & achievement
          600: '#CCAC00',
          700: '#997F00',
          800: '#665400',
          900: '#332900',
        },
        // ─── Neutral contexts ───
        charcoal: {
          DEFAULT: '#1A1A1A',  // Dark bg — gamified sections
          light:   '#2A2A2A',
          lighter: '#3A3A3A',
          border:  '#404040',
        },
        offwhite: {
          DEFAULT: '#F8F9FA',  // Light bg — standard/admin
          dark:    '#EAECEE',
        },
        // ─── Legacy alias (keep backward compat) ───
        accent: {
          DEFAULT: '#003B3D',
          light:   '#004A4C',
        },
        brand: {
          petrol:    '#003B3D',
          gold:      '#FFD700',
          charcoal:  '#1A1A1A',
          offwhite:  '#F8F9FA',
          text:      '#1A1A1A',
          textLight: '#F8F9FA',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-clash)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
