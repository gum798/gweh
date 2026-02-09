import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { getOverallEnergy, getEnergyLabel } from '../utils/omenGenerator';

// rerender-memo: Memoize component to prevent re-renders with complex object props
export default memo(function OmenCard({ omen, weather, moon, earthquake }) {
  const { t, i18n } = useTranslation();
  const energy = getOverallEnergy(weather, moon, earthquake);
  const energyInfo = getEnergyLabel(energy);

  if (!omen) return null;

  return (
    <div className="glass-panel p-6 md:p-8 animate-fade-in">
      {/* 에너지 지표 */}
      <div className="flex justify-between items-center mb-6">
        <span className="data-label">{t('omenCard.energyFlow')}</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gal-light rounded-gal-md overflow-hidden">
            <div
              className="h-full bg-gal-accent transition-all duration-1000 rounded-gal-md"
              style={{ width: `${energy}%` }}
            />
          </div>
          <span className={`text-sm font-medium ${energyInfo.color}`}>
            {energyInfo.label}
          </span>
        </div>
      </div>

      {/* 메인 괘 */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">&#x2731;</div>
        <p className="text-xl md:text-2xl text-gal-black leading-relaxed font-semibold">
          "{omen.main.message}"
        </p>
      </div>

      {/* 세부 괘 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {omen.details.map((detail, index) => (
          <div
            key={index}
            className="bg-gal-bg rounded-gal-lg p-4 border border-gal-border
                       hover:border-gal-accent transition-colors duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{detail.icon}</span>
              <span className="data-label">{detail.category}</span>
            </div>
            <p className="text-gal-body text-sm leading-relaxed">
              {detail.message}
            </p>
          </div>
        ))}
      </div>

      {/* 타임스탬프 */}
      <div className="mt-6 pt-4 border-t border-gal-border text-center">
        <p className="text-gal-muted text-xs">
          {omen.timestamp.toLocaleString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })} {t('omenCard.celestialSign')}
        </p>
      </div>
    </div>
  );
});
