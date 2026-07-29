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
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gal-bg z-[9999]">
      {/* 로딩 애니메이션 - 클린 스피너 */}
      <div className="relative w-24 h-24 mb-10">
        <div className="absolute inset-0 rounded-full border-2 border-gal-border animate-ping" />
        <div className="absolute inset-4 rounded-full border border-gal-border animate-pulse" />
        <div className="absolute inset-8 rounded-full border-2 border-gal-accent-ink animate-spin-slow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-3xl">
            &#x26AB;
          </div>
        </div>
      </div>

      {/* 메인 로딩 메시지 */}
      <h2 className="text-gal-black text-2xl font-bold mb-4 tracking-wide text-center">
        {displayMessage}
      </h2>

      {/* 서브 메시지 */}
      <p className="text-gal-body text-base font-medium h-6 animate-fade-in-out">
        {subMessages[subMessageIndex]}
      </p>

      {/* 프로그레스 바 */}
      <div className="mt-12 w-64 h-1.5 bg-gal-bg rounded-gal-md overflow-hidden border border-gal-border">
        <div className="h-full bg-gal-accent-ink w-full animate-progress-loop rounded-gal-md" />
      </div>
    </div>
  );
}
