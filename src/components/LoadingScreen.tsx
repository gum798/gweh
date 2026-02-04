import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function LoadingScreen({ message }: { message?: string }) {
  const { t } = useTranslation();
  const [subMessageIndex, setSubMessageIndex] = useState(0);
  
  const subMessages = [
    "별자리의 궤적을 정렬하는 중입니다...",
    "천지의 기운을 한곳으로 모으고 있습니다...",
    "동양의 지혜와 AI의 만남을 준비 중입니다...",
    "운명의 실타래를 정교하게 분석하고 있습니다...",
    "신비로운 예언의 문이 곧 열립니다..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSubMessageIndex((prev) => (prev + 1) % subMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const displayMessage = message || t('loading.message');

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a1a] z-[9999]">
      {/* 배경 그라데이션 오라 */}
      <div className="absolute inset-0 bg-radial-gradient from-mystic-purple/10 to-transparent opacity-50" />

      {/* 로딩 애니메이션 - 더욱 화려하고 시인성 높은 효과 */}
      <div className="relative w-40 h-40 mb-10">
        <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
        <div className="absolute inset-4 rounded-full border border-amber-300/40 animate-pulse" />
        <div className="absolute inset-8 rounded-full border-2 border-amber-200/60 animate-spin-slow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl filter drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-bounce">
            🔮
          </div>
        </div>
      </div>

      {/* 메인 로딩 메시지 - 시인성 강화 (두껍고 선명하게) */}
      <h2 className="text-amber-400 text-3xl font-bold mb-4 tracking-widest text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
        {displayMessage}
      </h2>

      {/* 서브 메시지 - 지루함 방지 및 시각적 피드백 */}
      <p className="text-gray-300 text-lg font-medium h-6 animate-fade-in-out">
        {subMessages[subMessageIndex]}
      </p>

      {/* 프로그레스 바 형태의 장식 */}
      <div className="mt-12 w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
        <div className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 w-full animate-progress-loop" />
      </div>
    </div>
  );
}
