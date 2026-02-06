// Autonomous verification with PTY at 2026-02-06 15:36
// Claw Test Integration2
// Testing direct execution
import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Navigation from './components/Navigation';
import AuthModal from './components/auth/AuthModal';
import ProfileModal from './components/auth/ProfileModal';
import { useAuth } from './contexts/AuthContext';
import { useSubscription } from './contexts/SubscriptionContext';
import SubscriptionBanner from './components/subscription/SubscriptionBanner';
import { SkeletonOmenTab } from './components/ui/Skeleton';
import { applyTheme, type ColorMode } from './lib/applyTheme';
import type { ThemeKey } from './lib/themes';

// 탭 컴포넌트 동적 로딩
const OmenTab = lazy(() => import('./components/tabs/OmenTab'));
const FaceTab = lazy(() => import('./components/tabs/FaceTab'));
const PalmTab = lazy(() => import('./components/tabs/PalmTab'));
const SajuTab = lazy(() => import('./components/tabs/SajuTab'));
const FortuneTab = lazy(() => import('./components/tabs/FortuneTab'));
const FashionTab = lazy(() => import('./components/tabs/FashionTab'));
const SummaryTab = lazy(() => import('./components/tabs/SummaryTab'));
const FaceHarmonyTab = lazy(() => import('./components/tabs/FaceHarmonyTab'));

