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
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spin-slow': 'spin 20s linear infinite',
        'progress-loop': 'progressLoop 2s ease-in-out infinite',
        'count-up': 'countPulse 0.6s ease-out forwards',
        'shimmer-gold': 'shimmerGold 3s ease-in-out infinite',
        'nav-underline': 'navUnderline 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: 'var(--glow-1)' },
          '100%': { boxShadow: 'var(--glow-2)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        progressLoop: {
          '0%': { width: '0%' },
          '50%': { width: '80%' },
          '100%': { width: '100%' },
        },
        countPulse: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmerGold: {
          '0%, 100%': { backgroundPosition: '200% center' },
          '50%': { backgroundPosition: '-200% center' },
        },
        navUnderline: {
          '0%': { width: '0%', opacity: '0', transform: 'translateX(-50%)' },
          '100%': { width: '70%', opacity: '1', transform: 'translateX(-50%)' },
        },
      }
    },
  },
  plugins: [],
}
