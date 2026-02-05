import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function FaceHarmonyTab() {
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // 분석 시뮬레이션
    setTimeout(() => {
      setScore(Math.floor(Math.random() * 21) + 80); // 80~100점 사이
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-[#0a0a1a] min-height-[60vh]">
      <h2 className="text-amber-400 text-3xl font-bold mb-8 tracking-widest drop-shadow-[0_2px_10px_rgba(251,191,36,0.4)]">
        🔮 관상 궁합 (Face Harmony)
      </h2>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 relative w-full max-w-2xl">
        {/* 첫 번째 인물 */}
        <div className="relative group">
          <div className="w-40 h-40 rounded-full border-4 border-amber-500/30 overflow-hidden bg-gray-900 flex items-center justify-center transition-all group-hover:border-amber-400">
            <span className="text-4xl">👤</span>
          </div>
          <p className="text-center mt-2 text-amber-200/70 font-medium">인물 1</p>
        </div>

        {/* 연결 애니메이션 라인 */}
        <div className="hidden md:block flex-1 h-1 bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20 relative">
          {isAnalyzing && (
            <div className="absolute inset-0 bg-amber-400 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
          )}
        </div>
        <div className="md:hidden text-2xl animate-bounce">⚡</div>

        {/* 두 번째 인물 */}
        <div className="relative group">
          <div className="w-40 h-40 rounded-full border-4 border-amber-500/30 overflow-hidden bg-gray-900 flex items-center justify-center transition-all group-hover:border-amber-400">
            <span className="text-4xl">👤</span>
          </div>
          <p className="text-center mt-2 text-amber-200/70 font-medium">인물 2</p>
        </div>
      </div>

      {!score && !isAnalyzing && (
        <button 
          onClick={handleAnalyze}
          className="px-10 py-4 bg-gradient-to-b from-amber-400 to-amber-600 text-mystic-950 font-bold rounded-full shadow-[0_0_20px_rgba(251,191,36,0.5)] hover:scale-105 active:scale-95 transition-all text-xl"
        >
          궁합 분석 시작
        </button>
      )}

      {isAnalyzing && (
        <div className="text-center">
          <p className="text-amber-200 text-xl animate-pulse">두 분의 천기를 대조하는 중입니다...</p>
          <div className="mt-4 w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 animate-progress-loop" />
          </div>
        </div>
      )}

      {score && (
        <div className="text-center animate-fade-in">
          <div className="text-6xl font-bold text-amber-400 mb-4 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
            {score}%
          </div>
          <p className="text-gray-300 text-lg leading-relaxed max-w-md">
            "두 분은 서로의 부족한 기운을 채워주는 보완적인 관상을 가지고 있습니다. 특히 눈매의 조화가 뛰어나 백년해로할 기운이 보입니다."
          </p>
          <button 
            onClick={() => setScore(null)}
            className="mt-8 text-amber-400/60 hover:text-amber-400 underline underline-offset-4 transition-all"
          >
            다시 분석하기
          </button>
        </div>
      )}
    </div>
  );
}
