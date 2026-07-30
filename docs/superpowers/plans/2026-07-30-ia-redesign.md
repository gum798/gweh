# GWEH 정보구조 재설계 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 라벨 없는 이모지 탭바를 없애고, 이미 존재하는 히어로 서비스 그리드를 8개짜리 홈 화면으로 승격시킨다.

**Architecture:** 홈 화면을 새로 만들지 않는다. `HeroSection`이 이미 서비스 카드 6개를 렌더하고 `handleServiceClick`으로 탭을 전환하며 `descKey`까지 갖고 있다. 카드 2개를 더하고 설명을 표시하고 탭바를 제거하면 홈이 된다. 라우팅은 `tabs.ts`의 기존 3분기 해시 규칙에 `home`을 더하는 것으로 끝난다.

**Tech Stack:** React 19, Vite 6, TypeScript, Tailwind 3, i18next (ko/en), Cloudflare Pages

**설계 근거:** `docs/superpowers/specs/2026-07-30-ia-redesign-design.md`

## Global Constraints

- **기능 변경 금지.** 점술 로직·API·데이터 흐름·인증·결제 무변경. 바뀌는 것은 내비게이션 구조와 정렬뿐이다.
- 모든 사용자 노출 문자열은 `t()`. **이 계획에서는 키 추가가 허용된다** (`hero.omenDesc` 등이 없다). ko/en 양쪽에 넣는다. 한쪽만 넣으면 i18next가 키 문자열을 그대로 노출한다.
- 다크 팔레트 값을 바꾸지 않는다. 텍스트는 `text-gal-*`/`text-status-*`(ink), 배경은 `bg-status-*-light`(tint).
- **주석에 살아있는 Tailwind 유틸리티 이름을 쓰지 않는다.** 콘텐츠 스캐너가 읽어 죽은 CSS를 배출한다. 이 저장소가 세 번 당했다.
- `Button`·`Card`는 `className` radius를 존중한다(`src/components/ui/radius.ts`). `Skeleton`도 같은 헬퍼를 쓴다.
- 작업 브랜치 `feat/ia-redesign`. 단계별 커밋, 완료 후 `main` 머지.
- 테스트 러너 없음. 검증은 게이트 + 브라우저 + **실기기 스크린샷**.

## 파일 구조

| 파일 | 상태 | 책임 |
|---|---|---|
| `src/lib/tabs.ts` | 수정 | 화면 식별자의 유일한 정의. `home` 추가 |
| `src/components/HeroSection.tsx` | 수정 | 홈 화면. 서비스 8개 + 설명 + 2열 |
| `src/components/layout/AppHeader.tsx` | 수정 | 홈에서는 로고, 서비스에서는 뒤로 가기 |
| `src/App.tsx` | 수정 | 렌더러 테이블에 `home`, `Navigation` 제거 |
| `src/components/Navigation.tsx` | **삭제** | 탭바. 이모지 8개 문제의 출처 |
| `src/locales/{ko,en}/common.json` | 수정 | `hero.omenDesc`·`hero.summaryDesc`·뒤로가기 라벨 |
| `src/components/tabs/SajuTab.tsx` | 수정 | date input 이탈, 정렬 |
| `src/components/subscription/SubscriptionBanner.tsx` | 수정 | 부유 배너 위치 |

---

### Task 1: 라우팅에 `home` 추가

**Files:**
- Modify: `src/lib/tabs.ts:30-54`, `src/App.tsx` (`TAB_RENDERERS`)

**Interfaces:**
- Produces: `TabId`에 `'home'` 포함, `DEFAULT_TAB === 'home'` — Task 2·3이 사용한다.

- [ ] **Step 1: 브랜치**

```bash
cd /Users/seojeonghwa/project/gweh && git checkout -b feat/ia-redesign
```

- [ ] **Step 2: `TABS`에 `home` 추가**

`src/lib/tabs.ts`의 `TABS` 배열 **맨 앞**에 넣는다. 순서가 곧 홈 화면 카드 순서는 아니지만(Task 2가 별도 배열을 쓴다), `home`이 첫 항목인 편이 읽기 쉽다.

