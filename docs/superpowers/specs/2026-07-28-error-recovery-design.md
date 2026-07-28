# GWEH 장애 복구 설계

- 작성일: 2026-07-28
- 대상 배포: https://gweh-3s2.pages.dev (Cloudflare Pages)
- 대상 커밋: `3fc3de6` — **라이브 빌드가 git HEAD와 일치함이 확인됨**
- 범위: 오류 복구 + 재발 감지. **UI 개편은 별도 스펙**으로 분리한다.

## 1. 배경

2026-03-23 마지막 커밋 이후 약 4개월간 방치된 서비스가 "동작하지 않는다"는 보고로 시작했다.
조사 결과 단일 버그가 아니라 **외부 의존성 2건이 조용히 죽은 것**이었고, 그 사실을 감지할
장치가 없어 4개월간 아무도 몰랐다.

이 스펙의 목표는 두 가지다.

1. 죽은 것을 되살린다.
2. **다음에 죽을 때는 4개월이 아니라 하루 안에 안다.**

2번이 1번보다 중요하다. 외부 의존성은 앞으로도 죽는다.

## 2. 확정 사실

모든 항목은 실제 네트워크 응답으로 확인했다. 추정은 별도 표기한다.

### 2.1 죽은 것

**Gemini 모델 퇴역 (BROKEN)**

```
POST https://gweh-3s2.pages.dev/api/fortune
→ HTTP 500
  {"error":"AI 운세 생성 실패","detail":"{ \"code\": 404,
    \"message\": \"This model models/gemini-2.0-flash is no longer available...\" }"}
```

`gemini-2.0-flash`와 `gemini-2.0-flash-lite` 모두 Google 공식 종료 목록에 있다. 호출부 6곳:

| 파일 | 모델 | 영향 |
|---|---|---|
| `functions/api/fortune.ts:126` | `gemini-2.0-flash` | 운세 탭 |
| `functions/api/personal-omen.ts:175` | `gemini-2.0-flash` | 개인 괘 |
| `functions/api/fashion-consult.ts:110` | `gemini-2.0-flash` | 패션 컨설팅 (유료) |
| `functions/api/daily-style.ts:106` | `gemini-2.0-flash` | 데일리 스타일 |
| `workers/daily-cron/worker.ts:251,304` | `gemini-2.0-flash-lite` | 구독자 아침 메일 |

**Supabase 프로젝트 정지 (복구됨)**

조사 시점에 `ynazlsxerdvqkzqvykjj.supabase.co`가 NXDOMAIN이었다. 권위 네임서버
(`christina.ns.cloudflare.com`)가 `aa` 플래그와 함께 NXDOMAIN을 반환했고, 공개 리졸버
4곳이 일치했다. `supabase.co` apex는 정상 응답(대조군)이었으므로 DNS 필터링이 아니었다.

2026-07-28 사용자가 대시보드에서 프로젝트를 복구했다. 복구 후 재확인:

```
dig @8.8.8.8  → NOERROR
GET /auth/v1/settings → HTTP 200   (복구 완료)
```

이 항목은 **코드 변경 없이 해소**되었다. 남은 작업은 확인과 스키마 정합성뿐이다(§4.5).

### 2.2 조용히 잘못된 것

**Polar 페이월 우회 (DEGRADED)**

`functions/api/daily-style.ts:27`

```ts
`${apiBaseUrl}/v1/subscriptions/?customer_email=${encodeURIComponent(user.email)}&active=true&limit=1`
```

`customer_email`은 Polar가 지원하지 않는 필터다. Polar는 미지원 쿼리 파라미터를 **에러 없이
버린다**(동일 응답 바이트 비교로 확인). 따라서 실제 실행 의미는 다음과 같다.

> "조직 전체에서 활성 구독 아무거나 1건을 반환하라"

조직에 유료 고객이 **한 명이라도** 있으면 `data.items.length > 0`이 참이 되어, 로그인한
**모든 비구독자**가 유료 기능을 통과한다. Gemini 쿼터도 함께 소모된다.

같은 저장소의 `functions/api/subscription-status.ts:43-72`는 **올바른 2단계 조회**를 쓴다.
즉 정답이 이미 코드베이스 안에 있고, `daily-style.ts`만 뒤처졌다.

