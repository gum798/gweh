# GWEH 장애 복구 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 퇴역한 Gemini 모델로 죽은 AI 기능 6곳을 되살리고, Polar 페이월 우회를 막고, 카메라 버그를 진단 가능한 상태로 만들고, 다음 외부 의존성 장애를 하루 안에 감지한다.

**Architecture:** Gemini 모델명을 `shared/gemini.ts` 한 곳으로 모으고 `GEMINI_MODEL` 환경변수로 배포 없이 교체 가능하게 만든다. 카메라 실패는 세 갈래(모델 로드 / 미검출 / 예기치 못한 예외)로 분리하여 원본 예외를 노출한다. 재발 감지는 이미 매시간 도는 `workers/daily-cron/worker.ts`에 얹어 새 인프라를 만들지 않는다.

**Tech Stack:** React 19 + Vite 6 + TypeScript, Cloudflare Pages Functions, Cloudflare Workers (cron), Supabase, Polar, Google Gemini, Resend, i18next

**설계 근거:** `docs/superpowers/specs/2026-07-28-error-recovery-design.md`

## Global Constraints

- **모델명 하드코딩 금지.** Gemini 모델 문자열은 `shared/gemini.ts`에만 존재한다. 호출부는 `geminiEndpoint(env)`만 쓴다.
- **교체 모델은 `gemini-3.5-flash-lite`.** 환경변수 `GEMINI_MODEL`이 있으면 그것이 우선한다.
- **이 저장소에는 테스트 러너가 없다.** 검증은 실제 엔드포인트 호출(curl)로 한다. `npm run lint`는 `**/*.{js,jsx}`만 대상으로 하여 `src/`를 검사하지 않으므로 통과 여부에 의미를 두지 않는다.
- **작업 브랜치는 `fix/error-recovery`.** 각 태스크마다 커밋하고, 전체 검증 후 `main`에 머지·푸시한다. (`지침.md`: "소스 수정하면 푸시까지")
- **운영 환경변수를 검증 목적으로 변경하지 않는다.** 실패 주입 테스트는 로컬 `wrangler dev`에서만 한다.
- **모든 사용자 노출 문자열은 `t()`를 거친다.** ko/en 양쪽 로케일에 키를 추가한다. 한쪽만 추가하면 i18next가 키 문자열을 그대로 화면에 노출한다.
- **Gemini 프롬프트는 예외**로 하드코딩된 한국어를 유지한다 (기존 관례).
- **`functions/api/*.ts`의 기존 관례를 따른다:** 각 파일이 자체 `PagesFunction` 타입과 `corsHeaders`를 선언하고 `onRequestOptions`를 export한다. 이 중복은 의도된 것이므로 정리하지 않는다.

## 파일 구조

| 파일 | 상태 | 책임 |
|---|---|---|
| `shared/gemini.ts` | 생성 | Gemini 모델명·엔드포인트의 유일한 정의. `functions/` 바깥에 두어 라우팅 대상이 될 여지를 없앤다 |
| `src/hooks/detectionError.ts` | 생성 | `DetectionError` 클래스. "사용자에게 그대로 보여도 되는 에러"와 "예기치 못한 예외"를 구분하는 표지 |
| `supabase/migrations/005_fashion_usage.sql` | 생성 | 코드는 쓰는데 마이그레이션이 없던 테이블 정의 |
| `functions/api/fortune.ts` | 수정 | Gemini 엔드포인트 교체 |
| `functions/api/personal-omen.ts` | 수정 | Gemini 엔드포인트 교체 |
| `functions/api/fashion-consult.ts` | 수정 | Gemini 엔드포인트 교체 |
| `functions/api/daily-style.ts` | 수정 | Gemini 엔드포인트 교체 + `verifySubscription()` 전면 교체 |
| `workers/daily-cron/worker.ts` | 수정 | Gemini 엔드포인트 교체 ×2 + 셀프체크 추가 |
| `workers/daily-cron/tsconfig.json` | 수정 | 상위 디렉터리 임포트 허용 |
| `src/hooks/useFaceDetection.ts` | 수정 | 실패 세 갈래 분리 |
| `src/hooks/useHandDetection.ts` | 수정 | 실패 세 갈래 분리 |
| `src/locales/{ko,en}/common.json` | 수정 | 신규 에러 키 |
| `package.json` | 수정 | `wrangler` devDependency 추가 |

---

### Task 1: 공유 모듈 성립 검증 + 운세 복구

가장 위험한 가정(`functions/` 바깥 임포트가 Pages 빌드에서 성립하는가)을 **가장 먼저** 검증하면서, 동시에 가장 시급한 엔드포인트를 고친다. 여기서 실패하면 후퇴안으로 전환하고 Task 2~7의 구조가 바뀐다.

**Files:**
- Create: `shared/gemini.ts`
- Modify: `functions/tsconfig.json` (상위 디렉터리 임포트 허용)
- Modify: `functions/api/fortune.ts:1-5` (Env), `functions/api/fortune.ts:126`
- Modify: `package.json` (devDependencies)

**Interfaces:**
- Produces: `DEFAULT_GEMINI_MODEL: string`, `GeminiEnv` 인터페이스, `geminiModel(env: GeminiEnv): string`, `geminiEndpoint(env: GeminiEnv): string` — Task 2·3·7이 그대로 사용한다.

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/seojeonghwa/project/gweh
git checkout -b fix/error-recovery
```

- [ ] **Step 2: wrangler를 devDependency로 추가**

`wrangler`는 선택이 아니다. `workers/daily-cron/`은 Pages 빌드와 별개로 `wrangler deploy`가 필요하고, Task 7의 실패 주입 검증(V10)도 `wrangler dev`를 쓴다.

**정확한 버전을 고정해야 한다.** `wrangler@^4.61.0`이나 `~4.61.0`은 모두 ERESOLVE로 실패한다 — `^`는 최신 4.x(4.114.0)를 고르는데 그건 `@cloudflare/workers-types@^5`를 요구하고, `~`가 고르는 4.61.1은 peer 하한을 `^4.20260128.0`으로 올린다. 저장소 핀(`^4.20260124.0`)과 호환되는 창은 **정확히 4.61.0 한 버전뿐**이다.

```bash
npm install --save-dev --save-exact wrangler@4.61.0
```

`--save-exact`가 필요하다. 없으면 npm이 `"^4.61.0"`을 써넣어 락파일 없는 설치에서 다시 깨진다.

- [ ] **Step 3: `shared/gemini.ts` 생성**

```ts
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
  return env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

export function geminiEndpoint(env: GeminiEnv): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel(env)}:generateContent?key=${env.GEMINI_API_KEY}`;
}
```

- [ ] **Step 4: `functions/tsconfig.json`이 상위 디렉터리를 보게 한다**

현재 `include`가 `["./**/*.ts"]`라 `../shared/`를 타입 검사 대상에 포함하지 않는다. 전체를 아래로 교체한다:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2021"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["./**/*.ts", "../shared/**/*.ts"]
}
```

이것은 타입 검사 범위일 뿐이며, 실제 번들링 성립 여부는 Step 7에서 별도로 검증한다. 둘은 다른 문제다.

- [ ] **Step 5: `functions/api/fortune.ts`의 Env에 `GEMINI_MODEL` 추가**

파일 맨 위 `interface Env` (1-5행)를 교체한다:

```ts
import { geminiEndpoint } from '../../shared/gemini';

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}
```

- [ ] **Step 6: `functions/api/fortune.ts:126`의 하드코딩된 URL 교체**

찾을 코드:

```ts
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${context.env.GEMINI_API_KEY}`,
```

바꿀 코드:

```ts
    const response = await fetch(
      geminiEndpoint(context.env),
```

