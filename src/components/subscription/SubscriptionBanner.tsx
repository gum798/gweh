import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface SubscriptionBannerProps {
  onLoginRequired: () => void;
}

export default function SubscriptionBanner({ onLoginRequired }: SubscriptionBannerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isSubscribed, subscribe, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(() => {
    const ts = localStorage.getItem('sub_banner_dismissed');
    if (!ts) return false;
    return Date.now() - parseInt(ts) < 24 * 60 * 60 * 1000;
  });
  const [expanded, setExpanded] = useState(false);

  // 첫 방문자는 배너 숨김 (맛보기 체험 허용)
  const [isFirstVisit] = useState(() => {
    const visited = localStorage.getItem('mystic_has_visited');
    if (!visited) {
      localStorage.setItem('mystic_has_visited', 'true');
      return true;
    }
    return false;
  });

  // Scarcity: countdown timer (resets daily)
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  // 첫 방문, 구독중, 배너 닫음, 로딩 중이면 숨김
  if (isSubscribed || dismissed || loading || isFirstVisit) return null;

  const handleClick = () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    subscribe();
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('sub_banner_dismissed', Date.now().toString());
  };

  return (
    /* 예전에는 화면 우하단에 떠 있었다(고정 위치 + 최상위 z). 375×667 영어에서
       본문 CTA 의 17~44% 를 가렸다. 떠 있으면서 겹치지 않는 상태는 없으므로
       둘 중 하나를 골라야 했고, 콘텐츠 흐름 안으로 들어오는 쪽을 골랐다 —
       하단 고정 바로 만들면 여덟 개 탭이 저마다 그만큼의 아래 여백을 잡아야
       하고, 한 곳만 빠뜨리면 같은 겹침이 조용히 되돌아온다. 흐름 안에서는
       겹침이 구조적으로 불가능하다. */
    <div className="mb-6 flex flex-col items-end gap-3">
      {/* Trigger badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={t('a11y.freeTrialInfo')}
        className="group relative flex items-center gap-2 px-4 py-2.5 rounded-gal-xl border border-gal-border bg-gal-light shadow-gal-nav hover:shadow-gal-hover transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink focus-visible:ring-offset-2"
      >
        <span className="text-status-success text-xs font-bold whitespace-nowrap">{t('sub.freeTrial')}</span>
        {expanded ? (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-gal-muted flex-shrink-0" aria-hidden="true">
            <path d="M3 11L8 6L13 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-gal-muted flex-shrink-0" aria-hidden="true">
            <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Expanded panel — 흐름 안으로 들어오면서 트리거 아래로 내려왔다.
          떠 있을 때는 패널이 배지 위로 열려야 화면 밖으로 안 나갔지만, 지금은
          여는 버튼 다음에 오는 것이 DOM 순서와 시각 순서 양쪽에서 맞다. */}
      {expanded && (
        <div className="animate-fade-in-up w-72 relative overflow-hidden rounded-gal-xl border border-gal-border bg-gal-light shadow-gal-card">
          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            aria-label={t('a11y.closeToast')}
            className="absolute top-3 right-3 text-gal-muted hover:text-gal-body z-10 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink rounded-gal-sm"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gal-accent-ink text-[10px] font-bold uppercase tracking-widest">
                {t('sub.badge')}
              </span>
            </div>

            <h3 className="text-gal-black text-base font-bold leading-snug mb-2">
              {t('sub.headline')}
            </h3>

            {/* Free trial badge */}
            <div className="flex items-center gap-2 mb-3 bg-status-success-light border border-status-success/40 rounded-gal-md px-3 py-1.5">
              <span className="text-status-success text-xs font-bold">{t('sub.freeTrial')}</span>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-gal-muted text-xs line-through">$9.99</span>
              <span className="text-gal-black text-xl font-bold">$0</span>
              <span className="text-gal-muted text-xs">{t('sub.freeTrialPeriod')}</span>
            </div>

            {/* Features */}
            <div className="space-y-1.5 mb-4">
              {['sub.feature1', 'sub.feature2', 'sub.feature3'].map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-gal-accent-ink text-[10px]">&#10003;</span>
                  <span className="text-gal-body text-xs">{t(key)}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleClick}
              className="w-full py-3 bg-gal-accent hover:bg-gal-accent-dark rounded-gal-md text-white font-bold text-xs tracking-wide transition-all shadow-gal-button hover:shadow-gal-hover hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent-ink focus-visible:ring-offset-2"
            >
              {t('sub.ctaTrial')}
            </button>

            {/* Scarcity */}
            <p className="text-center text-gal-muted text-[10px] mt-2">
              {t('sub.urgency', { time: timeLeft })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
