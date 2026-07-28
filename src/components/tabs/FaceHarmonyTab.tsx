import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CameraCapture from '../camera/CameraCapture';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { analyzeFaceFeatures, analyzeFaceHarmony } from '../../utils/physiognomy';
import type { HarmonyResult, HarmonyDimension } from '../../utils/physiognomy';

// ─── Animated SVG: Orbiting ring with runes ────────────────────────
function GoldenOrbitSVG({ size = 240, animate = true }: { size?: number; animate?: boolean }) {
  const r = size / 2 - 12;
  const runes = ['☯', '☰', '☲', '☵', '☴', '☷', '☳', '☶'];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 m-auto pointer-events-none">
      {/* outer dashed ring */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(46,163,242,0.25)" strokeWidth="1.5"
        strokeDasharray="8 6" className={animate ? 'animate-spin-slow origin-center' : ''} />
      {/* inner ring */}
      <circle cx={size / 2} cy={size / 2} r={r * 0.85} fill="none" stroke="rgba(46,163,242,0.15)" strokeWidth="1" />
      {/* rune characters placed around the ring */}
      {runes.map((rune, i) => {
        const angle = (i / runes.length) * Math.PI * 2 - Math.PI / 2;
        const cx = size / 2 + Math.cos(angle) * (r * 0.92);
        const cy = size / 2 + Math.sin(angle) * (r * 0.92);
        return (
          <text key={i} x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            fill="rgba(46,163,242,0.4)" fontSize="14" fontFamily="serif"
            style={{ animationDelay: `${i * 0.15}s` }}>
            {rune}
          </text>
        );
      })}
    </svg>
  );
}

// ─── SVG Connection Line with animated particles ──────────────────────────
function HarmonyConnectionSVG({ active, score }: { active: boolean; score?: number }) {
  return (
    <svg width="120" height="60" viewBox="0 0 120 60" className="hidden md:block flex-shrink-0">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(46,163,242,0.1)" />
          <stop offset="50%" stopColor="rgba(46,163,242,0.8)" />
          <stop offset="100%" stopColor="rgba(46,163,242,0.1)" />
        </linearGradient>
      </defs>
      {/* base line */}
      <line x1="10" y1="30" x2="110" y2="30" stroke="rgba(46,163,242,0.15)" strokeWidth="2" />
      {/* animated line */}
      {active && (
        <line x1="10" y1="30" x2="110" y2="30" stroke="url(#lineGrad)" strokeWidth="3">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </line>
      )}
      {/* traveling particles */}
      {active && [0, 1, 2].map(i => (
        <circle key={i} r="3" fill="#2ea3f2">
          <animateMotion dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite"
            path="M10,30 L110,30" begin={`${i * 0.5}s`} />
          <animate attributeName="opacity" values="0;1;0" dur={`${1.5 + i * 0.4}s`}
            repeatCount="indefinite" begin={`${i * 0.5}s`} />
        </circle>
      ))}
      {/* center score badge */}
      {score != null && !active && (
        <g>
          <circle cx="60" cy="30" r="18" fill="white" stroke="#2ea3f2" strokeWidth="1.5" />
          <text x="60" y="31" textAnchor="middle" dominantBaseline="central"
            fill="#2ea3f2" fontSize="12" fontWeight="bold">{score}%</text>
        </g>
      )}
    </svg>
  );
}