추가로 같은 쿼리의 `active=true`는 Polar OpenAPI(`info.version: "2026-04"`)에서
`deprecated: true`다. Polar가 이를 제거하면 필터는 "취소·연체 포함 모든 구독"으로 퇴화하여
**게이트가 영구히 열린 채 고정**된다.

반대 방향 결함도 같은 함수에 있다. `daily-style.ts:30`의 `if (!subsRes.ok) return false`는
Polar가 일시적으로 흔들릴 때 **유료 고객을 거부**한다.

### 2.3 정상 확인된 것 (재조사 불필요)

| 의존성 | 확인 방법 |
|---|---|
| OpenWeatherMap `/data/2.5/weather` | 번들에서 실제 키 추출 후 실호출 성공 |
| NASA APOD | 실호출 성공 |
| USGS FDSNWS | 코드와 동일한 쿼리로 실호출 성공 |
| Polar API 자체 | 라이브 `/api/checkout`·`/api/subscribe` HTTP 200, 체크아웃 URL 실제 생성 |
| TF.js 모델 가중치 | `model.json` + **전체 weight shard** + CORS 헤더 정상 (face·hand 양쪽) |
| 배포 무결성 | 19개 청크 전부 ESM 파싱·링크 성공, 모듈 그래프 완결, 댕글링 참조 0 |
| 배포 최신성 | 라이브 빌드 = git HEAD `3fc3de6` |

> 조사 중 부수효과: 라이브 결제 경로 검증 과정에서 **운영 Polar 계정에 미완료 체크아웃 세션
> 2건**이 생성되었다. 과금은 발생하지 않았으나 대시보드에 흔적이 남는다.

## 3. 카메라 버그: 미확정

사용자 보고 증상은 "얼굴/손 인식 실패" 에러다. §2.3이 **외부 원인을 전부 배제**했다.

추가로 캔버스 오염(tainted canvas) 가설도 약하다. 촬영 경로는 웹캠의 `data:` URL과
R2 재조회의 `blob:` URL이며 둘 다 캔버스를 오염시키지 않는다.

남은 원인은 코드 내부인데, **현재 코드가 원인을 구분해서 알려주지 않는다.**

`src/hooks/useFaceDetection.ts`

| 위치 | 실제 원인 | 사용자가 보는 메시지 |
|---|---|---|
| `:78` | 모델 다운로드/초기화 실패 | "얼굴 감지 모델을 불러올 수 없습니다" |
| `:103` | **사진에서 얼굴 미검출** (버그 아님) | "얼굴 감지 모델을 불러올 수 없습니다" |
| `:130` | 그 외 모든 예외 | "얼굴 감지 모델을 불러올 수 없습니다" |

`:130`은 `err.message`를 잡아놓고 **버린 뒤** 무의미한 문구로 덮어쓴다. 원인 정보가 코드에
도달했다가 폐기된다. `useHandDetection.ts:56,81,118`도 동일하다.

따라서 이 스펙은 카메라 버그를 **고치지 않는다.** 고칠 수 있는 상태로 만든다(§4.2).

## 4. 설계

### 4.1 Gemini 모델 중앙화

모델명이 6곳에 흩어져 있어 이번 장애의 수정 비용이 6배가 되었다. 한 곳으로 모으고,
**배포 없이 교체 가능한 계층**을 만든다.

**새 파일 `shared/gemini.ts`** — `functions/` 바깥에 둔다. `functions/` 내부의 언더스코어
디렉터리가 라우팅에서 제외되는지는 Cloudflare 공식 문서에서 확인되지 않았으므로, 애초에
라우팅 대상이 아닌 위치를 택한다.

```ts
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export function geminiEndpoint(env: { GEMINI_API_KEY: string; GEMINI_MODEL?: string }) {
  const model = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
}
```

이중 안전장치:

| 계층 | 다음 퇴역 때 대응 | 소요 |
|---|---|---|
| `GEMINI_MODEL` 환경변수 | Cloudflare 대시보드에서 문자열 교체 | **배포 불필요** |
| `DEFAULT_GEMINI_MODEL` 상수 | 코드 1줄 수정 | 배포 1회 |

