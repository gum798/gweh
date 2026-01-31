/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mystic: {
          900: '#0a0a1a',
          800: '#12122a',
          700: '#1a1a3a',
          600: '#2a2a5a',
          500: '#3a3a7a',
        },
        cosmic: {
          gold: '#d4af37',
          silver: '#c0c0c0',
          purple: '#9b59b6',
        }
      },
      fontFamily: {
        mystic: ['"Gowun Batang"', 'serif'],
        body: ['"Gowun Batang"', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #d4af37, 0 0 10px #d4af37' },
          '100%': { boxShadow: '0 0 20px #d4af37, 0 0 30px #d4af37' },
        }
      }
    },
  },
  plugins: [],
}
