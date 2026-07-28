/**
 * Gemini 모델의 유일한 정의.
 *
 * 2026-03 ~ 2026-07 사이 gemini-2.0-flash 가 예고 없이 퇴역하여 AI 기능 전체가
 * 4개월간 죽어 있었다. 같은 일이 반복될 때 배포 없이 복구할 수 있도록 두 계층으로 둔다.
 *
 *   1. GEMINI_MODEL 환경변수 — Cloudflare 대시보드에서 문자열만 교체 (배포 불필요)
 *   2. DEFAULT_GEMINI_MODEL 상수 — 코드 1줄 수정 후 배포
 *
 * 이 파일은 functions/ 바깥에 있다. functions/ 내부의 언더스코어 디렉터리가
 * 라우팅에서 제외되는지는 Cloudflare 공식 문서에서 확인되지 않았으므로,
 * 애초에 라우팅 대상이 아닌 위치를 택했다.
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export interface GeminiEnv {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
}

export function geminiModel(env: GeminiEnv): string {
  // trim 은 편의가 아니라 복구 경로의 일부다. 이 값은 모델이 퇴역해 서비스가 죽은
  // 상태에서, 대시보드에 손으로 붙여넣어진다. 붙여넣기에 딸려온 공백 하나는
  // URL 경로를 깨뜨리고, 그 실패는 '교체한 모델도 죽었다'와 똑같이 보인다 —
  // 운영자를 자기 런북의 틀린 분기로 보내는 가장 나쁜 실패다.
  //
  // 공백만 있는 값은 trim 후 빈 문자열이 되고, || 가 기본값으로 떨어뜨린다.
  // ?? 로 바꾸면 안 된다 — 빈 문자열이 통과해 모델 자리가 비어버린다.
  return env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function geminiEndpoint(env: GeminiEnv): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel(env)}:generateContent?key=${env.GEMINI_API_KEY}`;
}
