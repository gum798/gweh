import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useWeather } from '../../hooks/useWeather';
import { useParallelData } from '../../hooks/useParallelData';
import { useMoonPhase } from '../../hooks/useMoonPhase';
import { generateOmen, getOverallEnergy, getEnergyLabel } from '../../utils/omenGenerator';

const DataPanel = lazy(() => import('../DataPanel'));

export default function OmenTab() {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showData, setShowData] = useState(false);

  const { data: weather, loading: weatherLoading, error: weatherError } = useWeather(
    location?.lat,
    location?.lon
  );
  const { earthquake, loading: parallelLoading, errors: parallelErrors } = useParallelData();
  const { data: moon } = useMoonPhase();

  // 서울 기본 좌표
  const DEFAULT_LOCATION = { lat: 37.5665, lon: 126.9780 };

  const requestLocation = useCallback(() => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('이 브라우저에서는 위치 감지가 지원되지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('위치 정보를 사용할 수 없습니다.');
            break;
          case error.TIMEOUT:
            setLocationError('위치 요청 시간이 초과되었습니다.');
            break;
          default:
            setLocationError('위치를 가져오는 중 오류가 발생했습니다.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  const skipLocation = useCallback(() => {
    setLocation(DEFAULT_LOCATION);
  }, []);

  const isLoading = useMemo(
    () => location && (weatherLoading || parallelLoading),
    [location, weatherLoading, parallelLoading]
  );

  const omen = useMemo(() => {
    if (!weather || !moon || !earthquake) return null;
    return generateOmen(weather, moon, earthquake);
  }, [weather, moon, earthquake]);

  const toggleShowData = useCallback(() => {
    setShowData(prev => !prev);
  }, []);

  // 위치 요청 화면
  if (!location) {
    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl">
          <div
            className="flex min-h-[45vh] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-end pb-12 px-6 text-center"
            style={{
              backgroundImage: `linear-gradient(to top, #161022 10%, rgba(22, 16, 34, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url("https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&q=80")`,
            }}
          >
            <div className="flex flex-col gap-3 max-w-2xl">
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
                Divine <br />
                <span className="text-[#5b13ec] italic font-light">Omen</span>
              </h1>
              <p className="text-white/70 text-sm font-light leading-relaxed max-w-xs mx-auto">
                천지의 기운을 읽어 오늘의 괘를 알려드립니다
              </p>
            </div>
          </div>
        </section>

        {/* Location Request */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full border border-[#5b13ec]/50 flex items-center justify-center shadow-[0_0_15px_rgba(91,19,236,0.3)] mx-auto mb-4">
                <span className="text-3xl">🔮</span>
              </div>
              <h3 className="text-white text-xl font-bold tracking-tight">위치 감응</h3>
              <p className="text-white/50 text-sm mt-2">
                당신이 머무는 곳의 기운이<br />
                오늘의 괘를 달리하리니
              </p>
            </div>

            {locationError && (
              <div className="bg-red-500/10 backdrop-blur-xl rounded-xl border border-red-500/30 p-4 mb-6 text-center text-red-400 text-sm">
                {locationError}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={requestLocation}
                className="w-full flex items-center justify-center rounded-full h-14 px-8 bg-[#5b13ec] text-white text-base font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(91,19,236,0.3)] border border-[#5b13ec]/50 hover:scale-105 active:scale-95"
              >
                기운 감응 시작
              </button>

              <button
                onClick={skipLocation}
                className="w-full flex items-center justify-center rounded-full h-12 px-8 bg-transparent border border-white/20 text-white/60 text-sm font-medium tracking-widest uppercase transition-all hover:border-[#5b13ec]/50 hover:text-white"
              >
                위치 없이 진행
              </button>
            </div>

            <p className="text-white/30 text-xs text-center mt-4">
              위치 없이 진행하면 서울 기준으로 괘를 내립니다
            </p>
          </div>
        </section>
      </div>
    );
  }

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border border-[#5b13ec]/30 shadow-[0_0_30px_rgba(91,19,236,0.5)] animate-ping"></div>
          <div className="h-24 w-24 rounded-full border border-[#5b13ec]/50 flex items-center justify-center shadow-[0_0_15px_rgba(91,19,236,0.3)]">
            <span className="text-4xl animate-pulse">🔮</span>
          </div>
        </div>
        <h3 className="text-white text-xl font-bold mt-8 mb-2">Reading the Signs...</h3>
        <p className="text-white/50 text-sm text-center max-w-xs">
          천지의 기운을 살피는 중입니다
        </p>
        <div className="mt-6 flex gap-1">
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // 에러 화면
  const hasError = weatherError || parallelErrors.nasa || parallelErrors.earthquake;
  if (hasError) {
    const errorMessages = [
      weatherError,
      parallelErrors.nasa,
      parallelErrors.earthquake,
    ].filter(Boolean);

    return (
      <div className="px-4 py-8">
        <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-red-500/30 p-8 text-center">
          <div className="h-16 w-16 rounded-full border border-red-500/50 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">천기를 읽을 수 없습니다</h2>
          <div className="text-white/50 text-sm mb-6 space-y-1">
            {errorMessages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-[#5b13ec] text-white rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-[0_0_15px_rgba(91,19,236,0.3)]"
          >
            다시 점괘 보기
          </button>
        </div>
      </div>
    );
  }

  // 결과 화면
  const energy = getOverallEnergy(weather, moon, earthquake);
  const energyInfo = getEnergyLabel(energy);

  return (
    <div className="space-y-8 pb-8">
      {/* 위치 표시 */}
      {weather?.cityName && (
        <p className="text-white/40 text-sm text-center">
          {weather.cityName}의 하늘 아래
        </p>
      )}

      {/* 메인 괘 카드 */}
      <section className="px-4">
        <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          {/* 에너지 지표 */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-white/40 text-xs uppercase tracking-widest">기의 흐름</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5b13ec] to-purple-400 transition-all duration-1000"
                  style={{ width: `${energy}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${
                energyInfo.label === '대길' ? 'text-yellow-400' :
                energyInfo.label === '길' ? 'text-green-400' :
                energyInfo.label === '평' ? 'text-white/60' :
                energyInfo.label === '소흉' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {energyInfo.label}
              </span>
            </div>
          </div>

          {/* 메인 메시지 */}
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-full border border-[#5b13ec]/50 flex items-center justify-center shadow-[0_0_15px_rgba(91,19,236,0.3)] mx-auto mb-4">
              <span className="text-xl">✨</span>
            </div>
            <p className="text-white/70 text-lg italic leading-relaxed">
              "{omen?.main?.message}"
            </p>
          </div>

          {/* 타임스탬프 */}
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-white/30 text-xs">
              {omen?.timestamp?.toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })} 천기
            </p>
          </div>
        </div>
      </section>

      {/* 세부 괘 */}
      <section className="px-4">
        <div className="max-w-md mx-auto space-y-4">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] px-1">Detailed Omens</h4>
          {omen?.details?.map((detail, index) => (
            <div
              key={index}
              className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{detail.icon}</span>
                <span className="text-white font-bold">{detail.category}</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                {detail.message}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 천기 원천 토글 */}
      <div className="text-center">
        <button
          onClick={toggleShowData}
          className="px-6 py-2 text-[#5b13ec] text-sm hover:text-white transition-colors"
        >
          {showData ? '천기 숨기기 ▲' : '천기의 원천 보기 ▼'}
        </button>
      </div>

      {showData && (
        <div className="px-4 animate-fade-in">
          <Suspense fallback={
            <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6 text-center text-white/50">
              기운을 모으는 중...
            </div>
          }>
            <DataPanel
              weather={weather}
              moon={moon}
              earthquake={earthquake}
              nasa={null}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
