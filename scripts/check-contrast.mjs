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

  const BLACK = hex('gal-black');   // 본문 기본 잉크
  const WHITE = '#ffffff';          // 페이지 배경 — 토큰이 아니라 index.html 크리티컬 CSS 의 body 값

  // 상태색은 잉크 / 틴트(-light) 쌍이다. 한 값이 잉크와 표면을 겸할 수 없다 —
  // 잉크는 흰 바탕 위 글자용, 틴트는 gal-black 글자를 얹는 표면용.
  // 파일에 이미 있는 gal-accent / gal-accent-light 선례를 그대로 따른다.
  const STATUS = ['success', 'warning', 'danger', 'info'];

  // [전경, 배경, 라벨, 최소요구]
  const PAIRS = process.argv[2] === '--dark'
    // 다크 값은 아직 설정에 없다 — Task 7 이 토큰을 만들 때 위 hex() 로 갈아끼운다.
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
        [hex('gal-body'),   WHITE, 'gal-body (현행)', 4.5],
        [hex('gal-muted'),  WHITE, 'gal-muted (현행)', 4.5],
        [hex('gal-accent'), WHITE, 'gal-accent (현행)', 4.5],
        // text-status-* : 흰 바탕 위 글자
        ...STATUS.map((n) => [hex(`status-${n}`), WHITE, `text-status-${n}`, 4.5]),
        // bg-status-*-light : 틴트 표면 위 gal-black 본문
        ...STATUS.map((n) => [BLACK, hex(`status-${n}-light`), `gal-black on ${n}-light`, 4.5]),
        // 배지 조합 : 틴트 위에 같은 계열 잉크
        ...STATUS.map((n) => [hex(`status-${n}`), hex(`status-${n}-light`), `${n} ink on ${n}-light`, 4.5]),
        // 표면 식별 : 틴트가 흰 페이지 위에서 구분되는가.
        // 이걸 재지 않고 가정했기 때문에 amber-50 틴트가 gal-bg 보다 안 보이는 채로 통과했다.
        ...STATUS.map((n) => [hex(`status-${n}-light`), WHITE, `${n}-light on page`, 1.5]),
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
