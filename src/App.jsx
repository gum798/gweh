import { useState, useEffect, lazy, Suspense } from 'react';
import { useParallelData } from './hooks/useParallelData';
import Navigation from './components/Navigation';

// 탭 컴포넌트 동적 로딩
const OmenTab = lazy(() => import('./components/tabs/OmenTab'));
const FaceTab = lazy(() => import('./components/tabs/FaceTab'));
const PalmTab = lazy(() => import('./components/tabs/PalmTab'));
const SajuTab = lazy(() => import('./components/tabs/SajuTab'));

function App() {
  const [activeTab, setActiveTab] = useState('omen');
  const [bgImageLoaded, setBgImageLoaded] = useState(false);

  // NASA 배경용 데이터
  const { nasa } = useParallelData();

  // NASA 배경 이미지 프리로딩
  useEffect(() => {
    if (nasa?.mediaType === 'image' && nasa?.url) {
      const img = new Image();
      img.onload = () => setBgImageLoaded(true);
      img.src = nasa.url;
    }
  }, [nasa?.mediaType, nasa?.url]);

  const renderTab = () => {
    const fallback = (
      <div className="glass-panel p-6 text-center text-gray-400">
        기운을 모으는 중...
      </div>
    );

    switch (activeTab) {
      case 'omen':
        return (
          <Suspense fallback={fallback}>
            <OmenTab />
          </Suspense>
        );
      case 'face':
        return (
          <Suspense fallback={fallback}>
            <FaceTab />
          </Suspense>
        );
      case 'palm':
        return (
          <Suspense fallback={fallback}>
            <PalmTab />
          </Suspense>
        );
      case 'saju':
        return (
          <Suspense fallback={fallback}>
            <SajuTab />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* NASA 배경 이미지 */}
      {nasa?.mediaType === 'image' && (
        <div
          className={`fixed inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            bgImageLoaded ? 'opacity-20' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${nasa.url})` }}
        />
      )}

      {/* 오버레이 그라데이션 */}
      <div className="fixed inset-0 bg-gradient-to-b from-mystic-900/80 via-mystic-900/90 to-mystic-900" />

      {/* 콘텐츠 */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-mystic mystic-text text-shadow-glow mb-2">
            오늘의 괘
          </h1>
          <p className="text-gray-500 text-sm">
            천기와 운명의 신비로운 해석
          </p>
        </header>

        {/* 네비게이션 */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 탭 콘텐츠 */}
        <main>
          {renderTab()}
        </main>

        {/* NASA APOD 크레딧 */}
        {nasa && (
          <footer className="mt-8 text-center text-gray-500 text-xs">
            <p>배경: {nasa.title}</p>
            <p className="mt-1">NASA Astronomy Picture of the Day</p>
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
