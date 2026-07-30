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

// 이 배열이 홈 화면의 내비게이션이다. 순서는 "오늘 → 개별 분석 → 종합" 으로
// 읽히도록 잡았다. 서비스가 늘어나면 여기 한 줄과 ServiceIcon 의 case 하나가
// 전부다 — 탭을 몇 개까지 넣을 수 있는지 고민할 자리가 사라진 것이 이 구조의
// 이득이다. (lib/tabs.ts 의 TABS 와 별도인 이유: 그쪽은 해시 유효성의 출처이고
// home 을 포함하지만, 홈 화면이 자기 자신을 카드로 그릴 일은 없다.)
const services = [
  { id: 'omen', icon: 'omen', labelKey: 'hero.omen', descKey: 'hero.omenDesc' },
  { id: 'face', icon: 'face', labelKey: 'hero.face', descKey: 'hero.faceDesc' },
  { id: 'palm', icon: 'palm', labelKey: 'hero.palm', descKey: 'hero.palmDesc' },
  { id: 'saju', icon: 'saju', labelKey: 'hero.saju', descKey: 'hero.sajuDesc' },
  { id: 'fortune', icon: 'fortune', labelKey: 'hero.fortune', descKey: 'hero.fortuneDesc' },
  { id: 'harmony', icon: 'harmony', labelKey: 'hero.harmony', descKey: 'hero.harmonyDesc' },
  { id: 'fashion', icon: 'fashion', labelKey: 'hero.fashion', descKey: 'hero.fashionDesc' },
  { id: 'summary', icon: 'summary', labelKey: 'hero.summary', descKey: 'hero.summaryDesc' },
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
        {/* 두 덩어리의 아래 여백을 한 단씩 줄였다. md 이상에서도 그리드가
            한 줄에서 두 줄로 커져(6열→4열, 카드 6→8) 약 114px 길어졌고,
            1280×768 에서 마지막 카드 줄이 16px 만큼 폴드를 넘었다. 여기서
            32px 을 돌려받아 되돌린다 — 좁은 폭에서는 둘 다 렌더되지 않으므로
            모바일 계산에는 영향이 없다. */}
        <p className="hidden md:block text-[10px] md:text-[11px] text-gal-muted uppercase tracking-[0.5em] mb-8 md:mb-10 hero-fade hero-fade-1">
          Unveil Your Destiny
        </p>

        {/* Decorative divider */}
        <div className="hidden md:flex items-center gap-3 mb-6 md:mb-8 hero-fade hero-fade-2" aria-hidden="true">
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

        {/* Description
            좁은 폭에서 렌더하지 않는 세 번째 덩어리다. 앞의 두 개(위 U11 메모)와
            같은 이유이고, 근거는 이제 더 강하다: 이 문단은 서비스 이름을 죽 나열해
            무엇을 해 주는지 설명하는데, 바로 아래 그리드가 서비스 여덟 개를 이름과
            한 줄 설명까지 붙여 그린다. 가치 제안은 위 h2 가 이미 말한다.

            그리드가 한 줄에서 네 줄로 커지면서(카드 6→8, 6열→2열) 모바일 히어로가
            약 244px 길어졌고, 그만큼이 폴드 밖으로 나갔다. 이 문단과 아래 여백이
            합쳐 약 119px 이라 카드 여덟 개를 폴드 안으로 되돌린다. md 이상에서는
            히어로가 짧아 그대로 나온다. */}
        <p className="hidden md:block text-gal-body text-[13px] md:text-[15px] max-w-sm md:max-w-md mx-auto leading-relaxed text-center mb-14 md:mb-16 hero-fade hero-fade-3">
          {t('hero.desc')}
        </p>

        {/* Service cards — 이제 이 그리드가 홈 화면의 유일한 내비게이션이다.
            2×4 mobile, 4×2 desktop. 3열이 아닌 이유: 390px 에서 카드 폭이
            약 107px 밖에 안 나와 설명 한 줄이 세 줄로 쪼개진다. 2열이면
            약 167px 이라 한두 줄에 들어온다.

            아래 여백은 그리드가 한 줄에서 네 줄로 커졌으므로 한 단 줄였다.
            폴드 계산을 바꾸려는 것이 아니다 — 이 컨테이너는 justify-center 라
            그리드 **아래**의 여백을 줄이면 블록이 중앙으로 다시 맞춰지면서
            카드가 오히려 조금 내려간다(측정: 390×844 에서 카드 하단 695→703,
            CTA 하단 806→790). 순전히 비율 문제다: 네 줄짜리 블록 밑에
            56px 을 두면 CTA 가 떨어져 나가 보인다. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2.5 w-full max-w-lg md:max-w-2xl mb-10 md:mb-12 hero-fade hero-fade-3">
          {services.map(item => (
            <button
              key={item.id}
              onClick={() => handleServiceClick(item.id)}
              className="hero-card group flex flex-col items-center gap-1.5 py-3.5 md:py-4 px-2 rounded-xl border border-gal-border bg-white/[0.05] hover:bg-white/[0.10] hover:border-gal-accent-ink transition-all duration-300"
            >
              <ServiceIcon type={item.icon} />
              {/* 위계는 색으로 만들되 **아래가 아니라 위로** 만든다. 설명을
                  한 단 어둡게 하는 쪽이 자연스러워 보이지만, 히어로 카드
                  표면은 토큰이 아니라 히어로 그라디언트 위에 흰색 5% 를 덮은
                  합성이라 gal-light 카드보다 밝다(측정 #3c2c68). 그 위에서
                  muted 는 4.10:1 로 AA 미달이었다 — 팔레트가 muted 를 보증하는
                  기준면은 gal-light 이지 이 표면이 아니다. 그래서 설명을
                  본문 색에 두고 이름 쪽을 올렸다. 측정: 이름 9.0:1 / 설명 5.8:1.
                  (tailwind.config.js 의 대비 게이트는 토큰 쌍만 보므로 이
                  조합을 볼 수 없다. 렌더된 픽셀로 확인했다.) */}
              <span className="text-[9px] md:text-[10px] text-gal-dark group-hover:text-gal-black tracking-[0.12em] uppercase transition-colors duration-300 leading-tight text-center">
                {t(item.labelKey)}
              </span>
              {/* 정의만 되어 있고 한 번도 렌더되지 않던 descKey. 9px 밑으로
                  내리면 읽히지 않으므로 크기는 라벨과 같이 둔다. 라벨 쪽의
                  대문자 변환과 자간을 상속받으면 문장이 읽히지 않으므로 두
                  속성을 명시적으로 되돌린다. */}
              <span className="text-[9px] md:text-[10px] text-gal-body group-hover:text-gal-dark normal-case tracking-normal transition-colors duration-300 leading-snug text-center">
                {t(item.descKey)}
              </span>
            </button>
          ))}
        </div>

        {/* CTA button
            예전에는 콘텐츠 영역으로 스크롤했다. 히어로가 홈 화면이 된 뒤로는
            홈에서 콘텐츠 영역이 비어 있으므로(App.tsx 의 home 렌더러가 null)
            그 스크롤은 푸터로 내려가는 동작이 된다. 라벨이 "오늘의 운명
            확인하기" 라고 약속하므로 실제로 그 화면(오늘의 괘)으로 보낸다. */}
        <button
          onClick={() => handleServiceClick('omen')}
          className="hero-cta-btn group inline-flex items-center gap-2.5 px-8 py-3.5 text-[13px] font-medium rounded-lg transition-all duration-300 hero-fade hero-fade-4"
        >
          {t('hero.cta')}
          {/* 아래 화살표였다. 버튼이 스크롤이 아니라 화면 이동을 하게 됐으므로
              방향과 호버 이동축을 함께 옆으로 돌린다. */}
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4" />
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
    // 오늘의 괘 — Trigram (☲). 가운데 획을 끊는 것이 요점이다: 세 줄이 모두
    // 이어져 있으면 햄버거 메뉴로 읽힌다. 끊긴 가운데 획이 그 오독을 막는다.
    case 'omen':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 5h17" />
          <path d="M3.5 12h6.5M14 12h6.5" />
          <path d="M3.5 19h17" />
        </svg>
      );
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
    // 통합 리포트 — Document with lines. 막대그래프 계열은 사주의 네 기둥과
    // 실루엣이 겹쳐 28px 에서 구분되지 않으므로 문서 쪽을 골랐다.
    case 'summary':
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4.5" y="3" width="15" height="18" rx="2" />
          <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
        </svg>
      );
    default:
      return null;
  }
}
