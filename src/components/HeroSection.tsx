import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface HeroProps {
  onLogin: () => void;
  onProfile: () => void;
  onTabChange: (tab: string) => void;
}

const services = [
  { id: 'face', icon: 'face', labelKey: 'hero.face', descKey: 'hero.faceDesc' },
  { id: 'palm', icon: 'palm', labelKey: 'hero.palm', descKey: 'hero.palmDesc' },
  { id: 'saju', icon: 'saju', labelKey: 'hero.saju', descKey: 'hero.sajuDesc' },
  { id: 'fortune', icon: 'fortune', labelKey: 'hero.fortune', descKey: 'hero.fortuneDesc' },
  { id: 'harmony', icon: 'harmony', labelKey: 'hero.harmony', descKey: 'hero.harmonyDesc' },
  { id: 'fashion', icon: 'fashion', labelKey: 'hero.fashion', descKey: 'hero.fashionDesc' },
];

export default function HeroSection({ onLogin, onProfile, onTabChange }: HeroProps) {
  const { t, i18n } = useTranslation();
  const { t: tAuth } = useTranslation('auth');
  const { user } = useAuth();

  const handleServiceClick = (tabId: string) => {
    onTabChange(tabId);
    requestAnimationFrame(() => {
      document.getElementById('app-content')?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const scrollToContent = () => {
    document.getElementById('app-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section relative min-h-screen flex flex-col overflow-hidden">
      {/* === Background layers === */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Floating gradient orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        {/* Subtle grid overlay */}
        <div className="hero-grid" />
        {/* Noise texture */}
        <div className="hero-noise" />
      </div>

      {/* === Top bar (lang + auth) === */}
      <div className="relative z-20 flex justify-between items-center px-5 py-4 md:px-8 md:py-5">
        <button
          onClick={() => {
            const newLang = i18n.language === 'ko' ? 'en' : 'ko';
            i18n.changeLanguage(newLang);
            localStorage.setItem('mystic_language', newLang);
            document.documentElement.lang = newLang;
          }}
          aria-label={i18n.language === 'ko' ? 'Switch to English' : '한국어로 전환'}
          className="text-[11px] text-white/40 hover:text-white/80 border border-white/10 hover:border-white/25 w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 font-medium"
        >
          {i18n.language === 'ko' ? 'EN' : 'KO'}
        </button>

        {user ? (
          <button
            onClick={onProfile}
            className="text-[11px] text-white/40 hover:text-white/80 border border-white/10 hover:border-white/25 h-10 px-4 flex items-center rounded-lg transition-all duration-300 truncate max-w-[160px]"
          >
            {user.email}
          </button>
        ) : (
          <button
            onClick={onLogin}
            className="text-[11px] text-white/60 hover:text-white border border-white/15 hover:border-white/35 h-10 px-5 flex items-center gap-1.5 rounded-lg transition-all duration-300"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20c0-4 3-6 7-6s7 2 7 6" />
            </svg>
            {tAuth('login')}
          </button>
        )}
      </div>

      {/* === Center content === */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-24 md:pb-28">
        {/* Brand logo */}
        <div className="mb-4 hero-fade hero-fade-1">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter">
            GWEH<span className="hero-text-gradient ml-2 md:ml-3">AI</span>
          </h1>
        </div>

        {/* Sub-tagline */}
        <p className="text-[10px] md:text-[11px] text-white/25 uppercase tracking-[0.5em] mb-12 md:mb-14 hero-fade hero-fade-1">
          Unveil Your Destiny
        </p>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-10 md:mb-12 hero-fade hero-fade-2" aria-hidden="true">
          <div className="w-8 h-px bg-white/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-gal-accent/50" />
          <div className="w-8 h-px bg-white/10" />
        </div>

        {/* Main headline */}
        <h2 className="text-xl md:text-[28px] lg:text-[32px] text-white/85 leading-relaxed tracking-tight text-center mb-5 hero-fade hero-fade-2">
          <span className="font-light">{t('hero.line1')}</span>
          <br />
          {t('hero.line2pre')}<span className="hero-text-gradient font-bold">AI</span>{t('hero.line2post')}
        </h2>

        {/* Description */}
        <p className="text-white/35 text-[13px] md:text-[15px] max-w-sm md:max-w-md mx-auto leading-relaxed text-center mb-14 md:mb-16 hero-fade hero-fade-3">
          {t('hero.desc')}
        </p>

        {/* Service cards — 3×2 mobile, 6×1 desktop */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-2.5 w-full max-w-lg md:max-w-2xl mb-14 md:mb-16 hero-fade hero-fade-3">
          {services.map(item => (
            <button
              key={item.id}
              onClick={() => handleServiceClick(item.id)}
              className="hero-card group flex flex-col items-center gap-2 py-3.5 md:py-4 px-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300"
            >
              <ServiceIcon type={item.icon} />
              <span className="text-[9px] md:text-[10px] text-white/35 group-hover:text-white/70 tracking-[0.12em] uppercase transition-colors duration-300 leading-tight text-center">
                {t(item.labelKey)}
              </span>
            </button>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={scrollToContent}
          className="hero-cta-btn group inline-flex items-center gap-2.5 px-8 py-3.5 text-[13px] font-medium rounded-lg transition-all duration-300 hero-fade hero-fade-4"
        >
          {t('hero.cta')}
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M4 9l4 4 4-4" />
          </svg>
        </button>
      </div>

      {/* === Scroll indicator === */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hero-fade hero-fade-4">
        <button onClick={scrollToContent} className="text-white/15 hover:text-white/40 transition-colors duration-300" aria-label="Scroll down">
          <svg className="w-5 h-5 animate-bounce" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* === Bottom gradient transition to white === */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white via-white/50 to-transparent z-10 pointer-events-none" aria-hidden="true" />
    </section>
  );
}

/* ─── Custom SVG service icons (line-art, 24×24) ─── */

function ServiceIcon({ type }: { type: string }) {
  const cn = "w-7 h-7 md:w-8 md:h-8 text-white/25 group-hover:text-gal-accent transition-colors duration-300";

  switch (type) {
    // 관상 — Eye (reading faces)
    case 'face':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    // 손금 — Open hand
    case 'palm':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11V6a1 1 0 00-2 0" />
          <path d="M16 8V4a1 1 0 00-2 0v6" />
          <path d="M12 6V3a1 1 0 00-2 0v9" />
          <path d="M8 9V7a1 1 0 00-2 0v8a6 6 0 006 6c2.5 0 4.5-1.5 5.5-4L19 13a1 1 0 00-2 0" />
        </svg>
      );
    // 사주 — Four pillars
    case 'saju':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="5" width="2.5" height="14" rx="0.5" />
          <rect x="8.75" y="3" width="2.5" height="16" rx="0.5" />
          <rect x="14.5" y="5" width="2.5" height="14" rx="0.5" />
          <rect x="20.25" y="3" width="2.5" height="16" rx="0.5" />
        </svg>
      );
    // 운세 — Compass/destiny
    case 'fortune':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    // 궁합 — Two overlapping circles
    case 'harmony':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="9" cy="12" r="5.5" />
          <circle cx="15" cy="12" r="5.5" />
        </svg>
      );
    // 패션 — Gem/diamond (luxury)
    case 'fashion':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M6 3h12l3 7-9 12L3 10z" />
          <path d="M3 10h18" />
          <path d="M12 22l-3-12 3-7 3 7z" />
        </svg>
      );
    default:
      return null;
  }
}
