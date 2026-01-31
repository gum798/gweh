interface Env {
  GEMINI_API_KEY: string;
}

type PagesFunction<E = unknown> = (context: {
  request: Request;
  env: E;
  params: Record<string, string>;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { birth_date, birth_hour } = await context.request.json() as { birth_date: string; birth_hour: number };

    if (!birth_date) {
      return new Response(JSON.stringify({ error: '생년월일이 필요합니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date();
    const todayStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    const prompt = `당신은 동양 사주 기반의 운세 전문가입니다.

사용자 정보:
- 생년월일: ${birth_date}
- 태어난 시: ${birth_hour}시
- 오늘 날짜: ${todayStr}

오늘의 운세를 다음 JSON 형식으로 작성해주세요:

{
  "level": "대길/길/평/소흉/흉 중 하나",
  "overall": "오늘의 전체 운세 (3-4문장, 구체적이고 실용적으로)",
  "love": "연애운 (1-2문장)",
  "career": "직장/학업운 (1-2문장)",
  "wealth": "금전운 (1-2문장)",
  "health": "건강운 (1문장)",
  "advice": "오늘의 조언 (1문장, 행동 지향적)",
  "luckyColor": "행운의 색 (한국어)",
  "luckyNumber": 숫자,
  "luckyDirection": "행운의 방위 (동/서/남/북 중)"
}

중요:
- 사주 원리에 기반하되 현대적이고 실용적인 조언을 해주세요
- 한국어로 자연스럽게 작성
- JSON 형식만 반환 (마크다운 없이)`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${context.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 1024, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'AI 운세 생성 실패' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return new Response(JSON.stringify({ error: 'AI 응답 없음' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fortune = JSON.parse(text);

    return new Response(JSON.stringify({ success: true, fortune }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Fortune error:', error);
    return new Response(JSON.stringify({ error: '서버 오류' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
