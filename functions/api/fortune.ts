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
    const { birth_date, birth_hour } = await context.request.json() as { birth_date: string; birth_hour?: number };

    if (!birth_date) {
      return new Response(JSON.stringify({ error: '생년월일이 필요합니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date();
    const todayStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    // 생년에서 띠 계산
    const yearNum = parseInt(birth_date, 10);
    const zodiacAnimals = ['원숭이', '닭', '개', '돼지', '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양'];
    const zodiac = !isNaN(yearNum) ? zodiacAnimals[yearNum % 12] : '알 수 없음';

    const prompt = `당신은 동양 운세 전문가입니다. 띠별 운세를 기본으로, 사주 원리를 참고하여 오늘의 운세를 작성하세요.

## 분석 방식
1. **띠별 운세 (메인)**: 사용자의 띠(12지신)가 오늘의 천간·지지와 어떤 관계인지 분석하세요.
   - 삼합(三合), 육합(六合), 충(衝), 형(刑), 해(害) 등 오늘 지지와의 관계를 파악
   - 해당 띠의 올해 운기 흐름과 오늘의 에너지를 조합
2. **사주 참고 조언**: 생년의 천간·지지에서 오행 특성을 파악하고, 보완이 필요한 오행을 조언에 반영하세요.
3. **톤**: 일상적이고 친근한 운세 스타일. 지나치게 전문 용어(십신, 십이운성 등)를 나열하지 말고, 실생활에 도움되는 내용 위주로 작성하세요.

## 12지신과 오행
- 자(쥐)·축(소): 수/토 | 인(호랑이)·묘(토끼): 목 | 진(용)·사(뱀): 토/화
- 오(말)·미(양): 화/토 | 신(원숭이)·유(닭): 금 | 술(개)·해(돼지): 토/수

사용자 정보:
- 생년: ${birth_date}년
- 띠: ${zodiac}띠
- 오늘 날짜: ${todayStr}

JSON 형식만 반환:
{
  "level": "대길/길/평/소흉/흉 중 하나",
  "overall": "오늘의 전체 운세 — 띠와 오늘의 관계를 중심으로 실생활 풀이 (3-4문장, 전문 용어 최소화)",
  "love": "연애운 (1-2문장, 구체적 상황 중심)",
  "career": "직장/학업운 (1-2문장, 구체적 상황 중심)",
  "wealth": "금전운 (1-2문장, 구체적 상황 중심)",
  "health": "건강운 (1문장)",
  "advice": "오늘의 조언 — 구체적이고 실천 가능한 행동 (1문장)",
  "luckyColor": "행운의 색 (한국어)",
  "luckyNumber": 숫자,
  "luckyDirection": "행운의 방위 (동/서/남/북 중)"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${context.env.GEMINI_API_KEY}`,
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
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'AI 운세 생성 실패', detail: errText }), {
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