```ts
  { id: 'home', labelKey: 'nav.home', icon: '🏠' },
```

`icon`과 `labelKey`는 타입이 요구하므로 채운다. 탭바가 사라지므로 실제로 렌더되지는 않지만, `nav.home` 키는 Step 4에서 로케일에 추가한다 — 존재하지 않는 키를 참조하는 상태로 두지 않는다.

- [ ] **Step 3: `DEFAULT_TAB` 변경**

```ts
export const DEFAULT_TAB: TabId = 'home';
```

`resolveTabOnLoad`와 `resolveTabOnHashChange`는 이미 `DEFAULT_TAB`을 참조하므로 자동으로 따라온다. 세 분기 규칙(초기 미인식→기본, hashchange 빈 해시→기본, hashchange 비탭 해시→null)은 그대로 유지한다. **그 주석 블록을 지우지 마라** — 세 경우를 합치면 스킵링크가 화면을 리셋한다는 것이 그 주석의 요지다.

- [ ] **Step 4: 로케일에 `nav.home` 추가**

`src/locales/ko/common.json`의 `"nav.omen"` 줄 앞:

```json
  "nav.home": "홈",
```

`src/locales/en/common.json`의 대응 위치:

```json
  "nav.home": "Home",
```

- [ ] **Step 5: `App.tsx` 렌더러 테이블에 `home` 추가**

`TAB_RENDERERS`는 `Record<TabId, TabRenderer>`이므로 `home`을 넣지 않으면 컴파일 에러가 난다. 홈은 히어로가 그리므로 렌더러는 `null`을 반환한다:

```tsx
  home: () => null,
```

`TAB_RENDERERS`의 첫 항목으로 넣는다. Task 2에서 `App.tsx`가 홈일 때 콘텐츠 영역을 비우고 히어로만 보이게 조정한다.

- [ ] **Step 6: 검증 및 커밋**

```bash
npm run build
npm run typecheck:app:gate
python3 -c "
import json
ko=set(json.load(open('src/locales/ko/common.json')))
en=set(json.load(open('src/locales/en/common.json')))
print('ko에만:', sorted(ko-en)); print('en에만:', sorted(en-ko))
"
```

기대: 빌드 성공, 게이트 `18 known, 0 new`(줄 이동 시 베이스라인 절차), 로케일 양쪽 빈 목록.

```bash
git add src/lib/tabs.ts src/App.tsx src/locales/ko/common.json src/locales/en/common.json
git commit -m "feat(ia): 라우팅에 home 화면 추가

TabId 에 home 을 더하고 DEFAULT_TAB 을 옮긴다. Record<TabId, TabRenderer>
가 렌더러 누락을 컴파일 타임에 잡으므로 홈도 항목을 갖는다.
기존 #omen 등 해시는 그대로 동작하며, 바뀌는 것은 해시가 없을 때의 착지점뿐이다."
git push -u origin feat/ia-redesign
```

---

### Task 2: 히어로를 홈 화면으로

**Files:**
- Modify: `src/components/HeroSection.tsx:16-21` (서비스 배열), `:101` (그리드), `:105-112` (카드)
- Modify: `src/App.tsx` (홈일 때 콘텐츠 영역 처리)
- Modify: `src/locales/{ko,en}/common.json`

**Interfaces:**
- Consumes: Task 1의 `TabId`에 포함된 `'home'`

- [ ] **Step 1: 아이콘 두 종 추가**

`HeroSection.tsx`의 `ServiceIcon` 컴포넌트를 먼저 읽는다 — 기존 6종이 어떤 방식으로 분기하는지(`type` prop의 switch인지 맵인지) 확인하고 **그 방식을 그대로 따른다.** 기존 아이콘들은 1.5 스트로크의 24×24 라인 아이콘이며, 감사에서 "저장소에서 가장 잘 만들어진 컴포넌트"로 평가된 부분이다. 새 두 개도 같은 스트로크 굵기와 뷰박스를 쓴다.

