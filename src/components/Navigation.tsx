import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const tabs = [
  { id: 'omen', labelKey: 'nav.omen', icon: '☯️' },
  { id: 'fortune', labelKey: 'nav.fortune', icon: '🔮' },
  { id: 'fashion', labelKey: 'nav.fashion', icon: '👔' },
  { id: 'face', labelKey: 'nav.face', icon: '👁️' },
  { id: 'harmony', labelKey: 'nav.harmony', icon: '💖' },
  { id: 'palm', labelKey: 'nav.palm', icon: '🖐️' },
  { id: 'saju', labelKey: 'nav.saju', icon: '🏛️' },
  { id: 'summary', labelKey: 'nav.summary', icon: '📊' },
];

// rerender-memo: Memoize component to prevent re-renders when callback prop is stable
interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default memo(function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gal-border p-1.5 sm:p-2 mb-6 shadow-gal-nav">
      <div className="flex justify-center overflow-x-auto gap-0.5 sm:gap-1 scrollbar-hide snap-x" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`
                nav-tab-glow relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-gal-md flex-shrink-0 snap-start
                transition-all duration-200 font-medium
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent focus-visible:ring-offset-1
                ${isActive
                  ? 'bg-gal-accent-light text-gal-accent border-b-2 border-gal-accent'
                  : 'text-gal-muted hover:text-gal-body hover:bg-gal-light border-b-2 border-transparent'
                }
              `}
            >
              <span className={`text-base sm:text-lg transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} aria-hidden="true">{tab.icon}</span>
              <span className="hidden sm:inline text-sm">{t(tab.labelKey)}</span>
              <span className="sr-only sm:hidden">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});
