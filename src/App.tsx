import { useState, useCallback, useEffect, lazy, Suspense, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import HeroSection from './components/HeroSection';
import AppHeader from './components/layout/AppHeader';
import AuthModal from './components/auth/AuthModal';
import ProfileModal from './components/auth/ProfileModal';
import { useSubscription } from './contexts/SubscriptionContext';
import SubscriptionBanner from './components/subscription/SubscriptionBanner';
import { SkeletonOmenTab } from './components/ui/Skeleton';
import { resolveTabOnLoad, resolveTabOnHashChange, isTabId, type TabId } from './lib/tabs';
import { BRAND } from './lib/brand';

// Tab components (lazy-loaded)
const OmenTab = lazy(() => import('./components/tabs/OmenTab'));
const FaceTab = lazy(() => import('./components/tabs/FaceTab'));
const PalmTab = lazy(() => import('./components/tabs/PalmTab'));
const SajuTab = lazy(() => import('./components/tabs/SajuTab'));
const FortuneTab = lazy(() => import('./components/tabs/FortuneTab'));
const FashionTab = lazy(() => import('./components/tabs/FashionTab'));
const SummaryTab = lazy(() => import('./components/tabs/SummaryTab'));
const FaceHarmonyTab = lazy(() => import('./components/tabs/FaceHarmonyTab'));

interface TabRenderContext {
  onLoginRequired: () => void;
}

type TabRenderer = (ctx: TabRenderContext) => ReactNode;

/**
 * 탭 id → 콘텐츠. **`Record<TabId, ...>` 인 것이 요점이다.**
 *
 * 예전에는 switch 문에 8개 case 를 손으로 적고 `default: return null` 이었다.
 * 그래서 lib/tabs.ts 에 id 를 추가하거나 이름을 바꾸면 네비에는 버튼이 뜨고
 * 해시 검증도 통과하는데 콘텐츠 영역만 조용히 비었다 — lib/tabs.ts 맨 위
 * 주석이 "드리프트 없음" 을 주장하는데 코드는 강제하지 않는 상태였다.
 * 이제 항목이 빠지면 컴파일이 실패한다.
 *
 * onLoginRequired 는 실제로 그 prop 을 받는 두 탭(omen, summary)에만 내려간다.
 * 표를 균일하게 만들려고 나머지 6개까지 흘리지 않는다.
 */
const TAB_RENDERERS: Record<TabId, TabRenderer> = {
  // 홈은 콘텐츠 영역이 아니라 히어로가 그린다. 표에서 빼면 컴파일이 실패하므로
  // (그게 이 표의 요점이다) 항목은 두되 아무것도 반환하지 않는다.
  home: () => null,
  omen: ({ onLoginRequired }) => <OmenTab onLoginRequired={onLoginRequired} />,
  fortune: () => <FortuneTab />,
  fashion: () => <FashionTab />,
  face: () => <FaceTab />,
  harmony: () => <FaceHarmonyTab />,
  palm: () => <PalmTab />,
  saju: () => <SajuTab />,
  summary: ({ onLoginRequired }) => <SummaryTab onLoginRequired={onLoginRequired} />,
};

/**
 * 화면 전환 뒤의 스크롤 착지점.
 *
 * 홈과 서비스는 문서 안에서 서로 다른 곳에 있으므로 착지점도 다르다. 홈은
 * 히어로가 문서 최상단이라 맨 위로 보내야 하고, 서비스는 히어로가 언마운트된
 * 자리에 콘텐츠 컨테이너가 오므로 그 컨테이너 시작점으로 보낸다. 홈에서
 * 콘텐츠 컨테이너로 스크롤하면 (홈의 콘텐츠가 비어 있으므로) 푸터로 내려간다 —
 * 뒤로 가기가 아래로 움직이는 그림이 된다.
 *
 * rAF 를 한 번 거치는 이유: 호출 시점에는 setActiveTab 이 아직 커밋되지 않아
 * 히어로가 살아 있고, 그 상태로 측정하면 콘텐츠 컨테이너의 y 좌표가 히어로
 * 높이만큼 어긋난다.
 */
function scrollToScreen(tab: string) {
  requestAnimationFrame(() => {
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById('app-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function App() {
  const { t: tc } = useTranslation();
  const { isSubscribed } = useSubscription();
  // 상태는 string 이다 — HeroSection 의 onTabChange 가 string 을 넘긴다.
  // TabId 로 좁히는 일은 renderTab 에서 isTabId 로 한 번만 한다.
  const [activeTab, setActiveTab] = useState<string>(() => resolveTabOnLoad(window.location.hash));
  // 홈이냐 서비스냐가 이 셸의 유일한 분기다 — 히어로를 그릴지, 콘텐츠 컨테이너에
  // 위 패딩을 줄지, 헤더에 뒤로 가기를 띄울지가 모두 여기서 갈린다.
  const isHome = activeTab === 'home';
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Show toast after checkout completion (no tab switch)
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

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
    scrollToScreen(tab);
  }, []);

  // 뒤로/앞으로 가기 대응. 이 리스너가 없어 브라우저 히스토리가 죽어 있었다.
  //
  // hashchange 규칙은 최초 로드 규칙과 **의도적으로 다르다.** 빈 해시는 루트로
  // 뒤로가기 한 것이므로 기본 탭으로 리셋하고, 비어 있지 않은 비탭 해시는
  // 인페이지 앵커(스킵 링크 #app-content 등)이므로 탭을 건드리지 않는다.
  // 셋을 하나로 합치면 셋 중 하나가 반드시 깨진다 — 근거는 lib/tabs.ts 의 표 참조.
  useEffect(() => {
    const onHashChange = () => {
      const next = resolveTabOnHashChange(window.location.hash);
      // null 은 인페이지 앵커다 — 탭도 스크롤도 건드리지 않는다. 여기서
      // 스크롤을 건드리면 스킵 링크가 목적지에 닿는 순간 되밀린다.
      if (next === null) return;
      setActiveTab(next);
      // 브라우저 뒤로가기로 홈에 돌아왔을 때 화면이 푸터에 머물러 있으면
      // "상태는 홈인데 눈에는 서비스 화면의 바닥" 이 된다. 착지점을 맞춘다.
      scrollToScreen(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

  const renderTab = () => {
    const skeletonFallback = <SkeletonOmenTab />;
    const defaultFallback = (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="h-16 w-16 rounded-gal-xl border border-gal-border flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-gal-accent-ink border-t-transparent animate-spin" />
        </div>
        <p className="text-gal-muted text-sm mt-6">Loading...</p>
      </div>
    );

    // 좁히기는 여기 한 곳뿐이다. 알 수 없는 id 면 이전 `default: return null` 과 동일.
    if (!isTabId(activeTab)) return null;

    // omen 만 전용 스켈레톤, 나머지는 공용 스피너 — 기존 동작 그대로.
    // activeTab 이 TabId 로 좁혀져 있어, 'omen' 을 지우거나 이름을 바꾸면
    // 이 비교 자체가 TS2367 로 실패한다.
    const fallback = activeTab === 'omen' ? skeletonFallback : defaultFallback;

    return <Suspense fallback={fallback}>{TAB_RENDERERS[activeTab]({ onLoginRequired: openAuthModal })}</Suspense>;
  };

  return (
    <div className="min-h-dvh bg-gal-bg">
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gal-accent focus:text-white focus:rounded-gal-md"
      >
        {tc('a11y.skipToContent')}
      </a>
      <AppHeader
        isHome={isHome}
        onBack={() => handleTabChange('home')}
        onLogin={() => setAuthModalOpen(true)}
        onProfile={() => setProfileModalOpen(true)}
      />

      {/* Subscription banner (floating badge) */}
      <SubscriptionBanner onLoginRequired={openAuthModal} />

      {/* Toast — 라이브 리전은 **항상 렌더**한다. 예전처럼 `{toast && <div …>}` 로
          컨테이너째 껐다 켜면 스크린리더가 리전이 DOM 에 삽입되는 순간과 내용이
          채워지는 순간을 구분하지 못해 첫 알림을 통째로 놓친다. 리전은 미리 있고
          안쪽 내용만 바뀌어야 한다. 비어 있을 때는 크기가 0 이라 클릭도 막지 않는다.
          (animate-fade-in 은 실제로 나타나는 안쪽으로 옮겼다.) */}
      <div role="status" aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
        {toast && (
          <div className="bg-gal-accent text-white px-6 py-3 rounded-gal-xl shadow-gal-card text-sm font-medium flex items-center gap-2 animate-fade-in">
            {toast}
            <button onClick={() => setToast(null)} aria-label={tc('a11y.closeToast')} className="ml-2 text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-gal-sm">&times;</button>
          </div>
        )}
      </div>

      {/* 홈 화면 = 히어로. 서비스 화면에서는 렌더하지 않는다 — 히어로를 위에
          남겨 두면 헤더의 뒤로 가기가 "화면 전환" 이 아니라 "스크롤 위치"가
          되고, 서비스 콘텐츠를 보려면 매번 한 화면 높이를 지나야 한다.
          설계 문서의 리스크 표가 "홈이 한 번의 뒤로가기 거리에 있다" 고 말하는
          것이 이 구조다: 홈은 위에 겹쳐 있는 층이 아니라 돌아가는 곳이다. */}
      {isHome && <HeroSection onTabChange={handleTabChange} />}

      {/* Content */}
      {/* 스크롤 마진은 스티키 헤더(56px) 하나만 보정하면 된다. 예전 값은 그
          위에 스티키 탭바가 하나 더 있던 시절의 합계였고, 탭바가 사라진 지금
          그대로 두면 화면 전환 때 콘텐츠 위에 탭바 높이만큼의 빈 띠가 남는다.
          scrollIntoView 는 sticky 요소를 보정하지 않으므로 값 자체는 필요하다.
          렌더 레이아웃에는 영향이 없다(스크롤 앵커 전용).

          위 패딩은 홈에서 뺀다. 홈의 콘텐츠는 비어 있어서(home 렌더러가 null)
          그 패딩이 히어로와 푸터 사이의 정체불명 여백으로만 남는다. 요소
          자체는 홈에서도 유지한다 — 스킵 링크의 목적지가 사라지면 안 된다. */}
      <div id="app-content" className={`relative container mx-auto px-4 max-w-4xl scroll-mt-14 ${isHome ? '' : 'pt-8'}`}>
        {/* Auth Modal */}
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

        {/* Tab content */}
        <main>
          <div key={activeTab} className="animate-tab-enter">
            {renderTab()}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 pb-10">
          {/* Simple divider */}
          <div className="section-divider mx-auto mb-8" aria-hidden="true" />

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
                // href="#" 은 빈 프래그먼트라 hashchange 를 발화시킨다. 위 리스너의
                // "빈 해시 = 루트로 뒤로가기 = 기본 탭" 규칙에 걸려 탭이 omen 으로
                // 리셋되고 문서 최상단으로 점프한다 — 이 브랜치가 만든 회귀다.
                // (이전 리스너는 빈 해시를 그냥 무시했다.) 세 링크 모두 아직
                // 아무 데도 가지 않으므로 기본 동작만 막는다. 실제 SNS URL 이
                // 들어가면 이 핸들러를 지우면 된다.
                onClick={(e) => e.preventDefault()}
                aria-label={social.label}
                className="w-9 h-9 rounded-gal-xl border border-gal-border hover:border-gal-accent-ink flex items-center justify-center text-gal-muted hover:text-gal-accent-ink transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>

          <p className="text-[10px] text-gal-muted uppercase tracking-[0.3em] text-center">
            &copy; 2026 {BRAND}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
