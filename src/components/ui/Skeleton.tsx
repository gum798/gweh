import { defaultRadius } from './radius';

interface SkeletonProps {
  variant?: 'text' | 'card' | 'circle' | 'rectangular';
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const baseClasses = 'animate-shimmer bg-gradient-to-r from-gal-light via-gal-bg to-gal-light bg-[length:200%_100%]';

  // 반지름을 variant 표에서 **분리**한다. 예전에는 한 문자열에 섞여 있어서 호출부
  // className 의 반지름이 조용히 졌다: Tailwind 는 반지름 유틸리티를 클래스명
  // 알파벳순으로 내보내고 특이성이 전부 같아 뒤에 나온 것이 이긴다. 그래서
  // `<Skeleton variant="rectangular" className="rounded-full" />` 는 알약이 아니라
  // 4px 로 렌더됐다 — 이 파일 아래 SkeletonOmenTab 의 에너지 바가 실제 피해자다.
  // 근거와 순서표는 ./radius.ts 주석 참조.
  const variantClasses = {
    text: 'h-4',
    card: '',
    circle: '',
    rectangular: '',
  };

  const variantRadius = {
    text: 'rounded-gal-sm',
    card: 'rounded-gal-xl',
    circle: 'rounded-full',
    rectangular: 'rounded-gal-md',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${defaultRadius(className, variantRadius[variant])} ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-panel p-6 space-y-4 ${className}`}>
      <div className="flex items-center space-x-4">
        <Skeleton variant="circle" width="48px" height="48px" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton height="80px" variant="rectangular" />
      <div className="space-y-2">
        <Skeleton width="100%" />
        <Skeleton width="80%" />
        <Skeleton width="60%" />
      </div>
    </div>
  );
}

export function SkeletonOmenTab() {
  return (
    <div className="space-y-6 p-4">
      {/* Hero skeleton */}
      <div className="text-center space-y-4 py-8">
        <Skeleton variant="text" width="200px" height="24px" className="mx-auto" />
        <Skeleton variant="text" width="300px" height="16px" className="mx-auto" />
      </div>

      {/* Energy bar skeleton */}
      <div className="glass-panel p-4">
        <div className="flex justify-between items-center mb-2">
          <Skeleton width="80px" height="14px" />
          <Skeleton width="40px" height="14px" />
        </div>
        <Skeleton height="8px" variant="rectangular" className="rounded-full" />
      </div>

      {/* Main omen card skeleton */}
      <SkeletonCard />

      {/* Detail cards skeleton */}
      <div className="grid grid-cols-1 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
