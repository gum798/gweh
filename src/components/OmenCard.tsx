import { memo } from 'react';
import { getOverallEnergy, getEnergyLabel } from '../utils/omenGenerator';

// rerender-memo: Memoize component to prevent re-renders with complex object props
export default memo(function OmenCard({ omen, weather, moon, earthquake }) {
  const energy = getOverallEnergy(weather, moon, earthquake);
  const energyInfo = getEnergyLabel(energy);

  if (!omen) return null;

  return (
    <div className="glass-panel p-6 md:p-8 animate-float">
      {/* 에너지 지표 */}
      <div className="flex justify-between items-center mb-6">
        <span className="data-label">기의 흐름</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-mystic-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cosmic-gold to-yellow-400 transition-all duration-1000"
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
        <div className="text-4xl mb-4">✨</div>
        <p className="text-xl md:text-2xl mystic-text leading-relaxed text-shadow-glow font-mystic">
          "{omen.main.message}"
        </p>
      </div>

      {/* 세부 괘 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {omen.details.map((detail, index) => (
          <div
            key={index}
            className="bg-mystic-700/50 rounded-xl p-4 border border-cosmic-gold/10
                       hover:border-cosmic-gold/30 transition-colors duration-300"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{detail.icon}</span>
              <span className="data-label">{detail.category}</span>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">
              {detail.message}
            </p>
          </div>
        ))}
      </div>

      {/* 타임스탬프 */}
      <div className="mt-6 pt-4 border-t border-cosmic-gold/10 text-center">
        <p className="text-gray-500 text-xs">
          {omen.timestamp.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })} 천기
        </p>
      </div>
    </div>
  );
});
