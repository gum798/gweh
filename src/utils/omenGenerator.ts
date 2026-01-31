// 점술 해석 생성 로직
import i18next from 'i18next';

// Mapping from Korean moon names to English keys
const moonNameToKey = {
  '새달': 'newMoon',
  '초승달': 'waxingCrescent',
  '상현달': 'firstQuarter',
  '상현망간': 'waxingGibbous',
  '보름달': 'fullMoon',
  '하현망간': 'waningGibbous',
  '하현달': 'lastQuarter',
  '그믐달': 'waningCrescent',
};

const pressureOmens = {
  high: [
    'omen:pressure.high.0',
    'omen:pressure.high.1',
    'omen:pressure.high.2',
  ],
  normal: [
    'omen:pressure.normal.0',
    'omen:pressure.normal.1',
  ],
  low: [
    'omen:pressure.low.0',
    'omen:pressure.low.1',
    'omen:pressure.low.2',
  ],
};

const moonOmens = {
  newMoon: [
    'omen:moon.newMoon.0',
    'omen:moon.newMoon.1',
  ],
  waxingCrescent: [
    'omen:moon.waxingCrescent.0',
    'omen:moon.waxingCrescent.1',
  ],
  firstQuarter: [
    'omen:moon.firstQuarter.0',
    'omen:moon.firstQuarter.1',
  ],
  waxingGibbous: [
    'omen:moon.waxingGibbous.0',
    'omen:moon.waxingGibbous.1',
  ],
  fullMoon: [
    'omen:moon.fullMoon.0',
    'omen:moon.fullMoon.1',
    'omen:moon.fullMoon.2',
  ],
  waningGibbous: [
    'omen:moon.waningGibbous.0',
    'omen:moon.waningGibbous.1',
  ],
  lastQuarter: [
    'omen:moon.lastQuarter.0',
    'omen:moon.lastQuarter.1',
  ],
  waningCrescent: [
    'omen:moon.waningCrescent.0',
    'omen:moon.waningCrescent.1',
  ],
};

const earthquakeOmens = {
  quiet: [
    'omen:earthquake.quiet.0',
    'omen:earthquake.quiet.1',
  ],
  moderate: [
    'omen:earthquake.moderate.0',
    'omen:earthquake.moderate.1',
  ],
  active: [
    'omen:earthquake.active.0',
    'omen:earthquake.active.1',
    'omen:earthquake.active.2',
  ],
};

const weatherOmens = {
  clear: [
    'omen:weather.clear.0',
    'omen:weather.clear.1',
  ],
  clouds: [
    'omen:weather.clouds.0',
    'omen:weather.clouds.1',
  ],
  rain: [
    'omen:weather.rain.0',
    'omen:weather.rain.1',
  ],
  snow: [
    'omen:weather.snow.0',
    'omen:weather.snow.1',
  ],
  storm: [
    'omen:weather.storm.0',
    'omen:weather.storm.1',
  ],
};