// ─── Canvas: Particle Burst on result reveal ──────────────────────────────
function ParticleBurstCanvas({ trigger }: { trigger: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; decay: number; color: string }[] = [];

    const blueColors = ['#2ea3f2', '#5bb8f5', '#1a8fd8', '#7ec8f8', '#3daef4', '#0d7bc4'];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x: w / 2, y: h / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1 + Math.random() * 3,
        a: 1,
        decay: 0.01 + Math.random() * 0.02,
        color: blueColors[Math.floor(Math.random() * blueColors.length)],
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (const p of particles) {
        if (p.a <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03; // gravity
        p.a -= p.decay;
        ctx.globalAlpha = Math.max(0, p.a);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (alive) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />
  );
}

// ─── Circular Score Gauge (SVG) ────────────────────────────────────────────
function ScoreGauge({ score, size = 180 }: { score: number; size?: number }) {
  const r = size / 2 - 14;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1800;
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(score * ease));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2ea3f2" />
            <stop offset="50%" stopColor="#1a8fd8" />
            <stop offset="100%" stopColor="#0d7bc4" />
          </linearGradient>
        </defs>
        {/* background circle */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(46,163,242,0.1)" strokeWidth="8" />
        {/* score arc */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#gaugeGrad)" strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={circumference - filled}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.34, 1, 0.64, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-gal-accent animate-count-up">
          {animatedScore}
        </span>
        <span className="text-gal-accent/60 text-sm font-medium tracking-wider">점</span>
      </div>
    </div>
  );
}

// ─── Dimension Bar ────────────────────────────────────────────────────────
function DimensionBar({ dim, index }: { dim: HarmonyDimension; index: number }) {
  const barColor = dim.score >= 85 ? 'from-gal-accent to-gal-accent/70'
    : dim.score >= 70 ? 'from-gal-accent-dark to-gal-accent'
    : 'from-gal-accent-dark to-gal-accent-dark/70';

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 120}ms`, opacity: 0 }}>
      <div className="bg-white rounded-gal-xl border border-gal-border p-4
                      hover:border-gal-accent/30 transition-all duration-300 group shadow-gal-soft">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{dim.icon}</span>
            <span className="text-gal-black text-sm font-medium">{dim.label}</span>
          </div>
          <span className={`text-sm font-bold ${dim.score >= 85 ? 'text-gal-accent' : dim.score >= 70 ? 'text-gal-accent-dark' : 'text-gal-body'}`}>
            {dim.score}점
          </span>
        </div>
        {/* bar */}
        <div className="h-2 bg-gal-light rounded-full overflow-hidden mb-3">
          <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${dim.score}%`, transitionDelay: `${index * 120 + 300}ms` }} />
        </div>
        {/* interpretation */}
        <p className="text-gal-muted text-xs leading-relaxed group-hover:text-gal-body transition-colors">
          {dim.interpretation}
        </p>
      </div>
    </div>
  );
}