환경변수 계층이 핵심이다. 이번 같은 긴급 상황에서 코드 수정·빌드·배포 없이 복구된다.

**미검증 가정 — 구현 1단계에서 반드시 검증한다:**

1. Pages Functions 빌드가 `functions/` 바깥의 상대 임포트를 번들에 포함하는가
2. `workers/daily-cron/tsconfig.json`의 `include: ["./**/*.ts"]`가 상위 디렉터리 임포트를
   처리하는가

**후퇴안**: 위가 실패하면 공유 파일을 포기하고 각 호출부가 `env.GEMINI_MODEL`을 직접 읽되
기본값 문자열을 각자 갖는다. 환경변수 계층은 유지되므로 핵심 목표는 달성된다.

**모델 선택**: `gemini-3.5-flash-lite`. 현행 세대 중 최저 비용·최고 속도이며 지원 기간이 가장
길다. 다만 세대가 달라 한국어 문체와 JSON 준수도가 달라질 수 있으므로 §5에서 검증한다.

### 4.2 카메라 진단 계측

세 갈래를 분리하고, 세 번째에서 **원본 예외를 노출**한다.

| 분기 | 메시지 | 사용자 행동 | 진단 의미 |
|---|---|---|---|
| 모델 로드 실패 | "얼굴 인식 모듈을 불러오지 못했습니다. 네트워크를 확인해 주세요" | 재시도 | 인프라 |
| 얼굴 미검출 | "사진에서 얼굴을 찾지 못했습니다. 정면·밝은 곳에서 다시 촬영해 주세요" | 재촬영 | 정상 동작 |
| 그 외 예외 | "분석 중 오류가 발생했습니다 (원인: `<원본 메시지>`)" | 제보 | 코드 결함 |

**대상**

- `src/hooks/useFaceDetection.ts` — `:78`, `:103`, `:130`, `:154`, `:185`
- `src/hooks/useHandDetection.ts` — `:56`, `:81`, `:118`
- `src/locales/{ko,en}/common.json` — 신규 키 추가

**i18n 키 설계**: 기존 `error.faceModel` / `error.handModel` 키는 **삭제하지 않는다.**
의미를 "모델 로드 실패"로 좁히고 **문구만 위 표대로 교체**한다(현재 문구는
"얼굴 감지 모델을 불러올 수 없습니다"). 키를 유지하므로 다른 참조가 깨지지 않는다. 신규 키:

```
error.faceNotDetected / error.handNotDetected
error.faceUnexpected  / error.handUnexpected   (원본 메시지 보간용 {{detail}} 포함)
```

ko/en 양쪽 모두 추가한다. 누락 시 i18next가 키 문자열을 그대로 노출한다.

**완료 기준**: "카메라가 고쳐짐"이 **아니다.** 배포 후 사용자가 한 번 재현하면 세 갈래 중
어느 것인지 확정되는 것이 완료다. 실제 수정은 그 결과를 받아 별도로 설계한다.

### 4.3 Polar 페이월 수정

`functions/api/daily-style.ts:26-32`의 `verifySubscription()`을
`functions/api/subscription-status.ts:43-72`의 검증된 패턴으로 교체한다.

```
1) GET /v1/customers/?email=<email>&limit=1        → customer.id
2) GET /v1/subscriptions/?customer_id=<id>&limit=10
3) items 중 status가 'active' 또는 'trialing'인 것이 있으면 true
```

`active=true`(deprecated)는 제거한다.

`:30`의 `if (!subsRes.ok) return false`는 Polar 장애를 "구독 없음"으로 오해하여 유료 고객을
거부한다. 업스트림 실패와 "구독 없음"을 구분하여, 전자는 5xx로 올린다. 조용히 틀린 답을
주는 것보다 명시적으로 실패하는 편이 낫다 — 이번 장애 전체의 교훈이다.

### 4.4 재발 감지: 셀프체크

이번 조사에서 curl 몇 번으로 찾은 것을 4개월간 아무도 몰랐다. **그 curl을 자동화한다.**

`workers/daily-cron/worker.ts`에 얹는다. 새 인프라가 필요 없다 — cron 트리거,
`RESEND_API_KEY`, `GEMINI_API_KEY`, Supabase 자격증명이 이미 이 worker 안에 있다.