- `omen` — 오늘의 괘. 팔괘/음양 계열이 주제에 맞는다.
- `summary` — 통합 리포트. 문서나 차트 계열.

기존 아이콘과 시각적 무게가 맞는지 육안으로 확인한다. 안 맞으면 스트로크와 여백을 맞춘다.

- [ ] **Step 2: 서비스 배열을 8개로**

`HeroSection.tsx:16-21`의 배열에 두 항목을 더한다. `omen`을 맨 앞에, `summary`를 맨 뒤에 두면 "오늘 → 개별 분석 → 종합"으로 읽힌다:

```ts
  { id: 'omen', icon: 'omen', labelKey: 'hero.omen', descKey: 'hero.omenDesc' },
  { id: 'face', icon: 'face', labelKey: 'hero.face', descKey: 'hero.faceDesc' },
  { id: 'palm', icon: 'palm', labelKey: 'hero.palm', descKey: 'hero.palmDesc' },
  { id: 'saju', icon: 'saju', labelKey: 'hero.saju', descKey: 'hero.sajuDesc' },
  { id: 'fortune', icon: 'fortune', labelKey: 'hero.fortune', descKey: 'hero.fortuneDesc' },
  { id: 'harmony', icon: 'harmony', labelKey: 'hero.harmony', descKey: 'hero.harmonyDesc' },
  { id: 'fashion', icon: 'fashion', labelKey: 'hero.fashion', descKey: 'hero.fashionDesc' },
  { id: 'summary', icon: 'summary', labelKey: 'hero.summary', descKey: 'hero.summaryDesc' },
```

- [ ] **Step 3: 누락된 로케일 키 4개 추가**

`hero.omen`·`hero.omenDesc`·`hero.summary`·`hero.summaryDesc`가 없다. 기존 `hero.*Desc` 값들의 길이와 어조를 먼저 읽고 맞춘다 — 카드에 한 줄로 들어가야 하므로 기존 것보다 길면 안 된다.

ko:
```json
  "hero.omen": "오늘의 괘",
  "hero.omenDesc": "날씨와 달, 대지가 전하는 오늘의 기운",
  "hero.summary": "통합 리포트",
  "hero.summaryDesc": "모든 분석을 한 장으로",
```

en:
```json
  "hero.omen": "Today's Omen",
  "hero.omenDesc": "Today's energy from sky, moon and earth",
  "hero.summary": "Full Report",
  "hero.summaryDesc": "Every reading on one page",
```

- [ ] **Step 4: 그리드를 2열로, 설명 표시**

`HeroSection.tsx:101`의 그리드 클래스에서 `grid-cols-3 md:grid-cols-6`을 `grid-cols-2 md:grid-cols-4`로 바꾼다. 3열은 카드 폭이 좁아 설명이 들어가지 않는다.

`:108`의 라벨 `<span>` 다음에 설명을 추가한다. 라벨은 `text-[9px] md:text-[10px]`이므로 설명은 그보다 작으면 안 읽힌다 — 같은 크기로 두고 색으로 위계를 만든다:

```tsx
              <span className="text-[10px] text-gal-muted leading-snug text-center px-1 normal-case tracking-normal">
                {t(item.descKey)}
              </span>
```

기존 라벨 `<span>`이 `uppercase tracking-[0.12em]`을 쓰므로 설명에는 `normal-case tracking-normal`을 명시해 상속을 끊는다.

카드 자체의 세로 여백(`py-3.5 md:py-4`)이 두 줄을 담기에 충분한지 확인하고, 부족하면 늘린다. **간격 스케일 밖의 임의값을 쓰지 않는다.**

- [ ] **Step 5: 홈일 때 콘텐츠 영역 처리**

`App.tsx`에서 `activeTab === 'home'`이면 `#app-content` 안이 비게 된다(`home: () => null`). 빈 컨테이너가 여백만 차지하지 않도록, 홈일 때는 `#app-content`를 렌더하지 않거나 패딩을 제거한다. 어느 쪽이든 **스킵 링크의 대상(`#app-content`)이 사라지면 안 된다** — 스킵 링크는 항상 있어야 하므로, 요소는 남기고 내용만 비우는 쪽이 안전하다.

