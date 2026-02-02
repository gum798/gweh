interface Env {
  GEMINI_API_KEY: string;
}

interface RequestBody {
  image: string; // base64 encoded image
  height: number;
  weight: number;
  weather?: { temperature: number; description: string };
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: RequestBody = await context.request.json();
    const { image, height, weight, weather } = body;

    if (!image || !height || !weight) {
      return new Response(
        JSON.stringify({ error: '이미지, 키, 몸무게 정보가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // BMI 계산
    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    // base64 데이터에서 prefix 제거
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    const prompt = `당신은 전문 패션 스타일리스트입니다. 사용자의 전신 사진을 분석하여 맞춤형 패션 컨설팅을 제공해주세요.

사용자 정보:
- 키: ${height}cm
- 몸무게: ${weight}kg
- BMI: ${bmi}${weather ? `\n\n오늘 날씨:\n- 기온: ${weather.temperature}°C\n- 상태: ${weather.description}\n\n날씨에 맞는 옷차림도 함께 고려해주세요.` : ''}

다음 형식으로 JSON 응답을 작성해주세요:

{
  "bodyAnalysis": {
    "bodyType": "체형 유형 (예: 슬림, 균형, 볼륨감 있는 등)",
    "features": "체형의 특징과 강점",
    "proportions": "비율 분석"
  },
  "mainMessage": "전체적인 스타일 방향 제안 (2-3문장)",
  "styles": [
    {
      "category": "상의",
      "items": ["추천 아이템1", "추천 아이템2", "추천 아이템3"],
      "description": "추천 이유",
      "icon": "👕"
    },
    {
      "category": "하의",
      "items": ["추천 아이템1", "추천 아이템2", "추천 아이템3"],
      "description": "추천 이유",
      "icon": "👖"
    },
    {
      "category": "아우터",
      "items": ["추천 아이템1", "추천 아이템2", "추천 아이템3"],
      "description": "추천 이유",
      "icon": "🧥"
    },
    {
      "category": "스타일",
      "items": ["추천 스타일1", "추천 스타일2", "추천 스타일3"],
      "description": "추천 이유",
      "icon": "✨"
    }
  ],
  "colors": {
    "recommended": ["추천 색상1", "추천 색상2", "추천 색상3", "추천 색상4"],
    "avoid": ["피해야 할 색상이나 패턴"],
    "description": "색상 추천 이유"
  },
  "tips": ["스타일링 팁1", "스타일링 팁2", "스타일링 팁3"],
  "avoid": ["피해야 할 스타일1", "피해야 할 스타일2"],
  "accessories": ["추천 액세서리1", "추천 액세서리2", "추천 액세서리3"],
  "seasonalAdvice": "계절별 스타일링 조언"
}

중요:
- 사진을 보고 실제 체형과 분위기를 분석해주세요
- 성별에 관계없이 중립적인 추천을 해주세요
- 한국어로 자연스럽게 작성해주세요
- JSON 형식만 반환해주세요 (마크다운 코드블록 없이)`;

    // Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${context.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'AI 분석 중 오류가 발생했습니다.', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'AI 응답을 받지 못했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // JSON 파싱 시도
    let parsedContent;
    try {
      // 마크다운 코드블록 제거
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      parsedContent = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      console.error('JSON parse error:', content);
      return new Response(
        JSON.stringify({ error: 'AI 응답 파싱 중 오류가 발생했습니다.', raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedContent }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
