import { useTranslation } from 'react-i18next';

export default function LoadingScreen({ message }: { message?: string }) {
  const { t } = useTranslation();
  const displayMessage = message || t('loading.message');
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-mystic-900">
      {/* 로딩 애니메이션 - 동심원 */}
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-cosmic-gold/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-cosmic-gold/50 animate-pulse" />
        <div className="absolute inset-4 rounded-full border border-cosmic-gold/70 animate-pulse-slow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-cosmic-gold animate-pulse" />
        </div>
      </div>

      {/* 로딩 메시지 */}
      <p className="text-cosmic-gold text-lg font-mystic animate-pulse text-shadow-glow">
        {displayMessage}
      </p>

      {/* 장식적 요소 */}
      <div className="mt-8 flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-cosmic-gold"
            style={{
              animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
