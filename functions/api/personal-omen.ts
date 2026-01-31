interface Env {
  GEMINI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface RequestBody {
  birth_date: string;
  birth_hour?: number;
  omen_message: string;
  energy_label: string;
  lang: string;
  height?: number;
  weight?: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Auth check
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const accessToken = authHeader.slice(7);
    const userRes = await fetch(`${context.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    if (!userRes.ok) {
      return Response.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders });
    }

    const { birth_date, birth_hour, omen_message, energy_label, lang, height, weight } =
      await context.request.json() as RequestBody;

    if (!birth_date || !omen_message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    const today = new Date();
    const todayStr = today.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });

    const bodyInfo = height && weight ? `- 키: ${height}cm, 몸무게: ${weight}kg` : '';

    const prompt = lang === 'en'
      ? `You are an expert in Eastern Four Pillars of Destiny (Saju), physiognomy, and Feng Shui.

User info:
- Birth date: ${birth_date}
- Birth hour: ${birth_hour != null ? `${birth_hour}:00` : 'unknown'}
${bodyInfo ? `- Height/Weight: ${height}cm / ${weight}kg` : ''}

Today's environment (${todayStr}):
- Today's omen: "${omen_message}"
- Energy level: ${energy_label}

Based on the user's Four Pillars and today's cosmic energy, provide personalized advice.

Return JSON only:
{
  "headline": "One-line saju message for today",
  "saju_reading": "Four Pillars reading for today (2-3 sentences, practical)",
  "feng_shui_tip": "Feng shui advice: direction, color, or action (1-2 sentences)",
  "health_advice": "${height && weight ? 'Health tip considering their physique (1 sentence)' : ''}",
  "lucky_item": "Lucky item for today",
  "caution": "One thing to be careful about (1 sentence)"
}`
      : `당신은 동양 사주팔자, 관상학, 풍수지리를 정통으로 수련한 대가입니다.
30년간 수많은 사람의 운명을 봐온 경험이 있습니다.

사용자 정보:
- 생년월일: ${birth_date}
- 태어난 시: ${birth_hour != null ? `${birth_hour}시` : '모름'}
${bodyInfo}

오늘의 천기 (${todayStr}):
- 오늘의 괘: "${omen_message}"
- 기운: ${energy_label}

사용자의 사주팔자와 오늘의 천기를 종합하여 맞춤 조언을 해주세요.
마치 실제 사주 전문가가 상담하듯 구체적이고 실용적으로 작성해주세요.

JSON 형식만 반환:
{
  "headline": "오늘의 사주 한 줄 메시지",
  "saju_reading": "사주팔자 관점의 오늘 운세 풀이 (2-3문장, 구체적으로)",
  "feng_shui_tip": "풍수 관점의 방위/색상/행동 조언 (1-2문장)",
  "health_advice": "${height && weight ? '체형을 고려한 건강 조언 (1문장)' : ''}",
  "lucky_item": "오늘의 행운 아이템",
  "caution": "주의할 점 (1문장)"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${context.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 800, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return Response.json({ error: 'AI generation failed' }, { status: 500, headers: corsHeaders });
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return Response.json({ error: 'No AI response' }, { status: 500, headers: corsHeaders });
    }

    const result = JSON.parse(text);

    // Remove empty health_advice if no height/weight
    if (!height || !weight) {
      result.health_advice = '';
    }

    return Response.json({ success: true, data: result }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Personal omen error:', error);
    return Response.json({ error: 'Server error' }, { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
