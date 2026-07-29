import { useTranslation } from 'react-i18next';

export default function LocationPrompt({ onRequestLocation, onSkip, error }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-gal-light border border-gal-border rounded-gal-xl shadow-gal-card p-8 max-w-md text-center animate-fade-in">
        {/* 아이콘 */}
        <div className="text-5xl mb-6">&#x1F4CD;</div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gal-black mb-4">
          {t('location.title')}
        </h1>

        {/* 설명 */}
        <p className="text-gal-body mb-6 leading-relaxed">
          {t('omenTab.locationAffects1')}<br />
          {t('omenTab.locationAffects2')}
        </p>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-status-danger-light border border-status-danger/40 rounded-gal-md p-3 mb-6 text-status-danger text-sm">
            {error}
          </div>
        )}

        {/* 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={onRequestLocation}
            className="w-full px-8 py-3 bg-gal-accent text-white font-semibold rounded-gal-md
                       hover:bg-gal-accent-dark
                       transition-all duration-200
                       shadow-gal-button"
          >
            {t('location.startButton')}
          </button>

          <button
            onClick={onSkip}
            className="w-full px-8 py-3 bg-gal-light border border-gal-border
                       text-gal-body font-medium rounded-gal-md
                       hover:border-gal-accent-ink hover:text-gal-accent-ink
                       transition-all duration-200"
          >
            {t('location.skipButton')}
          </button>
        </div>

        {/* 부연 설명 */}
        <p className="text-gal-muted text-sm mt-4">
          {t('location.skipWarning')}
        </p>
      </div>
    </div>
  );
}
