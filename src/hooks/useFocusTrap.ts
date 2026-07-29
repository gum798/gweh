import { useEffect, useRef, type RefObject } from 'react';

// 모달 안에서 Tab 이 순회해야 하는 요소들.
//
// 이 목록은 트랩이 켜질 때 한 번 스냅샷하는 게 아니라 **Tab 이 눌릴 때마다**
// 다시 질의한다. 두 모달 다 열려 있는 동안 내용이 바뀐다 — ProfileModal 의
// 삭제/해지 확인 블록, AuthModal 의 login↔signup↔forgot 전환은 포커스 가능한
// 요소를 추가하고 없앤다. 스냅샷을 쓰면 트랩이 이미 DOM 에서 사라진 노드를
// first/last 로 붙들고, 그 경계에서 Tab 이 모달 밖으로 샌다.
const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * 모달 포커스 트랩 + ESC 닫기 + 포커스 복원.
 *
 * AuthModal 과 ProfileModal 이 **같은 훅**을 부른다. 예전에는 두 파일에 같은
 * 이펙트가 복사돼 있었고, 아래 "언마운트 탈출" 결함이 정확히 양쪽에 동일하게
 * 들어 있었다 — 한쪽만 고치면 다른 쪽은 조용히 새는 상태로 남는다.
 */
export function useFocusTrap(
  isOpen: boolean,
  onClose: () => void,
  dialogRef: RefObject<HTMLElement | null>,
) {
  // onClose 는 App.tsx 에서 인라인 화살표로 내려온다 — App 이 리렌더될 때마다
  // 새 함수다. 아래 이펙트의 클린업이 포커스를 **복원**하므로, onClose 를 deps 에
  // 두면 App 리렌더 한 번에 이펙트가 재실행되면서 사용자가 입력 중이던 필드에서
  // 포커스를 뺏어 첫 번째 요소로 되돌린다. ref 로 최신 값만 읽고 deps 에서 뺀다.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      // **포커스가 다이얼로그 밖으로 떨어진 경우를 반드시 먼저 잡는다.**
      // 모달 안의 버튼을 눌러 그 버튼 자신이 언마운트되면(비밀번호 찾기,
      // login↔signup 전환, 계정 삭제·구독 해지 확인 블록) activeElement 가
      // body 가 된다. 그러면 아래 first/last 비교가 둘 다 거짓이라 Tab 이
      // 막히지 않고 모달 **뒤쪽 페이지**로 그대로 샌다 — 트랩이 없는 것과 같다.
      // 목록을 매번 재질의해도 이건 안 고쳐진다. 죽은 노드가 문제가 아니라
      // activeElement 가 집합 밖에 있는 것이 문제이기 때문이다.
      if (!node.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }

      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);

      // 트리거가 아직 살아 있을 때만 되돌린다. 로그인에 성공하면 헤더의
      // "로그인" 버튼이 프로필 버튼으로 교체되므로 복원 대상이 분리된 노드가
      // 되고, 분리된 노드에 focus() 하면 조용히 body 로 떨어진다 — 스크린리더
      // 커서가 문서 맨 위로 되돌아간다. 그 경우 본문 컨테이너로 보낸다.
      // (tabindex="-1" 은 탭 순서에 넣지 않으면서 프로그램적 포커스만 허용한다.)
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus();
        return;
      }
      const fallback = document.getElementById('app-content');
      if (fallback) {
        fallback.setAttribute('tabindex', '-1');
        fallback.focus();
      }
    };
  }, [isOpen, dialogRef]);
}
