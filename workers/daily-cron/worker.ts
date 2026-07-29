// Daily Cron Worker - 매시간 실행, 사용자 위치 기반 로컬 06시에 발송
// wrangler.toml에서 [triggers] crons = ["0 * * * *"] 설정

import { geminiEndpoint } from '../../shared/gemini';
import { BRAND, splitBrand } from '../../shared/brand';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SANDBOX_ACCESS_TOKEN: string;
  POLAR_SANDBOX: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  RESEND_API_KEY: string;
  VITE_OPENWEATHER_API_KEY: string;
  NASA_API_KEY?: string;
  ALERT_EMAIL?: string;
}

interface UserProfile {
  user_id: string;
  height: number | null;
  weight: number | null;
  photo_url: string | null;
  last_lat: number | null;
  last_lon: number | null;
  birth_date: string | null;
}

// 경도 기반 로컬 시각 계산 (경도 15° = 1시간)
function getLocalHour(lon: number, utcNow: Date): number {
  const offsetHours = Math.round(lon / 15);
  const localHour = (utcNow.getUTCHours() + offsetHours + 24) % 24;
  return localHour;
}

// 경도 기반 로컬 날짜 계산
function getLocalDate(lon: number, utcNow: Date): string {
  const offsetMs = Math.round(lon / 15) * 60 * 60 * 1000;
  return new Date(utcNow.getTime() + offsetMs).toISOString().split('T')[0];
}

function supabaseRest(env: Env, path: string, options: RequestInit = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

async function getSubscribedEmails(env: Env): Promise<string[]> {
  const isSandbox = env.POLAR_SANDBOX === 'true';
  const token = isSandbox ? env.POLAR_SANDBOX_ACCESS_TOKEN : env.POLAR_ACCESS_TOKEN;
  const baseUrl = isSandbox ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';

  const emails: string[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`${baseUrl}/v1/subscriptions/?limit=100&page=${page}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) break;
    const data = await res.json() as { items: any[] };
    if (!data.items || data.items.length === 0) break;

    for (const sub of data.items) {
      if (sub.status === 'active' || sub.status === 'trialing') {
        if (sub.customer?.email) emails.push(sub.customer.email);
      }
    }

    hasMore = data.items.length === 100;
    page++;
  }

  return [...new Set(emails)];
}

async function getUserIdByEmail(env: Env, email: string): Promise<string | null> {
  // Use Supabase admin API to find user by email
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`, {
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!res.ok) return null;

  // Search through admin users list for the email
  const listRes = await fetch(
    `${env.SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`,
    {
      headers: {
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      },
    }
  );
  if (!listRes.ok) return null;
  const usersData = await listRes.json() as { users: { id: string; email: string }[] };
  const found = usersData.users?.find(u => u.email === email);
  return found?.id || null;
}

async function fetchWeather(lat: number, lon: number, apiKey: string) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
  );
  if (!res.ok) return null;
  const data = await res.json() as any;
  return {
    temperature: Math.round(data.main.temp),
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    clouds: data.clouds.all,
    description: data.weather?.[0]?.description || '',
    windSpeed: data.wind.speed,
    cityName: data.name,
  };
}

function calculateMoonPhase() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  let c = Math.floor(365.25 * year);
  let e = Math.floor(30.6 * month);
  const jd = c + e + day - 694039.09;
  const phase = jd / 29.5305882;
  const daysSinceNew = (phase - Math.floor(phase)) * 29.5305882;
  const illumination = 50 * (1 - Math.cos(2 * Math.PI * (phase - Math.floor(phase))));

  let name = '보름달';
  if (daysSinceNew < 1.85) name = '새달';
  else if (daysSinceNew < 7.38) name = '초승달';
  else if (daysSinceNew < 9.23) name = '상현달';
  else if (daysSinceNew < 14.77) name = '상현망간';
  else if (daysSinceNew < 16.61) name = '보름달';
  else if (daysSinceNew < 22.15) name = '하현망간';
  else if (daysSinceNew < 23.99) name = '하현달';
  else name = '그믐달';

  return { name, illumination: Math.round(illumination), daysSinceNew: Math.round(daysSinceNew) };
}

