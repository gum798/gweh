import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { TABS } from '../lib/tabs';

// rerender-memo: Memoize component to prevent re-renders when callback prop is stable
interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default memo(function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { t } = useTranslation();

  return (
    <nav className="sticky top-14 z-40 bg-gal-bg border-b border-gal-border mb-6 shadow-gal-nav">
      {/*
        스크롤 컨테이너는 항상 flex-start 다. 가운데 정렬은 안쪽 래퍼의 mx-auto 가
        맡는다 — flexbox 명세상 남는 공간이 음수면 auto 마진은 0 으로 떨어지므로
        (CSS Flexbox §8.1) 넘칠 때 자동으로 flex-start 가 된다. 즉 어떤 폭에서도
        첫 탭이 음수 스크롤 영역으로 밀리지 않는다.

        justify-center 를 lg: 로 가두는 방식은 브레이크포인트 추측이라 폰트 크기·
        라벨 길이·이모지 메트릭이 바뀌면 1024~1100px 대역에서 같은 버그가 재발한다.
        justify-[safe_center] 는 Tailwind 3.4.17 이 아무 CSS 도 출력하지 않아
        (arbitrary value 미지원) 쓸 수 없음을 빌드로 확인했다.
      */}
      <div className="flex overflow-x-auto scrollbar-hide snap-x px-2 py-1.5 sm:py-2">
        <div className="flex flex-shrink-0 mx-auto gap-0.5 sm:gap-1" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`
                  nav-tab-glow relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 min-h-[44px] rounded-gal-md flex-shrink-0 snap-start
                  transition-all duration-200 font-medium
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink focus-visible:ring-offset-1
                  ${isActive
                    ? 'bg-gal-accent-light text-gal-accent-ink border-b-2 border-gal-accent-ink'
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
      </div>
    </nav>
  );
});