- [ ] **Step 6: 검증 및 커밋**

```bash
npm run build && npm run typecheck:app:gate && node scripts/check-contrast.mjs --dark
```

브라우저(헤드리스 가능)로 390×844와 1280×768에서 홈을 열어 확인한다:
- 카드 8개가 전부 보이는가
- 이름과 설명이 잘리지 않는가
- `document.documentElement.scrollWidth === clientWidth`

```bash
git add src/components/HeroSection.tsx src/App.tsx src/locales/ko/common.json src/locales/en/common.json
git commit -m "feat(ia): 히어로 서비스 그리드를 8개짜리 홈 화면으로

이미 있던 카드 6개에 omen·summary 를 더하고, 정의만 되어 있고 렌더되지
않던 descKey 를 표시한다. 3열은 설명이 들어가지 않아 2열로 바꿨다.
'무엇인지 모르겠다'가 여기서 해소된다."
git push
```

---

### Task 3: 헤더에 뒤로 가기

**Files:**
- Modify: `src/components/layout/AppHeader.tsx`, `src/App.tsx` (prop 전달)
- Modify: `src/locales/{ko,en}/common.json`

**Interfaces:**
- Consumes: Task 1의 `DEFAULT_TAB`
- Produces: `<AppHeader isHome onBack … />`

- [ ] **Step 1: 로케일에 라벨 추가**

ko: `"a11y.backToHome": "홈으로 돌아가기",`
en: `"a11y.backToHome": "Back to home",`

- [ ] **Step 2: `AppHeader`에 뒤로 가기**

`AppHeader`의 props에 `isHome: boolean`과 `onBack: () => void`를 더한다. 브랜드 자리를 조건부로 만든다 — 홈에서는 지금처럼 브랜드 링크, 서비스 화면에서는 뒤로 가기 버튼 + 브랜드.

뒤로 가기 버튼은 **최소 44×44px 터치 타깃**을 지킨다(앱 전역 규칙). 아이콘만 있는 버튼이므로 `aria-label={tc('a11y.backToHome')}`가 필수다. `Button` 프리미티브의 `variant="ghost"`를 쓰면 포커스 링이 자동으로 붙는다.

- [ ] **Step 3: `App.tsx`에서 전달**

```tsx
<AppHeader
  isHome={activeTab === 'home'}
  onBack={() => handleTabChange('home')}
  onLogin={openAuthModal}
  onProfile={() => setProfileModalOpen(true)}
/>
```

`handleTabChange`는 해시를 쓰므로 뒤로 가기가 히스토리에 남고, 브라우저 뒤로가기와 일관되게 동작한다.

- [ ] **Step 4: I2 검증 및 커밋**

**I2 — 서비스 진입·복귀.** 브라우저에서 네 경로를 전부 확인하고 결과를 리포트에 적는다:

1. 홈에서 카드를 누르면 해당 서비스로 간다
2. 서비스 화면 헤더에 `←`가 보이고, 누르면 홈으로 온다 (홈에서는 `←`가 없어야 한다)
3. 브라우저 뒤로가기도 홈으로 온다
4. `←`에 Tab으로 도달하고 Enter와 **Space 양쪽**으로 동작한다 (버튼은 둘 다 응답해야 한다)

3번이 특히 중요하다 — `handleTabChange`가 해시를 쓰므로 히스토리에 남아야 하고, 남지 않으면 뒤로가기가 앱을 떠난다.

```bash
npm run build && npm run typecheck:app:gate
git add src/components/layout/AppHeader.tsx src/App.tsx src/locales/ko/common.json src/locales/en/common.json
git commit -m "feat(ia): 서비스 화면 헤더에 뒤로 가기"
git push
```

---

### Task 4: 탭바 제거

**Files:**
- Delete: `src/components/Navigation.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: `App.tsx`에서 `<Navigation>` 제거**

임포트와 렌더 양쪽을 지운다. `Navigation`이 `sticky top-14`였으므로, 그 아래 콘텐츠의 `scroll-mt-*`가 이제 과하다 — `#app-content`의 `scroll-mt` 값을 헤더 높이(57px)에 맞게 줄인다. 남겨두면 탭 전환 시 콘텐츠 위에 빈 공간이 생긴다.