- [ ] **Step 7: 커밋하고 프리뷰 배포 유발**

```bash
git add shared/gemini.ts functions/tsconfig.json functions/api/fortune.ts package.json package-lock.json
git commit -m "fix: Gemini 모델명을 shared/gemini.ts로 중앙화하고 fortune 복구

gemini-2.0-flash 퇴역으로 죽은 /api/fortune 을 gemini-3.5-flash-lite 로 교체.
GEMINI_MODEL 환경변수가 있으면 우선하므로 다음 퇴역 시 배포 없이 복구 가능."
git push -u origin fix/error-recovery
```

- [ ] **Step 8: V1 — 임포트 성립 검증 (이 태스크의 핵심 게이트)**

Cloudflare Pages가 `fix/error-recovery` 브랜치의 프리뷰 배포를 생성할 때까지 기다린 뒤, 프리뷰 URL을 확인한다 (Cloudflare 대시보드 → Pages → gweh → Deployments).

```bash
PREVIEW="https://<프리뷰-해시>.gweh-3s2.pages.dev"
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"birth_date":"1990-01-01"}' "$PREVIEW/api/fortune" | head -c 400
```

기대: HTTP 200 + `{"success":true,"fortune":{...}}`

**실패 시 판단 기준:**
- 빌드 자체가 실패하거나 `Cannot find module '../../shared/gemini'` → **후퇴안으로 전환.** Step 3의 파일과 Step 4의 tsconfig 변경을 되돌리고, `fortune.ts` 안에 직접 아래를 넣은 뒤 Step 6부터 다시 진행한다. Task 2·3·7도 같은 방식(각 파일이 자체 fallback 상수 보유)으로 조정한다.

```ts
  const GEMINI_MODEL_FALLBACK = 'gemini-3.5-flash-lite';
  const model = context.env.GEMINI_MODEL || GEMINI_MODEL_FALLBACK;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${context.env.GEMINI_API_KEY}`;
```

- [ ] **Step 9: V2 + V3 — 응답 내용 검증**

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"birth_date":"1990-01-01"}' "$PREVIEW/api/fortune" \
  | python3 -m json.tool
```

확인 항목 — 하나라도 어긋나면 다음 태스크로 넘어가지 않는다:
- `fortune.overall` 존재하고 비어 있지 않음
- `fortune.level`이 `대길`/`길`/`평`/`소흉`/`흉` 중 하나
- `fortune.love`, `career`, `wealth`, `health`, `advice` 전부 한국어
- `fortune.luckyNumber`가 문자열이 아닌 숫자

`level`이 목록 밖 값이거나 필드가 영어로 나오면 3.x 세대의 프롬프트 준수도 문제다. 이때는 **코드를 고치지 말고** Cloudflare Pages 환경변수에 `GEMINI_MODEL=gemini-2.5-flash`를 설정하고 재배포하여 재검증한다. 이 우회가 가능한 것이 §4.1 이중 구조의 실효다.

- [ ] **Step 10: 검증 결과 기록 커밋**

검증 중 `GEMINI_MODEL` 환경변수로 모델을 바꿨다면, `shared/gemini.ts`의 `DEFAULT_GEMINI_MODEL`도 같은 값으로 맞추고 커밋한다. 환경변수와 기본값이 갈라진 채로 두지 않는다.

```bash
git add -A && git commit -m "fix: 검증 결과에 따라 기본 모델 확정" || echo "변경 없음"
```

---

### Task 2: 나머지 Pages Functions 3곳 교체

**Files:**
- Modify: `functions/api/personal-omen.ts:1-5, :175`
- Modify: `functions/api/fashion-consult.ts:1-3, :110`
- Modify: `functions/api/daily-style.ts:1-8, :106`

**Interfaces:**
- Consumes: `geminiEndpoint(env)` from Task 1

- [ ] **Step 1: `personal-omen.ts` 수정**

맨 위에 임포트 추가하고 `interface Env`에 `GEMINI_MODEL?: string`을 넣는다:

```ts
import { geminiEndpoint } from '../../shared/gemini';

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}
```

`:175` 근처에서 찾을 코드:

```ts
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${context.env.GEMINI_API_KEY}`,
```

바꿀 코드:

```ts
    const response = await fetch(
      geminiEndpoint(context.env),
```

- [ ] **Step 2: `fashion-consult.ts` 수정**

맨 위 `interface Env`(1-3행)를 교체:

```ts
import { geminiEndpoint } from '../../shared/gemini';

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
}
```

`:110` 근처에서 찾을 코드:

```ts
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${context.env.GEMINI_API_KEY}`,
```

바꿀 코드:

```ts
    const response = await fetch(
      geminiEndpoint(context.env),
```

- [ ] **Step 3: `daily-style.ts` 수정 (Gemini 부분만)**

`verifySubscription()`은 Task 4에서 따로 다룬다. 지금은 Env와 엔드포인트만 손댄다.

맨 위 `interface Env`(1-8행)를 교체:

```ts
import { geminiEndpoint } from '../../shared/gemini';

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  POLAR_SANDBOX_ACCESS_TOKEN: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SANDBOX: string;
}
```

`:106` 근처에서 찾을 코드:

