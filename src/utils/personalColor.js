// RGB를 HSL로 변환
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// 피부톤 분석
export function analyzeSkinTone(skinSamples) {
  if (!skinSamples || skinSamples.length === 0) {
    return null;
  }

  // 평균 피부색 계산
  const avgR = Math.round(skinSamples.reduce((s, sample) => s + sample.color.r, 0) / skinSamples.length);
  const avgG = Math.round(skinSamples.reduce((s, sample) => s + sample.color.g, 0) / skinSamples.length);
  const avgB = Math.round(skinSamples.reduce((s, sample) => s + sample.color.b, 0) / skinSamples.length);

  const avgColor = { r: avgR, g: avgG, b: avgB };
  const hsl = rgbToHsl(avgR, avgG, avgB);

  // 웜톤/쿨톤 판정
  // 웜톤: 노란기가 강함 (R > B), 쿨톤: 붉은기/푸른기가 강함 (R <= B 또는 핑크빛)
  const yellowness = avgR - avgB;
  const warmth = yellowness + (avgG - avgB) * 0.5;

  const isWarm = warmth > 15;

  // 명도와 채도로 계절 분류
  const brightness = hsl.l;
  const saturation = hsl.s;

  let season, seasonKorean, colorPalette, characteristics;

  if (isWarm) {
    if (brightness >= 55 && saturation >= 30) {
      // 봄 웜톤: 밝고 선명
      season = 'spring';
      seasonKorean = '봄 웜톤';
      colorPalette = ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4ECDC4'];
      characteristics = '밝고 화사한 기운이 감도는 상입니다. 따스한 봄볕처럼 생기가 넘칩니다.';
    } else {
      // 가을 웜톤: 깊고 뮤트
      season = 'autumn';
      seasonKorean = '가을 웜톤';
      colorPalette = ['#D35400', '#E67E22', '#8B4513', '#556B2F', '#704214'];
      characteristics = '깊고 풍요로운 기운이 서린 상입니다. 가을 단풍처럼 성숙한 매력이 있습니다.';
    }
  } else {
    if (brightness >= 55 && saturation <= 40) {
      // 여름 쿨톤: 부드럽고 뮤트
      season = 'summer';
      seasonKorean = '여름 쿨톤';
      colorPalette = ['#DDA0DD', '#B0C4DE', '#87CEEB', '#98D8C8', '#F0E6FA'];
      characteristics = '부드럽고 우아한 기운이 흐르는 상입니다. 여름 안개처럼 은은한 매력이 있습니다.';
    } else {
      // 겨울 쿨톤: 선명하고 대비 강함
      season = 'winter';
      seasonKorean = '겨울 쿨톤';
      colorPalette = ['#E91E63', '#9C27B0', '#00BCD4', '#212121', '#FFFFFF'];
      characteristics = '선명하고 강렬한 기운이 넘치는 상입니다. 겨울 설경처럼 또렷한 매력이 있습니다.';
    }
  }

  return {
    season,
    seasonKorean,
    isWarm,
    colorPalette,
    characteristics,
    avgColor,
    hsl,
    analysis: {
      brightness: brightness >= 55 ? '밝은' : '깊은',
      saturation: saturation >= 40 ? '선명한' : '부드러운',
      undertone: isWarm ? '따스한 노란 기운' : '차분한 푸른 기운',
    },
  };
}

// 퍼스널 컬러 해석 메시지
const seasonOmens = {
  spring: [
    '봄날의 꽃처럼 생기 넘치는 기운이 그대에게 깃들었도다.',
    '따스한 봄볕을 머금은 상이니, 밝은 색으로 기운을 더하라.',
    '새싹이 움트듯 그대의 매력도 날로 피어오르리라.',
  ],
  summer: [
    '여름 안개처럼 신비로운 기운이 그대를 감싸도다.',
    '부드러운 달빛을 닮은 상이니, 은은한 색이 그대를 빛내리라.',
    '맑은 물처럼 깨끗한 기운이 사람을 끌어당기리라.',
  ],
  autumn: [
    '가을 단풍처럼 깊고 풍요로운 기운이 그대에게 있도다.',
    '대지의 따스함을 품은 상이니, 자연의 색이 그대와 어우러지리라.',
    '익어가는 열매처럼 성숙한 매력이 돋보이는 상이로다.',
  ],
  winter: [
    '겨울 밤하늘처럼 선명하고 신비로운 기운이 그대에게 있도다.',
    '눈처럼 맑은 상이니, 또렷한 색이 그대의 빛을 더하리라.',
    '차가운 달빛을 품었으니, 강렬한 매력이 세상을 사로잡으리라.',
  ],
};

export function getPersonalColorOmen(season) {
  const omens = seasonOmens[season];
  return omens[Math.floor(Math.random() * omens.length)];
}

// 추천 컬러 팁
export const colorTips = {
  spring: {
    best: '코랄, 피치, 밝은 오렌지, 연두, 밝은 청록',
    avoid: '회색, 검정, 탁한 색',
    makeup: '복숭아빛 블러셔, 오렌지 립, 골드 하이라이터',
    fashion: '밝고 화사한 파스텔, 비비드 컬러',
  },
  summer: {
    best: '라벤더, 로즈, 소프트 핑크, 스카이 블루, 민트',
    avoid: '오렌지, 강한 노랑, 카키',
    makeup: '로즈 블러셔, 핑크 립, 실버 펄',
    fashion: '부드럽고 뮤트된 파스텔, 그레이시 톤',
  },
  autumn: {
    best: '테라코타, 올리브, 머스타드, 카멜, 브릭',
    avoid: '파스텔, 밝은 핑크, 실버',
    makeup: '브릭 블러셔, 브라운 립, 브론즈 하이라이터',
    fashion: '자연스러운 어스 톤, 깊은 색감',
  },
  winter: {
    best: '퓨시아, 로얄 블루, 에메랄드, 순백, 블랙',
    avoid: '오렌지, 베이지, 파스텔',
    makeup: '핑크 블러셔, 레드 립, 쿨 하이라이터',
    fashion: '선명한 비비드, 모노톤, 강한 대비',
  },
};