- [ ] **Step 2: 파일 삭제**

```bash
git rm src/components/Navigation.tsx
grep -rn "Navigation" src/ && echo "!!! 참조 남음 !!!" || echo "OK"
```

- [ ] **Step 3: 고아 로케일 키 확인**

`nav.omen`~`nav.summary` 8개가 이제 참조되지 않을 수 있다. `grep -rn "nav\." src/`로 확인한다. **삭제하지 말고 보고한다** — 다른 곳에서 쓰고 있을 수 있고, 값이 서비스 이름이라 재사용 가치가 있다.

- [ ] **Step 4: 검증 및 커밋**

```bash
npm run build && npm run typecheck:app:gate
```

브라우저에서 8개 화면을 모두 방문해 `scrollWidth === clientWidth`를 확인한다(390×844). 탭바가 사라졌으므로 세로 공간이 늘었고, 이전에 폴드 밖이던 것이 들어왔을 수 있다.

```bash
git add -A
git commit -m "feat(ia): 탭바 제거

라벨 없는 이모지 8개 문제가 여기서 구조적으로 사라진다.
Navigation.tsx:48 의 hidden sm:inline 이 640px 미만에서 라벨을 숨겨,
스크린리더는 sr-only 라벨을 받는데 눈으로 보는 사용자는 아무것도
못 받는 상태였다."
git push
```

---

### Task 5: 정렬 3건

Task 1~4와 독립이다. 급하면 이것만 먼저 배포해도 된다.

**Files:**
- Modify: `src/components/tabs/SajuTab.tsx:302` (date input), 시간 select
- Modify: `src/components/subscription/SubscriptionBanner.tsx:67`

- [ ] **Step 1: date input의 카드 이탈 수정**

`SajuTab.tsx:302`의 클래스에 `min-w-0`을 더한다. iOS Safari의 `<input type="date">`는 고유 너비를 가지며, flex/grid 자식의 기본 `min-width:auto`가 축소를 막아 `w-full`이 무력해진다.

같은 원인의 다른 사례가 있는지 확인한다:

```bash
grep -rn 'type="date"\|type="time"\|type="number"' src/components/
```

찾은 것들도 컨테이너 밖으로 나갈 수 있는 위치인지 보고 필요하면 함께 처리한다.

- [ ] **Step 2: 날짜·시간 정렬 통일**

`SajuTab.tsx:302`의 date input과 그 아래 시간 select의 텍스트 정렬이 다르다(하나는 중앙, 하나는 좌측). **둘 다 좌측 정렬로 맞춘다** — 값 길이가 서로 달라 중앙정렬은 두 줄이 세로로 어긋나 보인다. `text-center`가 있으면 제거하고, 필요하면 `text-left`를 명시한다.

- [ ] **Step 3: 구독 배너 위치**

`SubscriptionBanner.tsx:67`의 `fixed bottom-6 right-6 z-50`이 콘텐츠 위에 떠 CTA와 겹친다. Task 5·7 리뷰에서 375×667 영어에서 CTA의 17~44%를 가린다고 측정됐다.

콘텐츠 흐름 안으로 옮기거나, 하단 고정 바로 만들되 본문에 그만큼의 하단 여백을 준다. **떠 있으면서 겹치지 않는 상태는 없다** — 둘 중 하나를 택하고 이유를 보고한다.

- [ ] **Step 4: 검증 및 커밋**

```bash
npm run build && npm run typecheck:app:gate && node scripts/check-contrast.mjs --dark
```

```bash
git add -A
git commit -m "fix(ui): 사주 입력 정렬과 구독 배너 위치

iOS Safari 의 date input 은 고유 너비를 가지며 flex 자식의 기본
min-width:auto 가 축소를 막아 w-full 이 무력하다. min-w-0 으로 해소.
Chrome 의 date input 은 더 좁아 헤드리스 측정으로는 재현되지 않았고,
그래서 직전 개편 28커밋을 통과했다."
git push
```

