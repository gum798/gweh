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
  const baseClasses = 'animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]';

  const variantClasses = {
    text: 'h-4 rounded',
    card: 'rounded-2xl',
    circle: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
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
