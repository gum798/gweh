interface ProgressBarProps {
  progress: number; // 0-100
  status?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ progress, status, showPercentage = true }: ProgressBarProps) {
  return (
    <div className="w-full max-w-xs space-y-2">
      <div className="w-full h-2 bg-gal-light rounded-gal-md overflow-hidden">
        <div
          className="h-full bg-gal-accent transition-all duration-300 ease-out rounded-gal-md"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-sm">
        {status && <span className="text-gal-muted">{status}</span>}
        {showPercentage && (
          <span className="text-gal-accent font-bold">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  );
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({ progress, size = 80, strokeWidth = 4 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="w-full h-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e5e5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2ea3f2"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-gal-accent font-bold text-lg">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