---

### Task 6: 회귀 확인 및 머지

- [ ] **Step 1: 게이트 전부**

```bash
npm run build
npm run typecheck:app:gate
node scripts/check-contrast.mjs --dark
grep -rn "Navigation" src/ && echo "!!! 참조 남음 !!!" || echo "I3 OK"
```

- [ ] **Step 2: I2 재확인 — 탭바 제거 후에도 이동이 되는가**

Task 3에서 확인했지만 Task 4가 탭바를 지운 뒤이므로 다시 본다. 탭바가 유일한 이동 수단이던 경로가 있었다면 여기서 드러난다. 홈 → 서비스 → 홈 → 다른 서비스를 순회하고, 그 사이 브라우저 뒤로가기를 섞어 상태와 URL이 어긋나지 않는지 확인한다.

- [ ] **Step 3: I7 — 가로 스크롤 회귀**

헤드리스 브라우저로 8개 화면(홈 포함 9개)을 390×844 ko/en에서 방문하고 `scrollWidth === clientWidth`를 확인한다. 직전 개편에서 이 검사가 통과했으므로 깨뜨리지 않았는지 보는 것이다.

- [ ] **Step 4: I1·I4·I5·I6 — 실기기 스크린샷**

**이 네 가지는 헤드리스로 확정할 수 없다.** Chrome의 폼 컨트롤은 iOS Safari와 다르게 렌더되며, 그것이 이번 결함들이 직전 개편을 통과한 이유다. 사용자에게 실기기 스크린샷을 요청한다:

- I1 — 홈에서 서비스 8개가 이름·설명과 함께 잘림 없이 보이는가
- I4 — 사주 탭의 날짜 입력이 카드 안에 들어오는가
- I5 — 날짜와 시간의 텍스트 시작 위치가 같은가
- I6 — 구독 배너가 버튼을 가리지 않는가

- [ ] **Step 5: I1~I8 결과표**

각 항목의 통과 여부와, 확인하지 못한 항목은 그 사유를 적는다. **조용히 빠뜨리면 "전부 검증됨"으로 오해된다.**

- [ ] **Step 6: 머지**

```bash
git checkout main
git merge --no-ff feat/ia-redesign -m "feat(ia): 홈 화면 + 드릴인 — 탭바 제거

420px 실기기에서 탭 8개가 전부 라벨 없는 이모지였다
(Navigation.tsx:48 의 hidden sm:inline). 스크린리더는 sr-only 라벨을
받으므로 눈으로 보는 사용자가 더 불리한 상태였다.

홈 화면을 새로 만들지 않았다 — HeroSection 이 이미 서비스 카드 6개를
렌더하고 탭을 전환하며 descKey 까지 갖고 있었다. 8개로 늘리고 설명을
표시하고 탭바를 지우니 홈이 됐다.

설계: docs/superpowers/specs/2026-07-30-ia-redesign-design.md
계획: docs/superpowers/plans/2026-07-30-ia-redesign.md"
git push origin main
```

- [ ] **Step 7: 배포 확인**

`https://gweh-3s2.pages.dev` 에서 홈이 뜨는지, 카드가 8개인지, 서비스 진입과 뒤로 가기가 동작하는지 확인한다.

---

## 다음 단계 (이 계획 밖)

1. **`FaceHarmonyTab` 번역** — 780줄, `t()` 호출 0건. 영어 사용자에게 이 탭만 한국어다.
2. **히어로 임의 폰트 크기 14개** — 스펙 §1.6("히어로 내용 보존")과 §3.4(타입 스케일)가 충돌하는 지점. 명시적 판단 필요.
3. **1280×720 영어 CTA 폴드** — 높이 기반 히어로 변형이 필요한 새 메커니즘.
4. **`shadow-gal-*`가 다크에서 안 보임** — 지금은 테두리가 입체감을 담당.
5. **`themes.ts`/`applyTheme.ts` 소비자 0** — 삭제 대상.
6. **cron worker 미배포** — 구독자 메일이 아직 옛 브랜드.
