// 팔레트를 별도 상수로 뽑아 둔 이유는 아래 ringOffsetColor 가 gal-bg 를 참조해야
// 하기 때문이다. scripts/check-contrast.mjs 는 여전히
// `default.theme.extend.colors` 로 같은 객체를 읽는다 — 게이트가 검사하는 값과
// 앱이 렌더하는 값이 같은 리터럴 하나에서 나와야 드리프트가 생기지 않는다.
const colors = {
        // ── 다크 퍼플 미스틱 팔레트 (Task 7) ──────────────────────────────
        // 이름은 라이트 시절 그대로다. 값만 반전했다 — 이름을 바꾸면 소비자 전 파일을
        // 다시 만져야 하고, 그 편집 하나하나가 Task 4 가 겪은 "슬롯을 잘못 매핑해서
        // 글자가 조용히 2.75:1 로 떨어지는" 사고의 기회다.
        //
        // ── 다크 퍼플 미스틱 팔레트 (Task 7) ──────────────────────────────
        // 이름은 라이트 시절 그대로다. 값만 반전했다 — 이름을 바꾸면 소비자 전 파일을
        // 다시 만져야 하고, 그 편집 하나하나가 Task 4 가 겪은 "슬롯을 잘못 매핑해서
        // 글자가 조용히 2.75:1 로 떨어지는" 사고의 기회다.
        //
        // 표고(elevation) 사다리. 값은 전부 scripts/check-contrast.mjs 가 검증한다.
        //   gal-bg    페이지          L=0.0066
        //   gal-light 카드 표면        L=0.0250  (페이지 대비 1.33:1)
        //   *-light   틴트 배지        L=0.046   (카드 대비 1.28:1)
        //   gal-border 경계선          L=0.2007  (카드 대비 3.34:1)
        //
        // 브랜드 앵커 3개는 design/code.html 과 동일하게 유지한다:
        //   #161022(배경) · #5b13ec(주색) · #f6f6f8(최상위 텍스트)
        // 나머지는 파생값이고, 아래 근거대로 레퍼런스 제안치에서 옮겼다.
        "gal-black": "#f6f6f8",   // 최상위 텍스트(반전). 페이지 17.20:1
        "gal-dark": "#e2dded",    // 인용/강조 본문. 페이지 13.97:1
        "gal-body": "#b8b0c8",    // 본문. 페이지 8.91:1 / 카드 6.72:1
        // 레퍼런스의 #8b8299 는 페이지 위 5.08:1 이지만 **카드 위에서 4.74:1** 이고,
        // 카드를 페이지와 구분되는 밝기(1.33:1)까지 올리면 4.5 아래로 떨어진다.
        // 카드 표면이 정해지면 muted 의 하한도 같이 정해진다 — 둘은 한 쌍이다.
        "gal-muted": "#9c93ad",   // 페이지 6.36:1 / 카드 4.79:1
        // 테두리는 카드 장식이 아니다. 이 저장소에서 gal-border 는 **입력 필드의
        // 유일한 식별 수단**이다(입력 15곳이 `border-gal-border bg-gal-bg`).
        // WCAG 1.4.11 은 컨트롤을 식별하는 경계에 인접색 대비 3:1 을 요구하므로
        // 한 토큰이 두 역할을 겸하는 이상 엄격한 쪽이 값을 정한다.
        // 레퍼런스의 #3a2f52 는 페이지 대비 1.51:1, **카드 대비 1.41:1** 로 절반에도
        // 못 미쳤다. (1.51 이라는 숫자 자체가 그 hex 에서 역산된 것이었다.)
        "gal-border": "#8175a4",  // 카드 3.34:1 / 페이지 4.43:1
        "gal-light": "#30254e",   // 카드·서피스. 페이지 1.33:1
        "gal-bg": "#161022",      // 페이지 배경 (브랜드 앵커)
        // 액센트는 채움과 잉크 두 역할로 쪼갠다. 하나로 겸할 수 없다 —
        // #5b13ec 는 흰 글씨를 얹으면 7.64:1 이지만 **글자색으로 쓰면 2.43:1** 이다.
        "gal-accent": "#5b13ec",  // 채움 전용 (브랜드 앵커)
        // 다크에서 hover 는 어두워지는 게 아니라 밝아진다. 라이트 시절의 -dark 는
        // "더 진한 채움"이었지만 여기서는 "더 밝은 채움"이어야 눌린 느낌이 아니라
        // 떠오르는 느낌이 된다. 흰 글씨 6.55:1 로 AA 는 유지된다.
        "gal-accent-dark": "#6d2af0",
        "gal-accent-light": "#423277",  // 틴트 표면. 카드 1.30:1, 잉크 5.05:1
        // 레퍼런스의 #a78bfa(6.82:1)는 페이지 위에서는 통과하지만 액센트 틴트 위에서
        // 4.5 를 만족하려면 틴트가 L≤0.0357 이어야 하고, 그러면 틴트가 카드 위에서
        // 1.14:1 — 배지가 카드에 녹아 사라진다. 잉크를 한 단계 밝혀서 틴트에 여유를 준다.
        "gal-accent-ink": "#b8a5ff",    // 텍스트·아이콘·포커스링 전용. 페이지 8.72:1
        "gal-footer": "#0d0916",
        // 상태색은 잉크/틴트 쌍이다 (gal-accent / gal-accent-light 선례).
        // 다크에서는 역할이 뒤집힌다: 잉크가 밝고 틴트가 어둡다.
        // 틴트는 채도를 지키려고 500 단계를 페이지 위에 알파 합성해 L=0.046 에 맞췄다
        // (400/300 단계를 옅게 깔면 회색으로 죽는다).
        // 잉크 단계가 색상마다 다른 것은 실수가 아니다. 빨강·파랑은 같은 단계에서
        // 휘도가 낮아, 400 단계로는 틴트 위 4.5:1 을 만들 수 없다:
        //   red-400 #f87171 은 틴트 최대 L 이 0.0344 라 배지가 카드에 묻힌다(1.12:1).
        //   blue-400 #60a5fa 도 0.0418 로 같은 문제다.
        // 지각 무게를 맞추려면 색상별로 단계가 달라야 한다(L 0.50~0.58 로 정렬).
        "status-success":       "#4ade80",  // green-400,  페이지 10.65:1
        "status-success-light": "#194433",  // 틴트, 잉크 6.29:1
        "status-warning":       "#fbbf24",  // amber-400,  페이지 11.12:1
        "status-warning-light": "#53371c",  // 틴트, 잉크 6.51:1
        "status-danger":        "#fca5a5",  // red-300,    페이지 9.78:1
        "status-danger-light":  "#6b242f",  // 틴트, 잉크 5.77:1
        "status-info":          "#93c5fd",  // blue-300,   페이지 10.29:1
        "status-info-light":    "#243a71",  // 틴트, 잉크 6.07:1
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors,
      // ring-offset-* 의 기본 오프셋 색은 Tailwind 가 #fff 로 박아 둔다.
      // 다크 배경에서는 포커스한 버튼 둘레에 흰 링이 생겨 오히려 배경보다 밝은
      // 테두리가 두 겹 그려진다. 페이지색으로 바꿔 링이 배경을 파고들게 한다.
      // (focus-visible:ring-offset-1/2 소비자: AppHeader, Button, Navigation,
      //  SubscriptionBanner)
      ringOffsetColor: { DEFAULT: colors["gal-bg"] },
      // Tailwind preflight 은 모든 요소의 border-color 를 borderColor.DEFAULT
      // (기본 #e5e7eb = gray-200) 로 깐다. 색 클래스 없이 두께만 준 테두리는
      // 다크 배경 위에서 **거의 흰 선**으로 그려진다 — 실제로 측정에서
      // `main section > div` 가 #e5e7eb(배경 대비 14.99:1)로 잡혔다.
      // 기본값을 토큰으로 돌려 놓으면 그 경로가 막힌다.
      borderColor: { DEFAULT: colors["gal-border"] },
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
      minHeight: {
        // 상설 헤더(AppHeader, h-14 = 3.5rem)가 sticky top-0 으로 히어로 **앞**에
        // 흐름을 차지한다. 히어로가 화면 전체 높이면 폴드 위 총 높이가
        // 화면 + 헤더가 되어 히어로 하단(스크롤 셰브런, 그라디언트 전환)이
        // 첫 화면 밖으로 밀린다. 헤더 높이를 빼서 히어로가 정확히 폴드에 맞게 한다.
        //
        // 단위가 vh 가 아니라 dvh 인 것이 핵심이다. 모바일 사파리에서 vh 는
        // **large viewport** — URL 바가 펼쳐진 상태의 높이를 모른다. 그 차이가
        // 60~115px 이고, 히어로 셰브런의 하단 여유는 31px 뿐이라 vh 로는
        // 첫 화면에서 셰브런과 CTA 가 URL 바 뒤로 잘린다.
        "screen-below-header": "calc(100dvh - 3.5rem)",
      },
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