```
기존 매시간 cron 안에서, UTC 0시에만 셀프체크 실행:

  Gemini      최소 토큰 generateContent 1회      ← 이번 Gemini 장애를 잡았을 검사
  Supabase    GET /rest/v1/ 도달성               ← 이번 Supabase 장애를 잡았을 검사
  Polar       GET /v1/subscriptions/?limit=1
  OpenWeather 서울 좌표 1회
  NASA        APOD 1회
  USGS        24h 쿼리 1회

  하나라도 실패 → Resend로 운영자에게 메일 1통 (실패 항목 + 응답 본문 발췌)
  전부 정상    → 아무것도 보내지 않음
```

**설계 원칙**

- **실패할 때만 시끄럽게.** 매일 "정상" 메일이 오면 사흘 뒤부터 읽지 않는다. 알림 피로는
  감지 장치를 무력화하는 가장 흔한 방식이다.
- **결과를 저장하지 않는다.** DB 테이블도, 대시보드도, 이력 조회도 만들지 않는다. 메일 한
  통이면 목적을 달성하며 그 이상은 YAGNI다.
- **셀프체크 실패가 본래 cron 작업을 막지 않는다.** 셀프체크는 try/catch로 격리하고,
  구독자 메일 발송은 그와 무관하게 진행한다. 감시 장치가 서비스를 죽이면 안 된다.

**운영자 메일 주소**는 `ALERT_EMAIL` 환경변수로 받는다. 하드코딩하지 않는다.

### 4.5 Supabase 복구 마무리

프로젝트가 살아났으므로 재생성 시나리오는 폐기한다. 남은 것은 확인과 스키마 정합성이다.

