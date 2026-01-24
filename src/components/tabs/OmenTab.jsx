import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useWeather } from '../../hooks/useWeather';
import { useParallelData } from '../../hooks/useParallelData';
import { useMoonPhase } from '../../hooks/useMoonPhase';
import { generateOmen } from '../../utils/omenGenerator';
import LoadingScreen from '../LoadingScreen';
import LocationPrompt from '../LocationPrompt';
import OmenCard from '../OmenCard';

const DataPanel = lazy(() => import('../DataPanel'));

export default function OmenTab() {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showData, setShowData] = useState(false);

  const { data: weather, loading: weatherLoading, error: weatherError } = useWeather(
    location?.lat,
    location?.lon
  );
  const { nasa, earthquake, loading: parallelLoading, errors: parallelErrors } = useParallelData();
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

  if (!location) {
    return (
      <div className="py-8">
        <LocationPrompt
          onRequestLocation={requestLocation}
          onSkip={skipLocation}
          error={locationError}
        />
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen message="천지의 기운을 살피는 중..." />;
  }

  const hasError = weatherError || parallelErrors.nasa || parallelErrors.earthquake;
  if (hasError) {
    const errorMessages = [
      weatherError,
      parallelErrors.nasa,
      parallelErrors.earthquake,
    ].filter(Boolean);

    return (
      <div className="flex items-center justify-center p-4">
        <div className="glass-panel p-8 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl mystic-text mb-2">천기를 읽을 수 없습니다</h2>
          <div className="text-gray-400 mb-4 space-y-1">
            {errorMessages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-cosmic-gold text-mystic-900 rounded-full font-medium"
          >
            다시 점괘 보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {weather?.cityName && (
        <p className="text-gray-400 text-center mb-6">
          {weather.cityName}의 하늘 아래
        </p>
      )}

      <div className="mb-8">
        <OmenCard
          omen={omen}
          weather={weather}
          moon={moon}
          earthquake={earthquake}
        />
      </div>

      <div className="text-center mb-4">
        <button
          onClick={toggleShowData}
          className="text-cosmic-gold/70 hover:text-cosmic-gold transition-colors text-sm"
        >
          {showData ? '천기 숨기기 ▲' : '천기의 원천 보기 ▼'}
        </button>
      </div>

      {showData && (
        <div className="animate-fade-in">
          <Suspense fallback={<div className="glass-panel p-6 text-center text-gray-400">기운을 모으는 중...</div>}>
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