```ts
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${context.env.GEMINI_API_KEY}`,
```

바꿀 코드:

```ts
    const geminiRes = await fetch(
      geminiEndpoint(context.env),
```

- [ ] **Step 4: 하드코딩된 모델명이 남아있지 않은지 확인**

```bash
grep -rn "gemini-2.0-flash\|generativelanguage.googleapis.com" functions/
```

기대 출력: **아무것도 없음.** 남아 있으면 그 파일을 마저 고친다.

- [ ] **Step 5: 커밋 및 배포**

```bash
git add functions/api/personal-omen.ts functions/api/fashion-consult.ts functions/api/daily-style.ts
git commit -m "fix: 나머지 Pages Functions 3곳의 Gemini 엔드포인트 중앙화"
git push
```

- [ ] **Step 6: V4 — 멀티모달 경로 검증**

`fashion-consult`는 이미지를 함께 보내는 유일한 엔드포인트다. 텍스트 전용 경로가 통과해도 멀티모달은 따로 확인해야 한다. 1×1 PNG로 최소 검증한다.

```bash
IMG="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
curl -s -X POST "$PREVIEW/api/fashion-consult" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-token-for-shape-check" \
  -d "{\"image\":\"$IMG\",\"height\":175,\"weight\":70}" | head -c 400
```

기대: **HTTP 200**이며 `success:true` + `data.bodyAnalysis` 존재.

이 엔드포인트는 `Authorization` 헤더의 **존재만** 확인하고 토큰을 검증하지 않으므로(`fashion-consult.ts:26-29`) 더미 토큰으로 통과한다. 만약 `AI 분석 중 오류가 발생했습니다`가 나오면 응답의 `details` 필드에 Gemini 원문 에러가 담기니 그것을 읽고 판단한다.

---

### Task 3: cron worker Gemini 교체

worker는 Pages와 **별개로 배포**된다. Pages 프리뷰 배포에 포함되지 않으므로 별도 검증이 필요하다.

**Files:**
- Modify: `workers/daily-cron/worker.ts:4-13` (Env), `:251`, `:304`
- Create: `workers/daily-cron/tsconfig.json` (존재하지 않음)

**Interfaces:**
- Consumes: `geminiEndpoint(env)` from Task 1

- [ ] **Step 1: worker tsconfig를 생성한다**

`workers/daily-cron/`에는 `worker.ts`와 `wrangler.toml`뿐이며 **tsconfig.json이 없다.** (초기 계획은 이 파일이 있다고 잘못 기술했다 — `functions/tsconfig.json`과 혼동한 오류다.) 즉 이 워커는 지금까지 타입 검사를 전혀 받지 않았다. 아래 내용으로 **새로 만든다**:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2021"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true
  },
  "include": ["./**/*.ts", "../../shared/**/*.ts"]
}
```

- [ ] **Step 2: worker의 Env에 `GEMINI_MODEL` 추가**

`worker.ts:4-13`의 `interface Env`를 교체한다. `ALERT_EMAIL`은 Task 7에서 쓰지만 지금 함께 넣어 Env 정의를 두 번 건드리지 않는다:

```ts
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SANDBOX_ACCESS_TOKEN: string;
  POLAR_SANDBOX: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  RESEND_API_KEY: string;
  VITE_OPENWEATHER_API_KEY: string;
  NASA_API_KEY?: string;
  ALERT_EMAIL?: string;
}
```

- [ ] **Step 3: 파일 맨 위에 임포트 추가**

`worker.ts` 첫 줄의 주석 블록 바로 다음에 넣는다:

```ts
import { geminiEndpoint } from '../../shared/gemini';
```

- [ ] **Step 4: `:251`과 `:304`의 두 호출부 교체**

두 곳 모두 아래 형태다 (`gemini-2.0-flash-**lite**` 임에 유의):

```ts
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`,
```

각각을 아래로 바꾼다:

```ts
    geminiEndpoint(env),
```

- [ ] **Step 5: 남은 하드코딩 확인**

```bash
grep -rn "gemini-2.0\|generativelanguage.googleapis.com" workers/
```

기대 출력: **아무것도 없음.**

- [ ] **Step 6: worker 배포**

```bash
cd workers/daily-cron
npx wrangler deploy
cd ../..
```

`GEMINI_MODEL`을 Pages 쪽에서 설정했다면 worker에도 동일하게 설정해야 한다. 둘은 별개 환경이다:

```bash
cd workers/daily-cron && npx wrangler secret put GEMINI_MODEL && cd ../..
```

(기본값으로 충분하면 이 단계는 건너뛴다.)

- [ ] **Step 7: V5 — worker 실행 로그에서 404 부재 확인**

터미널 하나에서 로그를 열고:

```bash
cd workers/daily-cron && npx wrangler tail
```

다른 터미널에서 수동 트리거:

```bash
curl -s "https://mystic-daily-cron.<your-subdomain>.workers.dev/test?force=true&regenerate=true" | head -c 300
```

기대: `wrangler tail` 출력에 `no longer available` 또는 `"code": 404`가 **없어야** 한다. worker URL은 `npx wrangler deploy` 출력에 표시된다.

- [ ] **Step 8: 커밋**

```bash
git add workers/daily-cron/worker.ts workers/daily-cron/tsconfig.json
git commit -m "fix: cron worker의 Gemini 엔드포인트 중앙화 (gemini-2.0-flash-lite 퇴역 대응)"
git push
```

---

### Task 4: Polar 페이월 우회 수정

`daily-style.ts`의 `verifySubscription()`이 Polar 미지원 필터 `customer_email`을 써서, 조직에 유료 고객이 1명이라도 있으면 **로그인한 모든 비구독자**를 통과시킨다. 올바른 구현이 같은 저장소 `subscription-status.ts:43-72`에 이미 있다.

**Files:**
- Modify: `functions/api/daily-style.ts:10-33`

**Interfaces:**
- Produces: `verifySubscription(env: Env, accessToken: string): Promise<'subscribed' | 'not-subscribed' | 'upstream-error'>` — 반환 타입이 boolean에서 3-상태로 바뀐다. 호출부(`:42-45`)도 함께 고친다.

- [ ] **Step 1: `verifySubscription()` 전면 교체**

`daily-style.ts:10-33`의 함수 전체를 아래로 교체한다:

```ts
/**
 * Polar 구독 상태 확인.
 *
 * 이전 구현은 `?customer_email=...&active=true` 를 썼으나 Polar는 customer_email 필터를
 * 지원하지 않으며 미지원 파라미터를 에러 없이 버린다. 그 결과 실제 질의는
 * "조직 전체의 활성 구독 아무거나 1건"이 되어, 조직에 유료 고객이 한 명이라도 있으면
 * 로그인한 모든 비구독자가 유료 기능을 통과했다.
 *
 * subscription-status.ts:43-72 의 검증된 2단계 조회로 교체한다.
 * active=true 는 Polar OpenAPI에서 deprecated 이므로 status 값으로 직접 판정한다.
 *
 * 반환값을 boolean이 아닌 3-상태로 둔 이유: 업스트림 장애를 "구독 없음"과 같이 취급하면
 * Polar가 흔들릴 때 유료 고객을 조용히 거부하게 된다. 조용히 틀린 답을 주는 것보다
 * 명시적으로 실패하는 편이 낫다.
 */
type SubscriptionCheck = 'subscribed' | 'not-subscribed' | 'upstream-error';

async function verifySubscription(env: Env, accessToken: string): Promise<SubscriptionCheck> {
  // 1) Supabase에서 사용자 이메일 조회
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (userRes.status === 401 || userRes.status === 403) return 'not-subscribed';
  if (!userRes.ok) {
    console.error('Supabase user lookup failed:', userRes.status, await userRes.text());
    return 'upstream-error';
  }
  const user = await userRes.json() as { email: string };

  const isSandbox = env.POLAR_SANDBOX === 'true';
  const polarToken = isSandbox ? env.POLAR_SANDBOX_ACCESS_TOKEN : env.POLAR_ACCESS_TOKEN;
  const apiBaseUrl = isSandbox ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';

  // 2) 이메일로 Polar customer 조회
  const custRes = await fetch(
    `${apiBaseUrl}/v1/customers/?email=${encodeURIComponent(user.email)}&limit=1`,
    { headers: { 'Authorization': `Bearer ${polarToken}` } }
  );
  if (!custRes.ok) {
    console.error('Polar customer lookup failed:', custRes.status, await custRes.text());
    return 'upstream-error';
  }
  const custData = await custRes.json() as { items?: any[] };
  const customer = custData.items?.[0];
  if (!customer) return 'not-subscribed';

  // 3) customer_id로 구독 조회 후 status로 판정
  const subsRes = await fetch(
    `${apiBaseUrl}/v1/subscriptions/?customer_id=${customer.id}&limit=10`,
    { headers: { 'Authorization': `Bearer ${polarToken}` } }
  );
  if (!subsRes.ok) {
    console.error('Polar subscription lookup failed:', subsRes.status, await subsRes.text());
    return 'upstream-error';
  }
  const subsData = await subsRes.json() as { items?: any[] };
  const active = subsData.items?.find(
    (s: any) => s.status === 'active' || s.status === 'trialing'
  );
  return active ? 'subscribed' : 'not-subscribed';
}
```

- [ ] **Step 2: 호출부를 3-상태에 맞게 수정**

`daily-style.ts:42-45`의 찾을 코드:

```ts
    const isSubscribed = await verifySubscription(context.env, authHeader.slice(7));
    if (!isSubscribed) {
      return Response.json({ error: 'Subscription required' }, { status: 403 });
    }
```

바꿀 코드:

```ts
    const check = await verifySubscription(context.env, authHeader.slice(7));
    if (check === 'upstream-error') {
      return Response.json(
        { error: '구독 상태를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 503 }
      );
    }
    if (check === 'not-subscribed') {
      return Response.json({ error: 'Subscription required' }, { status: 403 });
    }
```

- [ ] **Step 3: 미지원 필터가 Polar URL에 남아있지 않은지 확인**

주의: 맨몸 `grep customer_email`은 쓸 수 없다. `customer_email`은 **정당한 용도**로도 쓰인다 — `checkout.ts:61`·`subscribe.ts:60`의 체크아웃 요청 **본문 필드**, `polar-webhook.ts:11,56`의 인바운드 웹훅 **페이로드 필드**. 이들을 지우면 결제가 깨진다. 문제는 오직 **URL 쿼리 필터로 쓰인 경우**다.

```bash
grep -rnE '\$\{apiBaseUrl\}/v1/[^`]*(customer_email|active=true)' functions/
```

기대 출력: **아무것도 없음.** (`daily-style.ts`의 설명 주석에 옛 쿼리 문자열이 남는 것은 의도된 것이며 이 패턴에 걸리지 않는다.)

- [ ] **Step 4: 커밋 및 배포**

```bash
git add functions/api/daily-style.ts
git commit -m "fix: daily-style 페이월 우회 차단

customer_email 은 Polar 미지원 필터로 조용히 무시되어, 조직에 유료 고객이 1명이라도
있으면 로그인한 모든 비구독자가 유료 기능을 통과했다. subscription-status.ts 의
검증된 2단계 조회(customer 조회 -> customer_id 로 구독 조회)로 교체하고,
deprecated 된 active=true 대신 status 값으로 판정한다.

업스트림 장애를 '구독 없음'과 구분하여 503으로 올린다. 이전에는 Polar 장애 시
유료 고객을 조용히 거부했다."
git push
```

- [ ] **Step 5: V6 — 비구독 계정이 차단되는지 확인**

Polar에 등록되지 않은 이메일로 Supabase 계정을 만들고 access token을 얻는다.

```bash
SUPA="https://ynazlsxerdvqkzqvykjj.supabase.co"
ANON="sb_publishable_Dq7Tj4MLTyj6UBnHBwFgZw_3_SOgV-T"
curl -s -X POST "$SUPA/auth/v1/signup" -H "apikey: $ANON" \
  -H "Content-Type: application/json" \
  -d '{"email":"paywall-test@example.com","password":"TestPassword123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token','<이메일 확인 필요>'))"
```

토큰을 얻었으면:

```bash
TOKEN="<위에서 얻은 access_token>"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$PREVIEW/api/daily-style" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"omenMessage":"test","energy":"보통","lang":"ko"}'
```

기대: **403**. 200이 나오면 우회가 아직 살아 있다.

수정 전에 같은 요청이 200을 반환하는지 먼저 확인해두면 회귀 여부가 명확해진다. `main` 브랜치의 운영 URL로 같은 요청을 보내 비교한다.

- [ ] **Step 6: V7 — 구독 계정이 통과하는지 확인**

Polar에 활성 구독이 있는 계정의 토큰으로 같은 요청을 보낸다.

```bash
SUB_TOKEN="<구독자 계정의 access_token>"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$PREVIEW/api/daily-style" \
  -H "Authorization: Bearer $SUB_TOKEN" -H "Content-Type: application/json" \
  -d '{"omenMessage":"test","energy":"보통","lang":"ko"}'
```

기대: **200**. 403이면 정상 고객을 막은 것이므로 즉시 되돌린다. 구독 계정이 없으면 이 검증은 건너뛰되 **건너뛰었음을 기록**하고, 첫 실제 구독자 발생 시 확인한다.

---

### Task 5: 카메라 진단 계측

카메라 버그를 **고치지 않는다.** 세 갈래 실패를 분리하여 다음 재현 때 원인이 확정되게 만든다.

**Files:**
- Create: `src/hooks/detectionError.ts`
- Modify: `src/hooks/useFaceDetection.ts:78, :103, :130, :155, :185`
- Modify: `src/hooks/useHandDetection.ts:56, :81, :118`
- Modify: `src/locales/ko/common.json:92-93`
- Modify: `src/locales/en/common.json:84-85`

**Interfaces:**
- Produces: `class DetectionError extends Error` — "사용자에게 그대로 보여도 되는, 이미 번역된 메시지"라는 표지. 두 훅이 공유한다.

- [ ] **Step 1: `src/hooks/detectionError.ts` 생성**

```ts
/**
 * 이미 i18n 번역을 거쳐 사용자에게 그대로 노출해도 되는 감지 실패를 표시한다.
 *
 * 이것이 없으면 catch 블록에서 "우리가 의도적으로 던진 안내 메시지"와
 * "예기치 못한 런타임 예외"를 구분할 수 없다. 구분하지 못하면 모든 실패가
 * 같은 문구로 뭉개지고, 원인 진단이 불가능해진다 — 실제로 그래서
 * 카메라 버그의 원인을 4개월간 특정하지 못했다.
 */
export class DetectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DetectionError';
  }
}
```

- [ ] **Step 2: `src/locales/ko/common.json` 에러 키 교체·추가**

`:92-93`의 두 줄을 찾는다:

```json
  "error.faceModel": "얼굴 감지 모델을 불러올 수 없습니다",
  "error.handModel": "손 감지 모델을 불러올 수 없습니다",
