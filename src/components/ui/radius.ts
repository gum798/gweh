// 반지름 기본값을 프리미티브의 "항상 켜짐" 클래스 문자열에 그냥 박아두면 호출부가
// className 으로 준 반지름이 **조용히 무시된다.**
//
// Tailwind 는 borderRadius 유틸리티를 설정 키 순서가 아니라 **클래스명 알파벳순**으로
// 내보내고, 이 규칙들은 특이성이 전부 같아서 뒤에 나온 것이 이긴다.
// (아래는 rounded- 접두사를 뗀 표기다 — 주석에 살아 있는 유틸리티 이름을 적으면
//  Tailwind content 스캐너가 그것까지 CSS 로 내보내기 때문이다.)
//
//   [임의값] → full → gal-lg → gal-md → gal-sm → gal-xl → lg → xl
//
// 즉 gal-xl 기본값은 full·디자인 토큰 전부·임의값까지 이기고 원시 lg/xl 에만 진다.
// 호출부가 **정식 토큰**을 쓰면 실패하고 비토큰을 쓰면 성공하는, 가능한 최악의
// 방향이다. 빌드·타입체크·대비 게이트 어디에도 걸리지 않는다.
//
// className 속성 **안에서의** 순서는 아무 영향이 없다 — CSS 는 스타일시트 순서만
// 본다 — 그래서 기본값을 VARIANTS/SIZES 같은 표로 옮기는 것으로는 고쳐지지 않는다.
// 해법은 순서 싸움 자체를 없애는 것이다: 호출부가 shorthand 반지름을 직접 주면
// 기본값을 아예 방출하지 않는다. 승자가 하나뿐이면 CSS 순서가 무의미해진다.
//
// **shorthand 만** 잡는 것이 이 정규식의 핵심이다. 두 부류는 반드시 놓쳐야 한다:
//
//   1. 모서리/변 longhand(-t- -r- -b- -l- -s- -e- -tl- -tr- -br- -bl- -ss- -se-
//      -ee- -es-). 이들은 border-radius 단축이 아니라 개별 코너 속성을 세팅한다.
//      여기서 기본값을 지우면 **건드리지 않은 코너에 규칙이 하나도 안 남아** 사각형이
//      된다. 붙인 버튼 그룹과 세그먼트 컨트롤의 정석 마크업이 정확히 이 형태이고,
//      그게 이 수정을 하게 만든 Task 5 의 수요다.
//   2. 접두사가 붙은 변형(hover: group-hover: sm: …). 조건부 덮어쓰기이고 각자
//      특이성이나 미디어쿼리 순서로 자기 상태에서 이긴다. 기본값을 지우면 조건이
//      거짓일 때 반지름이 사라진다.
//
// 임의값(대괄호)은 반대로 반드시 **잡아야** 한다. 임의값 규칙은 gal-xl 보다 앞에
// 나오므로 기본값을 남기면 그쪽이 이겨버린다.
const SHORTHAND_RADIUS =
  /(?:^|\s)rounded(?:-(?:none|full|sm|md|lg|xl|2xl|3xl|gal-(?:sm|md|lg|xl)|\[[^\]\s]+\]))?(?=\s|$)/;

const DEFAULT_RADIUS = 'rounded-gal-xl';

/**
 * 프리미티브가 방출할 기본 반지름 클래스.
 * 호출부가 이미 shorthand 반지름을 줬으면 빈 문자열을 돌려 충돌 자체를 없앤다.
 *
 * Button·Card·Skeleton 이 **같은 함수**를 부른다. 정규식을 세 파일에 복사하면
 * 한쪽만 고쳐지는 순간 다시 조용한 실패로 돌아간다.
 *
 * `fallback` 은 기본값이 프리미티브마다 다를 때 쓴다 — Skeleton 은 variant 별로
 * 기본 반지름이 넷이라 하나의 상수로는 표현되지 않는다. 인자를 생략하면 Button·
 * Card 가 쓰던 값 그대로다.
 */
export function defaultRadius(className: string, fallback: string = DEFAULT_RADIUS): string {
  return SHORTHAND_RADIUS.test(className) ? '' : fallback;
}
