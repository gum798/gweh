import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

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

// 아래 CLI 실행부는 이 파일을 직접 실행할 때만 돈다.
// 실패 모드가 "조용한 통과(exit 0, 무출력)" 라서 문자열 비교로는 부족하다. 양쪽을 모두
// 실제 경로로 정규화해서 비교한다:
//   - 심링크: import.meta.url 은 realpath 로 해석되는데 argv[1] 은 링크 경로 그대로다.
//     (macOS /tmp -> /private/tmp 가 대표적) — pathToFileURL 만으로는 이게 안 잡힌다.
//   - 공백·비ASCII: import.meta.url 은 퍼센트 인코딩된다 — fileURLToPath 로 디코딩해서 맞춘다.
//   - Windows: `file://C:\...` 수동 조립이 깨진다 — 양쪽 다 네이티브 경로로 비교해 회피.
//   - import 시: argv[1] 이 undefined 라 그대로 쓰면 TypeError 로 죽는다 — 먼저 걸러낸다.
// ratio 는 가드 밖이라 import 해도 프로세스가 죽지 않는다.
const isMain = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(entry);
  } catch {
    return false;
  }
})();

if (isMain) {
  // 색 값(hex)은 반드시 tailwind.config.js 에서 읽는다. 여기에 hex 를 다시 적으면
  // 설정만 바뀌었을 때 게이트가 **옛 값을 검사하며 PASS 를 보고한다** — C1 과 같은
  // 조용한 통과 실패다. Task 7 은 모든 색 토큰을 교체하므로 특히 위험하다.
  // 스크립트가 소유하는 지식은 "어떤 전경이 어떤 배경 위에 오고 최소 몇 대 몇이어야 하는가"
  // 라는 **관계**뿐이고, 값 자체는 전부 설정에서 온다.
  // 상대 지정자는 cwd 가 아니라 이 모듈 URL 기준으로 풀리므로 어디서 실행해도 안전하다.
  const CONFIG_URL = new URL('../tailwind.config.js', import.meta.url);
  let colors;
  try {
    colors = (await import(CONFIG_URL.href)).default?.theme?.extend?.colors;
  } catch (e) {
    console.error(`ERROR: tailwind.config.js 를 불러오지 못했다 (${CONFIG_URL.pathname})`);
    console.error(`  ${e.message}`);
    process.exit(2);
  }
  if (!colors || typeof colors !== 'object') {
    console.error('ERROR: tailwind.config.js 에서 theme.extend.colors 를 찾지 못했다.');
    console.error('  설정 구조가 바뀌었다. 옛 값을 검사하지 않도록 중단한다.');
    process.exit(2);
  }

  // 토큰이 없거나 형식이 틀리면 그 행을 건너뛰지 않고 **크게 실패**한다.
  // 빠진 행은 곧 검사되지 않은 색이고, 그것도 조용한 통과다.
  const hex = (name) => {
    const v = colors[name];
    if (typeof v !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(v)) {
      console.error(`ERROR: tailwind.config.js 의 colors["${name}"] 를 읽을 수 없다.`);
      console.error(`  받은 값: ${JSON.stringify(v)} (6자리 hex 문자열이어야 한다)`);
      console.error('  토큰이 삭제·개명됐거나 형식이 바뀌었다. 검사되지 않은 색이 통과하는 것을 막기 위해 중단한다.');
      process.exit(2);
    }
    return v;
  };

  const BLACK = hex('gal-black');   // 본문 기본 잉크 (다크에서는 밝은 값)
  const PAGE  = hex('gal-bg');      // 페이지 배경. index.html 크리티컬 CSS 의 body 값과 같아야 한다
  const CARD  = hex('gal-light');   // 카드/서피스 — 페이지 위에 얹히는 면
  const INK   = hex('gal-accent-ink');
  const WHITE = '#ffffff';          // 토큰이 아니다. 액센트 채움 위 글자색으로만 쓴다

  // --dark 는 받아만 주고 무시한다. Task 7 이후 앱은 다크 하나뿐이라 표도 하나다.
  // 예전에는 다크 분기가 hex 8개를 **직접 적고** 있어서, 설정이 바뀌어도 게이트는
  // 옛 값을 검사하며 PASS 를 보고했다(C1 과 같은 조용한 통과). 표를 하나로 합치고
  // 값은 전부 hex() 로만 읽으면 그 드리프트 경로가 구조적으로 사라진다.
  // 라이트 표를 남겨 두는 선택지는 더 나쁘다 — 배경이 #ffffff 라고 가정한 검사인데
  // 실제 body 는 더 이상 흰색이 아니므로, 통과하든 실패하든 아무 의미가 없다.
  if (process.argv[2] && process.argv[2] !== '--dark') {
    console.error(`ERROR: 알 수 없는 인자 ${process.argv[2]} (--dark 만 받는다)`);
    process.exit(2);
  }

  // 상태색은 잉크 / 틴트(-light) 쌍이다. 한 값이 잉크와 표면을 겸할 수 없다.
  // 다크에서는 역할이 뒤집힌다 — 잉크가 밝고 틴트가 어둡다.
  const STATUS = ['success', 'warning', 'danger', 'info'];

  // ── 두 개의 하한, 서로 다른 질문 ────────────────────────────────────
  //
  // SURFACE_MIN — "이 면이 뒤의 면과 구분되는가". 시각적 무게를 요구하는 값이 아니다.
  // 라이트 시절의 1.05 를 그대로 쓰지 않는 이유: 다크 팔레트는 저휘도 구간에 몰려 있어
  // 대비비가 압축된다. 레퍼런스 팔레트의 카드(#1e1630 on #161022)가 **1.072:1** 이었고,
  // 그건 1.05 를 통과하면서도 화면에서는 카드가 아예 보이지 않는 값이다.
  // 1.12 는 그 실패를 걸러내면서 현재 틴트 5개에 1.28~1.30 의 여유를 남긴다.
  const SURFACE_MIN = 1.12;
  //
  // CARD_MIN — 카드 표면은 배지보다 요구가 세다. 앱의 주 컨테이너이고, 테두리가
  // 없는 카드 변형(muted, bg-gal-light 만 쓰는 패널)이 실재하기 때문이다.
  const CARD_MIN = 1.25;
  //
  // BORDER_MIN — WCAG 1.4.11(비텍스트 대비). **테두리를 카드 장식으로 보면 안 된다.**
  // gal-border 는 이 저장소에서 입력 필드의 유일한 식별 수단이다
  // (입력 15곳이 `border border-gal-border bg-gal-bg`, Button 의 secondary 도 같다).
  // 컨트롤을 식별하는 시각 정보에는 인접색 대비 3:1 이 요구된다. 한 토큰이 카드
  // 테두리와 입력 테두리를 겸하는 이상, 느슨한 쪽이 아니라 **엄격한 쪽**이 값을 정한다.
  // 인접색은 둘이다 — 바깥의 페이지와 안쪽의 카드 — 그래서 두 행을 모두 검사한다.
  // (이전 다크 분기의 1.5 는 검사 대상 hex 에서 역산된 값이라, 1/255 만 어긋나도
  //  실패하는 그 하나의 값에만 예 라고 답할 수 있었다.)
  const BORDER_MIN = 3.0;

  // [전경, 배경, 라벨, 최소요구]
  const PAIRS = [
    // ── 텍스트 : 페이지 위 ──
    [BLACK,          PAGE, 'gal-black on page', 4.5],
    [hex('gal-dark'), PAGE, 'gal-dark on page', 4.5],
    [hex('gal-body'), PAGE, 'gal-body on page', 4.5],
    [hex('gal-muted'), PAGE, 'gal-muted on page', 4.5],
    [INK,            PAGE, 'accent-ink on page', 4.5],
    // ── 텍스트 : 카드 위 ──
    // 카드는 페이지보다 밝으므로 여기가 항상 더 빡빡하다. 페이지만 재고 넘어가면
    // 카드 안에서만 AA 를 놓치는 조합이 그대로 통과한다.
    [BLACK,           CARD, 'gal-black on card', 4.5],
    [hex('gal-body'), CARD, 'gal-body on card', 4.5],
    [hex('gal-muted'), CARD, 'gal-muted on card', 4.5],
    [INK,             CARD, 'accent-ink on card', 4.5],
    // ── 액센트 채움 위 흰 글씨 (Button primary / hover) ──
    [WHITE, hex('gal-accent'), 'white on accent-fill', 4.5],
    [WHITE, hex('gal-accent-dark'), 'white on accent-fill:hover', 4.5],
    // ── 액센트 틴트 (Navigation 활성 탭, 배지) ──
    [INK,             hex('gal-accent-light'), 'accent-ink on accent-light', 4.5],
    [hex('gal-body'), hex('gal-accent-light'), 'gal-body on accent-light', 4.5],
    [hex('gal-accent-light'), CARD, 'accent-light on card', SURFACE_MIN],
    // ── 표면 사다리 ──
    [CARD, PAGE, 'card on page', CARD_MIN],
    // ── 경계선 : 안팎 두 인접색 모두 ──
    [hex('gal-border'), PAGE, 'border on page', BORDER_MIN],
    [hex('gal-border'), CARD, 'border on card', BORDER_MIN],
    // ── 상태색 ──
    // text-status-* : 페이지 위 글자
    ...STATUS.map((n) => [hex(`status-${n}`), PAGE, `text-status-${n} on page`, 4.5]),
    // text-status-* : 카드 위 글자
    ...STATUS.map((n) => [hex(`status-${n}`), CARD, `text-status-${n} on card`, 4.5]),
    // bg-status-*-light : 틴트 표면 위 gal-black 본문
    ...STATUS.map((n) => [BLACK, hex(`status-${n}-light`), `gal-black on ${n}-light`, 4.5]),
    // 배지 조합 : 틴트 위에 같은 계열 잉크
    ...STATUS.map((n) => [hex(`status-${n}`), hex(`status-${n}-light`), `${n} ink on ${n}-light`, 4.5]),
    // 표면 식별 : 틴트가 **카드 위에서** 구분되는가. 배지는 페이지가 아니라 카드
    // 안에 산다 — 페이지 기준으로만 재면 카드 위에서 사라지는 틴트가 통과한다.
    ...STATUS.map((n) => [hex(`status-${n}-light`), CARD, `${n}-light on card`, SURFACE_MIN]),
    // 채움으로 쓰이는 상태색 : Button 의 danger 변형(`bg-status-danger`)이 유일한
    // 소비자다. 다크에서 잉크가 밝아졌으므로 그 위 글자는 흰색이 아니라 페이지색이다.
    [PAGE, hex('status-danger'), 'page-ink on danger fill', 4.5],
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
}