```

아래로 교체한다 (기존 키는 유지하고 문구만 바꾼 뒤, 신규 키 5개를 더한다):

```json
  "error.faceModel": "얼굴 인식 모듈을 불러오지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요",
  "error.handModel": "손 인식 모듈을 불러오지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요",
  "error.faceNotDetected": "사진에서 얼굴을 찾지 못했습니다. 정면을 보고 밝은 곳에서 다시 촬영해 주세요",
  "error.facesNotDetected": "두 사람의 얼굴을 찾지 못했습니다. 두 분이 함께 나온 사진을 사용해 주세요",
  "error.handNotDetected": "사진에서 손을 찾지 못했습니다. 손바닥을 펴고 밝은 곳에서 다시 촬영해 주세요",
  "error.faceUnexpected": "얼굴 분석 중 오류가 발생했습니다 (원인: {{detail}})",
  "error.handUnexpected": "손 분석 중 오류가 발생했습니다 (원인: {{detail}})",
```

- [ ] **Step 3: `src/locales/en/common.json` 동일 작업**

`:84-85`의 두 줄을 아래로 교체한다:

```json
  "error.faceModel": "Could not load the face recognition module. Check your connection and try again",
  "error.handModel": "Could not load the hand recognition module. Check your connection and try again",
  "error.faceNotDetected": "No face found in the photo. Face the camera in good lighting and try again",
  "error.facesNotDetected": "Could not find two faces. Please use a photo with both people in it",
  "error.handNotDetected": "No hand found in the photo. Open your palm in good lighting and try again",
  "error.faceUnexpected": "Face analysis failed (cause: {{detail}})",
  "error.handUnexpected": "Hand analysis failed (cause: {{detail}})",
```

- [ ] **Step 4: JSON 문법 검증**

```bash
python3 -c "import json; [json.load(open(f)) for f in ['src/locales/ko/common.json','src/locales/en/common.json']]; print('JSON OK')"
```

기대: `JSON OK`. 쉼표 실수는 앱 전체를 흰 화면으로 만든다.

- [ ] **Step 5: 두 로케일의 키 집합이 일치하는지 확인**

```bash
python3 -c "
import json
ko=set(json.load(open('src/locales/ko/common.json')))
en=set(json.load(open('src/locales/en/common.json')))
print('ko에만:', sorted(ko-en)); print('en에만:', sorted(en-ko))
"
```

기대: 양쪽 모두 빈 목록. 한쪽에만 있으면 그 언어에서 키 문자열이 그대로 화면에 노출된다.

- [ ] **Step 6: `useFaceDetection.ts` 임포트 추가**

파일 상단 `import i18next from 'i18next';` 다음 줄에 추가한다:

```ts
import { DetectionError } from './detectionError';
```

- [ ] **Step 7: `useFaceDetection.ts:78` — 모델 로드 실패**

찾을 코드:

```ts
      throw new Error(i18next.t('error.faceModel'));