function App() {
  const { t, i18n } = useTranslation('auth');
  const { t: tc } = useTranslation();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['omen', 'fortune', 'fashion', 'face', 'harmony', 'palm', 'saju', 'summary'];
    return validTabs.includes(hash) ? hash : 'omen';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>(() =>
    (localStorage.getItem('mystic_color_mode') as ColorMode) || 'light'
  );

  const toggleColorMode = useCallback(() => {
    const next: ColorMode = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(next);
    localStorage.setItem('mystic_color_mode', next);
    const currentTheme = (localStorage.getItem('theme') as ThemeKey) || 'cosmic';
    applyTheme(currentTheme, next);
  }, [colorMode]);

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
    const skeletonFallback = <SkeletonOmenTab />;
    const defaultFallback = (
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
          <Suspense fallback={skeletonFallback}>
            <OmenTab onLoginRequired={openAuthModal} />
          </Suspense>
        );
      case 'face':
        return (
          <Suspense fallback={defaultFallback}>
            <FaceTab />
          </Suspense>
        );
      case 'harmony':
        return (
          <Suspense fallback={defaultFallback}>
            <FaceHarmonyTab />
          </Suspense>
        );
      case 'palm':
        return (
          <Suspense fallback={defaultFallback}>
            <PalmTab />
          </Suspense>
        );
      case 'saju':
        return (
          <Suspense fallback={defaultFallback}>
            <SajuTab />
          </Suspense>
        );
      case 'fortune':
        return (
          <Suspense fallback={defaultFallback}>
            <FortuneTab />
          </Suspense>
        );
      case 'fashion':
        return (
          <Suspense fallback={defaultFallback}>
            <FashionTab />
          </Suspense>
        );
      case 'summary':
        return (
          <Suspense fallback={defaultFallback}>
            <SummaryTab onLoginRequired={openAuthModal} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Cosmic starfield background layer */}
      <div className="cosmic-starfield" aria-hidden="true" />

      {/* 구독 배너 (floating badge) */}
      <SubscriptionBanner onLoginRequired={openAuthModal} />

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
          <div className="absolute left-0 top-4 flex gap-1.5">
            <button
              onClick={() => {
                const newLang = i18n.language === 'ko' ? 'en' : 'ko';
                i18n.changeLanguage(newLang);
                localStorage.setItem('mystic_language', newLang);
                document.documentElement.lang = newLang;
              }}
              aria-label={i18n.language === 'ko' ? 'Switch to English' : '한국어로 전환'}
              className="text-xs text-white/60 hover:text-white border border-white/10 hover:border-[var(--accent-50)] hover:shadow-[0_0_12px_var(--accent-20)] min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all duration-300 font-medium active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {i18n.language === 'ko' ? 'EN' : 'KO'}
            </button>
            <button
              onClick={toggleColorMode}
              aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="text-sm text-white/60 hover:text-white border border-white/10 hover:border-[var(--accent-50)] hover:shadow-[0_0_12px_var(--accent-20)] min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {colorMode === 'dark' ? '☀️' : '🌙'}
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
          <div className="relative inline-block logo-breathe">
            {/* Rotating mandala aura behind logo */}
            <svg
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-48 md:h-48 pointer-events-none animate-mandala-spin"
              viewBox="0 0 200 200"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="mandala-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="90" fill="url(#mandala-glow)" />
              {/* Outer ring petals */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <ellipse
                  key={deg}
                  cx="100"
                  cy="100"
                  rx="6"
                  ry="45"
                  transform={`rotate(${deg} 100 100)`}
                  stroke="var(--accent)"
                  strokeWidth="0.5"
                  strokeOpacity="0.2"
                  fill="none"
                />
              ))}
              {/* Inner ring petals */}
              {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg) => (
                <ellipse
                  key={deg}
                  cx="100"
                  cy="100"
                  rx="4"
                  ry="30"
                  transform={`rotate(${deg} 100 100)`}
                  stroke="var(--accent)"
                  strokeWidth="0.4"
                  strokeOpacity="0.12"
                  fill="none"
                />
              ))}
              {/* Center circle */}
              <circle cx="100" cy="100" r="18" stroke="var(--accent)" strokeWidth="0.6" strokeOpacity="0.2" fill="none" />
              <circle cx="100" cy="100" r="50" stroke="var(--accent)" strokeWidth="0.4" strokeOpacity="0.1" fill="none" strokeDasharray="4 6" />
            </svg>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tighter mb-1 px-16 relative">
              <span className="absolute inset-0 blur-2xl opacity-30 bg-[var(--accent)] rounded-full scale-150 animate-pulse-slow pointer-events-none" />
              <span className="relative drop-shadow-[0_0_20px_var(--accent-glow)]">
                MYSTIC <span className="text-[var(--accent)] drop-shadow-[0_0_12px_var(--accent-glow)]">AI</span>
              </span>
            </h1>
          </div>
          <p className="text-white/40 text-xs uppercase tracking-[0.35em] mt-1.5">
            <span className="inline-block bg-gradient-to-r from-[var(--accent-30)] via-[var(--accent)] to-[var(--accent-30)] bg-[length:200%_100%] animate-shimmer-gold bg-clip-text text-transparent font-medium">
              Unveil Your Destiny
            </span>
          </p>
        </header>

        {/* Auth Modal */}
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

        {/* 네비게이션 */}
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* 탭 콘텐츠 */}
        <main>
          <div key={activeTab} className="animate-tab-enter">
            {renderTab()}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 pb-10 footer-constellation">
          {/* Cosmic divider ornament */}
          <div className="cosmic-divider" aria-hidden="true">
            <div className="cosmic-divider-gem" />
          </div>

          {/* Social links */}
          <div className="flex justify-center gap-3 mb-5">
            {[
              { label: 'Instagram', path: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6' },
              { label: 'Twitter', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
              { label: 'GitHub', path: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2' },
            ].map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={social.label}
                className="w-9 h-9 rounded-full border border-white/10 hover:border-[var(--accent-40)] flex items-center justify-center text-white/25 hover:text-[var(--accent)] transition-all duration-300 hover:shadow-[0_0_12px_var(--accent-20)] hover:scale-110 active:scale-95 group"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="transition-transform duration-300 group-hover:scale-110">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>

          <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] text-center">
            <span className="bg-gradient-to-r from-white/10 via-white/25 to-white/10 bg-clip-text text-transparent">
              © 2026 MYSTIC AI
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
// Manual push test by ClawBot
