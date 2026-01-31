interface Env {
  GEMINI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  POLAR_SANDBOX_ACCESS_TOKEN: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SANDBOX: string;
}

async function verifySubscription(env: Env, accessToken: string): Promise<boolean> {
  // Get user email
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!userRes.ok) return false;
  const user = await userRes.json() as { email: string };

  // Check Polar subscription
  const isSandbox = env.POLAR_SANDBOX === 'true';
  const polarToken = isSandbox ? env.POLAR_SANDBOX_ACCESS_TOKEN : env.POLAR_ACCESS_TOKEN;
  const apiBaseUrl = isSandbox ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';

  const subsRes = await fetch(
    `${apiBaseUrl}/v1/subscriptions/?customer_email=${encodeURIComponent(user.email)}&active=true&limit=1`,
    { headers: { 'Authorization': `Bearer ${polarToken}` } }
  );
  if (!subsRes.ok) return false;
  const data = await subsRes.json() as { items: any[] };
  return data.items && data.items.length > 0;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSubscribed = await verifySubscription(context.env, authHeader.slice(7));
    if (!isSubscribed) {
      return Response.json({ error: 'Subscription required' }, { status: 403 });
    }

    const body = await context.request.json() as { omenMessage: string; energy: string; lang: string };

    const prompt = body.lang === 'ko'
      ? `당신은 신비로운 패션 스타일리스트입니다. 오늘의 운세 메시지와 에너지를 기반으로 오늘 하루의 스타일을 추천해주세요.

오늘의 괘 메시지: "${body.omenMessage}"
오늘의 에너지: ${body.energy}

다음 JSON 형식으로 응답해주세요:
{
  "headline": "한 줄 스타일 메시지",
  "colors": ["추천 컬러 1", "추천 컬러 2", "추천 컬러 3"],
  "style": "오늘의 스타일 설명 (2-3문장)",
  "item": "오늘의 포인트 아이템",
  "tip": "스타일 팁 한 마디"
}`
      : `You are a mystical fashion stylist. Based on today's fortune message and energy, recommend a style for the day.

Today's oracle message: "${body.omenMessage}"
Today's energy: ${body.energy}

Respond in this JSON format:
{
  "headline": "One-line style message",
  "colors": ["Color 1", "Color 2", "Color 3"],
  "style": "Today's style description (2-3 sentences)",
  "item": "Today's key item",
  "tip": "One style tip"
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${context.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
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

    const styleData = JSON.parse(text);
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
