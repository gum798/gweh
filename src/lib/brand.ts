/**
 * 앱(src)용 브랜드 재수출. 값의 정의는 shared/brand.ts 에 있다 —
 * Worker 의 메일 템플릿이 같은 문자열을 쓰는데 tsconfig 프로젝트가 달라서
 * src 를 볼 수 없기 때문이다. 이 파일은 앱 쪽 import 경로를 그대로 두기
 * 위한 얇은 재수출이고, 값을 바꿀 곳은 shared/brand.ts 한 곳뿐이다.
 *
 * BRAND_SHORT('GWEH')는 지웠다. 소비자가 0곳이었고, 살려 두면 GWEH AI 와
 * GWEH 라는 표기가 둘로 갈라진다 — 이 작업이 없애려는 문제 그 자체다.
 * 대신 실제로 쓰이는 두 값을 둔다: BRAND_DOMAIN(공유 카드 푸터),
 * BRAND_FILE_SLUG(공유 이미지 파일명).
 *
 * 렌더되는 문구 안에서는 이 상수를 직접 붙이지 말고 로케일의 {{brand}} 를
 * 쓴다. src/i18n.ts 가 interpolation.defaultVariables 로 채워 주므로 호출부에
 * 인자를 넘길 필요가 없다.
 */
export { BRAND, BRAND_DOMAIN, BRAND_FILE_SLUG, splitBrand } from '../../shared/brand';
