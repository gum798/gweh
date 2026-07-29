import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

// 감사 시점 버튼 41개에 서로 다른 클래스 조합 29가지가 있었다. 여기로 수렴한다.
//
// 색은 전부 토큰에서 온다 — 하드코딩된 hex 가 하나도 없어야
// scripts/check-contrast.mjs 가 실제로 이 버튼들을 검사하는 것이 된다.
// primary 의 bg-gal-accent 는 현재 흰 글자와 2.75:1 로 AA 미달이지만,
// 이는 게이트가 이미 알고 있는 기존 실패 2건 중 하나이고 Task 7 이
// 토큰 값을 바꿔 고친다. 여기서 다른 색을 쓰면 그 수정이 이 파일만 비껴간다.
const VARIANTS: Record<Variant, string> = {
  primary:   'bg-gal-accent text-white hover:bg-gal-accent-dark shadow-gal-button',
  secondary: 'bg-white text-gal-black border border-gal-border hover:border-gal-accent',
  ghost:     'bg-transparent text-gal-body hover:text-gal-black hover:bg-gal-light',
  danger:    'bg-status-danger text-white hover:opacity-90',
};

// min-h 는 간격이 아니라 크기다 — "임의값 금지" 규칙(간격)의 대상이 아니다.
// Tailwind 3.4 의 스케일에 44px(2.75rem) 단계가 있지만 임의값을 유지한다:
//   1. 이 저장소의 기존 터치 타깃 표기가 전부 임의값이다 — AppHeader 3곳,
//      Navigation 1곳, OmenTab 1곳. 스케일 표기 사용처는 0곳이다.
//   2. 44 는 리듬값이 아니라 터치 타깃 상수다(WCAG 2.5.5 / Apple HIG).
//      임의값은 그 의도를 말하지만 스케일 숫자는 감춘다.
//   3. lg 의 52px 에는 대응 토큰이 아예 없다 — Tailwind 기본 스케일은 11 다음이
//      12, 14 로 13 단계가 없다. 세 줄짜리 표에서 두 줄만 스케일 표기를 쓰면
//      나중에 누군가 52px 도 없는 토큰으로 "정리"하고, Tailwind 는 모르는
//      유틸리티에 아무것도 내보내지 않으므로 높이 규칙이 조용히 사라진다.
//      Task 1 이 지운 라벨 유틸리티로 이미 겪은 실패 모드다.
//
// 주의: 주석에도 살아 있는 유틸리티 이름을 적지 말 것. Tailwind 의 content
// 스캐너는 파일 텍스트를 정규식으로 훑기 때문에 주석 속 클래스명도 실제 CSS
// 규칙을 만들어낸다(이 주석의 초안이 죽은 규칙 2개를 번들에 넣었다).
const SIZES: Record<Size, string> = {
  sm: 'text-xs px-3 min-h-[44px]',
  md: 'text-sm px-5 min-h-[44px]',
  lg: 'text-base px-7 min-h-[52px]',
};

// 반지름은 항상-켜짐 문자열에서 빼서 여기에 따로 둔다. Tailwind 는 borderRadius
// 유틸리티를 **클래스명 알파벳순**으로 내보낸다(설정 키 순서가 아니다). 빌드된 CSS 의
// 실제 순서는 다음과 같다:
//   rounded-full → rounded-gal-lg → rounded-gal-md → rounded-gal-sm
//   → rounded-gal-xl → rounded-lg → rounded-xl
// 특이성이 같으므로 뒤에 나온 규칙이 이긴다. 즉 기본값을 클래스 문자열에 그냥
// 박아두면 rounded-gal-xl 이 rounded-full 과 디자인 토큰 **전부**를 이기고,
// 원시 rounded-lg/rounded-xl 에만 진다. 호출부가 **정식 토큰**을 쓰면 조용히
// 실패하고 비토큰을 쓰면 성공하는, 가능한 최악의 방향이다.
// className 속성의 순서는 아무 영향이 없다 — CSS 는 스타일시트 순서만 본다 —
// 그래서 이 기본값을 VARIANTS/SIZES 표로 옮기는 것으로는 아무것도 고쳐지지 않는다.
//
// 해법은 순서 싸움 자체를 없애는 것이다: className 에 접두사 없는 rounded 유틸리티가
// 있으면 기본값을 아예 내보내지 않는다. 그러면 승자가 하나뿐이라 CSS 순서와 무관하다.
// hover:/md: 처럼 접두사가 붙은 것은 조건부 덮어쓰기이므로 기본값을 남긴다 —
// 그것까지 지우면 조건이 거짓일 때 반지름이 없어진다.
const DEFAULT_RADIUS = 'rounded-gal-xl';
const HAS_RADIUS_OVERRIDE = /(?:^|\s)rounded(?:-[a-z0-9-]+)?(?=\s|$)/;

// type 기본값이 'button' 인 것은 중요하다. React 는 type 을 안 주면 속성을 아예
// 내보내지 않고, 그러면 HTML 기본값인 submit 이 적용된다. 탭에는 <form> 안에
// type="button" 을 명시한 버튼들이 있다 — SajuTab:254 폼 안의 양력/음력 토글과
// 시간 선택 버튼 3개, FortuneTab:330, AuthModal:134. 이 프리미티브가 submit 을
// 기본값으로 두면 Task 4 가 그것들을 바꾸는 순간 달력 토글이 폼을 제출한다.
// 41개 버튼을 흡수하는 컴포넌트는 위험한 쪽을 기본값으로 둘 수 없다.
// type 을 구조분해로 꺼냈으므로 rest 에는 남지 않는다 — 호출부가 명시한
// type="submit" 은 그대로 이 변수에 들어와 이긴다.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, loading, disabled, type = 'button', className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium',
        HAS_RADIUS_OVERRIDE.test(className) ? '' : DEFAULT_RADIUS,
        'transition-all duration-200 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading && (
        <span
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
});
