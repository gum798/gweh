import { useTranslation } from 'react-i18next';

const services = ['hero.face', 'hero.palm', 'hero.saju', 'hero.fortune', 'hero.harmony', 'hero.fashion'] as const;

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-14 md:py-20 text-center overflow-hidden">
      {/* Decorative 運命 watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <span className="text-[140px] md:text-[220px] lg:text-[280px] font-bold text-gal-black/[0.025] leading-none tracking-tight">
          運命
        </span>
      </div>

      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse at center, rgba(46,163,242,0.04) 0%, transparent 65%)' }}
      />

      <div className="relative">
        {/* Trigram icon — three lines */}
        <div className="mb-7 animate-fade-in">
          <svg
            className="mx-auto text-gal-muted"
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="5" y1="7" x2="21" y2="7" />
            <line x1="5" y1="13" x2="21" y2="13" />
            <line x1="5" y1="19" x2="21" y2="19" />
          </svg>
        </div>

        {/* Category label */}
        <p className="text-[10px] uppercase tracking-[0.35em] text-gal-muted mb-8 animate-fade-in">
          {t('hero.label')}
        </p>

        {/* Main headline */}
        <h2 className="text-[26px] md:text-4xl lg:text-5xl font-bold text-gal-black leading-snug tracking-tight mb-5 animate-fade-in-delay px-4">
          {t('hero.line1')}
          <br />
          {t('hero.line2pre')}<span className="text-gal-accent">AI</span>{t('hero.line2post')}
        </h2>

        {/* Thin accent line under headline */}
        <div className="flex justify-center mb-8 animate-fade-in-delay" aria-hidden="true">
          <div className="w-8 h-[1.5px] bg-gal-accent/40" />
        </div>

        {/* Description */}
        <p className="text-gal-body text-[13px] md:text-[15px] max-w-sm md:max-w-md mx-auto leading-relaxed mb-10 animate-fade-in-delay-2 px-4">
          {t('hero.desc')}
        </p>

        {/* Service keywords — typographic inline */}
        <div className="flex flex-wrap justify-center items-center gap-x-2 md:gap-x-3 gap-y-1.5 text-[11px] md:text-xs text-gal-muted tracking-[0.15em] uppercase animate-fade-in-delay-2">
          {services.map((key, i) => (
            <span key={key} className="inline-flex items-center gap-2 md:gap-3">
              <span>{t(key)}</span>
              {i < services.length - 1 && (
                <span className="text-gal-border/80" aria-hidden="true">·</span>
              )}
            </span>
          ))}
        </div>

        {/* Bottom divider */}
        <div className="mt-12 md:mt-14">
          <div className="section-divider mx-auto" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
