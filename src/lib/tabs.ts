/**
 * 탭 정의의 유일한 출처.
 *
 * 이전에는 같은 목록이 3곳에 흩어져 있었다 —
 *   1) App.tsx  useState 초기화의 validTabs 리터럴
 *   2) App.tsx  hashchange 리스너의 validTabs 리터럴
 *   3) Navigation.tsx 의 tabs 배열
 * 세 곳이 어긋나면 "탭이 URL 에는 있는데 렌더되지 않는다" 류의 버그가
 * 조용히 들어온다. 순서(=네비 표시 순서)와 멤버십(=해시 유효성)을 한곳에서 관리한다.
 */

export interface TabDef {
  id: string;
  labelKey: string;
  icon: string;
}

export const TABS: readonly TabDef[] = [
  { id: 'omen', labelKey: 'nav.omen', icon: '☯️' },
  { id: 'fortune', labelKey: 'nav.fortune', icon: '🔮' },
  { id: 'fashion', labelKey: 'nav.fashion', icon: '👔' },
  { id: 'face', labelKey: 'nav.face', icon: '👁️' },
  { id: 'harmony', labelKey: 'nav.harmony', icon: '💖' },
  { id: 'palm', labelKey: 'nav.palm', icon: '🖐️' },
  { id: 'saju', labelKey: 'nav.saju', icon: '🏛️' },
  { id: 'summary', labelKey: 'nav.summary', icon: '📊' },
];

export const TAB_IDS: readonly string[] = TABS.map((tab) => tab.id);

export const DEFAULT_TAB = 'omen';

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
export function resolveTabOnLoad(hash: string): string {
  const id = hashBody(hash);
  return TAB_IDS.includes(id) ? id : DEFAULT_TAB;
}

/**
 * hashchange 용. `null` 은 "탭을 건드리지 말 것" 을 뜻한다.
 *
 * 반환값을 `string | null` 로 둔 이유는 호출부가 "기본 탭으로 리셋" 과
 * "무시" 를 구분할 수 있어야 하기 때문이다. 문자열만 반환하면 그 구분이
 * 사라지고 3번 경우가 다시 2번으로 흡수된다.
 */
export function resolveTabOnHashChange(hash: string): string | null {
  const id = hashBody(hash);
  if (id === '') return DEFAULT_TAB;        // 경우 2 — 루트로 뒤로가기
  if (TAB_IDS.includes(id)) return id;      // 탭 해시
  return null;                              // 경우 3 — 인페이지 앵커, 탭과 무관
}
