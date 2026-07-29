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

// 아래는 CLI 로 직접 실행할 때만 돈다. 가드가 없으면 `ratio` 를 import 하는 쪽에서
// 최상위 process.exit() 이 프로세스를 죽인다 (Task 7 이 이 모듈을 import 할 수 있다).
if (import.meta.url === `file://${process.argv[1]}`) {
  // [전경, 배경, 라벨, 최소요구]
  const PAIRS = process.argv[2] === '--dark'
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
        ['#666666', '#ffffff', 'gal-body (현행)', 4.5],
        ['#999999', '#ffffff', 'gal-muted (현행)', 4.5],
        ['#2ea3f2', '#ffffff', 'gal-accent (현행)', 4.5],
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
