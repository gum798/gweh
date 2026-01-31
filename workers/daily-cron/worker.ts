// Daily Cron Worker - 매시간 실행, 사용자 위치 기반 로컬 06시에 발송
// wrangler.toml에서 [triggers] crons = ["0 * * * *"] 설정

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SANDBOX_ACCESS_TOKEN: string;
  POLAR_SANDBOX: string;
  GEMINI_API_KEY: string;
  RESEND_API_KEY: string;
  VITE_OPENWEATHER_API_KEY: string;
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

  if (weather) {
    if (weather.pressure > 1015) { score += 10; messages.push('안정된 기압이 평온한 기운을 가져옵니다'); }
    if (weather.pressure < 1005) { score -= 5; messages.push('변화하는 기압이 새로운 기회를 예고합니다'); }
    if (weather.clouds < 30) { score += 5; messages.push('맑은 하늘이 밝은 에너지를 전합니다'); }
  }

  if (moon) {
    if (moon.name === '보름달') { score += 15; messages.push('보름달의 강한 기운이 당신을 감쌉니다'); }
    if (moon.name === '새달') { score += 10; messages.push('새달이 새로운 시작을 축복합니다'); }
  }

  if (earthquake) {
    if (earthquake.count < 5) { score += 10; messages.push('고요한 대지가 안정을 선사합니다'); }
    if (earthquake.count > 15) { score -= 10; messages.push('활발한 대지의 움직임에 주의가 필요합니다'); }
  }

  score = Math.max(0, Math.min(100, score));
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`,
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

  try { return JSON.parse(text); } catch { return null; }
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`,
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
  try { return JSON.parse(text); } catch { return null; }
}

async function sendEmail(env: Env, to: string, omenMessage: string, styleData: any, energy: number, fortuneData?: any) {
  const energyLabel = energy >= 80 ? '대길 ✨' : energy >= 60 ? '길 🌟' : energy >= 40 ? '평 ☯️' : energy >= 20 ? '소흉 ⚡' : '흉 🌙';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#161022;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:-1px;">MYSTIC <span style="color:#5b13ec;">AI</span></h1>
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

    ${styleData ? `
    <!-- Style Card -->
    <div style="background:rgba(34,25,51,0.8);border:1px solid rgba(91,19,236,0.3);border-radius:16px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="font-size:20px;">👔</span>
        <span style="color:#fff;font-weight:bold;font-size:14px;">오늘의 스타일</span>
      </div>
      <p style="color:rgba(255,255,255,0.8);font-size:15px;font-style:italic;margin:0 0 12px;">"${styleData.headline}"</p>
      <p style="color:rgba(255,255,255,0.6);font-size:13px;line-height:1.6;margin:0 0 16px;">${styleData.style}</p>
      <div style="margin-bottom:12px;">
        <span style="color:rgba(255,255,255,0.4);font-size:11px;">추천 컬러: </span>
        ${(styleData.colors || []).map((c: string) => `<span style="color:#5b13ec;font-size:12px;background:rgba(91,19,236,0.1);padding:2px 8px;border-radius:12px;margin-right:4px;">${c}</span>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);">
        <div>
          <span style="color:rgba(255,255,255,0.4);font-size:11px;display:block;">포인트 아이템</span>
          <span style="color:#fff;font-size:13px;">${styleData.item}</span>
        </div>
        <div>
          <span style="color:rgba(255,255,255,0.4);font-size:11px;display:block;">스타일 팁</span>
          <span style="color:#fff;font-size:13px;">${styleData.tip}</span>
        </div>
      </div>
    </div>
    ` : ''}

    ${fortuneData ? `
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
      <a href="https://gweh.pages.dev" style="display:inline-block;background:#5b13ec;color:#fff;text-decoration:none;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:bold;">앱에서 자세히 보기</a>
      <p style="color:rgba(255,255,255,0.2);font-size:10px;margin-top:20px;text-transform:uppercase;letter-spacing:3px;">© MYSTIC AI</p>
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
      from: 'Mystic AI <onboarding@resend.dev>',
      to: [to],
      subject: `🔮 오늘의 운세 — ${new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Email send failed for ${to}:`, res.status, errText);
  }
  return res.ok;
}

async function runDailyCron(env: Env, forceAll = false) {
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

          if (row?.email_sent) { skipped++; continue; }

          // 7. Fetch weather
          const weather = await fetchWeather(lat, lon, env.VITE_OPENWEATHER_API_KEY);

          // 8. 기존 데이터 있으면 사용, 없으면 생성
          let omenMessage = row?.omen_message;
          let energyScore = row?.energy_score;
          let styleData = row?.style_data;

          if (!omenMessage) {
            const omen = generateSimpleOmen(weather, moon, earthquake);
            omenMessage = omen.message;
            energyScore = omen.energy;
          }

          if (!styleData) {
            styleData = await generateStyleWithGemini(env, omenMessage, energyScore ?? 50, weather, profile);
            console.log(`Style generated for ${email}: ${styleData ? 'OK' : 'FAILED'}`);
          }

          // 8-1. Fortune 데이터
          let fortuneData = row?.fortune_data;
          if (!fortuneData && (profile as any)?.birth_date) {
            const birthYear = (profile as any).birth_date.split('-')[0];
            fortuneData = await generateFortuneWithGemini(env, birthYear);
            console.log(`Fortune generated for ${email}: ${fortuneData ? 'OK' : 'FAILED'}`);
          }

          // 10. Save to daily_readings (upsert)
          await supabaseRest(env, 'daily_readings', {
            method: 'POST',
            body: JSON.stringify({
              user_id: userId,
              reading_date: localDate,
              omen_message: omenMessage,
              energy_score: energyScore,
              style_data: styleData,
              fortune_data: fortuneData,
              email_sent: true,
            }),
            headers: { 'Prefer': 'resolution=merge-duplicates' },
          });

          // 11. Send email
          await sendEmail(env, email, omenMessage, styleData, energyScore ?? 50, fortuneData);

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

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    await runDailyCron(env, false);
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // /test?force=true 로 수동 테스트 (시간 체크 무시)
    if (url.pathname === '/test') {
      const forceAll = url.searchParams.get('force') === 'true';
      const result = await runDailyCron(env, forceAll);
      return new Response(JSON.stringify({ result }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Mystic Daily Cron Worker', { status: 200 });
  },
};