async function fetchEarthquakes() {
  const now = new Date();
  const end = now.toISOString();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&endtime=${end}&minmagnitude=4`
  );
  if (!res.ok) return { count: 0, maxMagnitude: 0 };
  const data = await res.json() as any;
  const features = data.features || [];
  const magnitudes = features.map((f: any) => f.properties.mag);

  return {
    count: features.length,
    maxMagnitude: magnitudes.length > 0 ? Math.max(...magnitudes) : 0,
  };
}

function generateSimpleOmen(weather: any, moon: any, earthquake: any): { message: string; energy: number } {
  let score = 50;
  const messages: string[] = [];

  // 날씨 영향 (더 세분화)
  if (weather) {
    if (weather.pressure > 1020) { score += 12; messages.push('높은 기압이 맑은 기운을 불러옵니다'); }
    else if (weather.pressure > 1015) { score += 5; messages.push('안정된 기압이 평온한 기운을 가져옵니다'); }
    else if (weather.pressure < 1000) { score -= 12; messages.push('급변하는 기압이 혼란의 기운을 드리웁니다'); }
    else if (weather.pressure <= 1005) { score -= 5; messages.push('변화하는 기압이 새로운 기회를 예고합니다'); }

    if (weather.clouds < 20) { score += 8; messages.push('맑은 하늘이 밝은 에너지를 전합니다'); }
    else if (weather.clouds > 80) { score -= 8; messages.push('짙은 구름이 내면의 성찰을 이끕니다'); }

    if (weather.windSpeed > 10) { score -= 5; messages.push('거센 바람이 변화의 기운을 몰고 옵니다'); }
    else if (weather.windSpeed < 2) { score += 5; messages.push('고요한 바람이 평화를 선사합니다'); }

    if (weather.humidity > 85) { score -= 3; messages.push('높은 습기가 무거운 기운을 드리웁니다'); }
    else if (weather.humidity < 40) { score += 3; messages.push('건조한 공기가 명료한 기운을 전합니다'); }

    if (weather.temperature < -5) { score -= 8; messages.push('혹한의 기운이 시련을 예고합니다'); }
    else if (weather.temperature > 35) { score -= 5; messages.push('강렬한 열기가 열정의 기운을 불태웁니다'); }
  }

  // 달 영향 (모든 달 상태 반영)
  if (moon) {
    if (moon.name === '보름달') { score += 15; messages.push('보름달의 강한 기운이 당신을 감쌉니다'); }
    else if (moon.name === '새달') { score += 8; messages.push('새달이 새로운 시작을 축복합니다'); }
    else if (moon.name === '상현달') { score += 5; messages.push('차오르는 달이 성장의 기운을 보냅니다'); }
    else if (moon.name === '하현달') { score -= 5; messages.push('기우는 달이 정리와 마무리를 권합니다'); }
    else if (moon.name === '그믐달') { score -= 8; messages.push('그믐달이 내면의 쉼을 속삭입니다'); }
    else if (moon.name === '초승달') { score += 3; messages.push('초승달이 희망의 빛을 밝힙니다'); }
  }

  // 지진 영향
  if (earthquake) {
    if (earthquake.count === 0) { score += 12; messages.push('고요한 대지가 깊은 안정을 선사합니다'); }
    else if (earthquake.count < 5) { score += 5; messages.push('대지의 기운이 잔잔합니다'); }
    else if (earthquake.count > 20) { score -= 15; messages.push('요동치는 대지가 경각심을 일깨웁니다'); }
    else if (earthquake.count > 10) { score -= 8; messages.push('활발한 대지의 움직임에 주의가 필요합니다'); }
    if (earthquake.maxMagnitude >= 6) { score -= 10; messages.push('강한 지진파가 대지를 흔듭니다'); }
  }

  // 날짜 기반 변동 (같은 조건이어도 날마다 미세하게 다르게)
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const dailyVariance = ((daySeed * 9301 + 49297) % 233280) / 233280; // 0~1 사이 의사난수
  score += Math.round((dailyVariance - 0.5) * 16); // -8 ~ +8

  score = Math.max(5, Math.min(98, score));
  const message = messages.length > 0 ? messages.join('. ') + '.' : '천지의 기운이 평온합니다.';

  return { message, energy: score };
}

async function generateStyleWithGemini(env: Env, omenMessage: string, energy: number, weather?: any, profile?: any): Promise<any> {
  const energyLabel = energy >= 80 ? '대길' : energy >= 60 ? '길' : energy >= 40 ? '평' : energy >= 20 ? '소흉' : '흉';

  let weatherInfo = '';
  if (weather) {
    weatherInfo = `\n\n오늘 날씨: ${weather.temperature}°C, ${weather.description}\n날씨에 맞는 옷차림도 함께 고려해주세요.`;
  }

  let bodyInfo = '';
  if (profile?.height && profile?.weight) {
    bodyInfo = `\n\n사용자 체형: 키 ${profile.height}cm, 몸무게 ${profile.weight}kg\n체형에 맞는 스타일도 고려해주세요.`;
  }

  const prompt = `당신은 신비로운 패션 스타일리스트입니다. 오늘의 운세와 에너지를 기반으로 스타일을 추천해주세요.

오늘의 괘: "${omenMessage}"
에너지: ${energyLabel} (${energy}/100)${weatherInfo}${bodyInfo}

다음 JSON 형식으로 응답:
{
  "headline": "한 줄 스타일 메시지",
  "colors": ["추천 컬러 1", "추천 컬러 2", "추천 컬러 3"],
  "style": "오늘의 스타일 설명 (2-3문장)",
  "item": "오늘의 포인트 아이템",
  "tip": "스타일 팁 한 마디"
}`;

  const res = await fetch(
    geminiEndpoint(env),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 500, responseMimeType: 'application/json' },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('Style Gemini error:', res.status, errText);
    return null;
  }
  const data = await res.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch { return null; }
}

async function generateFortuneWithGemini(env: Env, birthYear: string): Promise<any> {
  const yearNum = parseInt(birthYear, 10);
  const zodiacAnimals = ['원숭이', '닭', '개', '돼지', '쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양'];
  const zodiac = !isNaN(yearNum) ? zodiacAnimals[yearNum % 12] : '알 수 없음';
  const today = new Date();
  const todayStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const prompt = `당신은 동양 운세 전문가입니다. 띠별 운세를 기반으로 오늘의 운세를 작성하세요.

사용자: ${birthYear}년생, ${zodiac}띠
오늘: ${todayStr}

JSON 형식만 반환:
{
  "level": "대길/길/평/소흉/흉 중 하나",
  "overall": "전체 운세 (3-4문장)",
  "love": "연애운 (1-2문장)",
  "career": "직장/학업운 (1-2문장)",
  "wealth": "금전운 (1-2문장)",
  "health": "건강운 (1문장)",
  "advice": "오늘의 조언 (1문장)",
  "luckyColor": "행운의 색",
  "luckyNumber": 숫자,
  "luckyDirection": "방위"
}`;

  const res = await fetch(
    geminiEndpoint(env),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 1024, responseMimeType: 'application/json' },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('Fortune Gemini error:', res.status, errText);
    return null;
  }
  const data = await res.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch { return null; }
}

async function sendEmail(env: Env, to: string, omenMessage: string, styleData: any, energy: number, fortuneData?: any, localDate?: string) {
  const energyLabel = energy >= 80 ? '대길 ✨' : energy >= 60 ? '길 🌟' : energy >= 40 ? '평 ☯️' : energy >= 20 ? '소흉 ⚡' : '흉 🌙';

  // 메일 헤더는 브랜드의 마지막 낱말만 색으로 강조한다 — 히어로 h1 과 같은
  // 표기이고, 쪼개는 규칙은 splitBrand 한 곳에 있다. 마크업만 여기서 만든다
  // (저쪽은 JSX, 이쪽은 HTML 문자열이라 마크업은 공유할 수 없다).
  // 강조색은 채움색 #5b13ec 가 아니라 잉크 #b8a5ff 다 — 채움색은 이 어두운
  // 배경 위 글자로 쓰면 2.43:1 이라 읽히지 않는다(앱 팔레트와 같은 규칙).
  const { lead, tail } = splitBrand();
  const brandMark = lead
    ? `${lead} <span style="color:#b8a5ff;">${tail}</span>`
    : tail;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#161022;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:-1px;">${brandMark}</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;letter-spacing:3px;margin:4px 0 0;">Daily Reading</p>
    </div>

    <!-- Omen Card -->
    <div style="background:rgba(34,25,51,0.8);border:1px solid rgba(91,19,236,0.3);border-radius:16px;padding:24px;margin-bottom:20px;">
      <div style="text-align:center;margin-bottom:16px;">
        <span style="font-size:32px;">🔮</span>
      </div>
      <p style="color:rgba(255,255,255,0.7);font-size:16px;line-height:1.6;text-align:center;font-style:italic;margin:0;">
        "${omenMessage}"
      </p>
      <div style="text-align:center;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);">
        <span style="color:#5b13ec;font-size:14px;font-weight:bold;">${energyLabel}</span>
      </div>
    </div>

    ${styleData?.headline ? `
    <!-- Style Card -->
    <div style="background:rgba(34,25,51,0.8);border:1px solid rgba(91,19,236,0.3);border-radius:16px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="font-size:20px;">👔</span>
        <span style="color:#fff;font-weight:bold;font-size:14px;">오늘의 스타일</span>
      </div>
      <p style="color:rgba(255,255,255,0.8);font-size:15px;font-style:italic;margin:0 0 12px;">"${styleData.headline}"</p>
      <p style="color:rgba(255,255,255,0.6);font-size:13px;line-height:1.6;margin:0 0 16px;">${styleData.style || ''}</p>
      ${Array.isArray(styleData.colors) && styleData.colors.length > 0 ? `
      <div style="margin-bottom:12px;">
        <span style="color:rgba(255,255,255,0.4);font-size:11px;">추천 컬러: </span>
        ${styleData.colors.map((c: string) => `<span style="color:#5b13ec;font-size:12px;background:rgba(91,19,236,0.1);padding:2px 8px;border-radius:12px;margin-right:4px;">${c}</span>`).join('')}
      </div>
      ` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
        ${styleData.item ? `<div>
          <span style="color:rgba(255,255,255,0.4);font-size:11px;display:block;">포인트 아이템</span>
          <span style="color:#fff;font-size:13px;">${styleData.item}</span>
        </div>` : ''}
        ${styleData.tip ? `<div>
          <span style="color:rgba(255,255,255,0.4);font-size:11px;display:block;">스타일 팁</span>
          <span style="color:#fff;font-size:13px;">${styleData.tip}</span>
        </div>` : ''}
      </div>
    </div>
    ` : ''}

    ${fortuneData?.overall ? `
    <!-- Fortune Card -->
    <div style="background:rgba(34,25,51,0.8);border:1px solid rgba(91,19,236,0.3);border-radius:16px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="font-size:20px;">🐲</span>
        <span style="color:#fff;font-weight:bold;font-size:14px;">오늘의 띠별 운세</span>
      </div>
      <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.7;margin:0 0 12px;">${fortuneData.overall || ''}</p>
      ${fortuneData.love ? `<div style="margin-top:8px;"><span style="color:#5b13ec;font-size:12px;">💕 연애:</span> <span style="color:rgba(255,255,255,0.6);font-size:13px;">${fortuneData.love}</span></div>` : ''}
      ${fortuneData.wealth ? `<div style="margin-top:4px;"><span style="color:#5b13ec;font-size:12px;">💰 금전:</span> <span style="color:rgba(255,255,255,0.6);font-size:13px;">${fortuneData.wealth}</span></div>` : ''}
      ${fortuneData.career ? `<div style="margin-top:4px;"><span style="color:#5b13ec;font-size:12px;">💼 직장:</span> <span style="color:rgba(255,255,255,0.6);font-size:13px;">${fortuneData.career}</span></div>` : ''}
      ${fortuneData.health ? `<div style="margin-top:4px;"><span style="color:#5b13ec;font-size:12px;">🏥 건강:</span> <span style="color:rgba(255,255,255,0.6);font-size:13px;">${fortuneData.health}</span></div>` : ''}
      ${fortuneData.advice ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);"><span style="color:rgba(255,255,255,0.4);font-size:11px;">💡 조언: </span><span style="color:rgba(255,255,255,0.7);font-size:13px;">${fortuneData.advice}</span></div>` : ''}
      ${fortuneData.luckyNumber != null ? `<div style="margin-top:4px;"><span style="color:rgba(255,255,255,0.4);font-size:11px;">행운의 숫자: </span><span style="color:#5b13ec;font-size:13px;">${fortuneData.luckyNumber}</span> <span style="color:rgba(255,255,255,0.4);font-size:11px;margin-left:8px;">행운의 색: </span><span style="color:#5b13ec;font-size:13px;">${fortuneData.luckyColor || ''}</span></div>` : ''}
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="text-align:center;padding-top:20px;">
      <a href="https://gweh-3s2.pages.dev" style="display:inline-block;background:#5b13ec;color:#fff;text-decoration:none;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:bold;">앱에서 자세히 보기</a>
      <p style="color:rgba(255,255,255,0.2);font-size:10px;margin-top:20px;text-transform:uppercase;letter-spacing:3px;">© ${BRAND}</p>
    </div>
  </div>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${BRAND} <onboarding@resend.dev>`,
      to: [to],
      subject: `🔮 오늘의 운세 — ${localDate ? new Date(localDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Email send failed for ${to}:`, res.status, errText);
  }
  return res.ok;
}

async function runDailyCron(env: Env, forceAll = false, resend = false, regenerate = false) {
    const utcNow = new Date();
    console.log(`Hourly cron started: ${utcNow.toISOString()} (UTC ${utcNow.getUTCHours()}:00)`);

    try {
      // 1. Get subscribed customer emails
      const emails = await getSubscribedEmails(env);
      console.log(`Found ${emails.length} subscribed users`);

      // 2. Fetch shared data (moon, earthquakes)
      const moon = calculateMoonPhase();
      const earthquake = await fetchEarthquakes();

      let processed = 0;
      let skipped = 0;

      for (const email of emails) {
        try {
          // 3. Get user ID
          const userId = await getUserIdByEmail(env, email);
          if (!userId) continue;

          // 4. Get user profile (need location to determine timezone)
          const profileRes = await supabaseRest(env, `user_profiles?user_id=eq.${userId}&select=*`);
          const profiles = await profileRes.json() as UserProfile[];
          const profile = profiles?.[0];

          // 5. 사용자 위치 기반 로컬 시각 확인 (위치 없으면 서울 기준)
          const lon = profile?.last_lon ?? 126.978; // 서울 기본값
          const lat = profile?.last_lat ?? 37.5665;
          const localHour = getLocalHour(lon, utcNow);

          // 로컬 시각이 6시가 아니면 스킵 (forceAll이면 무시)
          if (!forceAll && localHour !== 6) {
            skipped++;
            continue;
          }

          // 6. 사용자 로컬 날짜 기준으로 이메일 발송 여부 체크
          const localDate = getLocalDate(lon, utcNow);
          const existingRes = await supabaseRest(
            env,
            `daily_readings?user_id=eq.${userId}&reading_date=eq.${localDate}&select=id,omen_message,energy_score,style_data,fortune_data,email_sent`
          );
          const existing = await existingRes.json() as any[];
          const row = existing?.[0];

          if (row?.email_sent && !resend) { skipped++; continue; }

          // 7. Fetch weather
          const weather = await fetchWeather(lat, lon, env.VITE_OPENWEATHER_API_KEY);

          // 8. 기존 데이터 있으면 사용, 없으면 생성
          let omenMessage = row?.omen_message;
          let energyScore = row?.energy_score;
          let styleData = regenerate ? null : row?.style_data;

          if (!omenMessage) {
            const omen = generateSimpleOmen(weather, moon, earthquake);
            omenMessage = omen.message;
            energyScore = omen.energy;
          }

          if (!styleData || typeof styleData !== 'object' || !styleData.headline) {
            styleData = await generateStyleWithGemini(env, omenMessage, energyScore ?? 50, weather, profile);
            console.log(`Style generated for ${email}:`, JSON.stringify(styleData));
          }

          // 8-1. Fortune 데이터
          let fortuneData = regenerate ? null : row?.fortune_data;
          if ((!fortuneData || typeof fortuneData !== 'object' || !fortuneData.overall) && (profile as any)?.birth_date) {
            const birthYear = (profile as any).birth_date.split('-')[0];
            fortuneData = await generateFortuneWithGemini(env, birthYear);
            console.log(`Fortune generated for ${email}: ${fortuneData ? 'OK' : 'FAILED'}`);
          }

          // 10. Save to daily_readings (데이터 저장, email_sent는 아직 false)
          await supabaseRest(env, 'daily_readings', {
            method: 'POST',
            body: JSON.stringify({
              user_id: userId,
              reading_date: localDate,
              omen_message: omenMessage,
              energy_score: energyScore,
              style_data: styleData,
              fortune_data: fortuneData,
              email_sent: false,
            }),
            headers: { 'Prefer': 'resolution=merge-duplicates' },
          });

          // 11. Send email
          const emailSent = await sendEmail(env, email, omenMessage, styleData, energyScore ?? 50, fortuneData, localDate);

          // 12. 이메일 성공 시에만 email_sent=true로 업데이트
          if (emailSent) {
            await supabaseRest(env, `daily_readings?user_id=eq.${userId}&reading_date=eq.${localDate}`, {
              method: 'PATCH',
              body: JSON.stringify({ email_sent: true }),
            });
          }

          processed++;
          console.log(`Sent to ${email} (local 06:00, lon=${lon})`);
        } catch (err) {
          console.error(`Error processing ${email}:`, err);
        }
      }

      return `Done: ${processed} sent, ${skipped} skipped`;
    } catch (error) {
      console.error('Cron error:', error);
      return `Error: ${error}`;
    }
}

// ─── 셀프체크 ────────────────────────────────────────────────────────────
// 2026-03~07 사이 Gemini 모델 퇴역과 Supabase 프로젝트 정지가 각각 발생했으나
// 감지 장치가 없어 4개월간 아무도 몰랐다. 그때 원인을 찾는 데 쓴 것은 curl 몇 번이
// 전부였다. 그 curl 을 하루 한 번 자동으로 돌린다.

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
  // 응답까지 걸린 밀리초. PROBE_TIMEOUT_MS 를 얼마로 둘지는 판단이 아니라
  // 측정으로 정해야 하는데, 이 값이 없으면 그 측정을 할 곳이 없다.
  // 저장하지 않는다 — 매 실행의 결과에만 실려 나가고 사라진다.
  ms: number;
  skipped?: boolean;
}

// detail 은 /selfcheck 로 익명 호출자에게 그대로 반환되고 메일로도 나간다.
// 프로브 URL 중 셋(Gemini ?key=, NASA ?api_key=, OpenWeather ?appid=)은
// 쿼리스트링에 자격증명을 싣는다. 제공자의 에러 '본문'은 대개 안전하지만
// 런타임 예외 메시지는 요청 URL 을 통째로 포함할 수 있다. 저장 전에 자른다.
// 파라미터 이름을 열거하지 않는다 — 새 파라미터가 생기면 그 순간 새는 구조다.
function redactQuery(s: string): string {
  return s.replace(/\?[^\s]*/g, '?…');
}

// 프로브 하나가 연결 슬롯을 붙잡을 수 있는 상한.
// 이것은 '크론이 얼마나 기다려도 되는가'라는 답 없는 질문이 아니다(그건 waitUntil 이
// 이미 해결했다). '살아있는지 묻는 요청 하나가 얼마나 오래 매달려도 되는가'이고,
// 그 답은 10초면 충분하다. 부수 효과로 응답하지 않는 의존성도 이제 감지된다 —
// 타임아웃은 TimeoutError 로 던져지고 아래 catch 가 ok: false 로 바꿔 경보를 울린다.
const PROBE_TIMEOUT_MS = 10_000;

async function probe(name: string, fn: () => Promise<Response>): Promise<CheckResult> {
  const started = Date.now();
  try {
    const res = await fn();
    const ms = Date.now() - started;
    if (res.ok) {
      // 성공 본문은 쓸 데가 없지만, 읽지 않고 버려두면 연결 슬롯을 계속 붙잡는다.
      // Workers 는 invocation 당 동시 연결 6개가 상한이고 셀프체크는 그 슬롯을
      // runDailyCron 과 나눠 쓴다. 즉시 반납한다.
      await res.body?.cancel();
      return { name, ok: true, detail: `HTTP ${res.status}`, ms };
    }
    const body = (await res.text()).slice(0, 300);
    return { name, ok: false, detail: redactQuery(`HTTP ${res.status} — ${body}`), ms };
  } catch (err) {
    return {
      name,
      ok: false,
      detail: redactQuery(`예외: ${err instanceof Error ? err.message : String(err)}`),
      ms: Date.now() - started,
    };
  }
}

// 설정되지 않은 선택적 의존성은 '실패'가 아니라 '건너뜀'이다.
// ok: true 를 유지해야 failures.filter 가 깨끗하고, 경보가 울리지 않는다.
function skipped(name: string, reason: string): CheckResult {
  return { name, ok: true, detail: `건너뜀 — ${reason}`, ms: 0, skipped: true };
}

async function runSelfCheck(env: Env): Promise<CheckResult[]> {
  const isSandbox = env.POLAR_SANDBOX === 'true';
  const polarToken = isSandbox ? env.POLAR_SANDBOX_ACCESS_TOKEN : env.POLAR_ACCESS_TOKEN;
  const polarBase = isSandbox ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nasaKey = env.NASA_API_KEY;

  return Promise.all([
    // 이번에 죽었던 것 1: Gemini 모델. 최소 토큰으로 존재만 확인한다.
    //
    // 이 프로브가 보는 것은 '모델이 존재하고 키가 유효한가'뿐이다. maxOutputTokens: 1
    // 이면 thinking 계열 모델은 답을 내기 전에 예산을 소진하지만, 그때도 HTTP 200 이
    // 오므로 통과한다 — 의도한 동작이다. 응답의 품질은 검사 대상이 아니다.
    //
    // 오진 주의: 실패가 HTTP 400 이고 본문에 max_output_tokens / thinking 이 보이면
    // 그것은 모델 퇴역이 아니라 이 프로브의 버그다. thinking 예산을 끌 수 없는
    // 모델로 GEMINI_MODEL 을 바꾸면 이 1 이라는 값이 거부될 수 있다. 그때 필요한 것은
    // 모델 교체가 아니라 아래 maxOutputTokens 상향이다.
    // 진짜 퇴역은 400 이 아니라 404 / not found / no longer available 로 나타난다.
    probe('Gemini', () => fetch(geminiEndpoint(env), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })),
    // 이번에 죽었던 것 2: Supabase 프로젝트.
    probe('Supabase', () => fetch(
      `${env.SUPABASE_URL}/rest/v1/user_profiles?select=user_id&limit=1`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      }
    )),
    probe('Polar', () => fetch(`${polarBase}/v1/subscriptions/?limit=1`, {
      headers: { 'Authorization': `Bearer ${polarToken}` },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })),
    probe('OpenWeather', () => fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=37.5665&lon=126.978&appid=${env.VITE_OPENWEATHER_API_KEY}&units=metric`,
      { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) }
    )),
    // NASA: 이 Worker 는 NASA 를 호출하지 않는다. 제품에서 NASA 를 쓰는 것은
    // 프런트엔드이고(src/utils/api.ts), 거기서 쓰는 키는 VITE_NASA_API_KEY 로 별개다.
    // 즉 이 프로브가 통과해도 제품이 실제로 의존하는 키의 상태는 알 수 없다.
    // DEMO_KEY 로 대체하지 않는다 — 소스 IP 당 시간 30회 제한인데 Workers 는 공용 IP
    // 로 나가므로 429 가 언젠가 반드시 뜬다. 그 순간 이 장치는 늑대 소년이 되고,
    // 늑대 소년이 된 감지 장치는 없는 것보다 나쁘다.
    nasaKey
      ? probe('NASA', () => fetch(
          `https://api.nasa.gov/planetary/apod?api_key=${nasaKey}`,
          { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) }
        ))
      : skipped('NASA', 'NASA_API_KEY 미설정'),
    probe('USGS', () => fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${yesterday}&endtime=${today}&minmagnitude=4`,
      { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) }
    )),
  ]);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 반환값은 '경보가 실제로 나갔는가'다. 던지지 않는 계약은 그대로이므로
// 모든 실패 경로는 예외가 아니라 false 로 나온다.
async function sendSelfCheckAlert(env: Env, failures: CheckResult[]): Promise<boolean> {
  if (!env.ALERT_EMAIL) {
    console.error('Self-check failed but ALERT_EMAIL is not configured:', JSON.stringify(failures));
    return false;
  }

  const rows = failures.map(f =>
    `<tr>
      <td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;">${escapeHtml(f.name)}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;font-family:monospace;font-size:12px;white-space:nowrap;">${f.ms}ms</td>
      <td style="padding:8px 12px;border:1px solid #ddd;font-family:monospace;font-size:12px;">${escapeHtml(f.detail)}</td>
    </tr>`
  ).join('');

  // 경보 발송도 프로브와 같은 상한으로 묶는다. 이 경로는 실패했을 때만 타므로,
  // 이미 뭔가 아픈 상황에서 호출된다. 상한 없이 두면 경보 POST 하나가 연결 슬롯을
  // invocation 내내 붙잡을 수 있다 — 프로브에 상한을 둔 이유가 여기에도 그대로 적용된다.
  //
  // 단, 상한을 두면 이 fetch 는 이제 '던질 수 있다'. 이 함수는 지금까지 던지지 않는
  // 계약이었고 /selfcheck 는 try/catch 없이 호출한다. 계약을 유지한다 —
  // 경보를 못 보낸 것이 응답 자체를 깨뜨리면 진단이 더 어려워진다.
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      body: JSON.stringify({
        from: `${BRAND} <onboarding@resend.dev>`,
        to: [env.ALERT_EMAIL],
        subject: `[GWEH] 외부 의존성 이상 ${failures.length}건`,
        html: `<h2 style="font-family:sans-serif;">GWEH 셀프체크 실패</h2>
          <p style="font-family:sans-serif;color:#666;">${new Date().toISOString()}</p>
          <table style="border-collapse:collapse;font-family:sans-serif;">${rows}</table>
          <p style="font-family:sans-serif;color:#666;font-size:12px;">
            Gemini 가 <b>404 / not found / no longer available</b> 이면 모델 퇴역입니다.
            GEMINI_MODEL 환경변수만 교체하면 배포 없이 복구되지만,
            <b>Cloudflare Pages 와 이 Worker 양쪽에 각각 설정해야 합니다</b> —
            변수 저장소가 분리되어 있어 Worker 만 바꾸면 이 셀프체크는 통과하고 Pages Functions 는 계속 죽어 있습니다.<br>
            Gemini 가 <b>400 이면서 max_output_tokens / thinking</b> 을 언급하면 모델이 아니라
            셀프체크 프로브의 문제입니다. 모델을 바꾸지 마십시오 —
            worker.ts 의 Gemini 프로브 maxOutputTokens 값을 올려야 합니다.<br>
            <b>aborted due to timeout</b> 이면(소요 시간이 ${PROBE_TIMEOUT_MS}ms 근처) 죽은 것이 아니라
            느려진 것일 수 있습니다. 해당 서비스의 상태 페이지를 먼저 확인하고,
            평소에도 이 값에 가깝다면 PROBE_TIMEOUT_MS 를 올리십시오.<br>
            이 셀프체크가 검증하는 것은 <b>이 Worker 가 가진 자격증명뿐</b>이므로, 전부 통과하더라도
            Pages Functions 쪽 같은 이름의 변수들이 살아 있다는 뜻은 아닙니다.
          </p>`,
      }),
    });

    if (!res.ok) {
      console.error('Self-check alert email failed:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    // 타임아웃 포함. 여기까지 왔다는 것은 의존성도 아프고 경보 경로도 아프다는 뜻이다.
    // 남는 것은 Cloudflare 로그뿐이므로 실패 내역을 함께 남긴다.
    console.error('Self-check alert email threw:', err, JSON.stringify(failures));
    return false;
  }
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // 셀프체크는 하루 1회(UTC 0시)만. 그리고 무슨 일이 있어도 본래 cron 을 막지 않는다.
    // 감시 장치가 서비스를 죽이면 안 된다.
    //
    // try/catch 만으로는 그 약속을 지킬 수 없다. try/catch 는 '던져지는 것'을 잡지
    // '멈추는 것'을 잡지 못한다. 그래서 두 겹으로 막는다.
    //
    //   1. ctx.waitUntil — 아래 runDailyCron 은 셀프체크의 완료를 기다리지 않는다.
    //      순서상의 의존이 없으므로 셀프체크가 아무리 오래 걸려도 발송은 즉시 시작된다.
    //   2. 프로브별 AbortSignal.timeout — waitUntil 이 분리하지 못하는 자원이 하나
    //      남는다. Workers 는 invocation 당 동시 연결 6개가 상한인데, 이제 셀프체크와
    //      runDailyCron 이 그 슬롯을 '동시에' 나눠 쓴다. 멈춘 프로브가 슬롯을 계속
    //      붙잡으면 발송 쪽 fetch 가 큐에서 대기하게 된다. 그래서 각 프로브에 상한을
    //      둔다. 지연이 0 인 것이 아니라, 지연이 유한하고 짧게 묶여 있는 것이다.
    //
    // (compatibility_date = "2024-01-01" 에서 AbortSignal.timeout 동작 확인함)
    if (new Date().getUTCHours() === 0) {
      ctx.waitUntil((async () => {
        try {
          const results = await runSelfCheck(env);
          const failures = results.filter(r => !r.ok);
          if (failures.length > 0) {
            console.error('Self-check failures:', JSON.stringify(failures));
            await sendSelfCheckAlert(env, failures);
          } else {
            // 정상일 때는 메일을 보내지 않는다. 매일 오는 '정상' 알림은
            // 사흘이면 읽지 않게 되고, 그러면 감지 장치가 무력해진다.
            console.log('Self-check: all dependencies OK');
          }
        } catch (err) {
          console.error('Self-check itself threw:', err);
        }
      })());
    }

    await runDailyCron(env, false);
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // /test?force=true 로 수동 테스트 (시간 체크 무시)
    if (url.pathname === '/test') {
      const forceAll = url.searchParams.get('force') === 'true';
      const resend = url.searchParams.get('resend') === 'true';
      const regenerate = url.searchParams.get('regenerate') === 'true';
      const result = await runDailyCron(env, forceAll, resend, regenerate);
      return new Response(JSON.stringify({ result }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // /selfcheck 로 셀프체크만 수동 실행 (검증용)
    if (url.pathname === '/selfcheck') {
      const results = await runSelfCheck(env);
      const failures = results.filter(r => !r.ok);
      // notified: 경보가 실제로 나갔는가. 이 값이 없으면 '가짜 모델을 주입하고 경보가
      // 도착하는지 확인한다'는 검증이 자기 결과를 확인하려고 Cloudflare 로그 접근에
      // 의존하게 된다 — 검증 절차가 검증 대상보다 무거워진다.
      // 보낼 상황이 아니었으면(실패 0건이거나 notify 미지정) null: 실패와 구분된다.
      const notified =
        failures.length > 0 && url.searchParams.get('notify') === 'true'
          ? await sendSelfCheckAlert(env, failures)
          : null;
      return new Response(JSON.stringify({ results, failureCount: failures.length, notified }, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(`${BRAND} Daily Cron Worker`, { status: 200 });
  },
};
