import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useWeather } from './hooks/useWeather';
import { useParallelData } from './hooks/useParallelData';
import { useMoonPhase } from './hooks/useMoonPhase';
import { generateOmen } from './utils/omenGenerator';
import LoadingScreen from './components/LoadingScreen';
import LocationPrompt from './components/LocationPrompt';
import OmenCard from './components/OmenCard';

// bundle-dynamic-imports: DataPanel 동적 로딩
const DataPanel = lazy(() => import('./components/DataPanel'));

function App() {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showData, setShowData] = useState(false);
  const [bgImageLoaded, setBgImageLoaded] = useState(false);

  // API 훅들
  const { data: weather, loading: weatherLoading, error: weatherError } = useWeather(
    location?.lat,
    location?.lon
  );
  // async-parallel: NASA와 지진 데이터를 병렬로 가져옴
  const { nasa, earthquake, loading: parallelLoading, errors: parallelErrors } = useParallelData();
  const { data: moon } = useMoonPhase();

  // 위치 요청 핸들러 (useCallback 유지)
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
        maximumAge: 300000, // 5분 캐시
      }
    );
  }, []);

  // rerender-memo: 로딩 상태를 useMemo로 최적화
  const isLoading = useMemo(
    () => location && (weatherLoading || parallelLoading),
    [location, weatherLoading, parallelLoading]
  );

  // 괘 생성 (useMemo 유지)
  const omen = useMemo(() => {
    if (!weather || !moon || !earthquake) return null;
    return generateOmen(weather, moon, earthquake);
  }, [weather, moon, earthquake]);

  // NASA 배경 이미지 프리로딩
  useEffect(() => {
    if (nasa?.mediaType === 'image' && nasa?.url) {
      const img = new Image();
      img.onload = () => setBgImageLoaded(true);
      img.src = nasa.url;
    }
  }, [nasa?.mediaType, nasa?.url]);

  // 데이터 토글 핸들러 (useCallback으로 안정화)
  const toggleShowData = useCallback(() => {
    setShowData(prev => !prev);
  }, []);

  // 위치 미설정 시 프롬프트 표시
  if (!location) {
    return <LocationPrompt onRequestLocation={requestLocation} error={locationError} />;
  }

  // 로딩 중
  if (isLoading) {
    return <LoadingScreen message="천지의 기운을 살피는 중..." />;
  }

  // 에러 처리 - 모든 API 에러 통합 처리
  const hasError = weatherError || parallelErrors.nasa || parallelErrors.earthquake;
  if (hasError) {
    const errorMessages = [
      weatherError,
      parallelErrors.nasa,
      parallelErrors.earthquake,
    ].filter(Boolean);

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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

  // 메인 화면
  return (
    <div className="min-h-screen relative">
      {/* NASA 배경 이미지 - rendering-conditional-render: 삼항 연산자 사용 */}
      {nasa?.mediaType === 'image' ? (
        <div
          className={`fixed inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            bgImageLoaded ? 'opacity-20' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${nasa.url})` }}
        />
      ) : null}

      {/* 오버레이 그라데이션 */}
      <div className="fixed inset-0 bg-gradient-to-b from-mystic-900/80 via-mystic-900/90 to-mystic-900" />

      {/* 콘텐츠 */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-mystic mystic-text text-shadow-glow mb-2">
            오늘의 괘
          </h1>
          <p className="text-gray-400">
            {weather?.cityName ? `${weather.cityName}의 하늘 아래` : ''}
          </p>
        </header>

        {/* 메인 괘 카드 */}
        <div className="mb-8">
          <OmenCard
            omen={omen}
            weather={weather}
            moon={moon}
            earthquake={earthquake}
          />
        </div>

        {/* 데이터 패널 토글 */}
        <div className="text-center mb-4">
          <button
            onClick={toggleShowData}
            className="text-cosmic-gold/70 hover:text-cosmic-gold transition-colors text-sm"
          >
            {showData ? '천기 숨기기 ▲' : '천기의 원천 보기 ▼'}
          </button>
        </div>

        {/* 데이터 패널 - bundle-dynamic-imports + Suspense */}
        {showData ? (
          <div className="animate-fade-in">
            <Suspense fallback={<div className="glass-panel p-6 text-center text-gray-400">기운을 모으는 중...</div>}>
              <DataPanel
                weather={weather}
                moon={moon}
                earthquake={earthquake}
                nasa={nasa}
              />
            </Suspense>
          </div>
        ) : null}

        {/* NASA APOD 크레딧 - rendering-conditional-render: 삼항 연산자 사용 */}
        {nasa ? (
          <footer className="mt-8 text-center text-gray-500 text-xs">
            <p>배경: {nasa.title}</p>
            <p className="mt-1">NASA Astronomy Picture of the Day</p>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export default App;