```

바꿀 코드 (이 파일에서 이 문자열은 `loadModel`과 `loadMultiModel` 두 곳에 있다 — **둘 다** 바꾼다):

```ts
      throw new DetectionError(i18next.t('error.faceModel'));
```

- [ ] **Step 8: `useFaceDetection.ts:103` — 얼굴 미검출**

찾을 코드:

```ts
      if (!predictions || predictions.length === 0) {
        throw new Error(i18next.t('error.faceModel'));
      }
```

바꿀 코드:

```ts
      if (!predictions || predictions.length === 0) {
        throw new DetectionError(i18next.t('error.faceNotDetected'));
      }
```

- [ ] **Step 9: `useFaceDetection.ts:155` — 두 얼굴 미검출 (하드코딩된 한국어 제거)**

찾을 코드:

```ts
      if (!predictions || predictions.length < 2) {
        throw new Error('두 얼굴을 감지할 수 없습니다. 두 사람이 함께 나온 사진을 사용해주세요.');
      }
```

바꿀 코드:

```ts
      if (!predictions || predictions.length < 2) {
        throw new DetectionError(i18next.t('error.facesNotDetected'));
      }
```

- [ ] **Step 10: `useFaceDetection.ts:130` 과 `:185` — catch 블록**

두 catch 블록 모두 아래 형태다:

```ts
    } catch (err) {
      setError(err.message || i18next.t('error.faceModel'));
      setIsLoading(false);
      return null;
    }
```

**둘 다** 아래로 바꾼다:

```ts
    } catch (err) {
      if (err instanceof DetectionError) {
        setError(err.message);
      } else {
        console.error('Face analysis unexpected error:', err);
        setError(i18next.t('error.faceUnexpected', {
          detail: err instanceof Error ? err.message : String(err),
        }));
      }
      setIsLoading(false);
      return null;
    }
```

- [ ] **Step 11: `useHandDetection.ts` 동일 작업**

상단에 임포트 추가:

```ts
import { DetectionError } from './detectionError';
```

`:56` (모델 로드 실패):

```ts
      throw new DetectionError(i18next.t('error.handModel'));
```

`:80-82` (손 미검출) — 찾을 코드:

```ts
      if (!predictions || predictions.length === 0) {
        throw new Error(i18next.t('error.handModel'));
      }
```

바꿀 코드:

```ts
      if (!predictions || predictions.length === 0) {
        throw new DetectionError(i18next.t('error.handNotDetected'));
      }
```

`:117-121` (catch) — 찾을 코드:

```ts
    } catch (err) {
      setError(err.message || i18next.t('error.handModel'));
      setIsLoading(false);
      return null;
    }
```

바꿀 코드:

```ts
    } catch (err) {
      if (err instanceof DetectionError) {
        setError(err.message);
      } else {
        console.error('Hand analysis unexpected error:', err);
        setError(i18next.t('error.handUnexpected', {
          detail: err instanceof Error ? err.message : String(err),
        }));
      }
      setIsLoading(false);
      return null;
    }
```

`:95`의 `catch (lineError)`는 손금 라인 감지 실패를 의도적으로 삼키는 곳이다. **건드리지 않는다.**

- [ ] **Step 12: 빌드가 깨지지 않는지 확인**

```bash
npm run build
```

기대: 성공. `vite build`는 타입 검사를 하지 않는다.

**주의 — 루트 `npx tsc --noEmit`은 쓸 수 없다.** `tsconfig.json:30`의 프로젝트 참조가 `tsconfig.node.json`을 가리키는데 그 파일에 `composite: true`가 없어 TS6306/TS6310으로 **즉시 중단되며 `src/`를 전혀 검사하지 않는다.** 즉 이 저장소에는 프론트엔드 타입 검사 경로가 아예 없다(사전 결함, 이 계획의 범위 밖).

대신 변경한 파일만 직접 검사한다:

```bash
npx tsc --noEmit --skipLibCheck --jsx react-jsx \
  --target ES2020 --module ESNext --moduleResolution bundler \
  --lib ES2020,DOM,DOM.Iterable \
  src/hooks/detectionError.ts src/hooks/useFaceDetection.ts src/hooks/useHandDetection.ts
```

임포트 경로 오타와 미정의 심볼을 잡는 것이 목적이다. 기존에 없던 에러가 새로 생기지 않았는지만 확인한다.

- [ ] **Step 13: 커밋 및 배포**

```bash
git add src/hooks/detectionError.ts src/hooks/useFaceDetection.ts src/hooks/useHandDetection.ts src/locales/ko/common.json src/locales/en/common.json
git commit -m "fix: 얼굴/손 인식 실패를 세 갈래로 분리하여 진단 가능하게 만듦

기존에는 모델 로드 실패, 사진에 대상 없음, 예기치 못한 예외가 모두
'모델을 불러올 수 없습니다' 하나로 뭉개져 원인 구분이 불가능했다.
DetectionError 로 '번역된 안내'와 '실제 예외'를 구분하고, 후자는
원본 메시지를 사용자에게 노출한다.

useFaceDetection.ts:155 의 하드코딩된 한국어도 i18n 키로 옮겼다.

이 커밋은 카메라 버그를 고치지 않는다. 원인을 특정할 수 있게 만든다."
git push
```

- [ ] **Step 14: V8 — 세 갈래가 실제로 구분되는지 확인**

프리뷰 URL을 브라우저에서 열고 `#face` 탭으로 이동한다.

1. **미검출 분기**: 얼굴이 없는 사진(풍경 등)을 업로드
   → 기대: "사진에서 얼굴을 찾지 못했습니다. 정면을 보고 밝은 곳에서 다시 촬영해 주세요"
   → 이전의 "모델을 불러올 수 없습니다"가 나오면 실패
2. **정상 분기**: 얼굴이 또렷한 사진을 업로드
   → 기대: 분석 결과가 정상 표시
3. **예외 분기**: 2번이 실패한다면 그것이 바로 원래 버그다. 표시된 "(원인: ...)" 문구와 브라우저 콘솔의 `Face analysis unexpected error:` 로그를 **그대로 기록한다.** 이것이 이 태스크의 진짜 산출물이다.

`#palm` 탭에서 손 사진으로 1·2번을 반복한다.

**기록 위치**: 관찰 결과를 `docs/superpowers/specs/2026-07-28-error-recovery-design.md`의 §3에 추가 커밋한다. 다음 세션이 이어받을 유일한 단서다.

---

### Task 6: Supabase 복구 마무리 + fashion_usage 마이그레이션

프로젝트가 정지 상태에서 복구되었다. 복구가 코드 변경 없이 해소한 부분과, 사람이 눈으로 확인해야 하는 부분을 나눠 처리한다. 스펙 §4.5 전체를 다룬다.

**Files:**
- Create: `supabase/migrations/005_fashion_usage.sql`

- [ ] **Step 1: 인증 복구 확인 (스펙 §4.5-1)**

```bash
SUPA="https://ynazlsxerdvqkzqvykjj.supabase.co"
ANON="sb_publishable_Dq7Tj4MLTyj6UBnHBwFgZw_3_SOgV-T"
curl -s -o /dev/null -w "auth/v1/settings: %{http_code}\n" \
  -H "apikey: $ANON" "$SUPA/auth/v1/settings"
```

기대: **200**. (2026-07-28 확인 완료. 재확인 목적이다.) 521이면 아직 복구 진행 중이니 기다린다.

- [ ] **Step 2: Google OAuth 설정 생존 확인 (스펙 §4.5-2)**

`AuthModal.tsx:107`이 버튼으로 연결한 유일한 provider가 Google이다. 프로젝트 정지·복구로 OAuth 설정이 유실됐는지 확인한다.

