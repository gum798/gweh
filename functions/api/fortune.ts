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

    const prompt = `당신은 사주명리학(四柱命理學)을 정통으로 수련한 운세 전문가입니다.

## 반드시 따를 분석 원칙
1. **사주 원국 도출**: 생년월일시로부터 연주·월주·일주·시주(천간+지지)를 계산하세요.
2. **십신(十神) 분석**: 일간(日干)과 오늘 천간의 오행 생극 관계로 작용하는 십신을 파악하세요.
   - 비견/겁재(동일 오행): 경쟁, 협업, 지출
   - 식신/상관(내가 생하는 오행): 표현력, 창의성, 구설수
   - 편재/정재(내가 극하는 오행): 재물, 현실적 성취
   - 편관/정관(나를 극하는 오행): 직장, 명예, 책임감
   - 편인/정인(나를 생하는 오행): 학습, 문서, 정신적 안정
3. **십이운성**: 일간이 오늘 지지를 만났을 때의 에너지 단계 (장생·건록·제왕·묘·절 등)를 반영하세요.
4. **십이신살**: 연지 기준으로 역마살·장성살·화개살 등 오늘 작용하는 신살을 확인하세요.
5. **합충형파해**: 사주 지지와 오늘 지지 간 충돌·조화를 확인하세요.

## 오행 속성
- 목(木): 갑을/인묘진 — 성장, 봄, 동 | 화(火): 병정/사오미 — 팽창, 여름, 남
- 토(土): 무기 — 중재, 중앙 | 금(金): 경신/신유술 — 결실, 가을, 서
- 수(水): 임계/해자축 — 저장, 겨울, 북

사용자 정보:
- 생년월일: ${birth_date}
- 태어난 시: ${birth_hour != null ? `${birth_hour}시` : '모름'}
- 오늘 날짜: ${todayStr}

위 원칙에 따라 사주를 분석하고 오늘의 운세를 작성하세요.
각 영역에서 어떤 십신이 작용하는지, 오행의 흐름이 어떤지 구체적으로 언급해주세요.
따뜻하되 전문적인 어투로, 추상적이지 않게 작성하세요.

JSON 형식만 반환:
{
  "level": "대길/길/평/소흉/흉 중 하나",
  "overall": "오늘의 전체 운세 — 작용하는 십신과 운성 단계를 언급하며 실생활 의미를 풀이 (3-4문장)",
  "love": "연애운 — 관련 십신(정재/편재/상관 등)의 작용 관점에서 (1-2문장)",
  "career": "직장/학업운 — 정관/편관/정인 등의 작용 관점에서 (1-2문장)",
  "wealth": "금전운 — 정재/편재/겁재 등의 작용 관점에서 (1-2문장)",
  "health": "건강운 — 오행 과부족 기반 (1문장)",
  "advice": "오늘의 조언 — 부족한 오행을 보충하는 구체적 행동 (1문장)",
  "luckyColor": "부족한 오행을 보충하는 행운의 색 (한국어)",
  "luckyNumber": 숫자,
  "luckyDirection": "오행 기반 행운의 방위 (동/서/남/북/중앙 중)"
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
