import { useTranslation } from 'react-i18next';

export default function LocationPrompt({ onRequestLocation, onSkip, error }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-md text-center animate-float">
        {/* 아이콘 */}
        <div className="text-6xl mb-6">🔮</div>

        {/* 제목 */}
        <h1 className="text-3xl font-mystic mystic-text mb-4 text-shadow-glow">
          {t('location.title')}
        </h1>

        {/* 설명 */}
        <p className="text-gray-300 mb-6 leading-relaxed font-mystic">
          {t('omenTab.locationAffects1')}<br />
          {t('omenTab.locationAffects2')}
        </p>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={onRequestLocation}
            className="w-full px-8 py-3 bg-gradient-to-r from-cosmic-gold to-yellow-600
                       text-mystic-900 font-bold rounded-full
                       hover:from-yellow-500 hover:to-cosmic-gold
                       transition-all duration-300
                       shadow-lg hover:shadow-cosmic-gold/50
                       animate-glow"
          >
            {t('location.startButton')}
          </button>

          <button
            onClick={onSkip}
            className="w-full px-8 py-3 bg-transparent border border-gray-600
                       text-gray-400 font-medium rounded-full
                       hover:border-cosmic-gold/50 hover:text-cosmic-gold/70
                       transition-all duration-300"
          >
            {t('location.skipButton')}
          </button>
        </div>

        {/* 부연 설명 */}
        <p className="text-gray-500 text-sm mt-4">
          {t('location.skipWarning')}
        </p>
      </div>
    </div>
  );
}
