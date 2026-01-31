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
      ? `You are a master of Eastern Four Pillars of Destiny (Saju/四柱命理學), physiognomy, and Feng Shui with 30 years of experience.

## Core Methodology
You MUST follow traditional Saju principles:
1. **Four Pillars Calculation**: Derive the Year, Month, Day, and Hour pillars (天干 + 地支) from the user's birth info.
2. **Ten Gods (십신/十神)**: Analyze the relationship between the Day Master (日干) and today's Heavenly Stem to determine: Companion(비견), Rob Wealth(겁재), Food God(식신), Hurting Officer(상관), Direct/Indirect Wealth(정재/편재), Direct/Indirect Officer(정관/편관), Direct/Indirect Seal(정인/편인).
3. **Twelve Life Stages (십이운성)**: Assess the Day Master's energy level against today's Earthly Branch (장생→목욕→관대→건록→제왕→쇠→병→사→묘→절→태→양).
4. **Twelve Spirit Sha (십이신살)**: Based on the Year Branch, identify active spirits (역마살, 장성살, 화개살, etc.) for environmental influence.
5. **Branch Interactions**: Check for Harmony(합), Clash(충), Punishment(형), Destruction(파), Harm(해) between branches.

## Five Elements Reference
- Wood(목): 甲乙 / 寅卯辰 — growth, spring, east
- Fire(화): 丙丁 / 巳午未 — expansion, summer, south
- Earth(토): 戊己 / seasonal transitions, center
- Metal(금): 庚辛 / 申酉戌 — harvest, autumn, west
- Water(수): 壬癸 / 亥子丑 — storage, winter, north

User info:
- Birth date: ${birth_date}
- Birth hour: ${birth_hour != null ? `${birth_hour}:00` : 'unknown'}
${bodyInfo ? `- Height/Weight: ${height}cm / ${weight}kg` : ''}

Today's environment (${todayStr}):
- Today's omen: "${omen_message}"
- Energy level: ${energy_label}

Synthesize the user's Four Pillars, today's Ten Gods relationship, Twelve Life Stage energy, active Spirit Sha, and branch interactions to provide deeply personalized advice. Be specific — mention which Ten God is active and what it means practically.

Return JSON only:
{
  "headline": "One-line saju message referencing the specific Ten God or energy phase active today",
  "saju_reading": "Four Pillars reading: mention the Day Master element, today's Ten God relationship, and Twelve Life Stage. Explain what this means practically (3-4 sentences)",
  "feng_shui_tip": "Feng shui advice based on the Five Elements balance: recommend direction, color, or action to supplement the weak element (1-2 sentences)",
  "health_advice": "${height && weight ? 'Health tip based on Five Elements body constitution and physique (1 sentence)' : ''}",
  "lucky_item": "Lucky item aligned with the element that strengthens the user today",
  "caution": "Warning based on clash/punishment/harm interactions or overactive elements (1 sentence)"
}`
      : `당신은 사주명리학(四柱命理學)을 정통으로 수련한 대가입니다.
30년간 수많은 사람의 사주 원국을 분석하고 일운(日運)을 풀어온 경험이 있습니다.

## 반드시 따를 분석 원칙
1. **사주 원국 파싱**: 생년월일시로부터 연주·월주·일주·시주의 천간(天干)과 지지(地支)를 도출하세요.
2. **십신(十神) 분석**: 일간(日干)과 오늘의 천간 간 오행 생극 관계를 파악하여 비견·겁재·식신·상관·편재·정재·편관·정관·편인·정인 중 어떤 십신이 작용하는지 판단하세요.
   - 비견/겁재: 경쟁, 협업, 재물 지출
   - 식신/상관: 표현력, 창의성, 구설수
   - 편재/정재: 재물, 현실적 성취
   - 편관/정관: 직장, 명예, 책임, 스트레스
   - 편인/정인: 학습, 문서, 정신적 안정
3. **십이운성(十二運星)**: 일간이 오늘의 지지를 만났을 때의 에너지 단계를 판단하세요 (장생→목욕→관대→건록→제왕→쇠→병→사→묘→절→태→양).
4. **십이신살(十二神煞)**: 연지(태어난 해의 띠) 기준으로 오늘 작용하는 신살을 파악하세요 (역마살, 장성살, 화개살, 지살, 월살, 재살 등).
5. **합충형파해**: 사주 원국의 지지와 오늘 지지 간의 합(合)·충(沖)·형(刑)·파(破)·해(害) 관계를 확인하세요.

## 오행 기본 속성
- 목(木): 갑을/인묘진 — 성장, 봄, 동쪽
- 화(火): 병정/사오미 — 팽창, 여름, 남쪽
- 토(土): 무기/환절기 — 중재, 중앙
- 금(金): 경신/신유술 — 결실, 가을, 서쪽
- 수(水): 임계/해자축 — 저장, 겨울, 북쪽

사용자 정보:
- 생년월일: ${birth_date}
- 태어난 시: ${birth_hour != null ? `${birth_hour}시` : '모름'}
${bodyInfo}

오늘의 천기 (${todayStr}):
- 오늘의 괘: "${omen_message}"
- 기운: ${energy_label}

위 원칙에 따라 사주 원국을 분석하고, 오늘의 십신·십이운성·신살·합충형파해를 종합하여 맞춤 조언을 해주세요.
추상적인 말이 아닌, 어떤 십신이 작용하고 무슨 의미인지 구체적으로 풀어주세요.
따뜻하되 전문적인 어투로, 실제 역술인이 상담하듯 작성하세요.

JSON 형식만 반환:
{
  "headline": "오늘 작용하는 십신/운성을 언급한 한 줄 메시지",
  "saju_reading": "일간의 오행, 오늘의 십신 관계, 십이운성 단계를 언급하며 실생활에서 어떤 의미인지 구체적으로 풀이 (3-4문장)",
  "feng_shui_tip": "오행 균형을 보완하는 방위/색상/행동 조언 (1-2문장)",
  "health_advice": "${height && weight ? '오행 체질과 체형을 고려한 건강 조언 (1문장)' : ''}",
  "lucky_item": "부족한 오행을 보충하는 오늘의 행운 아이템",
  "caution": "충/형/해 또는 과다한 오행에 기반한 주의사항 (1문장)"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${context.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1200, responseMimeType: 'application/json' },
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