const combinationOmens = [
  {
    condition: (w, m, e) => w?.pressure > 1020 && m?.name === '보름달' && e?.count < 5,
    message: 'omen:combo.excellent',
    type: 'excellent',
  },
  {
    condition: (w, m, e) => w?.pressure < 1000 && e?.count > 10,
    message: 'omen:combo.caution',
    type: 'caution',
  },
  {
    condition: (w, m, e) => m?.name === '새달' && w?.clouds < 20,
    message: 'omen:combo.newBeginnings',
    type: 'new_beginnings',
  },
  {
    condition: (w, m, e) => m?.illumination > 80 && w?.visibility > 8000,
    message: 'omen:combo.clarity',
    type: 'clarity',
  },
  {
    condition: (w, m, e) => e?.maxMagnitude > 5.5,
    message: 'omen:combo.grounding',
    type: 'grounding',
  },
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPressureReading(pressure) {
  if (pressure > 1020) return 'high';
  if (pressure < 1000) return 'low';
  return 'normal';
}

function getWeatherCondition(description) {
  const desc = description?.toLowerCase() || '';
  if (desc.includes('clear') || desc.includes('맑음')) return 'clear';
  if (desc.includes('rain') || desc.includes('비')) return 'rain';
  if (desc.includes('snow') || desc.includes('눈')) return 'snow';
  if (desc.includes('storm') || desc.includes('thunder') || desc.includes('뇌우')) return 'storm';
  return 'clouds';
}

function getEarthquakeLevel(count) {
  if (count < 5) return 'quiet';
  if (count < 15) return 'moderate';
  return 'active';
}

export function generateOmen(weather, moon, earthquake) {
  const omens = [];
  let mainOmen = null;

  // 복합 조건 확인
  for (const combo of combinationOmens) {
    if (combo.condition(weather, moon, earthquake)) {
      mainOmen = {
        message: i18next.t(combo.message),
        type: combo.type,
      };
      break;
    }
  }

  // 개별 요소별 해석
  if (weather) {
    const pressureReading = getPressureReading(weather.pressure);
    omens.push({
      category: i18next.t('omen:category.atmosphere'),
      message: i18next.t(getRandomElement(pressureOmens[pressureReading])),
      icon: '🌡️',
    });

    const weatherCondition = getWeatherCondition(weather.description);
    omens.push({
      category: i18next.t('omen:category.weather'),
      message: i18next.t(getRandomElement(weatherOmens[weatherCondition])),
      icon: '🌤️',
    });
  }

  if (moon) {
    const moonKey = moonNameToKey[moon.name] || 'fullMoon';
    omens.push({
      category: i18next.t('omen:category.moon'),
      message: i18next.t(getRandomElement(moonOmens[moonKey])),
      icon: moon.emoji,
    });
  }

  if (earthquake) {
    const earthquakeLevel = getEarthquakeLevel(earthquake.count);
    omens.push({
      category: i18next.t('omen:category.earth'),
      message: i18next.t(getRandomElement(earthquakeOmens[earthquakeLevel])),
      icon: '🌍',
    });
  }

  // 메인 괘가 없으면 생성
  if (!mainOmen) {
    mainOmen = {
      message: generateSummaryOmen(weather, moon, earthquake),
      type: 'neutral',
    };
  }

  return {
    main: mainOmen,
    details: omens,
    timestamp: new Date(),
  };
}

function generateSummaryOmen(weather, moon, earthquake) {
  const factors = [];

  if (weather?.pressure > 1015) factors.push(i18next.t('omen:summary.stablePressure'));
  else if (weather?.pressure < 1005) factors.push(i18next.t('omen:summary.changingPressure'));

  if (moon?.illumination > 70) factors.push(i18next.t('omen:summary.brightMoon'));
  else if (moon?.illumination < 30) factors.push(i18next.t('omen:summary.darkSky'));

  if (earthquake?.count > 10) factors.push(i18next.t('omen:summary.activeEarth'));
  else if (earthquake?.count < 3) factors.push(i18next.t('omen:summary.quietEarth'));

  if (factors.length === 0) {
    return i18next.t('omen:summary.default');
  }

  const joined = factors.join(i18next.t('omen:summary.connector'));
  return i18next.t('omen:summary.template', { factors: joined });
}

export function getOverallEnergy(weather, moon, earthquake) {
  let score = 50;

  if (weather) {
    if (weather.pressure > 1015) score += 10;
    if (weather.pressure < 1005) score -= 5;
    if (weather.clouds < 30) score += 5;
  }

  if (moon) {
    if (moon.name === '보름달') score += 15;
    if (moon.name === '새달') score += 10;
    if (moon.illumination > 80) score += 5;
  }

  if (earthquake) {
    if (earthquake.count < 5) score += 10;
    if (earthquake.count > 15) score -= 10;
    if (earthquake.maxMagnitude > 6) score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

export function getEnergyLabel(energy) {
  if (energy >= 80) return { label: i18next.t('common:energy.excellent'), color: 'text-green-400' };
  if (energy >= 60) return { label: i18next.t('common:energy.good'), color: 'text-emerald-400' };
  if (energy >= 40) return { label: i18next.t('common:energy.moderate'), color: 'text-yellow-400' };
  if (energy >= 20) return { label: i18next.t('common:energy.caution'), color: 'text-orange-400' };
  return { label: i18next.t('common:energy.careful'), color: 'text-red-400' };
}
