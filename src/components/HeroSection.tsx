import { useTranslation } from 'react-i18next';

import { splitBrand } from '../lib/brand';

interface HeroProps {
  onTabChange: (tab: string) => void;
}

// 제품에서 가장 큰 브랜드 렌더(8xl h1). 마지막 낱말만 그라디언트로 강조하는
// 표기는 구독자 메일 헤더와 같고, 쪼개는 규칙은 splitBrand 가 갖는다.
// BRAND 가 한 낱말이 되면 lead 가 비므로 앞 여백(ml)을 걸지 않는다 —
// 그대로 두면 h1 첫 글자 앞에 정체불명의 들여쓰기가 생긴다.
const { lead: BRAND_LEAD, tail: BRAND_TAIL } = splitBrand();

const services = [
  { id: 'face', icon: 'face', labelKey: 'hero.face', descKey: 'hero.faceDesc' },
  { id: 'palm', icon: 'palm', labelKey: 'hero.palm', descKey: 'hero.palmDesc' },
  { id: 'saju', icon: 'saju', labelKey: 'hero.saju', descKey: 'hero.sajuDesc' },
  { id: 'fortune', icon: 'fortune', labelKey: 'hero.fortune', descKey: 'hero.fortuneDesc' },
  { id: 'harmony', icon: 'harmony', labelKey: 'hero.harmony', descKey: 'hero.harmonyDesc' },
  { id: 'fashion', icon: 'fashion', labelKey: 'hero.fashion', descKey: 'hero.fashionDesc' },
];

export default function HeroSection({ onTabChange }: HeroProps) {
  const { t } = useTranslation();

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
    <section className="hero-section relative min-h-screen-below-header flex flex-col overflow-hidden">
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

      {/* === Center content === */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-24 md:pb-28">
        {/* Brand logo */}
        <div className="mb-4 hero-fade hero-fade-1">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter">
            {BRAND_LEAD}<span className={BRAND_LEAD ? 'hero-text-gradient ml-2 md:ml-3' : 'hero-text-gradient'}>{BRAND_TAIL}</span>
          </h1>
        </div>

        {/* ── U11: 폴드 안에 CTA 를 넣는다 ────────────────────────────────
            min-h 는 **바닥**이지 천장이 아니다. dvh 로 바꿔도 375×667 에서는
            히어로 내용의 고유 높이가 가용 높이(667 − 헤더 56 = 611px)를 넘어
            CTA 가 밖으로 밀렸다: ko +12.3 / en +33.4 / en+lang +69.3px.

            간격 값은 하나도 건드리지 않는다. 대신 **장식 두 덩어리**를 좁은
            폭에서 렌더하지 않는다 — 아래 태그라인(영문 브랜드 문구, h1 이
            이미 같은 내용을 말한다)과 aria-hidden 장식 구분선.
            둘이 자기 높이 + 아래 여백까지 합쳐 약 108px(루트 16px 기준)이라
            세 조건을 모두 폴드 안으로 되돌린다. md 이상에서는 그대로 나온다.

            색 메모: 흰색 알파를 토큰으로 바꾼 자리다. 예전 값은 히어로 배경
            위에서 각각 1.9:1 과 3.3:1 로 본문 AA 미달이었다 — 히어로가
            "장식"이라는 이유로 예외가 되지는 않는다. 실제 문구가 들어 있다. */}

        {/* Sub-tagline */}
        <p className="hidden md:block text-[10px] md:text-[11px] text-gal-muted uppercase tracking-[0.5em] mb-12 md:mb-14 hero-fade hero-fade-1">
          Unveil Your Destiny
        </p>

        {/* Decorative divider */}
        <div className="hidden md:flex items-center gap-3 mb-10 md:mb-12 hero-fade hero-fade-2" aria-hidden="true">
          <div className="w-8 h-px bg-white/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-gal-accent-ink/70" />
          <div className="w-8 h-px bg-white/10" />
        </div>

        {/* Main headline */}
        <h2 className="text-xl md:text-[28px] lg:text-[32px] text-gal-black leading-relaxed tracking-tight text-center mb-5 hero-fade hero-fade-2">
          <span className="font-light">{t('hero.line1')}</span>
          <br />
          {t('hero.line2pre')}<span className="hero-text-gradient font-bold">AI</span>{t('hero.line2post')}
        </h2>

        {/* Description */}
        <p className="text-gal-body text-[13px] md:text-[15px] max-w-sm md:max-w-md mx-auto leading-relaxed text-center mb-14 md:mb-16 hero-fade hero-fade-3">
          {t('hero.desc')}
        </p>

        {/* Service cards — 3×2 mobile, 6×1 desktop */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-2.5 w-full max-w-lg md:max-w-2xl mb-14 md:mb-16 hero-fade hero-fade-3">
          {services.map(item => (
            <button
              key={item.id}
              onClick={() => handleServiceClick(item.id)}
              className="hero-card group flex flex-col items-center gap-2 py-3.5 md:py-4 px-1.5 rounded-xl border border-gal-border bg-white/[0.05] hover:bg-white/[0.10] hover:border-gal-accent-ink transition-all duration-300"
            >
              <ServiceIcon type={item.icon} />
              <span className="text-[9px] md:text-[10px] text-gal-body group-hover:text-gal-black tracking-[0.12em] uppercase transition-colors duration-300 leading-tight text-center">
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

      {/* === Scroll indicator ===
          셋을 한꺼번에 고친다. (주의: 이 주석에 살아 있는 유틸리티 이름을 적으면
          Tailwind content 스캐너가 그것까지 CSS 로 내보낸다. 아래는 전부 서술이다.)
          1) 가운데 정렬을 transform 이 아니라 flex 로 한다. 예전에는 이 컨테이너가
             수평 중앙 정렬용 transform 과 .hero-fade 를 함께 달고 있었는데,
             .hero-fade 의 `transform: translateY(28px)` 이 유틸리티와 특이성이 같고
             CSS 에서 더 뒤에 나와 **정렬용 transform 을 통째로 이겼다** — 셰브런이
             화면 중앙이 아니라 중앙에서 오른쪽으로 자기 폭의 절반만큼 밀려 있었다.
             (애니메이션을 안쪽 button 으로 내리면 두 transform 이 겹치지 않는다.)
          2) 아래 그라디언트보다 위 층에 둔다. 예전에는 둘의 z 값이 같아서
             DOM 순서상 나중인 그라디언트가 셰브런 위에 덮였다.
          3) 색을 흰색 15% 알파(자기 배경 위 1.56:1)에서 본문 토큰으로 올린다. */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
        <button onClick={scrollToContent} className="text-gal-body hover:text-gal-black transition-colors duration-300 hero-fade hero-fade-4" aria-label="Scroll down">
          <svg className="w-5 h-5 animate-bounce" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* === Bottom gradient transition ===
          더 이상 흰색으로 건너뛰지 않는다. 히어로 그라디언트의 마지막 정지점과
          페이지 배경이 같은 #161022 라서, 이 전환은 이제 같은 색 위의 같은 색이다. */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-gal-bg via-gal-bg/50 to-transparent z-10 pointer-events-none" aria-hidden="true" />
    </section>
  );
}

/* ─── Custom SVG service icons (line-art, 24×24) ─── */

function ServiceIcon({ type }: { type: string }) {
  const cn = "w-7 h-7 md:w-8 md:h-8 text-gal-muted group-hover:text-gal-accent-ink transition-colors duration-300";

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
