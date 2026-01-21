const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';

// 날짜 포맷 헬퍼 함수 (js-hoist-regexp: 함수 외부로 호이스팅)
function formatDateForApi(date) {
  return date.toISOString().split('T')[0];
}

function getTimeRange24h() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return {
    startTime: formatDateForApi(yesterday),
    endTime: formatDateForApi(now),
  };
}

export async function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=kr`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('날씨 데이터를 가져올 수 없습니다');
  return response.json();
}

export async function fetchNasaApod() {
  const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('NASA 데이터를 가져올 수 없습니다');
  return response.json();
}

export async function fetchEarthquakes() {
  const { startTime, endTime } = getTimeRange24h();
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&minmagnitude=4`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('지진 데이터를 가져올 수 없습니다');
  return response.json();
}

export function calculateMoonPhase(date = new Date()) {
  // Metonic cycle calculation (간단한 달 위상 계산)
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let c, e, jd, b;

  if (month < 3) {
    c = year - 1;
    e = month + 12;
  } else {
    c = year;
    e = month;
  }

  jd = Math.floor(365.25 * c) + Math.floor(30.6001 * (e + 1)) + day - 694039.09;
  jd /= 29.5305882;
  b = parseInt(jd);
  jd -= b;
  const phase = Math.round(jd * 8);

  const phases = [
    { name: '새달', emoji: '🌑', value: 0 },
    { name: '초승달', emoji: '🌒', value: 1 },
    { name: '상현달', emoji: '🌓', value: 2 },
    { name: '상현망간', emoji: '🌔', value: 3 },
    { name: '보름달', emoji: '🌕', value: 4 },
    { name: '하현망간', emoji: '🌖', value: 5 },
    { name: '하현달', emoji: '🌗', value: 6 },
    { name: '그믐달', emoji: '🌘', value: 7 },
  ];

  const phaseIndex = phase % 8;
  const illumination = Math.abs(Math.cos(jd * 2 * Math.PI)) * 100;

  return {
    ...phases[phaseIndex],
    illumination: Math.round(illumination),
    phaseIndex,
    daysSinceNew: Math.round(jd * 29.5305882) % 30,
  };
}
