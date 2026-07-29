# GWEH UI 개편 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱 셸을 세우고 8개 탭을 공용 프리미티브로 수렴시킨 뒤, 토큰 교체만으로 다크 퍼플 미스틱으로 전환한다.

**Architecture:** 지난 7번의 리디자인이 전부 "색만 바꾸고 구조는 두고 가기"였고 그 결과 버튼 스타일이 29가지가 됐다. 이번에는 순서를 뒤집는다 — 셸과 공용 컴포넌트를 먼저 세워 색이 한 곳에 모이게 만들고, 다크 전환은 마지막에 토큰 값 교체로 끝낸다. 1~6단계는 화이트 상태로도 배포 가능하며 각각 독립적으로 사용자에게 보이는 개선을 낸다.

**Tech Stack:** React 19, Vite 6, TypeScript, Tailwind 3 (gal-* 토큰), i18next (ko/en), Cloudflare Pages

**설계 근거:** `docs/superpowers/specs/2026-07-29-ui-redesign-design.md`

## Global Constraints

- **제품 기능 변경 금지.** 점술 로직·API 호출·데이터 흐름·인증·결제를 바꾸지 않는다. 시각적 표현, 마크업 구조, 그리고 **셸 수준의 내비게이션 동작**만 바꾼다.
  - 셸 내비게이션은 명시적 예외다: Task 2가 `hashchange` 리스너를 추가하고 탭 전환 스크롤 대상을 바꾼다. 스펙 §3.2가 요구하는 것이며, 현재 뒤로가기가 죽어 있고 탭 전환이 865px 위로 되돌리는 것을 고치는 것이 이 개편의 최대 레버리지다. 이는 "제품 기능"이 아니라 셸 결함 수정이다.
  - 그 외 모든 곳에서는 `onClick`·`disabled`·상태 훅·이펙트를 그대로 옮긴다.
- **모든 사용자 노출 문자열은 `t()`를 거친다.** ko/en 양쪽 로케일에 키를 추가한다. 한쪽만 추가하면 i18next가 키 문자열을 그대로 화면에 노출한다.
- **`SajuTab`이 수렴 기준 템플릿이다.** 카드 레시피는 `SajuTab.tsx:426`의 `bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card`.
- **간격 체계는 손대지 않는다.** `src/` 전체에 임의 spacing 값이 0건이며 이미 일관되다.
- **탭 본문의 모바일 레이아웃은 손대지 않는다.** 390×844에서 8개 탭 전부 `scrollWidth == 390`이다. 이건 지켜야 할 자산이지 고칠 대상이 아니다.
- **모든 색은 AA 4.5:1 이상.** 값을 고르면 반드시 계산해서 확인한다. 이번 감사가 찾은 결함의 상당수가 "검증 없이 고른 색"이었다.
- **테스트 러너가 없다.** 검증은 grep 카운트·대비 계산·빌드·타입체크로 한다. `npm run lint`는 `**/*.{js,jsx}`만 대상이라 `src/`를 검사하지 않으므로 의미를 두지 않는다.
- **작업 브랜치는 `feat/ui-redesign`.** 단계별 커밋, 전체 완료 후 `main`에 머지·푸시.
- 루트 `npx tsc --noEmit`는 쓸 수 없다(TS6306/TS6310으로 중단, `src/` 미검사). 변경 파일을 직접 지정해 검사한다.

## 파일 구조

| 파일 | 상태 | 책임 |
|---|---|---|
| `tailwind.config.js` | 수정 | 타입 스케일·상태색·다크 서피스 토큰의 유일한 정의 |
| `src/lib/brand.ts` | 생성 | 브랜드 문자열 단일 상수 |
| `src/components/layout/AppHeader.tsx` | 생성 | 상설 헤더 — 브랜드·언어·인증 |
| `src/components/ui/Button.tsx` | 생성 | 버튼 4종 |
| `src/components/ui/Card.tsx` | 생성 | 카드 3종 |
| `src/components/ui/PageHeader.tsx` | 생성 | 탭 제목 — 탭별 두 번째 히어로 6개를 대체 |
| `src/components/ui/LoadingState.tsx` | 생성 | 분석 중 표시 — 로딩 6종을 대체 |
| `src/components/ui/LevelPill.tsx` | 생성 | 운세 등급 배지 — 3벌 복제를 대체 |
| `src/App.tsx` | 수정 | 셸 구조. 스크롤·해시 처리 |
| `src/components/Navigation.tsx` | 수정 | 풀블리드 sticky 탭바 |
| `src/components/HeroSection.tsx` | 수정 | 상단바 제거(헤더로 이동), `min-h-dvh` |
| `src/components/tabs/*.tsx` ×8 | 수정 | 프리미티브로 치환 |
| `index.html` | 수정 | 브랜드·폰트·theme-color |
| `public/favicon.svg` | 수정 | 액센트 계열로 교체 |
| `public/og-image.svg` | 생성 | 누락된 공유 카드 이미지 |

---

### Task 1: 토큰 확장

색 값은 아직 화이트다. 이번 단계는 **의미를 나르는 토큰을 추가**하는 것이며, 6단계에서 이 값들만 교체하면 다크가 된다.

**Files:**
- Modify: `tailwind.config.js`
- Create: `scripts/check-contrast.mjs`

