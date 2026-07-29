import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { BRAND } from '../../lib/brand';

interface AppHeaderProps {
  onLogin: () => void;
  onProfile: () => void;
}

export default memo(function AppHeader({ onLogin, onProfile }: AppHeaderProps) {
  const { i18n } = useTranslation();
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
        <a
          href="#omen"
          className="text-base font-bold tracking-tight text-gal-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink rounded-gal-sm"
        >
          {BRAND}
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            aria-label={i18n.language === 'ko' ? 'Switch to English' : '한국어로 전환'}
            className="min-w-[44px] min-h-[44px] px-3 text-xs font-medium text-gal-body hover:text-gal-black border border-gal-border hover:border-gal-accent rounded-gal-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink"
          >
            {i18n.language === 'ko' ? 'EN' : 'KO'}
          </button>

          {user ? (
            <button
              onClick={onProfile}
              className="min-h-[44px] px-4 text-xs text-gal-body hover:text-gal-black border border-gal-border hover:border-gal-accent rounded-gal-md transition-colors truncate max-w-[180px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink"
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
