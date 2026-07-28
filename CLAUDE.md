# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**GWEH AI (오늘의 괘)** — a Korean/English divination web app. Eight tabs, each a self-contained "reading":
`omen` (환경 데이터 기반 징조), `fortune` (띠 운세), `fashion` (AI 스타일링), `face` (관상),
`harmony` (얼굴 궁합), `palm` (손금), `saju` (사주), `summary` (통합 리포트).

Two revenue paths: Polar subscription (recurring) and a one-off Polar checkout for a single fashion consult.

## Commands

```bash
npm install
npm run dev        # Vite dev server — Pages Functions in functions/ are NOT served here
npm run build      # vite build (no typecheck step)
npm run preview
npm run lint       # eslint
```

- There is **no test suite** and no test runner configured.
- `eslint.config.js` only matches `**/*.{js,jsx}`. Every file under `src/` is `.ts`/`.tsx`, so `npm run lint`
  covers only the root `*.config.js` files — it will not catch anything in application code.
  Typecheck manually with `npx tsc --noEmit` (`tsconfig.json` has `strict: false`, so it is a weak net).
- `vite dev` does not serve `functions/api/*`; those need Cloudflare's local runtime. `wrangler` is not a
  project dependency, so either install it or test those endpoints against a deployed preview.
- `functions/` and `workers/` have their own tsconfig with `strict: true` and `@cloudflare/workers-types`.

## Deployment

Push to GitHub → Cloudflare Pages auto-deploys (see `지침.md`). The user's standing instruction there is
**"소스 수정하면 푸시까지 해줘"** — commit and push after source changes.

`public/_redirects` sends everything to `/index.html` (SPA), so client routing is hash-based (`#omen`, `#saju`, …)
and `App.tsx` reads `window.location.hash` to pick the active tab.

The cron worker in `workers/daily-cron/` is a **separate** Cloudflare Worker, deployed independently
(`wrangler deploy` from that directory), not part of the Pages build.

## Architecture

### Three runtimes, one repo

| Path | Runtime | Notes |
|---|---|---|
| `src/` | Browser (React 19 + Vite 6) | All UI, on-device ML, deterministic divination math |
| `functions/api/*.ts` | Cloudflare Pages Functions | Anything needing a secret: Gemini, Supabase service role, Polar, R2 |
| `workers/daily-cron/worker.ts` | Cloudflare Worker (cron `0 * * * *`) | Pre-generates readings and emails subscribers |

**The browser never holds a privileged key.** Only `VITE_*` vars reach the client (OpenWeather, NASA, Supabase URL +
anon key). `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `POLAR_*`, `RESEND_API_KEY` are server-only.
Never move a Gemini call or a service-role query into `src/`.

### Server-side Supabase access pattern

Pages Functions and the cron worker do **not** use `@supabase/supabase-js`. They call the Supabase REST/auth
endpoints with plain `fetch` and the service role key. The recurring shape, repeated in nearly every function:

1. Read `Authorization: Bearer <supabase access token>` off the request.
2. `GET ${SUPABASE_URL}/auth/v1/user` with that token + `apikey: SERVICE_ROLE` → resolves the user id.
3. Then query/insert via `${SUPABASE_URL}/rest/v1/<table>` using the service role key for both headers.

Each function also declares its own local `PagesFunction` type and its own `corsHeaders` object plus an
`onRequestOptions` export — this duplication is deliberate/existing convention; match it when adding endpoints.

### Longitude-based local date

There is no timezone library. "Today" for a user is derived from their stored `last_lon`:

```ts
const offsetMs = Math.round(lon / 15) * 60 * 60 * 1000;
const localDate = new Date(Date.now() + offsetMs).toISOString().split('T')[0];
```

Default longitude when unknown is `126.978` (Seoul). The cron runs hourly and fires for each user only when their
local hour is 06. Any new per-day feature must reuse this convention, or cache keys will disagree with existing rows.

### Caching layers (four of them)

- **`localStorage`** — NASA APOD 24h, USGS earthquakes 10m (`useParallelData.ts`); keys are `gweh_*`.
  Also `mystic_language`, `mystic_birth_year`, `mystic_saju_input`, `mystic_has_visited`, `sub_banner_dismissed`.
- **IndexedDB** (`src/utils/imageStorage.ts`, DB `mystic_ai_storage`) — base64 images are too big for localStorage;
  used to survive the redirect to Polar checkout and back.
- **`daily_readings` JSONB columns** — `fortune_data`, `personal_omen_data`, `style_data` cache one Gemini response
  per `(user_id, reading_date)`. Functions check this cache **before** calling Gemini and upsert with
  `Prefer: resolution=merge-duplicates` after.
- **Cloudflare R2** — profile/fashion/face/palm photos at `profiles/<userId>/<type>.<ext>`.

### Divination logic: deterministic vs. AI

Two distinct sources of "readings", and they are not interchangeable:

- **Deterministic, client-side, in `src/utils/`** — `saju.ts` (천간/지지/오행), `sajuInterpret.ts`,
  `physiognomy.ts` (748 lines; MediaPipe landmark → 삼정/오관/십이궁 features + `analyzeFaceHarmony`),
  `palmReading.ts` + `palmLineDetector.ts` + `fingerGestureAnalyzer.ts`, `personalColor.ts`, `omenGenerator.ts`,
  `fashionRecommend.ts`. These run offline and are the fallback when no session/AI is available.
- **Gemini (`gemini-2.0-flash`), server-side** — `fortune.ts`, `personal-omen.ts`, `fashion-consult.ts`,
  `daily-style.ts`. Prompts are long inline Korean template literals that specify an exact JSON schema;
  requests set `responseMimeType: 'application/json'` and responses are still defensively stripped of
  ```` ```json ```` fences and unwrapped from a possible array before parsing.

