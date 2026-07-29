import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

// 페이지 헤더가 없어 탭 6개가 각자 40~50vh 히어로를 만들었고,
// min-h-screen 히어로 아래에 두 번째 히어로가 쌓였다.
//
// 문구는 전부 prop 으로 받는다 — 이 파일 안에 사용자에게 보이는 문자열이 없어야
// 호출부가 t() 로 ko/en 을 함께 공급할 수 있다.
//
// eyebrow 에 tracking 클래스를 붙이지 않는 것은 실수가 아니다. text-label 이
// 0.625rem 과 0.3em 자간을 한 튜플로 함께 나른다(tailwind.config.js). Tailwind
// 기본 tracking-widest 는 0.1em 이라 덧붙이면 오히려 의도한 자간을 덮어쓴다.
export function PageHeader({ eyebrow, title, subtitle, icon }: PageHeaderProps) {
  return (
    <header className="max-w-md mx-auto px-4 pt-6 pb-4 text-center">
      {icon && <div className="flex justify-center mb-3" aria-hidden="true">{icon}</div>}
      {eyebrow && (
        <p className="text-label font-bold uppercase text-gal-accent mb-1.5">{eyebrow}</p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-gal-black">{title}</h2>
      {subtitle && <p className="text-sm text-gal-body mt-2">{subtitle}</p>}
    </header>
  );
}
