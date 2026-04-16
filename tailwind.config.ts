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
        primary: {
          50: '#e6f2f2',
          100: '#cce6e6',
          200: '#99cccc',
          300: '#66b3b3',
          400: '#339999',
          500: '#008080',
          600: '#006666', // Accentfärg
          700: '#004d4d',
          800: '#003333',
          900: '#004040', // Huvudfärg
          950: '#002020',
        },
        accent: {
          50: '#e6f2f2',
          100: '#cce6e6',
          200: '#99cccc',
          300: '#66b3b3',
          400: '#339999',
          500: '#008080',
          600: '#006666', // Accentfärg - ljusare teal
          700: '#004d4d',
          800: '#003333',
          900: '#004040', // Huvudfärg - mörk petroleumgrön
          950: '#002020',
        },
        brand: {
          primary: '#004040',   // Huvudfärg
          accent: '#006666',    // Accentfärg
          white: '#FFFFFF',     // Bakgrund
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
