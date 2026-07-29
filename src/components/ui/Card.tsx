import type { ReactNode } from 'react';

type Variant = 'base' | 'accent' | 'muted';
type Padding = 'sm' | 'md' | 'lg';

interface CardProps {
  variant?: Variant;
  padding?: Padding;
  // 'article' 은 넣지 않는다. 탭 8개에 <section> 은 56곳 있지만 <article> 은 0곳이다.
  // 브리프의 Interfaces 블록도 'div'|'section' 두 가지만 약속한다 — 코드 블록의
  // 세 번째 값은 소비자가 없다. 아무도 쓰지 않는 옵션은 Task 1 이 지운 라벨 유틸리티와
  // 같은 문제이고, 실제 수요가 생기면 그때 한 줄로 추가하면 된다.
  as?: 'div' | 'section';
  className?: string;
  children: ReactNode;
}

// 감사 시점 패널 54개에 카드 변형 25가지, 패딩 5종(p-4/5/6/8/10)이 있었다.
// base 는 SajuTab.tsx:426 의 레시피다.
const VARIANTS: Record<Variant, string> = {
  base:   'bg-white border border-gal-border shadow-gal-card',
  accent: 'bg-white border border-gal-accent/40 shadow-gal-card',
  muted:  'bg-gal-bg border border-gal-border',
};

const PADDINGS: Record<Padding, string> = { sm: 'p-4', md: 'p-6', lg: 'p-8' };

export function Card({ variant = 'base', padding = 'md', as: Tag = 'div', className = '', children }: CardProps) {
  return (
    <Tag className={`rounded-gal-xl ${VARIANTS[variant]} ${PADDINGS[padding]} ${className}`}>
      {children}
    </Tag>
  );
}
