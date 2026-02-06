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
    <>
      {/* Floating mystical badge — bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Expanded popup panel */}
        {expanded && (
          <div className="animate-fade-in-up w-72 relative overflow-hidden rounded-2xl border border-[var(--accent-40)] bg-[var(--bg-panel-solid)] shadow-[0_8px_40px_rgba(0,0,0,0.4),0_0_20px_var(--accent-20)]">
            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              aria-label="Close"
              className="absolute top-3 right-3 text-white/20 hover:text-white/50 z-10 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Glow effects */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-[var(--accent-20)] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[var(--accent-10)] rounded-full blur-2xl pointer-events-none" />

            <div className="relative p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">✨</span>
                <span className="text-[var(--accent)] text-[10px] font-bold uppercase tracking-widest">
                  {t('sub.badge')}
                </span>
              </div>

              <h3 className="text-white text-base font-bold leading-snug mb-2">
                {t('sub.headline')}
              </h3>

              {/* Free trial badge */}
              <div className="flex items-center gap-2 mb-3 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                <span className="text-green-400 text-xs font-bold">🎁</span>
                <span className="text-green-400 text-xs font-bold">{t('sub.freeTrial')}</span>
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-white/40 text-xs line-through">$9.99</span>
                <span className="text-white text-xl font-bold">$0</span>
                <span className="text-white/40 text-xs">{t('sub.freeTrialPeriod')}</span>
              </div>

              {/* Features */}
              <div className="space-y-1.5 mb-4">
                {['sub.feature1', 'sub.feature2', 'sub.feature3'].map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[var(--accent)] text-[10px]">✓</span>
                    <span className="text-white/60 text-xs">{t(key)}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={handleClick}
                className="mystic-ripple w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-xl text-white font-bold text-xs tracking-wide transition-all shadow-[0_0_15px_var(--accent-40)] hover:shadow-[0_0_25px_var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-panel-solid)]"
              >
                {t('sub.ctaTrial')}
              </button>

              {/* Scarcity */}
              <p className="text-center text-white/30 text-[10px] mt-2">
                {t('sub.urgency', { time: timeLeft })}
              </p>
            </div>
          </div>
        )}

        {/* Floating badge button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mystic-ripple group relative flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--accent-40)] bg-[var(--bg-panel-solid)] shadow-[0_4px_20px_rgba(0,0,0,0.3),0_0_15px_var(--accent-20)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.4),0_0_20px_var(--accent-30)] transition-all hover:scale-105 active:scale-95"
          aria-label="Free trial info"
        >
          {/* Pulsing glow ring */}
          <span className="absolute inset-0 rounded-full animate-glow-ring pointer-events-none" />
          <span className="text-sm animate-pulse-slow">✨</span>
          <span className="text-green-400 text-xs font-bold whitespace-nowrap">{t('sub.freeTrial')}</span>
          {expanded ? (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-white/40 flex-shrink-0">
              <path d="M3 11L8 6L13 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-white/40 flex-shrink-0">
              <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
