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
    <nav className="sticky top-0 z-40 bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-white/10 p-1.5 sm:p-2 mb-6 shadow-[0_4px_30px_rgba(0,0,0,0.25)]">
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
                nav-tab-glow mystic-ripple relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl flex-shrink-0 snap-start
                transition-all duration-300 font-medium
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-primary)]
                ${isActive
                  ? 'bg-[var(--accent-20)] text-white border border-[var(--accent-40)] shadow-[0_0_15px_var(--accent-20),_inset_0_1px_0_var(--accent-10)]'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <span className={`text-base sm:text-lg transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} aria-hidden="true">{tab.icon}</span>
              <span className="hidden sm:inline text-sm">{t(tab.labelKey)}</span>
              <span className="sr-only sm:hidden">{t(tab.labelKey)}</span>
              {/* Accent-aware underline */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 h-[2.5px] rounded-full animate-nav-underline"
                  style={{
                    background: `linear-gradient(90deg, transparent, var(--accent), var(--accent-hover), var(--accent), transparent)`,
                    boxShadow: `0 0 10px var(--accent-glow), 0 0 20px var(--accent-30)`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});
