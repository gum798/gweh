/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy mystic colors (kept for any non-themed usage)
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
        },
        // Theme-aware semantic colors via CSS vars
        th: {
          bg: 'var(--bg-primary)',
          panel: 'var(--bg-panel)',
          'panel-solid': 'var(--bg-panel-solid)',
          accent: 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
        },
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
          '0%': { boxShadow: 'var(--glow-1)' },
          '100%': { boxShadow: 'var(--glow-2)' },
        }
      }
    },
  },
  plugins: [],
}
