/**
 * 탭 정의의 유일한 출처.
 *
 * 이전에는 같은 목록이 3곳에 흩어져 있었다 —
 *   1) App.tsx  useState 초기화의 validTabs 리터럴
 *   2) App.tsx  hashchange 리스너의 validTabs 리터럴
 *   3) Navigation.tsx 의 tabs 배열
 * 세 곳이 어긋나면 "탭이 URL 에는 있는데 렌더되지 않는다" 류의 버그가
 * 조용히 들어온다. 순서(=네비 표시 순서)와 멤버십(=해시 유효성)을 한곳에서 관리한다.
 *
 * 이 주장은 **타입으로 강제된다**, 규율로가 아니라:
 *   - Navigation.tsx  는 TABS 를 직접 map 한다 (런타임 파생)
 *   - App.tsx 의 해시 처리는 TAB_IDS 만 본다 (런타임 파생)
 *   - App.tsx 의 TAB_RENDERERS 는 `Record<TabId, ...>` 다 — 여기 id 를
 *     추가하고 렌더러를 안 넣으면 **컴파일이 실패한다** (TS2741)
 * 마지막 항목이 없던 동안에는 이 주석이 코드가 지키지 않는 약속이었다:
 * renderTab 이 switch + `default: return null` 이라 새 탭은 네비 버튼도 뜨고
 * 해시 검증도 통과하는데 콘텐츠만 조용히 비었다.
 *
 * 주의: 이 강제는 `npm run build` 로는 안 잡힌다. vite/esbuild 는 타입을
 * 검사하지 않고 트랜스파일만 한다. tsc 게이트가 실제 방어선이다.
 */

export interface TabDef {
  id: string;
  labelKey: string;
  icon: string;
}

export const TABS = [
  { id: 'home', labelKey: 'nav.home', icon: '🏠' },
  { id: 'omen', labelKey: 'nav.omen', icon: '☯️' },
  { id: 'fortune', labelKey: 'nav.fortune', icon: '🔮' },
  { id: 'fashion', labelKey: 'nav.fashion', icon: '👔' },
  { id: 'face', labelKey: 'nav.face', icon: '👁️' },
  { id: 'harmony', labelKey: 'nav.harmony', icon: '💖' },
  { id: 'palm', labelKey: 'nav.palm', icon: '🖐️' },
  { id: 'saju', labelKey: 'nav.saju', icon: '🏛️' },
  { id: 'summary', labelKey: 'nav.summary', icon: '📊' },
] as const satisfies readonly TabDef[];

/**
 * 탭 id 리터럴 유니온. TABS 에서 **파생**되므로 손으로 유지할 목록이 아니다.
 *
 * 이 타입이 있어야 App.tsx 의 `Record<TabId, TabRenderer>` 가 성립한다.
 * 예전 renderTab 은 switch + `default: return null` 이라, tabs.ts 에 id 를
 * 추가하면 네비에는 버튼이 뜨고 해시 검증도 통과하는데 **콘텐츠만 조용히
 * 비었다.** 이 파일 맨 위 주석이 "드리프트는 없다" 고 주장하는데 코드가
 * 강제하지 않는 상태였다. 이제는 컴파일이 막는다.
 */
export type TabId = (typeof TABS)[number]['id'];

export const TAB_IDS: readonly TabId[] = TABS.map((tab) => tab.id);

/**
 * 해시가 탭을 지목하지 않을 때의 착지점. `'omen'` 에서 `'home'` 으로 옮겼다.
 *
 * 기존 `#omen`·`#saju` 등의 북마크는 그대로 동작한다 — 바뀌는 것은 해시가
 * 없거나 알 수 없을 때 어디로 떨어지는지 뿐이다.
 */
export const DEFAULT_TAB: TabId = 'home';

/** 임의 문자열을 TabId 로 좁힌다. 유효 판정은 언제나 TAB_IDS 하나만 본다. */
export function isTabId(value: string): value is TabId {
  return (TAB_IDS as readonly string[]).includes(value);
}

/** 선행 '#' 을 떼어 낸 해시 본문. `''`, `'saju'`, `'app-content'` 등. */
function hashBody(hash: string): string {
  return hash.replace(/^#/, '');
}

/* ─────────────────────────────────────────────────────────────────────────
   해시 → 탭 매핑은 **경우가 셋이고 규칙이 셋이다.** 아래 두 함수를 하나로
   합치고 싶어지는 게 자연스러운 충동인데, 합치는 순간 반드시 셋 중 하나가
   깨진다. 실제로 두 번 깨졌다.

   ┌────────────────────┬──────────────────┬──────────────────────────────┐
   │ 언제               │ 해시             │ 올바른 동작                  │
   ├────────────────────┼──────────────────┼──────────────────────────────┤
   │ 최초 로드          │ 무엇이든         │ 유효하면 그 탭, 아니면 기본  │
   │ hashchange         │ 빈 문자열        │ 기본 탭으로 리셋             │
   │ hashchange         │ 비었지 않은 비탭 │ **아무것도 하지 않음**       │
   └────────────────────┴──────────────────┴──────────────────────────────┘

   왜 이렇게 갈리는가:

   1) 최초 로드 — 사용자가 URL 을 직접 치거나 공유받은 링크로 들어온 것이다.
      해시가 탭이 아니면 그 URL 은 탭에 대해 아무 말도 하지 않는 것이므로
      기본 탭이 맞다.

   2) hashchange + 빈 해시 — 첫 탭 클릭 이전으로 **뒤로가기** 한 것이다.
      URL 이 "루트" 를 뜻하고 루트는 기본 탭을 뜻하므로 리셋해야 한다.
      이걸 무시하면 "URL 은 / 인데 화면은 사주" 로 갈라진다. (리뷰 C1)

   3) hashchange + 비어 있지 않은 비탭 해시 — 페이지 내 앵커가 발화한 것이다.
      스킵 링크(`#app-content`), 푸터 소셜 링크(`#`... 는 빈 해시라 2번,
      그 외 인페이지 앵커)가 여기 해당한다. 사용자는 **탭을 바꾸려 한 적이
      없다.** 여기서 기본 탭으로 되돌리면 키보드 사용자가 Tab→Enter 로
      스킵 링크를 쓰는 순간 보고 있던 탭에서 조용히 튕겨 나간다. 마우스
      QA 로는 절대 안 잡힌다.

   두 함수 모두 유효 id 판정은 TAB_IDS 하나만 본다. 판정 기준이 갈라질 수
   없고, 갈리는 것은 "모르는 해시를 만났을 때의 처분" 뿐이다.
   ───────────────────────────────────────────────────────────────────────── */

/**
 * 최초 마운트용. 알 수 없거나 빈 해시는 기본 탭으로 떨어진다.
 */
export function resolveTabOnLoad(hash: string): TabId {
  const id = hashBody(hash);
  return isTabId(id) ? id : DEFAULT_TAB;
}

/**
 * hashchange 용. `null` 은 "탭을 건드리지 말 것" 을 뜻한다.
 *
 * 반환값이 `TabId | null` 인 이유는 호출부가 "기본 탭으로 리셋" 과 "무시" 를
 * 구분할 수 있어야 하기 때문이다. TabId 만 반환하면 그 구분이 사라지고
 * 3번 경우가 다시 2번으로 흡수된다.
 */
export function resolveTabOnHashChange(hash: string): TabId | null {
  const id = hashBody(hash);
  if (id === '') return DEFAULT_TAB;        // 경우 2 — 루트로 뒤로가기
  if (isTabId(id)) return id;               // 탭 해시
  return null;                              // 경우 3 — 인페이지 앵커, 탭과 무관
}