**Interfaces:**
- Produces: Tailwind 클래스 `text-{xs..5xl}`, `tracking-{tight..widest}`, `text-status-{success,warning,danger,info}`, `bg-status-*` — Task 4·5·7이 사용한다.

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/seojeonghwa/project/gweh
git checkout -b feat/ui-redesign
```

- [ ] **Step 2: 대비 검증 스크립트 작성**

`scripts/check-contrast.mjs` — 이후 모든 색 결정이 이걸 통과해야 한다.

```js
// WCAG 대비 계산. 색을 검증 없이 고르는 것이 이번 개편의 원인이었다.
const rel = (hex) => {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const ratio = (a, b) => {
  const [hi, lo] = [rel(a), rel(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [전경, 배경, 라벨, 최소요구]
const PAIRS = process.argv[2] === '--dark'
  ? [
      ['#a78bfa', '#161022', 'accent-ink on base', 4.5],
      ['#ffffff', '#5b13ec', 'white on accent-fill', 4.5],
      ['#f6f6f8', '#161022', 'text-primary', 4.5],
      ['#b8b0c8', '#161022', 'text-secondary', 4.5],
      ['#8b8299', '#161022', 'text-muted', 4.5],
      ['#3a2f52', '#161022', 'border on base', 1.5],
      ['#a78bfa', '#1e1630', 'accent-ink on surface', 4.5],
      ['#8b8299', '#1e1630', 'text-muted on surface', 4.5],
    ]
  : [
      ['#666666', '#ffffff', 'gal-body (현행)', 4.5],
      ['#999999', '#ffffff', 'gal-muted (현행)', 4.5],
      ['#2ea3f2', '#ffffff', 'gal-accent (현행)', 4.5],
    ];

let failed = 0;
for (const [fg, bg, label, min] of PAIRS) {
  const v = ratio(fg, bg);
  const ok = v >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(28)} ${fg} on ${bg}  ${v.toFixed(2)}:1 (min ${min})`);
}
console.log(failed === 0 ? '\nAll pass' : `\n${failed} failing`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 3: 현행 팔레트의 실패를 기록으로 남긴다**

```bash
node scripts/check-contrast.mjs
```

기대: 3건 중 2건 FAIL (`gal-muted` 2.85:1, `gal-accent` 2.75:1). 이 출력을 리포트에 그대로 붙인다 — 6단계 이후 같은 명령이 전부 PASS가 되는 것이 U1이다.

- [ ] **Step 4: `tailwind.config.js`에 타입 스케일 추가**

`theme.extend` 안, `fontFamily` 블록 **다음**에 삽입한다:

```js
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl':  ['3rem',     { lineHeight: '1.1' }],
        '6xl':  ['3.75rem',  { lineHeight: '1.05' }],
        '7xl':  ['4.5rem',   { lineHeight: '1' }],
        '8xl':  ['6rem',     { lineHeight: '1' }],
        // 라벨용 — 현재 text-[10px]/text-[11px] 로 흩어져 있는 것을 흡수한다
        'label':   ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.3em' }],
        // label-lg 는 구현 중 삭제됐다 — text-[11px] 4곳 중 0.2em 을 원하는 곳이 0이었다.
      },
      letterSpacing: {
        'tightest': '-0.05em',
        'tighter':  '-0.03em',
        'tight':    '-0.015em',
        'normal':   '0',
        'wide':     '0.05em',
        'wider':    '0.1em',
        'widest':   '0.3em',
      },
```

- [ ] **Step 5: 상태색 토큰 추가**

같은 `colors` 블록의 `gal-footer` 다음 줄에 삽입한다. 값은 화이트 배경 기준 AA를 만족하도록 골랐다(6단계에서 다크용으로 교체):

```js
        "status-success": "#15803d",
        "status-warning": "#b45309",
        "status-danger":  "#b91c1c",
        "status-info":    "#1d4ed8",
```

- [ ] **Step 6: 상태색이 AA를 만족하는지 확인**

```bash
node -e "
const {ratio}=await import('./scripts/check-contrast.mjs');
" 2>/dev/null || node --input-type=module -e "
const rel=h=>{h=h.replace('#','');const c=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4);return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]};
const r=(a,b)=>{const[h,l]=[rel(a),rel(b)].sort((x,y)=>y-x);return (h+0.05)/(l+0.05)};
for(const[n,v] of Object.entries({success:'#15803d',warning:'#b45309',danger:'#b91c1c',info:'#1d4ed8'}))
  console.log(n.padEnd(9), v, r(v,'#ffffff').toFixed(2)+':1', r(v,'#ffffff')>=4.5?'PASS':'FAIL');
"
```

기대: 4건 전부 PASS.

- [ ] **Step 7: 폰트 로딩 정리 + Space Grotesk 추가**

두 가지 문제가 있다. 첫째, `index.html:38-40`이 `Noto+Sans+KR:wght@400;500;700`만 로드하는데 코드는 `font-light`(300)와 `font-semibold`(600)를 22곳에서 쓴다 — **실제로는 400/700으로 렌더된다.** 둘째, 레퍼런스 디자인의 라틴 폰트 Space Grotesk가 없다.

`index.html`의 `:38-40` 세 줄(preload / stylesheet / noscript)에서 폰트 URL을 아래로 바꾼다. 세 줄 모두 같은 URL을 써야 한다:

```
https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap
```

`tailwind.config.js`의 `fontFamily`를 교체한다 — 라틴은 Space Grotesk, 한글은 Noto Sans KR이 받는다:

```js
      fontFamily: {
        "display": ["Space Grotesk", "Noto Sans KR", "system-ui", "sans-serif"],
        "heading": ["Space Grotesk", "Noto Sans KR", "sans-serif"],
        "body":    ["Noto Sans KR", "Space Grotesk", "system-ui", "sans-serif"],
      },
```

`index.html:51`의 크리티컬 CSS `font-family`도 `'Noto Sans KR','Space Grotesk',sans-serif`로 맞춘다.

**웨이트 300/600을 로드했으므로 기존 `font-light`/`font-semibold` 22곳은 그대로 두면 된다.** 이제 실제로 그 굵기로 렌더된다.

- [ ] **Step 8: 빌드 확인 후 커밋**

```bash
npm run build
git add tailwind.config.js scripts/check-contrast.mjs index.html
git commit -m "feat(ui): 타입 스케일·상태색 토큰 추가 + 대비 검증 스크립트

토큰 계층이 뒤집혀 있었다 — radius/shadow 는 토큰화됐는데 fontSize,
letterSpacing, 상태색이 없어 임의값 text-[Npx] 36개와 원시 팔레트
114곳이 생겼다. 성공이 green/emerald 두 가지, 경고가 orange/amber/yellow
세 가지로 흩어져 있던 것을 status-* 로 모은다.

색 값은 아직 화이트다. 6단계에서 이 토큰들만 다크로 교체한다."
git push -u origin feat/ui-redesign
```

---

### Task 2: 앱 셸

**탭 파일 8개를 하나도 건드리지 않고 8개 탭 전부의 경험을 고치는 단계.** 이 계획에서 레버리지가 가장 크다.

**Files:**
- Create: `src/lib/brand.ts`, `src/components/layout/AppHeader.tsx`
- Modify: `src/App.tsx`, `src/components/Navigation.tsx:25-26`, `src/components/HeroSection.tsx` (상단바 제거)
- Modify: `src/locales/{ko,en}/common.json` (스킵 링크 문자열)

**Interfaces:**
- Produces: `BRAND` (문자열 상수), `<AppHeader onLogin onProfile />` — Task 8이 `BRAND`를 사용한다.

- [ ] **Step 1: 브랜드 상수 생성**

`src/lib/brand.ts`:

```ts
/**
 * 브랜드 문자열의 유일한 정의.
 *
 * 저장소에 MYSTIC AI(index.html 6곳, worker 3곳)와 GWEH AI(앱 2곳)가
 * 동시에 존재해, 구독자 메일과 앱이 서로 다른 제품처럼 보였다.
 * 다음 변경이 1줄이 되도록 여기 모은다.
 */
export const BRAND = 'GWEH AI';
export const BRAND_SHORT = 'GWEH';
```

- [ ] **Step 2: 스킵 링크 문자열을 로케일에 추가**

`src/locales/ko/common.json`의 `"error.weather"` 줄 **앞**에 추가:

```json
  "a11y.skipToContent": "본문으로 건너뛰기",
```

`src/locales/en/common.json`의 대응 위치에 추가:

```json
  "a11y.skipToContent": "Skip to content",
```

- [ ] **Step 3: 상설 헤더 컴포넌트 생성**

`src/components/layout/AppHeader.tsx` — `HeroSection.tsx:50-83`의 언어·인증 버튼을 여기로 옮긴다. 히어로를 지나도 언어 전환과 로그인이 가능해진다.

```tsx
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { BRAND } from '../../lib/brand';

interface AppHeaderProps {
  onLogin: () => void;
  onProfile: () => void;
}

export default memo(function AppHeader({ onLogin, onProfile }: AppHeaderProps) {
  const { i18n } = useTranslation();
  const { t: tAuth } = useTranslation('auth');
  const { user } = useAuth();

  const toggleLang = () => {
    const next = i18n.language === 'ko' ? 'en' : 'ko';
    i18n.changeLanguage(next);
    localStorage.setItem('mystic_language', next);
    document.documentElement.lang = next;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gal-border">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        <a
          href="#omen"
          className="text-base font-bold tracking-tight text-gal-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent rounded-gal-sm"
        >
          {BRAND}
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            aria-label={i18n.language === 'ko' ? 'Switch to English' : '한국어로 전환'}
            className="min-w-[44px] min-h-[44px] px-3 text-xs font-medium text-gal-body hover:text-gal-black border border-gal-border hover:border-gal-accent rounded-gal-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent"
          >
            {i18n.language === 'ko' ? 'EN' : 'KO'}
          </button>

          {user ? (
            <button
              onClick={onProfile}
              className="min-h-[44px] px-4 text-xs text-gal-body hover:text-gal-black border border-gal-border hover:border-gal-accent rounded-gal-md transition-colors truncate max-w-[180px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent"
            >
              {user.email}
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="min-h-[44px] px-4 text-xs font-medium text-white bg-gal-accent hover:bg-gal-accent-dark rounded-gal-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent focus-visible:ring-offset-2"
            >
              {tAuth('login')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
});
```

- [ ] **Step 4: `HeroSection.tsx`에서 상단바 제거**

`HeroSection.tsx`의 `{/* === Top bar (lang + auth) === */}` 주석부터 그 `</div>`까지(약 `:49-83`) 통째로 삭제한다. 이제 헤더가 그 역할을 한다.

삭제 후 사용되지 않게 되는 것들을 정리한다: `onLogin`/`onProfile` prop, `useAuth` 임포트와 `user`, `tAuth`. **`i18n`은 남는지 확인 후 판단한다** — 다른 곳에서 쓰고 있으면 남긴다. `App.tsx`의 `<HeroSection>` 호출부에서도 해당 prop을 제거한다.

- [ ] **Step 5: `Navigation.tsx`를 풀블리드로**

`:25-26`의 두 줄을 교체한다. 현재는 `max-w-4xl` 컨테이너 안에 갇혀 1280px에서 x=208의 864px 섬으로 렌더되고, `justify-center` + `overflow-x-auto` 조합 때문에 640~869px 영어에서 첫 탭이 음수 스크롤 영역으로 밀려 도달 불가다.

찾을 코드:

```tsx
    <nav className="sticky top-0 z-40 bg-white border-b border-gal-border p-1.5 sm:p-2 mb-6 shadow-gal-nav">
      <div className="flex justify-center overflow-x-auto gap-0.5 sm:gap-1 scrollbar-hide snap-x" role="tablist">
```

바꿀 코드:

```tsx
    <nav className="sticky top-14 z-40 bg-white border-b border-gal-border mb-6 shadow-gal-nav">
      <div className="flex justify-start lg:justify-center overflow-x-auto gap-0.5 sm:gap-1 scrollbar-hide snap-x px-2 py-1.5 sm:py-2" role="tablist">
```

`top-0` → `top-14`는 헤더(h-14) 아래에 붙기 위함이다. `justify-start`가 기본이고 `lg:`에서만 중앙 정렬한다 — 넘칠 때 중앙 정렬하면 앞쪽이 잘린다.

- [ ] **Step 6: 탭 버튼 터치 타깃을 44px로**

같은 파일 `:36`의 클래스 문자열에서 `px-2.5 sm:px-3 py-2 sm:py-2.5` 를 `px-3 sm:px-4 min-h-[44px]` 로 바꾼다. 현재 40×42px로 권장치 미달이다.

- [ ] **Step 7: `App.tsx` — 스크롤·해시·셸 구조**

찾을 코드 (`:54-58`):

```tsx
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
```

바꿀 코드:

```tsx
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
    // 이전에는 window.scrollTo({top:0}) 이었다. 히어로가 생기기 전에 쓰인 코드라
    // 탭을 누를 때마다 865px 위 히어로 안으로 되돌아갔다. 콘텐츠 상단으로 보낸다.
    document.getElementById('app-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
```

- [ ] **Step 8: `App.tsx` — 뒤로가기 복구**

`handleTabChange` 정의 **다음**에 추가한다. 현재 저장소 전체에 `hashchange` 리스너가 0건이라 뒤로가기가 URL만 바꾸고 화면은 그대로다.

```tsx
  // 뒤로/앞으로 가기 대응. 이 리스너가 없어 브라우저 히스토리가 죽어 있었다.
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['omen', 'fortune', 'fashion', 'face', 'harmony', 'palm', 'saju', 'summary'];
      if (validTabs.includes(hash)) setActiveTab(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
```

- [ ] **Step 9: `App.tsx` — 헤더·스킵 링크 배치, 네비를 컨테이너 밖으로**

최상위 `return`의 `<div className="min-h-screen bg-white">` 바로 다음에 스킵 링크와 헤더를 넣는다:

```tsx
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gal-accent focus:text-white focus:rounded-gal-md"
      >
        {tc('a11y.skipToContent')}
      </a>
      <AppHeader onLogin={() => setAuthModalOpen(true)} onProfile={() => setProfileModalOpen(true)} />
```

그리고 `<Navigation ... />` 를 `<div id="app-content" className="relative container mx-auto px-4 pt-8 max-w-4xl">` **밖으로** 꺼내 그 바로 앞에 둔다. 컨테이너 안에 있으면 네비가 864px 섬이 된다.

`import AppHeader from './components/layout/AppHeader';` 를 상단에 추가하고, `useEffect`가 이미 임포트돼 있는지 확인한다.

- [ ] **Step 10: 빌드·타입 검사**

```bash
npm run build
npx tsc --noEmit --skipLibCheck --jsx react-jsx --target ES2020 --module ESNext \
  --moduleResolution bundler --lib ES2020,DOM,DOM.Iterable \
  src/App.tsx src/components/layout/AppHeader.tsx src/components/Navigation.tsx src/lib/brand.ts
```

기대: 빌드 성공. 타입 에러 신규 0건.

- [ ] **Step 11: 로케일 키 정합성 확인**

```bash
python3 -c "
import json
ko=set(json.load(open('src/locales/ko/common.json')))
en=set(json.load(open('src/locales/en/common.json')))
print('ko에만:', sorted(ko-en)); print('en에만:', sorted(en-ko))
"
```

기대: 양쪽 빈 목록.

- [ ] **Step 12: 커밋**

```bash
git add src/App.tsx src/components/layout/AppHeader.tsx src/components/Navigation.tsx src/components/HeroSection.tsx src/lib/brand.ts src/locales/ko/common.json src/locales/en/common.json
git commit -m "feat(ui): 앱 셸 — 상설 헤더, 풀블리드 네비, 뒤로가기 복구

히어로가 곧 헤더였던 구조를 고친다. 탭 파일 8개를 건드리지 않고
8개 탭 전부의 경험이 바뀐다.

- App.tsx:57 window.scrollTo({top:0}) 제거. 히어로가 생기기 전에 쓰인
  코드라 탭 전환마다 865px 위 히어로 안으로 되돌아갔다.
- hashchange 리스너 추가. 저장소 전체에 0건이라 뒤로가기가 죽어 있었다.
- Navigation 을 max-w-4xl 컨테이너 밖으로. 1280px 에서 x=208 의
  864px 섬으로 렌더되고 있었다.
- justify-center → justify-start (lg 에서만 중앙). 640~869px 영어에서
  기본 탭이 음수 스크롤 영역으로 밀려 도달 불가였다.
- 언어·인증을 히어로에서 헤더로. i18n.changeLanguage 호출이 트리
  전체에 1회뿐이라 히어로를 지나면 언어 전환이 불가능했다.
- 탭 터치 타깃 40x42 → 44px, 스킵 링크 추가"
git push
```

- [ ] **Step 13: U2·U3·U4 — 프리뷰에서 확인**

Cloudflare Pages 브랜치 별칭 `https://feat-ui-redesign.gweh-3s2.pages.dev` 에서:

- **U2**: 탭을 누르면 콘텐츠 상단에 착지하는가? 히어로로 되돌아가지 않아야 한다.
- **U3**: 탭 3개를 순서대로 누른 뒤 브라우저 뒤로가기 → 이전 탭이 실제로 표시되는가?
- **U4**: 창 폭을 640px·869px로 줄이고 언어를 EN으로 → 첫 번째 탭(Oracle)이 잘리지 않고 클릭 가능한가?

세 항목의 결과를 리포트에 기록한다. 실패하면 다음 태스크로 넘어가지 않는다.

---

### Task 3: 공용 프리미티브

버튼 41개에 스타일 29가지, 카드 54개에 25가지, 로딩 6가지를 흡수할 컴포넌트를 만든다. **이 단계는 아직 탭을 고치지 않는다** — 다음 두 태스크가 쓸 도구를 만든다.

**Files:**
- Create: `src/components/ui/Button.tsx`, `Card.tsx`, `PageHeader.tsx`, `LoadingState.tsx`, `LevelPill.tsx`

**Interfaces:**
- Produces:
  - `<Button variant="primary"|"secondary"|"ghost"|"danger" size="sm"|"md"|"lg" fullWidth? loading? ...ButtonHTMLAttributes />`
  - `<Card variant="base"|"accent"|"muted" padding="sm"|"md"|"lg" as?="div"|"section" />`
  - `<PageHeader eyebrow? title subtitle? icon? />`
  - `<LoadingState label? />`
  - `<LevelPill level: '대길'|'길'|'평'|'소흉'|'흉' />`
- Task 4·5가 전부 사용한다.

- [ ] **Step 1: `Button.tsx`**

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

// 감사 시점 버튼 41개에 서로 다른 클래스 조합 29가지가 있었다. 여기로 수렴한다.
const VARIANTS: Record<Variant, string> = {
  primary:   'bg-gal-accent text-white hover:bg-gal-accent-dark shadow-gal-button',
  secondary: 'bg-white text-gal-black border border-gal-border hover:border-gal-accent',
  ghost:     'bg-transparent text-gal-body hover:text-gal-black hover:bg-gal-light',
  danger:    'bg-status-danger text-white hover:opacity-90',
};

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-3 min-h-[44px]',
  md: 'text-sm px-5 min-h-[44px]',
  lg: 'text-base px-7 min-h-[52px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, loading, disabled, className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-gal-xl font-medium',
        'transition-all duration-200 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading && (
        <span
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
});
```

- [ ] **Step 2: `Card.tsx`**

`SajuTab.tsx:426`의 레시피가 `base`다.

```tsx
import type { ReactNode } from 'react';

type Variant = 'base' | 'accent' | 'muted';
type Padding = 'sm' | 'md' | 'lg';

interface CardProps {
  variant?: Variant;
  padding?: Padding;
  as?: 'div' | 'section' | 'article';
  className?: string;
  children: ReactNode;
}

// 감사 시점 패널 54개에 카드 변형 25가지, 패딩 5종(p-4/5/6/8/10)이 있었다.
// base 는 SajuTab.tsx:426 의 레시피다.
const VARIANTS: Record<Variant, string> = {
  base:   'bg-white border border-gal-border shadow-gal-card',
  accent: 'bg-white border border-gal-accent/40 shadow-gal-card',
  muted:  'bg-gal-bg border border-gal-border',
};

const PADDINGS: Record<Padding, string> = { sm: 'p-4', md: 'p-6', lg: 'p-8' };

export function Card({ variant = 'base', padding = 'md', as: Tag = 'div', className = '', children }: CardProps) {
  return (
    <Tag className={`rounded-gal-xl ${VARIANTS[variant]} ${PADDINGS[padding]} ${className}`}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 3: `PageHeader.tsx`**

탭 6개가 각자 만든 두 번째 히어로(`OmenTab:318`, `FaceTab:133`, `PalmTab:109`, `FortuneTab:303`, `SajuTab:227`, `FashionTab:395`)를 대체한다.

```tsx
import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

// 페이지 헤더가 없어 탭 6개가 각자 40~50vh 히어로를 만들었고,
// min-h-screen 히어로 아래에 두 번째 히어로가 쌓였다.
export function PageHeader({ eyebrow, title, subtitle, icon }: PageHeaderProps) {
  return (
    <header className="max-w-md mx-auto px-4 pt-6 pb-4 text-center">
      {icon && <div className="flex justify-center mb-3" aria-hidden="true">{icon}</div>}
      {eyebrow && (
        <p className="text-label font-bold uppercase text-gal-accent mb-1.5">{eyebrow}</p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-gal-black">{title}</h2>
      {subtitle && <p className="text-sm text-gal-body mt-2">{subtitle}</p>}
    </header>
  );
}
```

- [ ] **Step 4: `LoadingState.tsx`**

```tsx
interface LoadingStateProps {
  label?: string;
}

// 같은 "분석 중" 순간에 로딩 화면이 6가지였다.
export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] flex flex-col items-center justify-center gap-5 px-6"
    >
      <div className="h-14 w-14 rounded-gal-xl border border-gal-border flex items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-gal-accent border-t-transparent animate-spin" />
      </div>
      {label && <p className="text-sm text-gal-body text-center">{label}</p>}
    </div>
  );
}
```

- [ ] **Step 5: `LevelPill.tsx`**

운세 등급 표가 `FortuneTab:176-180`, `SajuTab:413-419`, `SummaryTab:320-328`에 복제돼 있고 `OmenTab:465-470`에 인라인 삼항식으로 또 있다. 같은 "대길"이 탭마다 다른 앰버로 렌더된다.

```tsx
export type Level = '대길' | '길' | '평' | '소흉' | '흉';

// 등급 표가 세 곳에 복제 + 한 곳에 인라인으로 있었고 색이 서로 달랐다.
const STYLES: Record<Level, string> = {
  '대길': 'bg-status-success/10 text-status-success border-status-success/30',
  '길':   'bg-status-info/10    text-status-info    border-status-info/30',
  '평':   'bg-gal-light         text-gal-body       border-gal-border',
  '소흉': 'bg-status-warning/10 text-status-warning border-status-warning/30',
  '흉':   'bg-status-danger/10  text-status-danger  border-status-danger/30',
};

export function LevelPill({ level }: { level: Level }) {
  const style = STYLES[level] ?? STYLES['평'];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-gal-lg border text-sm font-bold ${style}`}>
      {level}
    </span>
  );
}
```

- [ ] **Step 6: 빌드·타입 검사**

```bash
npm run build
npx tsc --noEmit --skipLibCheck --jsx react-jsx --target ES2020 --module ESNext \
  --moduleResolution bundler --lib ES2020,DOM,DOM.Iterable \
  src/components/ui/Button.tsx src/components/ui/Card.tsx src/components/ui/PageHeader.tsx \
  src/components/ui/LoadingState.tsx src/components/ui/LevelPill.tsx
```

기대: 성공, 신규 타입 에러 0건.

- [ ] **Step 7: 커밋**

```bash
git add src/components/ui/
git commit -m "feat(ui): 공용 프리미티브 5종

Button/Card/PageHeader/LoadingState/LevelPill.
버튼 41개→스타일 29가지, 패널 54개→카드 25가지, 로딩 6가지,
운세 등급 표 3벌 복제를 흡수할 도구를 먼저 만든다.

Card base 는 SajuTab.tsx:426 의 레시피를 채택했다 — 감사에서 가장
정돈된 탭으로 판정됐다.

포커스 링을 Button 에 내장해 이후 전 버튼에 자동 적용된다
(현재 73개 중 14개에만 있다)."
git push
```

---

### Task 4: 탭 수렴 A — 경량 4개

`PalmTab`(338), `FortuneTab`(370), `FaceTab`(429), `SajuTab`(538). `SajuTab`은 템플릿이므로 대부분 검증에 가깝다.

**Files:**
- Modify: `src/components/tabs/PalmTab.tsx`, `FortuneTab.tsx`, `FaceTab.tsx`, `SajuTab.tsx`

**Interfaces:**
- Consumes: Task 3의 `Button`, `Card`, `PageHeader`, `LoadingState`, `LevelPill`

- [ ] **Step 1: 착수 전 기준선 측정**

```bash
for f in PalmTab FortuneTab FaceTab SajuTab; do
  p=src/components/tabs/$f.tsx
  printf "%-12s 버튼:%s 카드후보:%s text-[:%s 원시색:%s\n" "$f" \
    "$(grep -c '<button' $p)" \
    "$(grep -c 'rounded-gal-xl' $p)" \
    "$(grep -oE 'text-\[[0-9]+px\]' $p | wc -l | tr -d ' ')" \
    "$(grep -oE '\b(text|bg|border)-(red|orange|amber|yellow|green|emerald|blue|indigo|purple|pink)-[0-9]{3}' $p | wc -l | tr -d ' ')"
done
```

출력을 리포트에 기록한다. 완료 후 같은 명령의 결과와 비교한다.

- [ ] **Step 2: 각 탭의 두 번째 히어로를 `<PageHeader>`로 교체**

`PalmTab.tsx:109`, `FortuneTab.tsx:303`, `FaceTab.tsx:133`, `SajuTab.tsx:227` 부근의 히어로 블록(배경 이미지 + 큰 제목)을 찾아 `<PageHeader>` 호출로 대체한다. 예:

```tsx
<PageHeader
  eyebrow={tc('saju.fourPillars')}
  title={t('title')}
  subtitle={t('subtitle')}
/>
```

**기존 i18n 키를 그대로 쓴다.** 새 문자열을 만들지 않는다. 히어로에만 쓰이던 키가 있으면 `PageHeader`의 `title`/`subtitle`로 옮기고, 남는 키는 삭제하지 않고 둔다(다른 참조가 있을 수 있다).

- [ ] **Step 3: 카드를 `<Card>`로 교체**

`bg-white rounded-gal-xl border border-gal-border p-N shadow-gal-card` 패턴을 `<Card>`로 바꾼다. 패딩이 `p-4`면 `padding="sm"`, `p-6`이면 기본, `p-8`이면 `padding="lg"`. `p-5`/`p-10`은 가장 가까운 것으로 반올림한다 — 5종을 3종으로 줄이는 것이 목적이다.

강조 카드(`border-gal-accent` 계열)는 `variant="accent"`로 통일한다. 현재 `border-gal-accent`와 `border-gal-accent/20`이 혼재한다.

- [ ] **Step 4: 버튼을 `<Button>`으로 교체**

주요 CTA는 `variant="primary"`, 보조는 `secondary`, 텍스트성은 `ghost`. `size`는 기본 `md`, 전체폭 CTA는 `fullWidth`.

**`<button>`의 `onClick`·`disabled`·`aria-*`는 그대로 옮긴다.** 동작을 바꾸지 않는다.

- [ ] **Step 5: 로딩·등급 교체**

로딩 블록을 `<LoadingState label={...} />`로, 운세 등급 표시를 `<LevelPill level={...} />`로 바꾼다. `FortuneTab.tsx:176-180`, `SajuTab.tsx:413-419`의 로컬 등급 표는 삭제한다.

- [ ] **Step 6: 임의값·원시색 제거**

`text-[10px]` 중 `tracking-[0.3em]`과 짝지어진 9곳은 `text-label` 한 클래스로 흡수한다(`text-label`이 0.625rem + 0.3em을 함께 갖는다). 나머지 `text-[10px]`와 `text-[11px]`는 `text-xs`로 보낸다.

**주의: `text-label-lg`는 존재하지 않는다.** Task 1에서 소비자가 0이라 삭제했다. Tailwind는 모르는 유틸리티에 에러를 내지 않고 **아무것도 emit하지 않으므로**, 이걸 쓰면 해당 요소가 부모 폰트 크기를 상속하며 빌드·타입체크 어디에도 안 걸린다.

**주의: `tracking-widest`는 0.3em이 아니라 Tailwind 기본값 0.1em이다.** Task 1에서 오버라이드를 걷어낸 결과다. 이미 0.1em으로 렌더되는 곳이 8군데 있다(`FortuneTab:271,275,279`, `SummaryTab:580,584,588`, `SajuTab:475`, `SubscriptionBanner:84`) — 이들은 그대로 두면 된다.

크기 스케일에 정확히 맞지 않는 6개(`9/13/15/28/32px`)는 가장 가까운 단계로 반올림하고 어느 쪽으로 갔는지 리포트에 남긴다.

원시 팔레트(`amber-600` 등)는 `status-*`로. **텍스트에는 `text-status-*`(ink), 배경에는 `bg-status-*-light`(tint)를 쓴다.** ink를 배경으로 쓰면 그 위 `gal-black` 텍스트가 AA에 미달한다(2.60~3.47).

- [ ] **Step 7: 빌드·타입·회귀 검사**

```bash
npm run build
npx tsc --noEmit --skipLibCheck --jsx react-jsx --target ES2020 --module ESNext \
  --moduleResolution bundler --lib ES2020,DOM,DOM.Iterable \
  src/components/tabs/PalmTab.tsx src/components/tabs/FortuneTab.tsx \
  src/components/tabs/FaceTab.tsx src/components/tabs/SajuTab.tsx
```

그리고 Step 1의 측정을 다시 돌려 감소를 확인한다.

- [ ] **Step 8: 커밋**

```bash
git add src/components/tabs/PalmTab.tsx src/components/tabs/FortuneTab.tsx src/components/tabs/FaceTab.tsx src/components/tabs/SajuTab.tsx
git commit -m "refactor(ui): 경량 4개 탭을 공용 프리미티브로 수렴

Palm/Fortune/Face/Saju. 탭별 두 번째 히어로를 PageHeader 로 대체하고
카드·버튼·로딩·등급 배지를 프리미티브로 교체한다. 동작 변경 없음."
git push
```

---

### Task 5: 탭 수렴 B — 중량 4개

`SummaryTab`(639), `OmenTab`(708), `FaceHarmonyTab`(780), `FashionTab`(803).

**Files:**
- Modify: `src/components/tabs/SummaryTab.tsx`, `OmenTab.tsx`, `FaceHarmonyTab.tsx`, `FashionTab.tsx`

**Interfaces:**
- Consumes: Task 3의 프리미티브 전부

- [ ] **Step 1: 기준선 측정**

```bash
for f in SummaryTab OmenTab FaceHarmonyTab FashionTab; do
  p=src/components/tabs/$f.tsx
  printf "%-16s 버튼:%s 카드후보:%s text-[:%s 원시색:%s 하드코딩hex:%s\n" "$f" \
    "$(grep -c '<button' $p)" "$(grep -c 'rounded-gal-xl' $p)" \
    "$(grep -oE 'text-\[[0-9]+px\]' $p | wc -l | tr -d ' ')" \
    "$(grep -oE '\b(text|bg|border)-(red|orange|amber|yellow|green|emerald|blue|indigo|purple|pink)-[0-9]{3}' $p | wc -l | tr -d ' ')" \
    "$(grep -oE '#[0-9a-fA-F]{6}' $p | wc -l | tr -d ' ')"
done
```

- [ ] **Step 2: `OmenTab`의 세 번째 `<h1>` 제거**

`OmenTab.tsx:326-329`가 기본 탭 첫 화면에 **MYSTIC / AI** 를 렌더한다 — 저장소에서 세 번째 브랜드 표기다. 이 `<h1>` 블록을 삭제하고 `<PageHeader>`로 대체한다.

대응 로케일 키 `omenTab.heroTitle1` / `omenTab.heroTitle2`(`ko/common.json:132-133`, `en/common.json:121-122`)도 삭제한다. 삭제 전 다른 참조가 없는지 확인한다:

```bash
grep -rn "heroTitle1\|heroTitle2" src/
```

- [ ] **Step 3: `SummaryTab`의 결과 카드 색 통일**

`:432/478/523`이 파랑, `:542`가 회색으로 동급 카드 4개의 강조가 어긋나 있다. 네 개 모두 `<Card variant="base">`로 통일하거나, 강조가 필요하면 넷 다 `accent`로 한다. **넷을 같게 만드는 것이 요점이다.**

- [ ] **Step 4: `FaceHarmonyTab` 정렬 문제 해결**

이 탭만 `max-w-md`가 없어 카드가 ~830px로 벌어지는데 자기 리셋 버튼(`:572`)에는 `max-w-md`가 있어 같은 화면에서 어긋난다. 다른 탭과 동일하게 `max-w-md mx-auto`를 적용한다.

혼자 쓰는 여백 체계(`mx-2`/`mx-4`)를 다른 탭의 `px-4`로 맞춘다.

설정에 없는 하드코딩 파랑 3개(`:92` `#5bb8f5`/`#7ec8f8`/`#3daef4`)를 토큰으로 교체한다.

**번역(`t()` 호출 0건)은 이번 범위가 아니다.** 스펙 §4에 명시돼 있다. 건드리지 않는다.

- [ ] **Step 5: 나머지 프리미티브 교체**

Task 4 Step 3~6과 동일한 방식으로 카드·버튼·로딩·등급·임의값·원시색을 교체한다. `SummaryTab.tsx:320-328`의 로컬 등급 표와 `OmenTab.tsx:465-470`의 인라인 삼항식은 `<LevelPill>`로 대체하고 삭제한다.

- [ ] **Step 6: 빌드·타입 검사**

```bash
npm run build
npx tsc --noEmit --skipLibCheck --jsx react-jsx --target ES2020 --module ESNext \
  --moduleResolution bundler --lib ES2020,DOM,DOM.Iterable \
  src/components/tabs/SummaryTab.tsx src/components/tabs/OmenTab.tsx \
  src/components/tabs/FaceHarmonyTab.tsx src/components/tabs/FashionTab.tsx
```

- [ ] **Step 7: U5·U6·U7 — 수렴 목표 달성 확인**

```bash
echo "=== U5 버튼 스타일 서명 ==="
grep -rhoE 'className="[^"]*"' src/components/tabs/*.tsx | grep -E 'bg-gal-accent|border-gal-border' | sort -u | wc -l
echo "=== U7 임의 폰트 크기 ==="
grep -rhoE 'text-\[[0-9]+px\]' src/components/tabs/*.tsx src/components/*.tsx | wc -l
echo "=== 원시 팔레트 잔량 ==="
grep -rhoE '\b(text|bg|border)-(red|orange|amber|yellow|green|emerald|blue|indigo|purple|pink)-[0-9]{3}' src/components/tabs/*.tsx | wc -l
```

기대: U7의 `text-[Npx]`가 **0**. 버튼·원시색은 기준선 대비 큰 폭 감소.

**U5·U6의 정식 판정은 프리미티브의 variant 수로 한다** — `Button.tsx`의 `VARIANTS` 키가 4개(primary/secondary/ghost/danger), `Card.tsx`가 3개(base/accent/muted)이면 목표 달성이다. 위 grep은 탭에 남은 잔량을 보는 보조 지표다.

```bash
echo "U5 버튼 variant 수: $(grep -cE '^\s+(primary|secondary|ghost|danger):' src/components/ui/Button.tsx)"
echo "U6 카드 variant 수: $(grep -cE '^\s+(base|accent|muted):' src/components/ui/Card.tsx)"
```

기대: 4, 3.

- [ ] **Step 8: U10 — 모바일 회귀 방지 확인**

프리뷰 `https://feat-ui-redesign.gweh-3s2.pages.dev` 에서 브라우저 개발자도구를 390×844로 두고 8개 탭을 모두 방문하여 가로 스크롤이 생기지 않는지 확인한다. 콘솔에서:

```js
document.documentElement.scrollWidth
```

기대: 모든 탭에서 **390**. 이건 개편 전에 정상이던 것으로, 깨뜨리지 않았는지 확인하는 회귀 검사다.

- [ ] **Step 9: 커밋**

```bash
git add src/components/tabs/SummaryTab.tsx src/components/tabs/OmenTab.tsx src/components/tabs/FaceHarmonyTab.tsx src/components/tabs/FashionTab.tsx src/locales/ko/common.json src/locales/en/common.json
git commit -m "refactor(ui): 중량 4개 탭 수렴 + 세 번째 브랜드 표기 제거

Summary/Omen/FaceHarmony/Fashion.

- OmenTab:326-329 의 세 번째 <h1>(MYSTIC/AI) 삭제. 기본 탭 첫 화면에
  저장소 세 번째 브랜드 표기가 렌더되고 있었다.
- SummaryTab 동급 결과 카드 4개 중 3개만 파랑이던 것을 통일
- FaceHarmonyTab 에 max-w-md 적용. 카드가 ~830px 로 벌어지는데 자기
  리셋 버튼에는 max-w-md 가 있어 같은 화면에서 어긋나 있었다.
- 하드코딩 hex 와 원시 팔레트를 토큰으로 교체

FaceHarmonyTab 의 번역 누락(t() 0건)은 스펙 §4 에 따라 범위 밖."
git push
```

---

### Task 6: 접근성

**Files:**
- Modify: `src/components/camera/CameraCapture.tsx`, `src/components/tabs/FashionTab.tsx`, `FaceHarmonyTab.tsx`, `src/components/auth/AuthModal.tsx`, `ProfileModal.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: 사진 업로드를 실제 버튼으로**

5곳이 `tabIndex`·`role`·키 핸들러 없는 맨 `<div onClick>`이고, 프록시하는 `<input type="file">`은 `className="hidden"`이다. **키보드 사용자는 패션·관상·손금·궁합에 사진을 넣을 수 없다.**

대상: `CameraCapture.tsx:308`·`:316`, `FashionTab.tsx:480`·`:509`, `FaceHarmonyTab.tsx:662`·`:672`·`:228`.

각 `<div onClick={...} className="... cursor-pointer">` 를 `<button type="button" onClick={...} className="...">` 로 바꾼다. `cursor-pointer`는 버튼 기본값이라 제거한다. 내부에 다른 버튼이 중첩되지 않는지 확인한다 — 중첩되면 바깥을 버튼으로 만들 수 없으므로 그 경우 `role="button"` + `tabIndex={0}` + `onKeyDown`(Enter/Space)으로 처리하고 이유를 리포트에 남긴다.

- [ ] **Step 2: 모달에 dialog 시맨틱**

`AuthModal.tsx`와 `ProfileModal.tsx`의 최상위 오버레이에 추가한다:

```tsx
role="dialog"
aria-modal="true"
aria-labelledby="<모달 제목 요소의 id>"
```

포커스 트랩과 복원을 넣는다. 모달 컴포넌트 안에:

```tsx
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const focusables = node?.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);
```

`dialogRef`를 오버레이 내부 패널에 붙인다. `useRef`·`useEffect` 임포트를 확인한다.

- [ ] **Step 3: 토스트에 `aria-live`**

`App.tsx`의 토스트 블록(`{toast && (`)의 바깥 `<div>`에 `role="status"`와 `aria-live="polite"`를 추가한다.

- [ ] **Step 4: 카메라 리플로우 제거**

`CameraCapture.tsx:251-260`의 `<Webcam>`이 종횡비를 예약하지 않아 UA 기본 300×150으로 렌더됐다가 스트림이 붙으면 304×304로 점프한다 — 사용자가 촬영 버튼으로 손을 뻗는 순간 154px 리플로우가 일어난다.

`<Webcam>`을 감싸는 컨테이너에 `aspect-square w-full` 을 주고 `<Webcam>`에 `className="w-full h-full object-cover"` 를 적용한다.

- [ ] **Step 5: `prefers-reduced-motion` 대응**

`src/index.css` 맨 끝에 추가한다. 명명 애니메이션이 14종인데 대응이 0건이다.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 6: U9 — 키보드로 사진 업로드 확인**

프리뷰에서 `#fashion` 탭을 열고 **마우스를 쓰지 않고** Tab만으로 업로드 영역까지 이동한 뒤 Enter를 눌러 파일 선택 창이 뜨는지 확인한다. `#face`, `#palm`, `#harmony`에서도 반복한다.

기대: 4개 탭 전부에서 파일 선택 창이 열린다. 결과를 리포트에 기록한다.

- [ ] **Step 7: 빌드·커밋**

```bash
npm run build
git add src/components/camera/CameraCapture.tsx src/components/tabs/FashionTab.tsx src/components/tabs/FaceHarmonyTab.tsx src/components/auth/AuthModal.tsx src/components/auth/ProfileModal.tsx src/App.tsx src/index.css
git commit -m "fix(a11y): 키보드 사진 업로드, 모달 시맨틱, 카메라 리플로우

- 사진 업로드 타깃 5곳이 tabIndex/role/키핸들러 없는 div onClick 이고
  프록시하는 input[type=file] 이 hidden 이라, 키보드 사용자는 패션·관상·
  손금·궁합에 사진을 넣을 수 없었다. 실제 button 으로 교체.
- 모달 2개에 role=dialog + aria-modal + 포커스 트랩 + 복원
- 토스트에 role=status + aria-live
- CameraCapture 의 Webcam 이 종횡비를 예약하지 않아 촬영 버튼으로 손을
  뻗는 순간 154px 리플로우가 났다. aspect-square 예약.
- prefers-reduced-motion 대응 (명명 애니메이션 14종에 대응 0건이었다)"
git push
```

---

### Task 7: 다크 전환

**여기서 비로소 다크가 된다.** 앞 6단계 덕분에 색이 토큰에 모여 있어 이 단계는 값 교체가 대부분이다.

**Files:**
- Modify: `tailwind.config.js`, `src/index.css`, `src/components/HeroSection.tsx`, `src/components/layout/AppHeader.tsx`, `src/components/Navigation.tsx`, `src/components/ui/*.tsx`

- [ ] **Step 1: 다크 팔레트가 AA를 만족하는지 먼저 확인**

```bash
node scripts/check-contrast.mjs --dark
```

기대: **8건 전부 PASS.** 하나라도 FAIL이면 값을 조정하고 다시 돌린다. 코드를 고치기 전에 이걸 통과시킨다.

- [ ] **Step 2: `tailwind.config.js`의 `gal-*` 색 값 교체**

이름은 유지하고 값만 바꾼다. 이름을 바꾸면 전 파일을 다시 만져야 한다.

```js
        "gal-black": "#f6f6f8",   // 최상위 텍스트 (반전)
        "gal-dark": "#e2dded",
        "gal-body": "#b8b0c8",    // 9.1:1
        "gal-muted": "#8b8299",   // 4.8:1  ← 이전 #999999 는 2.85:1 이었다
        "gal-border": "#3a2f52",
        "gal-light": "#1e1630",   // 카드/서피스
        "gal-bg": "#161022",      // 페이지 배경
        "gal-accent": "#5b13ec",  // 채움 전용. 흰 글씨 7.64:1
        "gal-accent-dark": "#4a0fc4",
        "gal-accent-light": "#2a1f42",
        "gal-accent-ink": "#a78bfa",  // 텍스트/아이콘 전용. base 위 6.82:1
        "gal-footer": "#0f0b18",
```

`gal-accent-ink`가 신규다. **`text-gal-accent`로 쓰이던 곳을 `text-gal-accent-ink`로 바꿔야 한다** — 그대로 두면 2.43:1이 된다.

- [ ] **Step 3: 상태색을 다크용으로 교체**

```js
        "status-success": "#4ade80",
        "status-warning": "#fbbf24",
        "status-danger":  "#f87171",
        "status-info":    "#60a5fa",
```

밝은 값이어야 어두운 배경에서 읽힌다. Step 1의 스크립트에 이 4개를 `#161022` 배경으로 추가해 4.5:1 이상인지 확인한다.

- [ ] **Step 4: `text-gal-accent` → `text-gal-accent-ink` 일괄 치환**

```bash
grep -rln 'text-gal-accent\b' src/ | while read f; do
  sed -i '' 's/text-gal-accent\b/text-gal-accent-ink/g' "$f"
done
grep -rn 'text-gal-accent\b' src/ && echo "!!! 남음 !!!" || echo "OK"
```

`text-gal-accent-light`/`-dark`가 오염되지 않았는지 확인한다(`\b` 경계로 막았지만 결과를 눈으로 본다).

- [ ] **Step 5: 흰 배경 하드코딩 치환**

`bg-white`가 카드 배경으로 쓰인 곳을 `bg-gal-light`로 바꾼다. `AppHeader`의 `bg-white/95`는 `bg-gal-bg/95`로, `Navigation`의 `bg-white`는 `bg-gal-bg`로.

```bash
grep -rn 'bg-white' src/ | wc -l
```

교체 후 남은 것이 의도적인지(예: 액센트 버튼 위 흰 글씨) 확인한다.

- [ ] **Step 6: `index.html`의 크리티컬 CSS와 `theme-color`**

`:7` `<meta name="theme-color" content="#ffffff" />` → `content="#161022"`.
`:51` `body{...background:#ffffff;color:#1a1a1a;...}` → `background:#161022;color:#f6f6f8;`.
`.init-loader` 색도 함께 맞춘다. 이걸 안 바꾸면 앱 부팅 전 흰 화면이 번쩍인다.

- [ ] **Step 7: 히어로 조정**

`HeroSection.tsx`의 `min-h-screen` → `min-h-dvh`. 현재 CTA 하단이 iPhone SE(667px)에서 y=694, 영어에서 y=716로 화면 밖이다.

하단 그라디언트 전환(`:156` 부근)이 이제 흰색이 아니라 `#161022`로 이어져야 한다 — `via-white/50 to-white` 계열을 `via-gal-bg/50 to-gal-bg`로 바꾼다. 이 전환이 이번 개편에서 **가장 단순해지는 부분**이다. 위아래가 같은 색이 되므로 그라디언트가 더 이상 색을 건너뛰지 않는다.

스크롤 큐가 `text-white/15`(1.56:1)로 자기 그라디언트에 덮여 있는 것을 `text-gal-body`로 바꾸고 그라디언트 위로 올린다.

- [ ] **Step 8: U1 + U11 확인**

```bash
node scripts/check-contrast.mjs --dark && npm run build
```

프리뷰에서 개발자도구를 **375×667(iPhone SE)** 로 두고 히어로의 CTA 버튼이 화면 안에 보이는지 확인한다(U11). 영어로도 확인한다 — 영어가 22px 더 길다.

- [ ] **Step 9: 커밋**

```bash
git add tailwind.config.js src/index.css index.html src/components/
git commit -m "feat(ui): 다크 퍼플 미스틱 전환

토큰 값 교체가 대부분이다 — 1~6단계에서 색을 토큰에 모아둔 덕분이다.

- 액센트를 채움(#5b13ec, 흰글씨 7.64:1)과 잉크(#a78bfa, 배경 위 6.82:1)
  두 역할로 분리. 레퍼런스 값을 텍스트로 쓰면 2.43:1 로 실패한다.
- gal-muted 2.85:1 → 4.8:1, gal-border 1.26:1 → 실제로 보이는 값
- theme-color 와 크리티컬 CSS 도 함께 (안 바꾸면 부팅 전 흰 화면 번쩍임)
- 히어로 min-h-screen → min-h-dvh. iPhone SE 에서 CTA 가 화면 밖이었다.
- 하단 그라디언트가 이제 같은 색으로 이어진다 — 다크/화이트 이음매가
  구조적으로 사라진다

design/screen.png, design/code.html, 구독자 메일과 팔레트가 일치한다."
git push
```

---

### Task 8: 브랜드·자산 통일 및 머지

**Files:**
- Modify: `index.html`, `workers/daily-cron/worker.ts`, `public/favicon.svg`
- Create: `public/og-image.svg`

- [ ] **Step 1: `index.html`의 브랜드 교체**

`:10`(title), `:11`(meta title), `:18`(og:title), `:23`(og:site_name), `:29`(twitter:title), `:62`(init-loader의 `<h1>`)의 `MYSTIC AI`를 `GWEH AI`로 바꾼다.

```bash
grep -n "MYSTIC\|Mystic" index.html
```

기대: 교체 후 0건.

- [ ] **Step 2: 워커 메일 템플릿의 브랜드 교체**

`workers/daily-cron/worker.ts`의 `Mystic AI` ×2, `MYSTIC AI` ×1을 `GWEH AI`로 바꾼다. `from: 'Mystic AI <onboarding@resend.dev>'` 두 곳(구독자 메일과 셀프체크 경보)이 포함된다.

```bash
grep -rn "Mystic\|MYSTIC" workers/
```

- [ ] **Step 3: favicon 교체**

`public/favicon.svg`가 어느 팔레트와도 맞지 않는 금색(`#d4af37`)이다. 액센트 계열로 바꾼다:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#161022"/>
  <circle cx="32" cy="32" r="17" fill="none" stroke="#a78bfa" stroke-width="3"/>
  <path d="M32 15a17 17 0 0 0 0 34z" fill="#5b13ec"/>
</svg>
```

- [ ] **Step 4: og-image 생성**

`index.html:20,31`이 `/og-image.jpg`를 가리키는데 파일이 없다. `public/_redirects`의 catch-all 때문에 404 대신 HTML이 반환되어 SNS 공유 카드가 깨진다.

`public/og-image.svg`를 만들고 `index.html`의 참조를 `.svg`로 바꾼다:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#161022"/>
  <circle cx="1000" cy="150" r="220" fill="#5b13ec" opacity="0.25"/>
  <circle cx="200" cy="520" r="180" fill="#a78bfa" opacity="0.15"/>
  <text x="80" y="300" font-family="Space Grotesk, Noto Sans KR, sans-serif" font-size="96" font-weight="700" fill="#f6f6f8">GWEH AI</text>
  <text x="80" y="370" font-family="Noto Sans KR, sans-serif" font-size="34" fill="#b8b0c8">AI가 읽는 관상 · 손금 · 사주</text>
</svg>
```

`og:image:width`/`height`(1200×630)는 그대로 맞다.

- [ ] **Step 5: robots.txt의 sitemap 확인**

```bash
cat public/robots.txt
curl -s -o /dev/null -w "%{content_type}\n" https://gweh-3s2.pages.dev/sitemap.xml
```

`content_type`이 `text/html`이면 파일이 없는 것이다(catch-all이 index.html을 반환). 없으면 `robots.txt`의 `Sitemap:` 줄을 삭제한다 — 존재하지 않는 것을 가리키는 것보다 낫다.

- [ ] **Step 6: U8 — 브랜드 통일 확인**

```bash
grep -rn "MYSTIC\|Mystic" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs --exclude-dir=design . | grep -v "mystic_language\|mystic_ai_storage\|mystic_birth\|mystic_saju\|mystic_has_visited\|mystic-daily-cron"
```

기대: 0건. `localStorage` 키(`mystic_language` 등)와 워커 이름(`mystic-daily-cron`)은 **바꾸지 않는다** — 사용자 데이터와 배포 대상이 걸려 있다. 이건 의도적 예외이며 리포트에 명시한다.

- [ ] **Step 7: 전체 검증**

```bash
echo "--- U1 대비 ---"; node scripts/check-contrast.mjs --dark
echo "--- U7 임의 폰트크기 ---"; grep -rhoE 'text-\[[0-9]+px\]' src/ | wc -l
echo "--- U12 빌드 ---"; npm run build && echo BUILD_OK
echo "--- U12 타입 ---"; npm run typecheck
```

U1 전부 PASS, U7 = 0, 빌드 성공, 타입은 기존 4건(`checkout.ts:79,80`, `subscribe.ts:75`×2) 외 신규 0.

- [ ] **Step 8: U1~U12 결과표 작성**

각 항목의 통과 여부와 건너뛴 항목의 사유를 적는다. 브라우저가 필요한 U2·U3·U4·U9·U10·U11은 실제로 수행했는지 명시한다. **조용히 빠뜨리면 "전부 검증됨"으로 오해된다.**

- [ ] **Step 9: main 머지 및 푸시**

```bash
git add index.html workers/daily-cron/worker.ts public/
git commit -m "feat(ui): 브랜드 통일 및 자산 정리

MYSTIC AI(index.html 6곳, worker 3곳)와 GWEH AI(앱 2곳)가 동시에
존재해 구독자 메일과 앱이 서로 다른 제품처럼 보였다. GWEH AI 로 통일.
저장소명·도메인이 gweh 이고 가장 최근 디자인 작업의 선택이다.

- favicon 금색(#d4af37, 어느 팔레트와도 불일치) → 액센트 계열
- og-image 신설. 파일이 없어 _redirects catch-all 이 HTML 을 반환해
  SNS 공유 카드가 깨져 있었다.
- localStorage 키(mystic_*)와 워커 이름은 유지 — 사용자 데이터와
  배포 대상이 걸려 있다"
git push

git checkout main
git merge --no-ff feat/ui-redesign -m "feat(ui): UI 전면 개편 — 앱 셸, 공용 프리미티브, 다크 퍼플 전환

지난 7번의 리디자인이 전부 '색만 바꾸고 구조는 두고 가기'였고 그 결과
버튼 스타일 29가지, 카드 25가지, 로딩 6가지가 쌓였다. 이번에는 순서를
뒤집어 셸과 공용 컴포넌트를 먼저 세우고 다크 전환을 토큰 교체로 끝냈다.

설계: docs/superpowers/specs/2026-07-29-ui-redesign-design.md
계획: docs/superpowers/plans/2026-07-29-ui-redesign.md"
git push origin main
```

- [ ] **Step 10: 운영 배포 확인**

```bash
sleep 60
curl -s https://gweh-3s2.pages.dev/ | grep -o "GWEH AI" | head -1
curl -sI https://gweh-3s2.pages.dev/og-image.svg | grep -i content-type
```

기대: `GWEH AI`, `content-type: image/svg+xml`.

브라우저로 운영 사이트를 열어 다크 테마가 적용됐는지, 8개 탭을 순회하며 시각적 회귀가 없는지 확인한다.

---

## 다음 단계 (이 계획 밖)

1. **`FaceHarmonyTab` 번역** — 780줄, `t()` 호출 0건. 영어 사용자에게 이 탭만 한국어다. 분량이 크고 UI 개편과 독립적이라 별도 작업.
2. **장애 복구 스펙의 미완 항목** — `2026-07-28-error-recovery-design.md` §9. worker 배포, V5~V12, checkout 이메일 연결.
