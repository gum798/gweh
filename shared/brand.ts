/**
 * 브랜드 문자열의 유일한 정의.
 *
 * 저장소가 스스로를 네 가지로 불렀다: index.html 과 구독자 메일의 MYSTIC AI,
 * 앱 헤더의 GWEH AI, 기본 탭 첫 화면의 MYSTIC, 구독 배지의 DAILY MYSTIC.
 * 메일을 받은 사람과 앱을 연 사람이 서로 다른 제품을 보고 있었다.
 * 다음 변경이 1줄이 되도록 여기 모은다.
 *
 * 왜 src/lib 이 아니라 shared 인가 — 앱(src)과 Worker(workers/daily-cron)가
 * 같은 문자열을 써야 하는데 tsconfig 프로젝트가 서로 다르다. Worker 와
 * Functions 의 tsconfig 는 이미 상위 shared 디렉터리를 include 하고 있고
 * (shared/gemini.ts 선례), 여기가 세 프로젝트가 모두 볼 수 있는 유일한
 * 경계다. 앱 코드는 기존 경로를 유지하려고 src/lib/brand.ts 재수출로 쓴다.
 *
 * 바꾸지 않는 것 — localStorage 키(mystic_ 접두사)와 Worker 이름
 * (mystic-daily-cron). 전자는 이미 배포된 사용자의 저장 데이터를, 후자는
 * Cloudflare 배포 대상을 가리킨다. 이름만 예쁘게 하려고 사용자 데이터를
 * 잃거나 배포를 갈아엎을 이유가 없다. 의도적 예외다.
 */

/** 렌더되는 모든 브랜드 표기. */
export const BRAND = 'GWEH AI';

/** 공유 카드 푸터에 찍히는 도메인. 예전 값 mystic-ai.com 은 존재한 적이 없다. */
export const BRAND_DOMAIN = 'gweh-3s2.pages.dev';

/** 내려받기 파일명 접두사. 사용자에게 보이지만 번역 대상은 아니다. */
export const BRAND_FILE_SLUG = 'gweh';