**`rule/*.md` is the domain spec** for the deterministic side — research write-ups on 관상 (`face.md`), 손금
(`palm.md`), 사주 (`saju.md`), 징조 (`oracle.md`), 퍼스널컬러/코디 (`fashion.md`), including the MediaPipe landmark
index mappings used in `physiognomy.ts`. Read the relevant `rule/` doc before changing any scoring or
interpretation logic.

### On-device ML loading

TensorFlow.js and the MediaPipe models are **dynamically imported** inside `useFaceDetection.ts` /
`useHandDetection.ts` (module-level singletons, `Promise.all` on the two imports, `tf.ready()` once). Tab
components are `lazy()`-loaded in `App.tsx` for the same reason. Keep TF out of the static import graph — a
top-level `import '@tensorflow/tfjs'` anywhere in `src/` would pull megabytes into the initial bundle.

### Subscriptions (Polar)

Subscription state is **not stored in Supabase**. `/api/subscription-status` looks the customer up in Polar by
email on every check, then reads their subscriptions and treats `active` or `trialing` as subscribed.
`POLAR_SANDBOX === 'true'` switches both the token and the API base
(`sandbox-api.polar.sh` ↔ `api.polar.sh`) — this toggle exists in the Pages Functions, `.env.example`,
and `workers/daily-cron/wrangler.toml` independently, so flipping environments means changing all of them.

Because the webhook is asynchronous, `SubscriptionContext` retries `checkSubscription()` with backoff when it
sees `?subscription_success=true`.

Fashion gating: subscribers get one consult per day, tracked in the `fashion_usage` table; non-subscribers pay
per consult via `/api/checkout` and are returned with `?checkout_success=true`, at which point the image is
restored from IndexedDB and analysis auto-runs.

### i18n

`src/i18n.ts` statically imports 7 namespaces × 2 languages (`common`, `omen`, `face`, `palm`, `saju`, `fashion`,
`auth`) from `src/locales/{ko,en}/`. Default namespace is `common`; `ko` is both default and fallback.
Every user-facing string goes through `t()` — including strings in non-React modules, which import `i18next`
directly and call `i18next.t()` (see `src/utils/api.ts`, `src/hooks/useFaceDetection.ts`).
**Gemini prompts are the exception**: they are hardcoded Korean and instruct the model to answer in Korean.

Adding a language means adding a `src/locales/<lang>/` set of all 7 files and registering it in `i18n.ts`.

### Styling

Tailwind with a bespoke `gal-*` design token set (`tailwind.config.js`): `gal-black/dark/body/muted/border/light/
bg/accent/footer`, `rounded-gal-{sm,md,lg,xl}`, `shadow-gal-{soft,card,hover,nav,button}`, and a large set of
named entrance animations (`animate-fade-in`, `animate-tab-enter`, …). Use these tokens rather than raw hex or
default Tailwind grays.

`src/lib/themes.ts` defines a CSS-variable theme (`gallery`) applied by `applyTheme()` in `main.tsx`. It is
**light mode only** and currently has exactly one theme, though `user_profiles.theme` and the `ThemeKey` type
keep the multi-theme door open. `design/code.html` + `design/screen.png` are an older dark-mode design
reference, not live code.

## Environment variables

Client (`.env`, must be `VITE_`-prefixed): `VITE_OPENWEATHER_API_KEY`, `VITE_NASA_API_KEY`,
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Server (Cloudflare Pages/Worker secrets): `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_ID`, `POLAR_SANDBOX_ACCESS_TOKEN`, `POLAR_SANDBOX_PRODUCT_ID`,
`POLAR_SANDBOX`, `RESEND_API_KEY`, plus the `R2_BUCKET` binding.

Note `.env.example` omits the two `VITE_SUPABASE_*` keys that `src/lib/supabase.ts` reads. When they're absent
`supabase` is `null` and every auth path degrades to "Supabase not configured" instead of throwing — preserve
that null-guard pattern in new code.

## Known rough edges

- `supabase/migrations/` has no migration for the `fashion_usage` table that `functions/api/fashion-usage.ts`
  reads and writes; it was created out of band.
- The R2 public base URL is hardcoded in `functions/api/upload-photo.ts`.
- `src/main.tsx` imports `./App.jsx` while the file is `App.tsx` (Vite resolves it); don't "fix" this without
  checking the build.
- `README.md` describes an earlier weather/moon-only version with `.jsx` files — treat this file as the
  current source of truth over it.
