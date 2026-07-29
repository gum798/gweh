/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "gal-black": "#1a1a1a",
        "gal-dark": "#333333",
        "gal-body": "#666666",
        "gal-muted": "#999999",
        "gal-border": "#e5e5e5",
        "gal-light": "#f5f5f5",
        "gal-bg": "#fafafa",
        "gal-accent": "#2ea3f2",
        "gal-accent-dark": "#1a8fd8",
        "gal-accent-light": "#eaf6fe",
        "gal-footer": "#111111",
        "status-success": "#15803d",
        "status-warning": "#b45309",
        "status-danger":  "#b91c1c",
        "status-info":    "#1d4ed8",
      },
      fontFamily: {
        "display": ["Space Grotesk", "Noto Sans KR", "system-ui", "sans-serif"],
        "heading": ["Space Grotesk", "Noto Sans KR", "sans-serif"],
        "body":    ["Noto Sans KR", "Space Grotesk", "system-ui", "sans-serif"],
      },
      // xs~8xl 은 Tailwind 기본 스케일을 그대로 쓴다 — 재선언하면 값이 같아도
      // 향후 Tailwind 업데이트와 어긋날 뿐이고, 다르게 쓰면 기존 마크업이 조용히 바뀐다.
      // 여기엔 Tailwind 에 없는 라벨 단계만 더한다.
      fontSize: {
        // 라벨용 — 현재 text-[10px]/text-[11px] + tracking-[0.3em]/[0.2em] 조합으로
        // 흩어져 있는 것을 한 클래스로 흡수한다 (크기+자간을 함께 나른다).
        'label':   ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.3em' }],
        'label-lg':['0.6875rem',{ lineHeight: '1rem',     letterSpacing: '0.2em' }],
      },
      // letterSpacing 은 의도적으로 확장하지 않는다. Tailwind 기본 6단계
      // (tighter/tight/normal/wide/wider/widest) 를 덮어쓰면 기존 101곳이 조용히 바뀐다.
      // 유일한 실수요였던 0.3em eyebrow 는 위 text-label 이 자간까지 함께 나르므로 불필요하다.
      borderRadius: {
        "gal-sm": "2px",
        "gal-md": "4px",
        "gal-lg": "6px",
        "gal-xl": "8px",
      },
      boxShadow: {
        "gal-soft": "0 2px 12px rgba(0, 0, 0, 0.06)",
        "gal-card": "0 4px 20px rgba(0, 0, 0, 0.08)",
        "gal-hover": "0 8px 32px rgba(0, 0, 0, 0.12)",
        "gal-nav": "0 1px 4px rgba(0, 0, 0, 0.06)",
        "gal-button": "0 4px 16px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-delay': 'fadeIn 0.6s ease-out 0.15s forwards',
        'fade-in-delay-2': 'fadeIn 0.6s ease-out 0.3s forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'tab-enter': 'tabEnter 0.3s ease-out forwards',
        'shimmer-gold': 'shimmerGold 3s ease-in-out infinite',
        'nav-underline': 'navUnderline 0.4s ease-out forwards',
        'progress-loop': 'progressLoop 2s ease-in-out infinite',
        'count-up': 'countPulse 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        tabEnter: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmerGold: {
          '0%, 100%': { backgroundPosition: '200% center' },
          '50%': { backgroundPosition: '-200% center' },
        },
        navUnderline: {
          '0%': { width: '0%', opacity: '0', transform: 'translateX(-50%)' },
          '100%': { width: '85%', opacity: '1', transform: 'translateX(-50%)' },
        },
        progressLoop: {
          '0%': { width: '0%' },
          '50%': { width: '80%' },
          '100%': { width: '100%' },
        },
        countPulse: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      }
    },
  },
  plugins: [],
}