// ─── Avatar Circle ────────────────────────────────────────────────────────
function AvatarCircle({
  image, label, side, onClick, ready
}: { image?: string | null; label: string; side: 'left' | 'right'; onClick: () => void; ready?: boolean }) {
  return (
    <div className={`relative group cursor-pointer ${side === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right'}`}
      style={{ opacity: 0 }} onClick={onClick}>
      <div className="relative">
        {/* outer ring -- enhanced when ready */}
        <div className={`absolute -inset-3 rounded-full border transition-all duration-700 ${
          ready
            ? 'border-gal-accent/50 shadow-gal-card'
            : 'border-gal-accent/20 animate-pulse-slow'
        }`} />
        <div className={`w-36 h-36 md:w-40 md:h-40 rounded-full border-2 overflow-hidden
                        bg-gal-bg flex items-center justify-center
                        group-hover:border-gal-accent/60 group-hover:shadow-gal-hover
                        transition-all duration-500 ${
                          ready ? 'border-gal-accent/50' : 'border-gal-border'
                        }`}>
          {image ? (
            <img src={image} alt={label} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl opacity-60">📷</span>
              <span className="text-gal-muted text-xs">촬영하기</span>
            </div>
          )}
        </div>
        {/* checkmark badge when ready */}
        {ready && (
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gal-accent
                          rounded-full flex items-center justify-center shadow-gal-card
                          animate-scale-in border-2 border-white" style={{ opacity: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7.5L5.5 11L12 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
      <p className="text-center mt-3 text-gal-body font-medium text-sm tracking-wide">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export default function FaceHarmonyTab() {
  const { t } = useTranslation();
  const { detectFace, detectMultipleFaces, isLoading, error: detectionError } = useFaceDetection();

  const [mode, setMode] = useState<'idle' | 'capture-a' | 'capture-b' | 'analyzing' | 'result'>('idle');
  const [inputMode, setInputMode] = useState<'separate' | 'single'>('separate');
  const [imageA, setImageA] = useState<string | null>(null);
  const [imageB, setImageB] = useState<string | null>(null);
  const [landmarksA, setLandmarksA] = useState<any[] | null>(null);
  const [landmarksB, setLandmarksB] = useState<any[] | null>(null);
  const [harmonyResult, setHarmonyResult] = useState<HarmonyResult | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback(async (imageSrc: string, target: 'a' | 'b') => {
    setError(null);
    const faceData = await detectFace(imageSrc);
    if (!faceData) {
      // 구체적인 실패 사유는 훅의 error 상태에 담겨 있고, 렌더 시점에 표시된다.
      setMode('idle');
      return;
    }

    const croppedImage = faceData.annotatedImage || imageSrc;

    if (target === 'a') {
      setImageA(croppedImage);
      setLandmarksA(faceData.landmarks);
      setMode('idle');
    } else {
      setImageB(croppedImage);
      setLandmarksB(faceData.landmarks);
      setMode('idle');
    }
  }, [detectFace]);

  // Crop a single face region from the source image using landmark bounding box
  const cropFaceFromImage = useCallback((imageSrc: string, landmarks: any[]): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let minX = Infinity, maxX = 0, minY = Infinity, maxY = 0;
        for (const kp of landmarks) {
          minX = Math.min(minX, kp.x);
          maxX = Math.max(maxX, kp.x);
          minY = Math.min(minY, kp.y);
          maxY = Math.max(maxY, kp.y);
        }

        // 30% padding for natural framing
        const pad = Math.max(maxX - minX, maxY - minY) * 0.3;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(img.width, maxX + pad);
        maxY = Math.min(img.height, maxY + pad);

        const w = maxX - minX;
        const h = maxY - minY;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, minX, minY, w, h, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(imageSrc); // fallback
      img.src = imageSrc;
    });
  }, []);

  const handleSinglePhoto = useCallback(async (imageSrc: string) => {
    setError(null);
    setMode('analyzing');

    const faces = await detectMultipleFaces(imageSrc);
    if (!faces || faces.length < 2) {
      // 구체적인 실패 사유는 훅의 error 상태에 담겨 있고, 렌더 시점에 표시된다.
      setMode('idle');
      return;
    }

    const [faceA, faceB] = faces;

    // Crop each face individually from the original photo
    const [croppedA, croppedB] = await Promise.all([
      faceA.annotatedImage
        ? Promise.resolve(faceA.annotatedImage)
        : cropFaceFromImage(imageSrc, faceA.landmarks),
      faceB.annotatedImage
        ? Promise.resolve(faceB.annotatedImage)
        : cropFaceFromImage(imageSrc, faceB.landmarks),
    ]);

    setImageA(croppedA);
    setImageB(croppedB);
    setLandmarksA(faceA.landmarks);
    setLandmarksB(faceB.landmarks);

    // Start analysis after a brief delay
    setTimeout(() => {
      const result = analyzeFaceHarmony(faceA.landmarks, faceB.landmarks);
      setHarmonyResult(result);
      setMode('result');
      setTimeout(() => setShowParticles(true), 300);
    }, 2500);
  }, [detectMultipleFaces, cropFaceFromImage]);

  const handleSinglePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageSrc = event.target?.result as string;
      if (imageSrc) handleSinglePhoto(imageSrc);
    };
    reader.readAsDataURL(file);
  }, [handleSinglePhoto]);

  const startAnalysis = useCallback(() => {
    if (!landmarksA || !landmarksB) return;
    setMode('analyzing');

    // simulate analysis delay
    setTimeout(() => {
      const result = analyzeFaceHarmony(landmarksA, landmarksB);
      setHarmonyResult(result);
      setMode('result');
      setTimeout(() => setShowParticles(true), 300);
    }, 3500);
  }, [landmarksA, landmarksB]);

  const handleReset = () => {
    setMode('idle');
    setImageA(null);
    setImageB(null);
    setLandmarksA(null);
    setLandmarksB(null);
    setHarmonyResult(null);
    setShowParticles(false);
    setError(null);
  };

  // ─── Camera Capture Screen ─────────────────────────────────
  if (mode === 'capture-a' || mode === 'capture-b') {
    const target = mode === 'capture-a' ? 'a' : 'b';
    const label = target === 'a' ? '첫 번째 인물' : '두 번째 인물';
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-4">
          <h3 className="text-gal-accent text-lg font-bold">{label}의 얼굴을 촬영하세요</h3>
          <p className="text-gal-muted text-sm mt-1">정면을 바라보고 밝은 곳에서 촬영하면 정확도가 높아집니다</p>
        </div>
        <CameraCapture
          onCapture={(img: string) => handleCapture(img, target)}
          captureLabel="얼굴 촬영"
          instruction=""
          detectType="face"
        />
        <div className="text-center">
          <button onClick={() => setMode('idle')}
            className="text-gal-accent/60 hover:text-gal-accent text-sm underline underline-offset-4 transition-colors">
            ← 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ─── Analyzing Screen ──────────────────────────────────────
  if (mode === 'analyzing' || isLoading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center p-8 animate-fade-in">
        {/* rotating mandala */}
        <div className="relative w-48 h-48">
          <GoldenOrbitSVG size={192} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl animate-pulse">☯</span>
          </div>
        </div>

        <h3 className="text-gal-accent text-xl font-bold mt-8 mb-2 tracking-wide">
          천기를 대조하는 중...
        </h3>
        <p className="text-gal-muted text-sm text-center max-w-xs leading-relaxed">
          두 분의 오관(五官)과 삼정(三停), 십이궁(十二宮)의 기운을 면밀히 비교하고 있습니다
        </p>

        {/* animated progress bar */}
        <div className="mt-8 w-56 h-1.5 bg-gal-light rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gal-accent-dark via-gal-accent to-gal-accent-dark rounded-full animate-progress-loop" />
        </div>

        {/* floating dots */}
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="w-1.5 h-1.5 bg-gal-accent rounded-full animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  // ─── Result Screen ─────────────────────────────────────────
  if (mode === 'result' && harmonyResult) {
    const { totalScore, grade, gradeEmoji, mainMessage, dimensions, advice, elementPair } = harmonyResult;
    return (
      <div className="space-y-8 pb-12 animate-fade-in">
        {/* Hero Result */}
        <section className="relative overflow-hidden rounded-gal-xl mx-2">
          <ParticleBurstCanvas trigger={showParticles} />
          <div className="relative z-10 bg-white border border-gal-border rounded-gal-xl p-8 shadow-gal-card">
            {/* Grade Badge */}
            <div className="text-center mb-6 animate-scale-in" style={{ opacity: 0 }}>
              <span className="inline-block px-5 py-1.5 bg-gal-accent-light border border-gal-accent/30 rounded-gal-md text-gal-accent text-sm font-bold tracking-widest">
                {gradeEmoji} {grade}
              </span>
            </div>

            {/* Faces + Score */}
            <div className="flex items-center justify-center gap-4 md:gap-6 mb-8">
              {/* Person A */}
              <div className="flex flex-col items-center animate-slide-in-left" style={{ opacity: 0 }}>
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-gal-accent/40 overflow-hidden shadow-gal-card">
                  {imageA && <img src={imageA} alt="인물 1" className="w-full h-full object-cover" />}
                </div>
                <span className="text-gal-muted text-xs mt-2">인물 1</span>
              </div>

              {/* Score Gauge */}
              <div className="animate-scale-in" style={{ opacity: 0, animationDelay: '300ms' }}>
                <ScoreGauge score={totalScore} size={140} />
              </div>

              {/* Person B */}
              <div className="flex flex-col items-center animate-slide-in-right" style={{ opacity: 0 }}>
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-gal-accent/40 overflow-hidden shadow-gal-card">
                  {imageB && <img src={imageB} alt="인물 2" className="w-full h-full object-cover" />}
                </div>
                <span className="text-gal-muted text-xs mt-2">인물 2</span>
              </div>
            </div>

            {/* Main Message */}
            <div className="animate-fade-in-up" style={{ opacity: 0, animationDelay: '600ms' }}>
              <p className="text-gal-body text-sm md:text-base leading-relaxed text-center max-w-lg mx-auto italic">
                &ldquo;{mainMessage}&rdquo;
              </p>
            </div>

            {/* Element Pair */}
            <div className="flex items-center justify-center gap-4 mt-6 animate-fade-in-up" style={{ opacity: 0, animationDelay: '900ms' }}>
              <span className="px-4 py-1.5 bg-gal-accent-light border border-gal-accent/20 rounded-gal-md text-gal-accent text-sm font-bold tracking-wider">
                {ELEMENT_LABELS[elementPair.a]}
              </span>
              <span className="text-gal-accent/60 text-lg animate-pulse-slow">☯</span>
              <span className="px-4 py-1.5 bg-gal-accent-light border border-gal-accent/20 rounded-gal-md text-gal-accent text-sm font-bold tracking-wider">
                {ELEMENT_LABELS[elementPair.b]}
              </span>
            </div>
          </div>
        </section>

        {/* Element Harmony Detail */}
        <section className="mx-4 animate-fade-in-up" style={{ opacity: 0, animationDelay: '1000ms' }}>
          <div className="bg-white rounded-gal-xl border border-gal-border p-5 shadow-gal-soft">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔥</span>
              <span className="text-gal-accent text-sm font-bold tracking-wide">오행 궁합 · 상생상극(相生相剋)</span>
            </div>
            <p className="text-gal-body text-sm leading-relaxed whitespace-pre-line">{elementPair.harmony}</p>
          </div>
        </section>

        {/* Dimension Cards */}
        <section className="mx-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gal-border to-transparent" />
            <span className="text-gal-accent/60 text-xs font-bold tracking-[0.2em] uppercase">세부 궁합 분석</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gal-border to-transparent" />
          </div>
          {dimensions.map((dim, i) => (
            <DimensionBar key={dim.key} dim={dim} index={i} />
          ))}
        </section>

        {/* Advice Section */}
        <section className="mx-4 animate-fade-in-up" style={{ opacity: 0, animationDelay: '1200ms' }}>
          <div className="bg-white rounded-gal-xl border border-gal-accent/20 p-5 shadow-gal-soft">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📜</span>
              <span className="text-gal-accent text-sm font-bold tracking-wide">신비로운 조언</span>
            </div>
            <p className="text-gal-body text-sm leading-relaxed">{advice}</p>
          </div>
        </section>

        {/* Reset Button */}
        <div className="px-4 pt-2">
          <button onClick={handleReset}
            className="w-full max-w-md mx-auto flex items-center justify-center h-12 rounded-gal-xl font-bold text-sm
                       bg-gal-accent text-white hover:bg-gal-accent-dark
                       shadow-gal-button transition-all duration-300 tracking-widest">
            궁합을 다시 살피다
          </button>
        </div>
      </div>
    );
  }

  // ─── Idle / Setup Screen ───────────────────────────────────
  const bothReady = landmarksA && landmarksB;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-gal-xl mx-2">
        <div className="relative bg-white border border-gal-border rounded-gal-xl py-12 px-6 shadow-gal-card">
          {/* Background SVG mandala */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <GoldenOrbitSVG size={320} animate />
          </div>

          <div className="relative z-10 text-center mb-6">
            <h2 className="text-gal-accent text-3xl md:text-4xl font-bold mb-3 tracking-wider">
              관상 궁합
            </h2>
            <p className="text-gal-muted text-sm max-w-sm mx-auto leading-relaxed">
              두 사람의 오관(五官)과 삼정(三停), 오행(五行)의 기운을 비교하여<br/>
              천생연분의 궁합을 밝혀드립니다
            </p>
          </div>

          {/* Input Mode Toggle */}
          <div className="relative z-10 flex justify-center gap-2 mb-8">
            <button
              onClick={() => { setInputMode('separate'); handleReset(); }}
              className={`px-4 py-2 rounded-gal-lg text-xs font-medium transition-all duration-300 ${
                inputMode === 'separate'
                  ? 'bg-gal-accent-light text-gal-accent border border-gal-accent/30'
                  : 'text-gal-muted hover:text-gal-accent border border-transparent'
              }`}
            >
              📷 각각 촬영
            </button>
            <button
              onClick={() => { setInputMode('single'); handleReset(); }}
              className={`px-4 py-2 rounded-gal-lg text-xs font-medium transition-all duration-300 ${
                inputMode === 'single'
                  ? 'bg-gal-accent-light text-gal-accent border border-gal-accent/30'
                  : 'text-gal-muted hover:text-gal-accent border border-transparent'
              }`}
            >
              🤳 함께 찍은 사진
            </button>
          </div>

          {/* Separate mode: Avatar Pair */}
          {inputMode === 'separate' && (
            <div className="relative z-10 flex items-center justify-center gap-4 md:gap-8">
              <AvatarCircle
                image={imageA}
                label="인물 1"
                side="left"
                onClick={() => setMode('capture-a')}
              />

              <HarmonyConnectionSVG active={false} score={harmonyResult?.totalScore} />

              {/* mobile connector */}
              <div className="md:hidden flex flex-col items-center">
                <div className="w-8 h-px bg-gal-border" />
                <span className="text-gal-accent/40 text-lg my-1">☯</span>
                <div className="w-8 h-px bg-gal-border" />
              </div>

              <AvatarCircle
                image={imageB}
                label="인물 2"
                side="right"
                onClick={() => setMode('capture-b')}
              />
            </div>
          )}

          {/* Single photo mode: Upload area */}
          {inputMode === 'single' && !imageA && !imageB && (
            <div className="relative z-10 animate-fade-in">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mx-auto max-w-sm border-2 border-dashed border-gal-accent/25 rounded-gal-xl p-10 cursor-pointer
                           hover:border-gal-accent/50 hover:bg-gal-accent-light transition-all duration-300 text-center group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👥</div>
                <p className="text-gal-accent text-sm font-medium mb-2">두 사람이 함께 찍은 사진을 올려주세요</p>
                <p className="text-gal-muted text-xs leading-relaxed">
                  AI가 자동으로 두 얼굴을 감지·분리하여<br/>각 인물의 관상을 개별 분석합니다
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSinglePhotoUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Single photo mode: Show detected faces */}
          {inputMode === 'single' && imageA && imageB && mode !== 'analyzing' && mode !== 'result' && (
            <div className="relative z-10 flex items-center justify-center gap-4 md:gap-8 animate-fade-in">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-gal-accent/40 overflow-hidden">
                  <img src={imageA} alt="인물 1" className="w-full h-full object-cover" />
                </div>
                <span className="text-gal-muted text-xs mt-2">인물 1</span>
              </div>
              <span className="text-gal-accent/40 text-2xl">☯</span>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-2 border-gal-accent/40 overflow-hidden">
                  <img src={imageB} alt="인물 2" className="w-full h-full object-cover" />
                </div>
                <span className="text-gal-muted text-xs mt-2">인물 2</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Error message */}
      {(detectionError || error) && (
        <div className="mx-4 bg-red-50 rounded-gal-xl border border-red-200 p-4 text-center text-red-600 text-sm animate-fade-in">
          {detectionError || error}
        </div>
      )}

      {/* Instruction / Action */}
      <section className="mx-4">
        {inputMode === 'separate' && (!imageA || !imageB) ? (
          <div className="text-center space-y-4 animate-fade-in-up" style={{ opacity: 0 }}>
            <p className="text-gal-muted text-sm">
              {!imageA && !imageB
                ? '위의 원을 눌러 두 분의 얼굴을 촬영해주세요'
                : !imageA
                ? '첫 번째 인물의 얼굴을 촬영해주세요'
                : '두 번째 인물의 얼굴을 촬영해주세요'
              }
            </p>
            <div className="flex justify-center gap-3">
              {!imageA && (
                <button onClick={() => setMode('capture-a')}
                  className="px-6 py-3 bg-gal-accent-light border border-gal-accent/20 rounded-gal-xl text-gal-accent text-sm font-medium
                             hover:bg-gal-accent/10 transition-all duration-300">
                  📷 인물 1 촬영
                </button>
              )}
              {!imageB && (
                <button onClick={() => setMode('capture-b')}
                  className="px-6 py-3 bg-gal-accent-light border border-gal-accent/20 rounded-gal-xl text-gal-accent text-sm font-medium
                             hover:bg-gal-accent/10 transition-all duration-300">
                  📷 인물 2 촬영
                </button>
              )}
            </div>
          </div>
        ) : inputMode === 'separate' && imageA && imageB ? (
          <div className="text-center animate-scale-in" style={{ opacity: 0 }}>
            <button onClick={startAnalysis}
              className="px-10 py-4 bg-gal-accent text-white font-bold
                         rounded-gal-xl shadow-gal-button hover:bg-gal-accent-dark
                         hover:scale-105 active:scale-95 transition-all duration-300 text-lg tracking-wide">
              궁합 분석 시작
            </button>
            <button onClick={handleReset}
              className="block mx-auto mt-4 text-gal-muted hover:text-gal-body text-xs underline underline-offset-4 transition-colors">
              처음부터 다시
            </button>
          </div>
        ) : null}
      </section>

      {/* Feature Description Cards */}
      {!imageA && !imageB && (
        <section className="mx-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: '👁️', title: '오관 상보 분석', desc: '눈·코·입·이마·얼굴형의 상보성을 분석하여 6가지 차원의 궁합을 측정합니다' },
            { icon: '☯', title: '오행 상생·상극', desc: '얼굴 비율에서 도출한 오행(木火土金水) 원소의 궁합을 판별합니다' },
            { icon: '⏳', title: '삼정 시기 조화', desc: '초년·중년·말년의 운의 흐름이 서로 어떻게 맞물리는지 분석합니다' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-gal-xl border border-gal-border p-4
                                    animate-fade-in-up group hover:border-gal-accent/30 hover:shadow-gal-hover
                                    cursor-default shadow-gal-soft" style={{ opacity: 0, animationDelay: `${i * 150 + 300}ms` }}>
              <span className="text-xl mb-2 block group-hover:scale-110 transition-transform duration-300 inline-block">{card.icon}</span>
              <h4 className="text-gal-accent text-sm font-bold mb-1 group-hover:text-gal-accent-dark transition-colors">{card.title}</h4>
              <p className="text-gal-muted text-xs leading-relaxed group-hover:text-gal-body transition-colors">{card.desc}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

// Element label map for display
const ELEMENT_LABELS: Record<string, string> = {
  wood: '木(목)', fire: '火(화)', earth: '土(토)', metal: '金(금)', water: '水(수)',
};
