import i18next from 'i18next';

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
      seasonKorean = i18next.t('face:season.spring');
      colorPalette = ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4ECDC4'];
      characteristics = i18next.t('face:characteristics.spring');
    } else {
      // 가을 웜톤: 깊고 뮤트
      season = 'autumn';
      seasonKorean = i18next.t('face:season.autumn');
      colorPalette = ['#D35400', '#E67E22', '#8B4513', '#556B2F', '#704214'];
      characteristics = i18next.t('face:characteristics.autumn');
    }
  } else {
    if (brightness >= 55 && saturation <= 40) {
      // 여름 쿨톤: 부드럽고 뮤트
      season = 'summer';
      seasonKorean = i18next.t('face:season.summer');
      colorPalette = ['#DDA0DD', '#B0C4DE', '#87CEEB', '#98D8C8', '#F0E6FA'];
      characteristics = i18next.t('face:characteristics.summer');
    } else {
      // 겨울 쿨톤: 선명하고 대비 강함
      season = 'winter';
      seasonKorean = i18next.t('face:season.winter');
      colorPalette = ['#E91E63', '#9C27B0', '#00BCD4', '#212121', '#FFFFFF'];
      characteristics = i18next.t('face:characteristics.winter');
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
      brightness: brightness >= 55 ? i18next.t('face:analysis.bright') : i18next.t('face:analysis.deep'),
      saturation: saturation >= 40 ? i18next.t('face:analysis.vivid') : i18next.t('face:analysis.soft'),
      undertone: isWarm ? i18next.t('face:analysis.warmUndertone') : i18next.t('face:analysis.coolUndertone'),
    },
  };
}

// 퍼스널 컬러 해석 메시지
function getSeasonOmens(season: string): string[] {
  const seasonOmens = {
    spring: [
      i18next.t('face:seasonOmen.spring.0'),
      i18next.t('face:seasonOmen.spring.1'),
      i18next.t('face:seasonOmen.spring.2'),
    ],
    summer: [
      i18next.t('face:seasonOmen.summer.0'),
      i18next.t('face:seasonOmen.summer.1'),
      i18next.t('face:seasonOmen.summer.2'),
    ],
    autumn: [
      i18next.t('face:seasonOmen.autumn.0'),
      i18next.t('face:seasonOmen.autumn.1'),
      i18next.t('face:seasonOmen.autumn.2'),
    ],
    winter: [
      i18next.t('face:seasonOmen.winter.0'),
      i18next.t('face:seasonOmen.winter.1'),
      i18next.t('face:seasonOmen.winter.2'),
    ],
  };

  return seasonOmens[season] || [];
}

export function getPersonalColorOmen(season) {
  const omens = getSeasonOmens(season);
  return omens[Math.floor(Math.random() * omens.length)];
}

// 추천 컬러 팁
function getColorTips() {
  return {
    spring: {
      best: i18next.t('face:colorTips.spring.best'),
      avoid: i18next.t('face:colorTips.spring.avoid'),
      makeup: i18next.t('face:colorTips.spring.makeup'),
      fashion: i18next.t('face:colorTips.spring.fashion'),
    },
    summer: {
      best: i18next.t('face:colorTips.summer.best'),
      avoid: i18next.t('face:colorTips.summer.avoid'),
      makeup: i18next.t('face:colorTips.summer.makeup'),
      fashion: i18next.t('face:colorTips.summer.fashion'),
    },
    autumn: {
      best: i18next.t('face:colorTips.autumn.best'),
      avoid: i18next.t('face:colorTips.autumn.avoid'),
      makeup: i18next.t('face:colorTips.autumn.makeup'),
      fashion: i18next.t('face:colorTips.autumn.fashion'),
    },
    winter: {
      best: i18next.t('face:colorTips.winter.best'),
      avoid: i18next.t('face:colorTips.winter.avoid'),
      makeup: i18next.t('face:colorTips.winter.makeup'),
      fashion: i18next.t('face:colorTips.winter.fashion'),
    },
  };
}

export const colorTips = getColorTips();
