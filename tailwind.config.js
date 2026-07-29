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
        // 상태색은 잉크/틴트 쌍이다 (gal-accent / gal-accent-light 선례).
        // 한 값이 글자색과 배경을 겸할 수 없다 — 잉크는 흰 바탕 위 4.5:1 을 만족하지만
        // 배경으로 쓰면 그 위의 gal-black 본문이 2.60~3.47 로 떨어진다.
        // 잉크 = Tailwind 700, 틴트 = Tailwind 100. 전부 scripts/check-contrast.mjs 로 검증됨.
        "status-success":       "#15803d",  // 흰 바탕 위 글자
        "status-success-light": "#dcfce7",  // gal-black 본문을 얹는 표면
        // amber-700(#b45309)은 틴트 위에서 4.5097:1 로 여유가 0.22% 뿐이었다.
        // 틴트를 amber-50 으로 옮겨 봤으나 표면이 gal-bg 보다도 안 보였다(1.037 < 1.044).
        // 약한 쪽은 틴트가 아니라 잉크였으므로 amber-800 으로 어둡게 해서 해결한다:
        // 흰 바탕 7.09:1, 틴트 위 6.37:1. 틴트는 형제 3색과 같은 100 단계로 복귀.
        "status-warning":       "#92400e",
        "status-warning-light": "#fef3c7",
        "status-danger":        "#b91c1c",
        "status-danger-light":  "#fee2e2",
        "status-info":          "#1d4ed8",
        "status-info-light":    "#dbeafe",
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
        // eyebrow 라벨 — text-[10px] + tracking-[0.3em] 조합 9곳을 크기+자간 통째로 흡수한다.
        // label-lg(11px/0.2em)는 넣지 않는다: text-[11px] 4곳 중 3곳은 자간 클래스가 아예 없고
        // 1곳은 0.5em 이라 0.2em 을 원하는 소비자가 하나도 없다.
        'label': ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.3em' }],
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
