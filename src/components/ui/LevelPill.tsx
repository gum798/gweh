export type Level = '대길' | '길' | '평' | '소흉' | '흉';

// 운세 등급 표가 FortuneTab:176, SajuTab:413, SummaryTab:320 에 복제돼 있고
// OmenTab:465 에 인라인 삼항식으로 또 있었다. 같은 "대길"이 탭마다 다른 색으로 렌더된다.
//
// 색은 게이트가 검증하는 잉크/틴트 쌍만 쓴다. 브리프 초안은 배경을 잉크의
// 10% 알파로 깔았는데, 그건 -light 틴트가 아니라서 scripts/check-contrast.mjs 가
// 검사하지 않는 조합이고 실제로 재보면 대길이 AA 미달이다:
//   success 잉크 위 10% 알파 배경(#e8f2ec)  = 4.38:1  (미달)
//   success 잉크 위 success-light 틴트       = 4.57:1  (통과, 게이트 검증 행)
// 나머지 세 색은 알파로도 통과하지만, 한 줄만 다른 규칙을 쓰면 Task 7 이 토큰을
// 바꿀 때 검증되지 않은 조합이 남는다. 다섯 줄 전부 쌍으로 맞춘다.
// 테두리 alpha 는 장식이며 본문 대비 요건 대상이 아니라 그대로 둔다.
//
// 주의: 주석에 살아 있는 유틸리티 이름을 적으면 Tailwind content 스캐너가
// 그것까지 CSS 로 내보낸다 — 위 수치를 클래스명으로 적었던 초안이 실제로
// 죽은 규칙을 번들에 넣었다.
const STYLES: Record<Level, string> = {
  '대길': 'bg-status-success-light text-status-success border-status-success/30',
  '길':   'bg-status-info-light    text-status-info    border-status-info/30',
  '평':   'bg-gal-light            text-gal-body       border-gal-border',
  '소흉': 'bg-status-warning-light text-status-warning border-status-warning/30',
  '흉':   'bg-status-danger-light  text-status-danger  border-status-danger/30',
};

// level 을 Level 유니온으로 좁힐 수 없다. 호출부 네 곳이 전부 string 을 넘긴다:
//   - FortuneTab / SummaryTab : `interface FortuneResult { level: string }` 이고
//     값은 Gemini 응답을 검증 없이 JSON.parse 한 것이다(functions/api/fortune.ts:149).
//     스키마 검증기가 repo 에 없으므로 런타임에 임의 문자열이 올 수 있다.
//   - SajuTab / OmenTab : getTodayFortune()·getEnergyLabel() 이 i18next.t() 결과를
//     그대로 내보낸다 → 정적 타입은 string, 런타임 값은 lng 에 따라 **영어**다.
// 유니온을 강제하면 Task 4·5 의 네 호출부가 전부 TS2345 로 깨져 게이트가 잡는다.
// 그래서 prop 은 string 으로 받고 여기서 런타임 정규화한다(Level ⊂ string 이라
// 리터럴을 넘기던 호출부도 그대로 통과한다).
//
// 영어 별칭까지 받는 이유: 지금 en 로케일에서 SajuTab 은 모든 등급이 '흉'(빨강)으로,
// OmenTab 도 전부 빨강으로 렌더된다 — 한국어 키로만 조회하기 때문이다.
// 별칭이 없으면 Task 4·5 가 그 버그를 그대로 옮겨 심는다.
// 주의: 아래 영어 값은 src/locales/en/{saju,common}.json 에서 베껴온 것이라
// 로케일이 바뀌면 조용히 어긋난다. 근본 해법은 생산자(sajuInterpret.ts,
// omenGenerator.ts)가 번역문이 아니라 번역되지 않는 등급 키를 내보내는 것인데,
// 그 파일들은 이 태스크의 범위 밖이다.
const CANONICAL: Record<string, Level> = {
  // 한국어 정규값
  '대길': '대길',
  '길': '길',
  '평': '평',
  '소흉': '소흉',
  '흉': '흉',
  // en/saju.json 의 fortune.*
  'great fortune': '대길',
  'good fortune': '길',
  'neutral': '평',
  'minor caution': '소흉',
  'unfavorable': '흉',
  // en/common.json 의 energy.*
  'excellent': '대길',
  'good': '길',
  'caution': '소흉',
  'be careful': '흉',
};

/** 임의 문자열을 등급으로 좁힌다. 모르는 값은 중립('평')으로 떨어진다. */
function toLevel(value: string): Level {
  if (!value) return '평';
  return CANONICAL[value.trim().toLowerCase()] ?? '평';
}

// 라벨은 받은 값을 그대로 렌더한다 — 생산자가 이미 t() 로 번역한 문자열이므로
// 정규화한 한국어를 대신 찍으면 영어 사용자에게 한글이 보인다. 정규화는 색에만 쓴다.
export function LevelPill({ level }: { level: string }) {
  if (!level) return null;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-gal-lg border text-sm font-bold ${STYLES[toLevel(level)]}`}>
      {level}
    </span>
  );
}
