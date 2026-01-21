// 점술 해석 생성 로직

const pressureOmens = {
  high: [
    "기압이 높아 우주의 기운이 안정되어 있습니다.",
    "높은 기압이 맑은 결정을 이끌어낼 것입니다.",
    "하늘이 내려앉은 듯 기압이 높으니, 차분히 사색하기 좋은 날입니다.",
  ],
  normal: [
    "기압이 평온하니 균형 잡힌 하루가 펼쳐질 것입니다.",
    "대기의 기운이 조화롭습니다.",
  ],
  low: [
    "기압이 낮아 변화의 바람이 불고 있습니다.",
    "낮은 기압은 새로운 기회의 전조입니다.",
    "대기가 동요하니 직감을 믿으세요.",
  ],
};

const moonOmens = {
  새달: [
    "새달의 어둠 속에서 새로운 시작이 잉태되고 있습니다.",
    "달이 숨은 밤, 내면의 목소리에 귀 기울이세요.",
  ],
  초승달: [
    "초승달의 가는 빛이 희망의 씨앗을 비춥니다.",
    "달이 차오르기 시작하니 계획을 세우기 좋은 때입니다.",
  ],
  상현달: [
    "상현달이 절반의 진실을 드러냅니다. 결단의 시간입니다.",
    "달이 반쪽을 보이니 선택의 기로에 서게 될 것입니다.",
  ],
  상현망간: [
    "달이 차오르며 에너지가 상승하고 있습니다.",
    "거의 다 찬 달이 성취의 순간이 가까워옴을 알립니다.",
  ],
  보름달: [
    "보름달의 충만한 빛 아래, 숨겨진 것들이 드러납니다.",
    "달이 가득 찼으니 감정이 고조될 수 있습니다. 평정심을 유지하세요.",
    "만월의 기운이 직관력을 높여줍니다.",
  ],
  하현망간: [
    "달이 기울기 시작하니 정리하고 비울 때입니다.",
    "이제 거두어들일 시간입니다.",
  ],
  하현달: [
    "하현달이 성찰의 시간을 선물합니다.",
    "반쪽 달이 과거를 돌아보게 합니다.",
  ],
  그믐달: [
    "그믐달이 한 주기의 끝을 알립니다. 휴식을 취하세요.",
    "달이 사라져가니 불필요한 것을 놓아주세요.",
  ],
};

const earthquakeOmens = {
  quiet: [
    "대지가 고요합니다. 안정의 기운이 감돕니다.",
    "지구가 평화로이 숨쉬고 있습니다.",
  ],
  moderate: [
    "대지가 미세하게 움직이고 있습니다.",
    "땅 아래 에너지가 흐르고 있으니 중요한 결정은 신중히 하세요.",
  ],
  active: [
    "대지가 활발히 움직이고 있습니다. 변화의 기운이 강합니다.",
    "지각이 동요하니 큰 결정은 며칠 미루는 것이 좋겠습니다.",
    "땅의 용틀임이 감지됩니다. 유연하게 대처하세요.",
  ],
};

const weatherOmens = {
  clear: [
    "맑은 하늘이 밝은 전망을 예고합니다.",
    "구름 한 점 없는 하늘은 명료한 판단을 돕습니다.",
  ],
  clouds: [
    "구름이 하늘을 수놓으니 상상력이 풍부해지는 날입니다.",
    "구름 사이로 빛이 비치듯, 작은 희망을 놓치지 마세요.",
  ],
  rain: [
    "비가 대지를 적시니 정화의 기운이 흐릅니다.",
    "빗소리에 마음을 맡기세요. 내면의 목소리가 들릴 것입니다.",
  ],
  snow: [
    "눈이 세상을 덮으니 새로운 시작을 준비할 때입니다.",
    "하얀 눈은 순수한 의도를 상징합니다.",
  ],
  storm: [
    "폭풍이 지나가고 있습니다. 이 또한 지나가리라.",
    "격렬한 기운이 감돕니다만, 폭풍 뒤엔 무지개가 있습니다.",
  ],
};

const combinationOmens = [
  {
    condition: (w, m, e) => w?.pressure > 1020 && m?.name === '보름달' && e?.count < 5,
    message: "높은 기압과 보름달, 고요한 대지... 오늘은 우주가 당신 편입니다. 용기 내어 행동하세요.",
    type: 'excellent',
  },
  {
    condition: (w, m, e) => w?.pressure < 1000 && e?.count > 10,
    message: "낮은 기압과 활발한 지각 활동... 오늘은 관망하며 에너지를 축적하세요.",
    type: 'caution',
  },
  {
    condition: (w, m, e) => m?.name === '새달' && w?.clouds < 20,
    message: "새달의 밤, 맑은 하늘 아래 새로운 의도를 품기에 완벽한 시간입니다.",
    type: 'new_beginnings',
  },
  {
    condition: (w, m, e) => m?.illumination > 80 && w?.visibility > 8000,
    message: "밝은 달과 높은 가시성... 오늘 밤 진실이 명확해질 것입니다.",
    type: 'clarity',
  },
  {
    condition: (w, m, e) => e?.maxMagnitude > 5.5,
    message: "대지 깊은 곳에서 강한 움직임이 있었습니다. 기반을 다지는 일에 집중하세요.",
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
        message: combo.message,
        type: combo.type,
      };
      break;
    }
  }

  // 개별 요소별 해석
  if (weather) {
    const pressureReading = getPressureReading(weather.pressure);
    omens.push({
      category: '대기',
      message: getRandomElement(pressureOmens[pressureReading]),
      icon: '🌡️',
    });

    const weatherCondition = getWeatherCondition(weather.description);
    omens.push({
      category: '날씨',
      message: getRandomElement(weatherOmens[weatherCondition]),
      icon: '🌤️',
    });
  }

  if (moon) {
    omens.push({
      category: '달',
      message: getRandomElement(moonOmens[moon.name] || moonOmens['보름달']),
      icon: moon.emoji,
    });
  }

  if (earthquake) {
    const earthquakeLevel = getEarthquakeLevel(earthquake.count);
    omens.push({
      category: '대지',
      message: getRandomElement(earthquakeOmens[earthquakeLevel]),
      icon: '🌍',
    });
  }

  // 메인 징조가 없으면 생성
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

  if (weather?.pressure > 1015) factors.push('안정된 기압');
  else if (weather?.pressure < 1005) factors.push('변화하는 기압');

  if (moon?.illumination > 70) factors.push('밝은 달빛');
  else if (moon?.illumination < 30) factors.push('어두운 밤하늘');

  if (earthquake?.count > 10) factors.push('활발한 지각 활동');
  else if (earthquake?.count < 3) factors.push('고요한 대지');

  if (factors.length === 0) {
    return "우주와 대지가 평온한 균형을 이루고 있습니다. 자연의 흐름에 몸을 맡기세요.";
  }

  const joined = factors.join('과 ');
  return `${joined}이 어우러진 오늘, 하늘과 땅의 기운이 당신의 직감을 높여줄 것입니다.`;
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
  if (energy >= 80) return { label: '매우 좋음', color: 'text-green-400' };
  if (energy >= 60) return { label: '좋음', color: 'text-emerald-400' };
  if (energy >= 40) return { label: '보통', color: 'text-yellow-400' };
  if (energy >= 20) return { label: '주의', color: 'text-orange-400' };
  return { label: '신중', color: 'text-red-400' };
}
