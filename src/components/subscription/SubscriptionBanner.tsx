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
    // 24시간 후 다시 표시
    return Date.now() - parseInt(ts) < 24 * 60 * 60 * 1000;
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

  if (isSubscribed || dismissed || loading) return null;

  const handleClick = () => {
    if (!user) {
      onLoginRequired();
      return;
    }
    subscribe();
  };

  return (
    <section className="px-4 mb-6">
      <div className="max-w-md mx-auto relative overflow-hidden rounded-2xl border border-[#5b13ec]/40 bg-gradient-to-br from-[#1a1030] via-[#221933] to-[#2a1040]">
        {/* Dismiss */}
        <button
          onClick={() => { setDismissed(true); localStorage.setItem('sub_banner_dismissed', Date.now().toString()); }}
          className="absolute top-3 right-3 text-white/20 hover:text-white/50 text-sm z-10"
        >
          &times;
        </button>

        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#5b13ec]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

        <div className="relative p-5">
          {/* Loss aversion: "You're missing out" */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✨</span>
            <span className="text-[#5b13ec] text-xs font-bold uppercase tracking-widest">
              {t('sub.badge')}
            </span>
          </div>

          <h3 className="text-white text-lg font-bold leading-snug mb-2">
            {t('sub.headline')}
          </h3>

          {/* Social proof */}
          <p className="text-white/50 text-sm mb-4 leading-relaxed">
            {t('sub.description')}
          </p>

          {/* Free trial badge */}
          <div className="flex items-center gap-2 mb-3 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <span className="text-green-400 text-xs font-bold">🎁</span>
            <span className="text-green-400 text-sm font-bold">{t('sub.freeTrial')}</span>
          </div>

          {/* Framing: daily price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-white/40 text-sm line-through">$9.99</span>
            <span className="text-white text-2xl font-bold">$0</span>
            <span className="text-white/40 text-sm">{t('sub.freeTrialPeriod')}</span>
            <span className="text-white/30 text-xs mx-1">→</span>
            <span className="text-white/50 text-sm">$9.99/mo</span>
          </div>

          {/* Features */}
          <div className="space-y-2 mb-5">
            {['sub.feature1', 'sub.feature2', 'sub.feature3'].map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[#5b13ec] text-xs">✓</span>
                <span className="text-white/70 text-sm">{t(key)}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleClick}
            className="w-full py-3.5 bg-[#5b13ec] hover:bg-[#4a0fd0] rounded-xl text-white font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(91,19,236,0.4)] hover:shadow-[0_0_30px_rgba(91,19,236,0.6)] hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('sub.ctaTrial')}
          </button>

          {/* Scarcity: time-limited framing */}
          <p className="text-center text-white/30 text-xs mt-3">
            {t('sub.urgency', { time: timeLeft })}
          </p>
        </div>
      </div>
    </section>
  );
}
