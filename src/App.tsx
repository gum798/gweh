import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from './components/Navigation';
import AuthModal from './components/auth/AuthModal';
import ProfileModal from './components/auth/ProfileModal';
import { useAuth } from './contexts/AuthContext';
import { useSubscription } from './contexts/SubscriptionContext';

// 탭 컴포넌트 동적 로딩
const OmenTab = lazy(() => import('./components/tabs/OmenTab'));
const FaceTab = lazy(() => import('./components/tabs/FaceTab'));
const PalmTab = lazy(() => import('./components/tabs/PalmTab'));
const SajuTab = lazy(() => import('./components/tabs/SajuTab'));
const FashionTab = lazy(() => import('./components/tabs/FashionTab'));

function App() {
  const { t, i18n } = useTranslation('auth');
  const { t: tc } = useTranslation();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const [activeTab, setActiveTab] = useState('omen');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 결제 완료 후 토스트 표시 (탭 이동 없음)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout_success') === 'true') {
      setToast(tc('toast.checkoutSuccess'));
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('subscription_success') === 'true') {
      setToast(tc('toast.subscriptionSuccess'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 토스트 자동 닫기
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

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
            <OmenTab onLoginRequired={openAuthModal} />
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
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
          <div className="bg-[#5b13ec] text-white px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(91,19,236,0.5)] text-sm font-medium flex items-center gap-2">
            <span>✨</span>
            {toast}
            <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white">&times;</button>
          </div>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl">
        {/* 헤더 */}
        <header className="relative text-center mb-6">
          <div className="absolute left-0 top-1">
            <button
              onClick={() => {
                const newLang = i18n.language === 'ko' ? 'en' : 'ko';
                i18n.changeLanguage(newLang);
                localStorage.setItem('mystic_language', newLang);
                document.documentElement.lang = newLang;
              }}
              className="text-xs text-white/60 hover:text-white border border-white/10 hover:border-[#5b13ec]/50 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              {i18n.language === 'ko' ? 'EN' : 'KO'}
            </button>
          </div>
          <div className="absolute right-0 top-1">
            {user ? (
              <button
                onClick={() => setProfileModalOpen(true)}
                className="text-xs text-white/50 hover:text-white/80 border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors truncate max-w-[150px]"
              >
                {user.email}
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-xs text-[#5b13ec] hover:text-[#7b3ff5] border border-[#5b13ec]/30 hover:border-[#5b13ec]/60 px-3 py-1.5 rounded-lg transition-colors"
              >
                {t('login')}
              </button>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tighter mb-1">
            MYSTIC <span className="text-[#5b13ec]">AI</span>
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.3em]">
            Unveil Your Destiny
          </p>
        </header>

        {/* Auth Modal */}
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

        {/* 네비게이션 */}
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

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
