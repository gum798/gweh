export default function DataPanel({ weather, moon, earthquake, nasa }) {
  return (
    <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📜</span>
        <h2 className="text-white font-bold text-lg">천기의 원천</h2>
      </div>

      <div className="space-y-6">
        {/* 날씨 데이터 */}
        {weather && (
          <DataSection title="하늘의 숨결" icon="🌡️">
            <DataRow label="위치" value={weather.cityName} />
            <DataRow label="기온" value={`${weather.temperature}°C`} />
            <DataRow label="체감" value={`${weather.feelsLike}°C`} />
            <DataRow label="기압" value={`${weather.pressure} hPa`} />
            <DataRow label="습도" value={`${weather.humidity}%`} />
            <DataRow label="구름" value={`${weather.clouds}%`} />
            <DataRow label="풍속" value={`${weather.windSpeed} m/s`} />
            <DataRow label="상태" value={weather.description} />
          </DataSection>
        )}

        {/* 달 위상 */}
        {moon && (
          <DataSection title="달의 속삭임" icon={moon.emoji}>
            <DataRow label="위상" value={moon.name} />
            <DataRow label="조도" value={`${moon.illumination}%`} />
            <DataRow label="삭 이후" value={`${moon.daysSinceNew}일`} />
          </DataSection>
        )}

        {/* 지진 데이터 */}
        {earthquake && (
          <DataSection title="대지의 맥동" icon="🌍">
            <DataRow label="발생 횟수" value={`${earthquake.count}회`} />
            <DataRow label="평균 규모" value={`M ${earthquake.avgMagnitude}`} />
            <DataRow label="최대 규모" value={`M ${earthquake.maxMagnitude}`} />
            {earthquake.strongest && (
              <DataRow
                label="최강 지점"
                value={earthquake.strongest.place || '알 수 없음'}
              />
            )}
          </DataSection>
        )}

        {/* NASA APOD */}
        {nasa && (
          <DataSection title="우주의 계시" icon="🔭">
            <DataRow label="제목" value={nasa.title} />
            <DataRow label="날짜" value={nasa.date} />
          </DataSection>
        )}
      </div>
    </div>
  );
}

function DataSection({ title, icon, children }) {
  return (
    <div className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-[#5b13ec] text-xs uppercase tracking-widest flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <span>{title}</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">{children}</div>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <>
      <span className="text-white/40">{label}</span>
      <span className="text-white/80 truncate" title={value}>
        {value}
      </span>
    </>
  );
}