```bash
curl -s -H "apikey: $ANON" "$SUPA/auth/v1/settings" | python3 -m json.tool
```

응답의 `external.google`이 `true`인지 확인한다. `false`거나 키가 없으면 Supabase 대시보드 → Authentication → Providers 에서 Google을 다시 활성화하고 Client ID/Secret을 재입력해야 한다.

브라우저 확인이 더 확실하다: 운영 사이트에서 로그인 모달을 열고 Google 버튼을 눌러 실제로 구글 동의 화면까지 가는지 본다. `redirect_uri_mismatch`가 뜨면 Google Cloud Console의 승인된 리디렉션 URI를 점검한다.

- [ ] **Step 3: 서버측 SUPABASE_URL 확인 (스펙 §4.5-3)**

Pages Functions가 쓰는 `SUPABASE_URL`은 번들에 박힌 `VITE_SUPABASE_URL`과 **별개 값**이며, 외부에서 검증할 수 없다. `functions/api/profile.ts:13`이 업스트림 실패를 401로 뭉개기 때문이다.

Cloudflare 대시보드 → Pages → gweh → Settings → Environment variables 에서 아래 두 값을 눈으로 확인한다:

- `SUPABASE_URL`이 `https://ynazlsxerdvqkzqvykjj.supabase.co`와 **같은지**
- `SUPABASE_SERVICE_ROLE_KEY`가 같은 프로젝트의 키인지

worker 쪽도 별개 환경이므로 함께 확인한다:

```bash
cd workers/daily-cron && npx wrangler secret list && cd ../..
```

값이 다르면 어느 쪽이 옳은지 판단해야 한다. 다르다는 사실 자체를 기록에 남긴다.

- [ ] **Step 4: fashion_usage 테이블 실존 확인**

```bash
SUPA="https://ynazlsxerdvqkzqvykjj.supabase.co"
SERVICE_KEY="<Cloudflare Pages 의 SUPABASE_SERVICE_ROLE_KEY 값>"
curl -s -o /dev/null -w "%{http_code}\n" \
  "$SUPA/rest/v1/fashion_usage?select=id&limit=1" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"
```

- `200` → 테이블 존재. Step 2의 파일은 `IF NOT EXISTS`라 안전하게 그대로 추가한다.
- `404` → 테이블 없음. 패션 사용량 제한이 현재 동작하지 않는다는 뜻이며 Step 3에서 실제로 생성해야 한다.

- [ ] **Step 5: 마이그레이션 파일 생성**

`supabase/migrations/005_fashion_usage.sql`:

```sql
-- fashion_usage: 구독자의 패션 컨설팅 1일 1회 제한 추적
--
-- functions/api/fashion-usage.ts 가 이 테이블을 읽고 쓰지만 마이그레이션 정의가
-- 누락되어 있었다. 즉 DB 스키마의 진실이 저장소에 없었다. 2026-07 프로젝트
-- 정지·복구 사건에서 이것이 실제 위험으로 드러나 뒤늦게 추가한다.
--
-- UNIQUE(user_id, used_date) 는 장식이 아니다. fashion-usage.ts 의 POST 는
-- `Prefer: resolution=ignore-duplicates` 를 보내는데, 이 헤더는 유니크 제약이
-- 있어야 동작한다. 제약이 없으면 중복 행이 조용히 쌓이고 제한이 무력해진다.

CREATE TABLE IF NOT EXISTS fashion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  used_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, used_date)
);

ALTER TABLE fashion_usage ENABLE ROW LEVEL SECURITY;

-- 사용자는 자기 기록만 조회 가능.
-- INSERT 정책은 두지 않는다 — 쓰기는 service_role 키를 쓰는 Pages Function 만
-- 수행하며, service_role 은 RLS 를 우회한다. 클라이언트가 직접 쓸 수 있으면
-- 사용량 제한을 스스로 조작할 수 있게 된다.
CREATE POLICY "Users can read own fashion usage"
  ON fashion_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fashion_usage_user_date
  ON fashion_usage(user_id, used_date);
```

- [ ] **Step 6: Step 4가 404였을 때만 — Supabase에 실제 적용**

Supabase 대시보드 → SQL Editor 에서 Step 5의 SQL을 그대로 실행한다. 실행 후 Step 4의 curl을 다시 돌려 `200`이 되는지 확인한다.

Step 4가 이미 200이었다면 이 단계는 건너뛴다.

- [ ] **Step 7: V12 — 최종 확인**

**테이블 존재 확인만으로는 부족하다.** 테이블이 예전에 유니크 제약 없이 만들어졌다면 `CREATE TABLE IF NOT EXISTS`가 조용히 no-op 하고 제약은 끝내 추가되지 않는다 — 이 마이그레이션이 막으려던 바로 그 실패 모드인데 존재 확인 curl은 200을 반환한다. **제약 자체를 확인해야 한다.**

Supabase 대시보드 → SQL Editor 에서:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'fashion_usage'::regclass AND contype = 'u';
```

기대: `UNIQUE (user_id, used_date)` 1행. **0행이면** 테이블은 있으나 제약이 없는 상태이므로 아래를 실행한다:

```sql
ALTER TABLE fashion_usage ADD CONSTRAINT fashion_usage_user_id_used_date_key UNIQUE (user_id, used_date);
```

(중복 행이 이미 쌓여 있으면 이 문장이 실패한다. 그 경우 중복을 먼저 정리해야 하며, 그 사실 자체가 제한이 무력했다는 증거다.)

```bash
ls -1 supabase/migrations/
```

기대: 목록에 `005_fashion_usage.sql` 존재.

- [ ] **Step 8: 커밋**

```bash
git add supabase/migrations/005_fashion_usage.sql
git commit -m "fix: 누락된 fashion_usage 테이블 마이그레이션 추가

