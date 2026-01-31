import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from './components/Navigation';
import AuthModal from './components/auth/AuthModal';
import ProfileModal from './components/auth/ProfileModal';
import { useAuth } from './contexts/AuthContext';
import { useSubscription } from './contexts/SubscriptionContext';
import SubscriptionBanner from './components/subscription/SubscriptionBanner';

// 탭 컴포넌트 동적 로딩
const OmenTab = lazy(() => import('./components/tabs/OmenTab'));
const FaceTab = lazy(() => import('./components/tabs/FaceTab'));
const PalmTab = lazy(() => import('./components/tabs/PalmTab'));
const SajuTab = lazy(() => import('./components/tabs/SajuTab'));
const FortuneTab = lazy(() => import('./components/tabs/FortuneTab'));
const FashionTab = lazy(() => import('./components/tabs/FashionTab'));
const SummaryTab = lazy(() => import('./components/tabs/SummaryTab'));

function App() {
  const { t, i18n } = useTranslation('auth');
  const { t: tc } = useTranslation();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['omen', 'fortune', 'fashion', 'face', 'palm', 'saju', 'summary'];
    return validTabs.includes(hash) ? hash : 'omen';
  });
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
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

  const renderTab = () => {
    const fallback = (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border border-[var(--accent-30)] shadow-[0_0_30px_var(--accent-glow)] animate-ping"></div>
          <div className="h-20 w-20 rounded-full border border-[var(--accent-50)] flex items-center justify-center shadow-[0_0_15px_var(--accent-30)]">
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
      case 'fortune':
        return (
          <Suspense fallback={fallback}>
            <FortuneTab />
          </Suspense>
        );
      case 'fashion':
        return (
          <Suspense fallback={fallback}>
            <FashionTab />
          </Suspense>
        );
      case 'summary':
        return (
          <Suspense fallback={fallback}>
            <SummaryTab onLoginRequired={openAuthModal} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
          <div className="bg-[var(--accent)] text-white px-6 py-3 rounded-xl shadow-[0_0_20px_var(--accent-glow)] text-sm font-medium flex items-center gap-2">
            <span>✨</span>
            {toast}
            <button onClick={() => setToast(null)} aria-label="Close" className="ml-2 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded">&times;</button>
          </div>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl">
        {/* 헤더 */}
        <header className="relative text-center mb-6">
          <div className="absolute left-0 top-4">
            <button
              onClick={() => {
                const newLang = i18n.language === 'ko' ? 'en' : 'ko';
                i18n.changeLanguage(newLang);
                localStorage.setItem('mystic_language', newLang);
                document.documentElement.lang = newLang;
              }}
              aria-label={i18n.language === 'ko' ? 'Switch to English' : '한국어로 전환'}
              className="text-xs text-white/60 hover:text-white border border-white/10 hover:border-[var(--accent-50)] min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all font-medium active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {i18n.language === 'ko' ? 'EN' : 'KO'}
            </button>
          </div>
          <div className="absolute right-0 top-4">
            {user ? (
              <button
                onClick={() => setProfileModalOpen(true)}
                aria-label={tc('profile.birthDate') ? `Profile: ${user.email}` : user.email}
                className="text-xs text-white/50 hover:text-white/80 border border-white/10 hover:border-white/30 min-h-[44px] px-3 flex items-center rounded-lg transition-all truncate max-w-[150px] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                {user.email}
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-xs text-[var(--accent)] hover:text-[var(--accent)] border border-[var(--accent-30)] hover:border-[var(--accent-50)] min-h-[44px] px-3 flex items-center rounded-lg transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                {t('login')}
              </button>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tighter mb-1 px-16">
            MYSTIC <span className="text-[var(--accent)]">AI</span>
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

        {/* 구독 배너 */}
        <SubscriptionBanner onLoginRequired={openAuthModal} />

        {/* 탭 콘텐츠 */}
        <main>
          {renderTab()}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center pb-8">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.4em]">
            © 2026 MYSTIC AI
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
