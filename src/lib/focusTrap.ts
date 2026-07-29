// 모달 안에서 Tab 이 순회해야 하는 요소들.
//
// AuthModal 과 ProfileModal 이 **같은 상수**를 쓴다. 셀렉터를 두 파일에 복사하면
// 한쪽만 고쳐지는 순간 두 모달의 트랩 범위가 조용히 갈라진다.
//
// 이 목록은 트랩이 켜질 때 한 번 스냅샷하는 게 아니라 **Tab 이 눌릴 때마다**
// 다시 질의하는 용도다. 두 모달 다 열려 있는 동안 내용이 바뀐다 —
// ProfileModal 의 삭제/해지 확인 블록, AuthModal 의 login↔signup↔forgot 전환은
// 포커스 가능한 요소를 추가하고 없앤다. 스냅샷을 쓰면 트랩이 이미 DOM 에서
// 사라진 노드를 first/last 로 붙들고, 그 경계에서 Tab 이 모달 밖으로 샌다.
export const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