1. 복구 완료 확인 — `/auth/v1/settings` 200 (2026-07-28 확인 완료)
2. Google OAuth 설정 생존 확인 — `AuthModal.tsx:107`이 유일하게 연결된 provider다
3. Cloudflare Pages의 서버측 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`가 같은 프로젝트를
   가리키는지 대시보드에서 확인. 이 값은 번들의 `VITE_SUPABASE_URL`과 **별개**이며 외부에서
   검증 불가능하다. `functions/api/profile.ts:13`이 업스트림 실패를 401로 뭉개기 때문이다.
4. **`fashion_usage` 테이블 마이그레이션 누락 보완**

4번을 설명한다. `functions/api/fashion-usage.ts`가 이 테이블을 읽고 쓰지만
`supabase/migrations/`에는 정의가 없다. 즉 **DB 스키마의 진실이 저장소에 없다.** 프로젝트가
정지·복구를 거친 지금, 이 테이블의 실존 여부를 확인하고 없으면 `005_fashion_usage.sql`을
추가한다. 있더라도 마이그레이션 파일은 추가한다 — 다음 복구 때 같은 구멍에 빠지지 않기 위해서다.

### 4.6 범위에서 제외

의도적으로 제외한 항목. 실제 결함이지만 이 스펙의 목적과 다르다.

| 항목 | 이유 |
|---|---|
| `og-image.jpg` 누락 (`index.html:20,31`) | UI/브랜딩 → 다음 UI 스펙 |
| `MYSTIC AI` vs `GWEH AI` 브랜드 불일치 | UI/브랜딩 → 다음 UI 스펙 |
| 히어로(다크) ↔ 본문(화이트) 디자인 충돌 | UI 개편 본론 |
| `main.tsx`의 `./App.jsx` 임포트 | 동작에 문제 없음, 무관한 리팩터링 |
| Pages Functions의 `PagesFunction` 타입·CORS 중복 | 무관한 리팩터링 |
| 결정론적 유틸 테스트 스위트 | 사용자가 "복구 + 재발 감지" 범위 선택 |

## 5. 검증 방법

이 저장소에는 테스트가 없고 `npm run lint`는 `**/*.{js,jsx}`만 대상으로 하여 `src/`를
전혀 검사하지 않는다. 따라서 검증은 **실제 엔드포인트 호출**로 한다. 각 항목은 통과/실패가
명확해야 한다.

| # | 검증 | 통과 기준 |
|---|---|---|
| V1 | `shared/gemini.ts` 임포트 성립 | 프리뷰 배포 후 함수가 500 없이 응답 |
| V2 | `POST /api/fortune` | HTTP 200, `fortune.overall` 존재 |
| V3 | 한국어 문체·JSON 준수 | V2 응답의 `level`이 대길/길/평/소흉/흉 중 하나, 전 필드 한국어 |
| V4 | `POST /api/fashion-consult` (멀티모달) | 이미지 첨부 요청이 HTTP 200, `bodyAnalysis` 존재 |
| V5 | cron worker Gemini 호출 | `wrangler tail`에 404 부재 |
| V6 | Polar 페이월 | 비구독 계정으로 `POST /api/daily-style` → **403** |
| V7 | Polar 정상 경로 | 구독 계정으로 `POST /api/daily-style` → 200 |
| V8 | 카메라 계측 | 얼굴 없는 사진 업로드 시 "사진에서 얼굴을 찾지 못했습니다" 표시 |
| V9 | 셀프체크 정상 | 전 의존성 정상일 때 메일 **미발송** |
| V10 | 셀프체크 이상 | **로컬 `wrangler dev`에서** `GEMINI_MODEL`을 존재하지 않는 값으로 두고 1회 실행 → 경보 메일 수신. 운영 환경변수는 건드리지 않는다 |
| V11 | 셀프체크 격리 | 셀프체크 실패 시에도 구독자 메일 발송이 진행됨 |
| V12 | `fashion_usage` | 테이블 존재 확인, 마이그레이션 파일 존재 |

V10과 V11이 특히 중요하다. **감지 장치 자체가 동작하는지 검증하지 않으면 감지 장치가 있다는
착각만 남는다.** 이번 장애의 본질이 정확히 그것이었다.

## 6. 구현 순서

의존 관계가 있는 것만 순서를 고정한다.

```
1. shared/gemini.ts 임포트 성립 검증 (V1)      ← 실패 시 §4.1 후퇴안으로 전환
2. Gemini 6곳 교체 + V2·V3·V4·V5              ← 서비스 복구, 가장 시급
3. Polar 페이월 수정 + V6·V7                   ← Supabase 복구로 우회가 활성화된 상태
4. 카메라 계측 + V8                            ← 배포 후 사용자 재현 필요
5. fashion_usage 확인·마이그레이션 + V12
6. 셀프체크 + V9·V10·V11                       ← 마지막. 앞의 것들이 정상이어야 의미 있음
```

1이 실패하면 후퇴안으로 전환하되 2~6은 그대로 진행한다.

3을 2보다 뒤로 두는 이유는 시급성 차이일 뿐이며, 실제로는 독립적이다. 단 Supabase가 복구된
지금 우회가 **활성 상태**이므로 오래 미루지 않는다.

## 7. 리스크

| 리스크 | 대응 |
|---|---|
| `gemini-3.5-flash-lite`의 한국어 문체가 기존과 다름 | V3에서 검증. 불만족 시 `GEMINI_MODEL` 환경변수로 `gemini-2.5-flash` 즉시 전환 — 이것이 §4.1 이중 구조의 실효 |
| `responseMimeType: 'application/json'`의 3.x 지원 여부 | V2·V4에서 확인. 미지원 시 프롬프트의 JSON 지시만으로 동작하며 기존 코드에 이미 마크다운 펜스 제거 로직이 있음 |
| 공유 모듈 임포트 실패 | §4.1 후퇴안 |
| 셀프체크가 Gemini 쿼터·비용 소모 | 하루 1회, 최소 토큰. 무시 가능 |
| 카메라 원인이 계측 후에도 불명 | 원본 예외가 노출되므로 최소한 예외 종류는 확정됨. 그래도 불명이면 재현 환경(기기·브라우저) 확보가 다음 단계 |
| Supabase 재정지 | 셀프체크가 하루 안에 감지 (§4.4) |

## 8. 실측 결과 (2026-07-28 머지 후)

머지 커밋 `26926ad`. 운영 배포 후 실제 호출로 확인한 것:

| 검증 | 결과 | 근거 |
|---|---|---|
| **V1** 공유 모듈 임포트 | ✅ PASS | 프리뷰에서 요청이 새 모델 경로로 Google 도달 |
| **V2** `/api/fortune` | ✅ PASS | HTTP 200, `fortune.overall` 정상 |
| **V3** 응답 스키마·문체 | ✅ PASS | `level` 목록 내(길), 전 필드 한국어, `luckyNumber` 숫자형 |
| **V4** 멀티모달 `inline_data` | ✅ PASS | `fashion-consult` 200, `bodyAnalysis` 생성 |
| 회귀 | ✅ 없음 | `subscription-status` 200, SPA 200, `personal-omen` 401(정상) |

**`gemini-3.5-flash-lite`는 기존 프롬프트를 그대로 소화한다.** 프롬프트 수정도, `GEMINI_MODEL` 오버라이드도 필요 없었다.

### 조사 과정에서 드러난 중요한 사실

**V1은 모델 실재 여부를 증명하지 못한다.** 최종 리뷰가 대조 실험으로 확인했다 — 잘못된 키로
호출하면 실재 모델·가짜 모델·퇴역 모델이 **전부 동일한 `400 API_KEY_INVALID`** 를 반환한다.
키 검증이 모델 해석보다 먼저 일어나기 때문이다. V1이 증명한 것은 임포트가 번들된다는 것뿐이며,
모델 문자열은 V2가 통과하기 전까지 미검증 상태였다.

**`{{detail}}` 없는 오류 메시지는 원인을 숨긴다.** 카메라 버그를 4개월간 특정하지 못한 이유가
버그 자체가 아니라 세 갈래 실패가 한 문구로 뭉개져 있었다는 점이었다.

## 9. 남은 작업

**미검증 (사용자 개입 필요)**

| 검증 | 차단 사유 |
|---|---|
| V5 worker Gemini | Cloudflare 인증 (사내 프록시가 OAuth 차단) |
| V6 페이월 차단 | 비구독 계정 토큰 필요 |
| V7 구독자 통과 | 유료 구독자 0명 — 테스트 대상 부재 |
| **V8 카메라 재현** | **브라우저·카메라·사진 필요. 이 계측의 진짜 산출물** |
| V9·V10·V11 셀프체크 | `wrangler deploy` + `ALERT_EMAIL` 시크릿 |
| V12 마이그레이션 | Supabase SQL Editor |

**배포 차단 사항**

- **worker 미배포.** main 머지로 해결되지 않는다. 구독자 아침 메일과 셀프체크 모두 `wrangler deploy` 전까지 죽어 있다.
- **`ALERT_EMAIL`은 Resend 계정 소유자 주소여야 한다.** 발신자가 `onboarding@resend.dev`(공용 테스트 발신자)라 도메인 인증 없이는 다른 주소로 못 보낸다. 어긋나면 모든 경보가 403으로 조용히 실패한다.
- **`GEMINI_MODEL`은 Pages와 Worker에 따로 설정해야 한다.** 별개 환경이며, 셀프체크는 Worker 쪽만 검사한다. 하나만 바꾸면 셀프체크는 초록인데 Pages Functions 4곳이 죽는다.

**구독자 발생 전에 고쳐야 할 것**

`FashionTab.tsx:164`가 `/api/checkout`에 `customerEmail`을 보내지 않아 Polar 고객 이메일이
Supabase 계정과 연결되지 않는다. 지금은 구독자가 0명이라 무해하지만, **첫 유료 고객이
페이월에 막힌다.** 근본 해결은 `external_customer_id`에 Supabase UID를 넣는 것이다.

**즉시 권고**

`/api/fortune`은 인증 없이 호출 가능한 Gemini 프록시다(`fortune.ts:60-61`, 익명 호출이 설계상 의도).
퇴역한 모델이 4개월간 이를 가려왔다. Cloudflare 레이트리밋 규칙 권고.

## 10. 이 스펙이 답하지 않는 것

- 카메라 버그의 **실제 수정**. V8 관찰 결과를 받아 별도 설계.
- UI 개편 전반. 별도 스펙. 이월 항목: `og-image.jpg` 누락, `MYSTIC AI` vs `GWEH AI` 브랜드 불일치, 히어로(다크) ↔ 본문(화이트) 충돌.
- 서버측 `SUPABASE_URL`의 실제 값과 Google OAuth 생존 여부. 대시보드 확인 필요(§4.5-2, §4.5-3).
- 정지 기간 중 사용자 데이터 손실 여부.