코드는 이 테이블을 읽고 쓰지만 마이그레이션 정의가 없어 DB 스키마의 진실이
저장소 밖에 있었다. UNIQUE(user_id, used_date) 는 fashion-usage.ts 의
Prefer: resolution=ignore-duplicates 가 동작하기 위한 전제 조건이다."
git push
```

---

### Task 7: 셀프체크 — 재발 감지

이번 장애의 본질은 "외부 의존성이 죽은 것"이 아니라 **"죽은 것을 4개월간 몰랐던 것"**이다. 조사에 쓴 curl을 자동화한다.

**Files:**
- Modify: `workers/daily-cron/worker.ts` (파일 끝의 `export default` 앞에 함수 추가, `scheduled`·`fetch` 핸들러 수정)

**Interfaces:**
- Consumes: `geminiEndpoint(env)` (Task 1), `Env`의 `ALERT_EMAIL`·`NASA_API_KEY` (Task 3 Step 2에서 이미 추가됨)
- Produces: `runSelfCheck(env: Env): Promise<CheckResult[]>`, `sendSelfCheckAlert(env: Env, failures: CheckResult[]): Promise<void>`

- [ ] **Step 1: 셀프체크 함수 추가**

`worker.ts`의 `export default {` 바로 **앞에** 아래를 통째로 넣는다:

```ts
// ─── 셀프체크 ────────────────────────────────────────────────────────────
// 2026-03~07 사이 Gemini 모델 퇴역과 Supabase 프로젝트 정지가 각각 발생했으나
// 감지 장치가 없어 4개월간 아무도 몰랐다. 그때 원인을 찾는 데 쓴 것은 curl 몇 번이
// 전부였다. 그 curl 을 하루 한 번 자동으로 돌린다.

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

async function probe(name: string, fn: () => Promise<Response>): Promise<CheckResult> {
  try {
    const res = await fn();
    if (res.ok) return { name, ok: true, detail: `HTTP ${res.status}` };
    const body = (await res.text()).slice(0, 300);
    return { name, ok: false, detail: `HTTP ${res.status} — ${body}` };
  } catch (err) {
    return { name, ok: false, detail: `예외: ${err instanceof Error ? err.message : String(err)}` };
  }
}

async function runSelfCheck(env: Env): Promise<CheckResult[]> {
  const isSandbox = env.POLAR_SANDBOX === 'true';
  const polarToken = isSandbox ? env.POLAR_SANDBOX_ACCESS_TOKEN : env.POLAR_ACCESS_TOKEN;
  const polarBase = isSandbox ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return Promise.all([
    // 이번에 죽었던 것 1: Gemini 모델. 최소 토큰으로 존재만 확인한다.
    probe('Gemini', () => fetch(geminiEndpoint(env), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    })),
    // 이번에 죽었던 것 2: Supabase 프로젝트.
    probe('Supabase', () => fetch(
      `${env.SUPABASE_URL}/rest/v1/user_profiles?select=user_id&limit=1`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )),
    probe('Polar', () => fetch(`${polarBase}/v1/subscriptions/?limit=1`, {
      headers: { 'Authorization': `Bearer ${polarToken}` },
    })),
    probe('OpenWeather', () => fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=37.5665&lon=126.978&appid=${env.VITE_OPENWEATHER_API_KEY}&units=metric`
    )),
    probe('NASA', () => fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${env.NASA_API_KEY || 'DEMO_KEY'}`
    )),
    probe('USGS', () => fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${yesterday}&endtime=${today}&minmagnitude=4`
    )),
  ]);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendSelfCheckAlert(env: Env, failures: CheckResult[]): Promise<void> {
  if (!env.ALERT_EMAIL) {
    console.error('Self-check failed but ALERT_EMAIL is not configured:', JSON.stringify(failures));
    return;
  }

  const rows = failures.map(f =>
    `<tr>
      <td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;">${escapeHtml(f.name)}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;font-family:monospace;font-size:12px;">${escapeHtml(f.detail)}</td>
    </tr>`
  ).join('');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Mystic AI <onboarding@resend.dev>',
      to: [env.ALERT_EMAIL],
      subject: `[GWEH] 외부 의존성 이상 ${failures.length}건`,
      html: `<h2 style="font-family:sans-serif;">GWEH 셀프체크 실패</h2>
        <p style="font-family:sans-serif;color:#666;">${new Date().toISOString()}</p>
        <table style="border-collapse:collapse;font-family:sans-serif;">${rows}</table>
        <p style="font-family:sans-serif;color:#666;font-size:12px;">
          Gemini 실패라면 모델 퇴역일 가능성이 높습니다.
          Cloudflare 대시보드에서 GEMINI_MODEL 환경변수만 교체하면 배포 없이 복구됩니다.
        </p>`,
    }),
  });

  if (!res.ok) {
    console.error('Self-check alert email failed:', res.status, await res.text());
  }
}
```

- [ ] **Step 2: `scheduled` 핸들러에 연결**

파일 끝의 찾을 코드:

```ts
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    await runDailyCron(env, false);
  },
```

바꿀 코드:

```ts
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // 셀프체크는 하루 1회(UTC 0시)만. 그리고 무슨 일이 있어도 본래 cron 을 막지 않는다.
    // 감시 장치가 서비스를 죽이면 안 된다.
    if (new Date().getUTCHours() === 0) {
      try {
        const results = await runSelfCheck(env);
        const failures = results.filter(r => !r.ok);
        if (failures.length > 0) {
          console.error('Self-check failures:', JSON.stringify(failures));
          await sendSelfCheckAlert(env, failures);
        } else {
          // 정상일 때는 메일을 보내지 않는다. 매일 오는 '정상' 알림은
          // 사흘이면 읽지 않게 되고, 그러면 감지 장치가 무력해진다.
          console.log('Self-check: all dependencies OK');
        }
      } catch (err) {
        console.error('Self-check itself threw:', err);
      }
    }

    await runDailyCron(env, false);
  },
```

- [ ] **Step 3: 수동 트리거 라우트 추가**

`fetch` 핸들러의 `/test` 블록 **다음**, `return new Response('Mystic Daily Cron Worker', ...)` **앞**에 추가한다:

```ts
    // /selfcheck 로 셀프체크만 수동 실행 (검증용)
    if (url.pathname === '/selfcheck') {
      const results = await runSelfCheck(env);
      const failures = results.filter(r => !r.ok);
      if (failures.length > 0 && url.searchParams.get('notify') === 'true') {
        await sendSelfCheckAlert(env, failures);
      }
      return new Response(JSON.stringify({ results, failureCount: failures.length }, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
```

- [ ] **Step 4: `ALERT_EMAIL` 시크릿 설정**

```bash
cd workers/daily-cron
npx wrangler secret put ALERT_EMAIL
# 프롬프트에 운영자 이메일 입력 (예: gum798@gmail.com)
cd ../..
```

주소를 코드에 하드코딩하지 않는다.

- [ ] **Step 5: 배포**

```bash
cd workers/daily-cron && npx wrangler deploy && cd ../..
```

- [ ] **Step 6: V9 — 전부 정상일 때 메일이 가지 않는지 확인**

```bash
curl -s "https://mystic-daily-cron.<your-subdomain>.workers.dev/selfcheck" | python3 -m json.tool
```

기대: `failureCount: 0`, 모든 항목 `ok: true`. **메일함에 아무것도 오지 않아야 한다** (`notify=true`를 붙이지 않았으므로 애초에 발송 경로를 타지 않는다).

`ok: false`가 있으면 그 의존성이 실제로 문제인 것이다. `detail`을 읽고 조치한 뒤 재실행한다.

- [ ] **Step 7: V10 — 실패 주입 시 경보가 오는지 확인**

**운영 환경변수를 건드리지 않는다.** 로컬에서 가짜 모델명을 주입한다.

```bash
cd workers/daily-cron
cat > .dev.vars <<'EOF'
GEMINI_MODEL=gemini-does-not-exist-9999
EOF
# .dev.vars 는 .gitignore 에 이미 포함되어 있다
npx wrangler dev --local=false
```

다른 터미널에서:

```bash
curl -s "http://localhost:8787/selfcheck?notify=true" | python3 -m json.tool
```

기대:
- 응답의 `Gemini` 항목이 `ok: false`이고 `detail`에 `404` 또는 `no longer available` 포함
- **`ALERT_EMAIL` 주소로 경보 메일 1통 수신** — 제목 `[GWEH] 외부 의존성 이상 1건`
- 나머지 5개 항목은 `ok: true`

메일이 오지 않으면 감지 장치가 없는 것과 같다. `wrangler dev` 콘솔의 `Self-check alert email failed:` 로그를 확인한다.

```bash
rm .dev.vars   # 검증 후 반드시 제거
cd ../..
```

- [ ] **Step 8: V11 — 셀프체크가 죽어도 본래 cron이 도는지 확인**

`runSelfCheck` 내부에서 강제로 예외를 던지도록 임시 수정한다. `runSelfCheck` 함수 첫 줄에 아래를 넣는다:

```ts
  throw new Error('TEMPORARY: V11 검증용 강제 예외');
```

`wrangler dev`로 `/test?force=true`를 호출하여 구독자 메일 발송 로직이 **정상 진행**되는지 확인한다. `scheduled`가 아니라 `fetch`의 `/test` 경로라 셀프체크를 타지 않으므로, 검증은 `scheduled` 경로에 대해 해야 한다. `wrangler dev`에서:

```bash
npx wrangler dev --test-scheduled
# 다른 터미널에서
curl -s "http://localhost:8787/__scheduled"
```

기대: 콘솔에 `Self-check itself threw:` 로그가 찍히고, **그 뒤에** `Hourly cron started:` 로그가 이어진다. 두 번째 로그가 없으면 격리가 실패한 것이므로 `try/catch` 범위를 확인한다.

검증 후 **임시 예외 줄을 반드시 제거한다.**

```bash
grep -n "TEMPORARY: V11" workers/daily-cron/worker.ts && echo "!!! 제거 필요 !!!" || echo "제거 완료"
```

- [ ] **Step 9: 커밋 및 재배포**

```bash
git add workers/daily-cron/worker.ts
git commit -m "feat: cron worker에 일일 의존성 셀프체크 추가

Gemini 모델 퇴역과 Supabase 프로젝트 정지를 4개월간 아무도 몰랐다.
조사에 쓴 curl 을 하루 한 번(UTC 0시) 자동 실행하고, 실패 시에만
운영자에게 메일을 보낸다.

설계 원칙:
- 실패할 때만 발송. 매일 오는 '정상' 알림은 사흘이면 읽지 않게 된다.
- 결과를 저장하지 않는다. DB 테이블도 대시보드도 만들지 않는다.
- 셀프체크가 터져도 구독자 메일 발송은 그대로 진행된다(try/catch 격리).
  감시 장치가 서비스를 죽이면 안 된다.

검증용 수동 라우트: GET /selfcheck (?notify=true 로 메일 발송까지)"
git push
cd workers/daily-cron && npx wrangler deploy && cd ../..
```

---

### Task 8: 통합 검증 및 main 머지

**Files:** 없음 (검증 및 머지만)

- [ ] **Step 1: 하드코딩 잔여물 최종 확인**

```bash
echo "--- 퇴역 모델명 ---"
grep -rn "gemini-2\.0" functions/ workers/ shared/ && echo "!!! 남아있음 !!!" || echo "OK"
echo "--- 미지원 Polar 필터 ---"
grep -rn "customer_email\|active=true" functions/ && echo "!!! 남아있음 !!!" || echo "OK"
echo "--- 임시 검증 코드 ---"
grep -rn "TEMPORARY" functions/ workers/ src/ shared/ && echo "!!! 남아있음 !!!" || echo "OK"
echo "--- 로컬 시크릿 파일 ---"
ls workers/daily-cron/.dev.vars 2>/dev/null && echo "!!! 제거 필요 !!!" || echo "OK"
```

전부 `OK`여야 한다.

- [ ] **Step 2: 빌드 확인**

```bash
npm run build && echo "BUILD OK"
```

- [ ] **Step 2a: 타입 검사를 스크립트로 연결**

Task 3 리뷰 지적: `functions/tsconfig.json`과 새로 만든 `workers/daily-cron/tsconfig.json` 둘 다 **어떤 npm 스크립트에도 연결되어 있지 않다.** 사람이 직접 명령을 칠 때만 돌아가므로 회귀 방지 가치가 0으로 수렴한다. 아무도 실행하지 않는 게이트는 게이트가 아니다.

`package.json`의 `scripts`에 추가한다:

```json
    "typecheck": "tsc --noEmit -p functions/tsconfig.json && tsc --noEmit -p workers/daily-cron/tsconfig.json",
```

루트 `tsconfig.json`은 의도적으로 제외한다 — 프로젝트 참조 결함(TS6306/TS6310)으로 즉시 중단되어 `src/`를 검사하지 못하는 상태이며, 그 수정은 이 계획의 범위 밖이다.

```bash
npm run typecheck
```

기대: `functions/`의 기존 `TS18046` 4건만 출력되고 그 외 신규 에러 없음.

- [ ] **Step 2b: 문서에 남은 퇴역 모델명·누락 환경변수 정리**

Task 2 리뷰에서 발견된 문서 부채다. 코드는 고쳤는데 문서가 옛 사실을 말하고 있으면 다음 사람이 속는다.

`CLAUDE.md:99` — 퇴역한 모델명을 명시하고 있다. 찾을 코드:

```
- **Gemini (`gemini-2.0-flash`), server-side** — `fortune.ts`, `personal-omen.ts`, `fashion-consult.ts`,
```

바꿀 코드:

```
- **Gemini, server-side** — `fortune.ts`, `personal-omen.ts`, `fashion-consult.ts`,
```

그리고 같은 단락 끝에 아래 문장을 덧붙인다:

```
  모델명은 `shared/gemini.ts`의 `DEFAULT_GEMINI_MODEL` 한 곳에만 있으며, 런타임에
  `GEMINI_MODEL` 환경변수가 그것을 덮어쓴다. 모델이 퇴역하면 배포 없이 대시보드에서 교체한다.
```

`.env.example` — `GEMINI_API_KEY` 줄 다음에 아래를 추가한다. 이 레버의 존재를 운영자가 알아야 이중 구조가 작동한다:

```
# Gemini 모델 오버라이드 (선택)
# 모델이 퇴역했을 때 코드 수정·배포 없이 여기서 교체한다.
# 미설정 시 shared/gemini.ts 의 DEFAULT_GEMINI_MODEL 사용
GEMINI_MODEL=
```

```bash
grep -rn "gemini-2\.0" CLAUDE.md .env.example && echo "!!! 남아있음 !!!" || echo "OK"
```

- [ ] **Step 3: V1~V12 결과표 작성**

각 항목의 통과 여부와, 건너뛴 항목은 그 사유를 적는다. 특히 V7(구독 계정)과 V8(카메라 재현)은 계정·기기 사정으로 건너뛸 수 있으므로 **건너뛴 사실을 반드시 남긴다.** 조용히 빠뜨리면 "전부 검증됨"으로 오해된다.

- [ ] **Step 4: main 머지 및 푸시**

```bash
git checkout main
git merge --no-ff fix/error-recovery -m "fix: 4개월 방치된 외부 의존성 장애 복구 + 재발 감지

- Gemini 모델 퇴역 대응: 모델명을 shared/gemini.ts 로 중앙화,
  GEMINI_MODEL 환경변수로 배포 없이 교체 가능
- Polar 페이월 우회 차단 (daily-style.ts 의 미지원 필터 customer_email)
- 얼굴/손 인식 실패를 세 갈래로 분리하여 진단 가능하게 만듦
- 누락된 fashion_usage 마이그레이션 추가
- cron worker 에 일일 셀프체크 + 실패 시 경보 메일

설계: docs/superpowers/specs/2026-07-28-error-recovery-design.md
계획: docs/superpowers/plans/2026-07-28-error-recovery.md"
git push origin main
```

- [ ] **Step 5: 운영 배포 확인**

```bash
sleep 60
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"birth_date":"1990-01-01"}' https://gweh-3s2.pages.dev/api/fortune | head -c 300
```

기대: HTTP 200 + 정상 운세 JSON. 이것이 처음 문제 제기의 직접적인 해소다.

- [ ] **Step 6: 남은 과제 기록**

`docs/superpowers/specs/2026-07-28-error-recovery-design.md`의 §8을 갱신한다:

- 카메라 버그의 실제 원인 (Task 5 Step 14의 관찰 결과)
- 건너뛴 검증 항목과 사유
- 서버측 `SUPABASE_URL` 확인 결과
- 정지 기간 중 사용자 데이터 손실 여부

```bash
git add docs/superpowers/specs/2026-07-28-error-recovery-design.md
git commit -m "docs: 복구 작업 실측 결과 반영"
git push origin main
```

---

## 다음 단계 (이 계획 밖)

1. **카메라 버그 실제 수정** — Task 5 Step 14에서 원인이 확정되면 별도 설계
2. **UI 개편** — 별도 스펙. 이월 항목: `og-image.jpg` 누락, `MYSTIC AI` vs `GWEH AI` 브랜드 불일치, 히어로(다크) ↔ 본문(화이트) 충돌
