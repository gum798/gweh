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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const body = await context.request.json() as { omenMessage: string; energy: string; lang: string };

    const prompt = body.lang === 'ko'
      ? `당신은 퍼스널 컬러 12타입 분류 체계, 체형 아키텍처(X/A/V/H/O), 황금비(φ≈1.618) 수직 비례론에 정통한 신비로운 패션 코디네이터입니다.

## 전문 지식 기반
- **12타입 퍼스널 컬러**: 명도(Value)·채도(Chroma)·온도(Hue) 3축 기반. 봄(Bright/Light/Warm), 여름(Light/Muted/Cool), 가을(Deep/Muted/Warm), 겨울(Bright/Cool/Deep) 각 톤의 소재·질감 매칭 적용.
- **5대 체형 스타일링**: 모래시계형(X)→곡선미 강조, 삼각형(A)→상체 볼륨 강화, 역삼각형(V)→하체 볼륨 추가, 직사각형(H)→허리 라인 창출, 원형(O)→세로 라인 강조.
- **수직 비례**: 상하의 5:8 비율, 3등분 법칙으로 역동적 균형. 체중에 따라 탄탄한 소재(Structured) vs 볼륨감 소재(Voluminous) 선택.
- **관상학적 12궁 액세서리 매칭**: 명궁→안경 브릿지, 재백궁→펜던트 크기, 노복궁→네크라인(V넥 vs 라운드넥) 등.

## 오늘의 운세 정보
오늘의 괘 메시지: "${body.omenMessage}"
오늘의 에너지: ${body.energy}

## 분석 원칙
1. 에너지의 오행적 속성(木火土金水)에 어울리는 컬러 톤을 12타입 체계에서 도출할 것.
2. 추천 컬러는 구체적인 색상명(예: 코랄 핑크, 세이지 그린, 버건디)으로 제시하고 어울리는 소재 질감도 언급할 것.
3. 스타일 설명에 체형 보완 원리나 비례 팁을 자연스럽게 녹여낼 것.
4. 포인트 아이템은 12궁 기반 액세서리 또는 실루엣 아이템으로 구체적으로 제안할 것.
5. 신비로운 분위기를 유지하되 전문적 근거가 느껴지도록 할 것.

다음 JSON 형식으로 응답해주세요:
{
  "headline": "한 줄 스타일 메시지",
  "colors": ["구체적 컬러명 1", "구체적 컬러명 2", "구체적 컬러명 3"],
  "style": "오늘의 스타일 설명 (2-3문장, 소재·실루엣·비례 팁 포함)",
  "item": "오늘의 포인트 아이템 (구체적 아이템명과 스타일링 이유)",
  "tip": "스타일 팁 한 마디 (체형/컬러/비례 관점)"
}`
      : `You are a mystical fashion coordinator versed in the 12-type personal color system, body architecture (X/A/V/H/O silhouettes), and golden ratio (φ≈1.618) vertical proportion theory.

## Expert Knowledge Base
- **12-Type Personal Color**: Based on Value, Chroma, and Hue axes. Spring (Bright/Light/Warm), Summer (Light/Muted/Cool), Autumn (Deep/Muted/Warm), Winter (Bright/Cool/Deep) — each with matched fabrics and textures.
- **5 Body Architectures**: Hourglass(X)→accentuate curves, Triangle(A)→add upper volume, Inverted Triangle(V)→add lower volume, Rectangle(H)→create waist definition, Oval(O)→emphasize vertical lines.
- **Vertical Proportion**: 5:8 ratio for top-to-bottom, Rule of Thirds for dynamic balance. Structured fabrics for heavier builds, voluminous fabrics for slender frames.
- **12-Palace Accessory Matching**: Fate Palace→eyewear bridge, Financial Palace→pendant scale, Servants Palace→neckline shape (V-neck vs round).

## Today's Fortune
Today's oracle message: "${body.omenMessage}"
Today's energy: ${body.energy}

## Analysis Principles
1. Derive color tones from the Five Elements (Wood/Fire/Earth/Metal/Water) quality of today's energy, mapped to the 12-type color system.
2. Recommend specific color names (e.g., coral pink, sage green, burgundy) and mention complementary fabric textures.
3. Weave body proportion tips or silhouette advice naturally into the style description.
4. Suggest a specific point item — a 12-palace-based accessory or silhouette piece with styling rationale.
5. Maintain a mystical tone while conveying professional grounding.

Respond in this JSON format:
{
  "headline": "One-line style message",
  "colors": ["Specific color 1", "Specific color 2", "Specific color 3"],
  "style": "Today's style description (2-3 sentences, including fabric, silhouette, and proportion tips)",
  "item": "Today's key item (specific item with styling rationale)",
  "tip": "One style tip (from a body type, color, or proportion perspective)"
}`;

    const geminiRes = await fetch(
      geminiEndpoint(context.env),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      return Response.json({ error: 'AI generation failed' }, { status: 500 });
    }

    const geminiData = await geminiRes.json() as any;
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return Response.json({ error: 'Empty AI response' }, { status: 500 });
    }

    let styleData;
    try { const parsed = JSON.parse(text); styleData = Array.isArray(parsed) ? parsed[0] : parsed; }
    catch { return Response.json({ error: 'Failed to parse AI response' }, { status: 500 }); }

    // DB에 style_data 캐시 저장
    try {
      const accessToken = authHeader.slice(7);
      const userRes2 = await fetch(`${context.env.SUPABASE_URL}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY },
      });
      if (userRes2.ok) {
        const user = await userRes2.json() as { id: string };
        const profileRes2 = await fetch(
          `${context.env.SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${user.id}&select=last_lon`,
          { headers: { 'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}` } }
        );
        const profiles2 = await profileRes2.json() as { last_lon?: number }[];
        const lon = profiles2?.[0]?.last_lon ?? 126.978;
        const now = new Date();
        const offsetMs = Math.round(lon / 15) * 60 * 60 * 1000;
        const localDate = new Date(now.getTime() + offsetMs).toISOString().split('T')[0];

        fetch(`${context.env.SUPABASE_URL}/rest/v1/daily_readings`, {
          method: 'POST',
          headers: {
            'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: user.id,
            reading_date: localDate,
            style_data: styleData,
          }),
        }).catch(err => console.error('Style cache save error:', err));
      }
    } catch {}

    return Response.json({ success: true, data: styleData }, {
      headers: {
        'Access-Control-Allow-Origin': context.request.headers.get('origin') || '*',
      },
    });
  } catch (error) {
    console.error('Daily style error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  const origin = context.request.headers.get('origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
