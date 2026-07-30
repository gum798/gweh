import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { BRAND } from '../../lib/brand';
import { Button } from '../ui/Button';

interface AppHeaderProps {
  /** 홈 화면인가. 서비스 화면에서만 뒤로 가기가 나온다. */
  isHome: boolean;
  onBack: () => void;
  onLogin: () => void;
  onProfile: () => void;
}

export default memo(function AppHeader({ isHome, onBack, onLogin, onProfile }: AppHeaderProps) {
  const { t: tc, i18n } = useTranslation();
  const { t: tAuth } = useTranslation('auth');
  const { user } = useAuth();

  const toggleLang = () => {
    const next = i18n.language === 'ko' ? 'en' : 'ko';
    i18n.changeLanguage(next);
    localStorage.setItem('mystic_language', next);
    document.documentElement.lang = next;
  };

  return (
    <header className="sticky top-0 z-50 bg-gal-bg/95 backdrop-blur border-b border-gal-border">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* 왼쪽 자리는 두 가지다. 홈에서는 브랜드만, 서비스 화면에서는 뒤로
            가기 + 브랜드. 탭바가 사라진 뒤 서비스 화면에서 화면을 벗어나는
            수단은 이 버튼과 브라우저 뒤로가기 둘뿐이므로 조건부로 숨기지
            않는다 — 홈에서만 없다.

            버튼이지 링크가 아닌 이유: 히스토리 항목을 새로 쌓는 것이 아니라
            해시를 홈으로 바꾸는 동작이고(App.tsx 의 handleTabChange), button
            이면 Enter 와 Space 양쪽이 기본 동작으로 붙는다. */}
        <div className="flex items-center gap-1">
          {!isHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              aria-label={tc('a11y.backToHome')}
              className="min-w-[44px] px-0 rounded-gal-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Button>
          )}
          <a
            href="#home"
            className="text-base font-bold tracking-tight text-gal-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink rounded-gal-sm"
          >
            {BRAND}
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            aria-label={i18n.language === 'ko' ? 'Switch to English' : '한국어로 전환'}
            className="min-w-[44px] min-h-[44px] px-3 text-xs font-medium text-gal-body hover:text-gal-black border border-gal-border hover:border-gal-accent-ink rounded-gal-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink"
          >
            {i18n.language === 'ko' ? 'EN' : 'KO'}
          </button>

          {user ? (
            <button
              onClick={onProfile}
              className="min-h-[44px] px-4 text-xs text-gal-body hover:text-gal-black border border-gal-border hover:border-gal-accent-ink rounded-gal-md transition-colors truncate max-w-[180px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink"
            >
              {user.email}
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="min-h-[44px] px-4 text-xs font-medium text-white bg-gal-accent hover:bg-gal-accent-dark rounded-gal-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink focus-visible:ring-offset-2"
            >
              {tAuth('login')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
});
