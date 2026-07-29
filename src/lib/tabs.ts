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

/**
 * 위치 해시를 탭 id 로 정규화한다. 선행 '#' 유무는 상관없다.
 *
 * 최초 마운트와 hashchange 가 **반드시 같은 규칙**을 쓰게 하려고 함수로 뽑았다.
 * 이전에는 초기화는 "알 수 없는 해시 → omen", 리스너는 "알 수 없는 해시 → 무시"
 * 였다. 그래서 "/#saju 에서 뒤로가기 → URL 은 / 인데 화면은 사주" 처럼
 * URL 과 렌더 상태가 갈라졌다.
 */
export function resolveTab(hash: string): string {
  const id = hash.replace(/^#/, '');
  return TAB_IDS.includes(id) ? id : DEFAULT_TAB;
}
