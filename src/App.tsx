import { useState, lazy, Suspense } from 'react';
import Navigation from './components/Navigation';
import PremiumBanner from './components/PremiumBanner';

// 탭 컴포넌트 동적 로딩
const OmenTab = lazy(() => import('./components/tabs/OmenTab'));
const FaceTab = lazy(() => import('./components/tabs/FaceTab'));
const PalmTab = lazy(() => import('./components/tabs/PalmTab'));
const SajuTab = lazy(() => import('./components/tabs/SajuTab'));
const FashionTab = lazy(() => import('./components/tabs/FashionTab'));

function App() {
  const [activeTab, setActiveTab] = useState('omen');

  const renderTab = () => {
    const fallback = (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border border-[#5b13ec]/30 shadow-[0_0_30px_rgba(91,19,236,0.5)] animate-ping"></div>
          <div className="h-20 w-20 rounded-full border border-[#5b13ec]/50 flex items-center justify-center shadow-[0_0_15px_rgba(91,19,236,0.3)]">
            <span className="text-3xl animate-pulse">✨</span>
          </div>
        </div>
        <p className="text-white/50 text-sm mt-6">Loading...</p>
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
      case 'fashion':
        return (
          <Suspense fallback={fallback}>
            <FashionTab />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#161022]">
      {/* 콘텐츠 */}
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl">
        {/* 헤더 */}
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tighter mb-1">
            MYSTIC <span className="text-[#5b13ec]">AI</span>
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.3em]">
            Unveil Your Destiny
          </p>
        </header>

        {/* Premium Banner */}
        <PremiumBanner />

        {/* 네비게이션 */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 탭 콘텐츠 */}
        <main>
          {renderTab()}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center pb-8">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.4em]">
            © 2024 MYSTIC AI
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
