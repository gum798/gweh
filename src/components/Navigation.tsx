import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const tabs = [
  { id: 'omen', labelKey: 'nav.omen', icon: '☯️' },
  { id: 'fortune', labelKey: 'nav.fortune', icon: '🔮' },
  { id: 'fashion', labelKey: 'nav.fashion', icon: '👔' },
  { id: 'face', labelKey: 'nav.face', icon: '👁️' },
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
    <nav className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-2 mb-6">
      <div className="flex justify-center overflow-x-auto gap-1 scrollbar-hide scroll-snap-x" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-2.5 rounded-xl flex-shrink-0 snap-start
              transition-all duration-300 font-medium
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b13ec] focus-visible:ring-offset-1 focus-visible:ring-offset-[#161022]
              ${activeTab === tab.id
                ? 'bg-[#5b13ec]/20 text-white border border-[#5b13ec]/40 shadow-[0_0_10px_rgba(91,19,236,0.2)]'
                : 'text-white/50 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <span className="text-lg" aria-hidden="true">{tab.icon}</span>
            <span className="hidden sm:inline text-sm">{t(tab.labelKey)}</span>
            <span className="sr-only sm:hidden">{t(tab.labelKey)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
});
