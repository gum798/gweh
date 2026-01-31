import { memo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface DataPanelProps {
  weather: any;
  moon: any;
  earthquake: any;
  nasa: any;
}

// rerender-memo: Memoize component to prevent re-renders from parent
export default memo(function DataPanel({ weather, moon, earthquake, nasa }: DataPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-md mx-auto bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📜</span>
        <h2 className="text-white font-bold text-lg">{t('data.source')}</h2>
      </div>

      <div className="space-y-6">
        {/* 날씨 데이터 */}
        {weather && (
          <DataSection title={t('data.weather')} icon="🌡️">
            <DataRow label={t('data.location')} value={weather.cityName} />
            <DataRow label={t('data.temperature')} value={`${weather.temperature}°C`} />
            <DataRow label={t('data.feelsLike')} value={`${weather.feelsLike}°C`} />
            <DataRow label={t('data.pressure')} value={`${weather.pressure} hPa`} />
            <DataRow label={t('data.humidity')} value={`${weather.humidity}%`} />
            <DataRow label={t('data.clouds')} value={`${weather.clouds}%`} />
            <DataRow label={t('data.windSpeed')} value={`${weather.windSpeed} m/s`} />
            <DataRow label={t('data.condition')} value={weather.description} />
          </DataSection>
        )}

        {/* 달 위상 */}
        {moon && (
          <DataSection title={t('data.moon')} icon={moon.emoji}>
            <DataRow label={t('data.moonPhase')} value={moon.name} />
            <DataRow label={t('data.illumination')} value={`${moon.illumination}%`} />
            <DataRow label={t('data.daysSinceNew')} value={`${moon.daysSinceNew}일`} />
          </DataSection>
        )}

        {/* 지진 데이터 */}
        {earthquake && (
          <DataSection title={t('data.earthquake')} icon="🌍">
            <DataRow label={t('data.earthquakeCount')} value={`${earthquake.count}회`} />
            <DataRow label={t('data.avgMagnitude')} value={`M ${earthquake.avgMagnitude}`} />
            <DataRow label={t('data.maxMagnitude')} value={`M ${earthquake.maxMagnitude}`} />
            {earthquake.strongest && (
              <DataRow
                label={t('data.strongestLocation')}
                value={earthquake.strongest.place || t('data.unknown')}
              />
            )}
          </DataSection>
        )}

        {/* NASA APOD */}
        {nasa && (
          <DataSection title={t('data.nasa')} icon="🔭">
            <DataRow label={t('data.nasaTitle')} value={nasa.title} />
            <DataRow label={t('data.nasaDate')} value={nasa.date} />
          </DataSection>
        )}
      </div>
    </div>
  );
});

// rerender-memo: Memoize sub-components to prevent unnecessary re-renders
const DataSection = memo(function DataSection({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-[var(--accent)] text-xs uppercase tracking-widest flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <span>{title}</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">{children}</div>
    </div>
  );
});

const DataRow = memo(function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-white/40">{label}</span>
      <span className="text-white/80 truncate" title={value}>
        {value}
      </span>
    </>
  );
});
