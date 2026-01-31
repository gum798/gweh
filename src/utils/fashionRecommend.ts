// 체형 분석 및 패션 스타일 추천
import i18next from 'i18next';

export interface BodyInfo {
  height: number; // cm
  weight: number; // kg
}

export interface BodyAnalysis {
  bmi: number;
  bmiCategory: string;
  bodyType: string;
  bodyTypeKorean: string;
}

export interface FashionRecommendation {
  mainMessage: string;
  bodyAnalysis: BodyAnalysis;
  styles: StyleRecommendation[];
  colors: ColorRecommendation;
  tips: string[];
  avoid: string[];
}

export interface StyleRecommendation {
  category: string;
  items: string[];
  description: string;
  icon: string;
}

export interface ColorRecommendation {
  recommended: string[];
  avoid: string[];
  description: string;
}

// BMI 계산 및 체형 분류
export function analyzeBody(info: BodyInfo): BodyAnalysis {
  const heightM = info.height / 100;
  const bmi = info.weight / (heightM * heightM);

  let bmiCategory: string;
  if (bmi < 18.5) {
    bmiCategory = 'underweight';
  } else if (bmi < 23) {
    bmiCategory = 'normal';
  } else if (bmi < 25) {
    bmiCategory = 'overweight';
  } else {
    bmiCategory = 'obese';
  }

  // 체형 분류 (키와 BMI 조합) - 성별 중립
  let bodyType: string;
  let bodyTypeKorean: string;

  if (info.height >= 175) {
    if (bmi < 22) {
      bodyType = 'tallSlim';
      bodyTypeKorean = i18next.t('fashion:bodyType.tallSlim');
    } else {
      bodyType = 'tallLarge';
      bodyTypeKorean = i18next.t('fashion:bodyType.tallLarge');
    }
  } else if (info.height >= 165) {
    if (bmi < 20) {
      bodyType = 'averageSlim';
      bodyTypeKorean = i18next.t('fashion:bodyType.averageSlim');
    } else if (bmi < 24) {
      bodyType = 'averageNormal';
      bodyTypeKorean = i18next.t('fashion:bodyType.averageNormal');
    } else {
      bodyType = 'averageLarge';
      bodyTypeKorean = i18next.t('fashion:bodyType.averageLarge');
    }
  } else {
    if (bmi < 22) {
      bodyType = 'shortSlim';
      bodyTypeKorean = i18next.t('fashion:bodyType.shortSlim');
    } else {
      bodyType = 'shortLarge';
      bodyTypeKorean = i18next.t('fashion:bodyType.shortLarge');
    }
  }

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmiCategory,
    bodyType,
    bodyTypeKorean,
  };
}

// 패션 추천 생성
export function generateFashionRecommendation(
  bodyInfo: BodyInfo,
  bodyAnalysis: BodyAnalysis
): FashionRecommendation {
  const { bodyType } = bodyAnalysis;

  // 체형별 메인 메시지
  const mainMessage = getMainMessage(bodyType);

  // 체형별 스타일 추천
  const styleRecommendations = getStyleRecommendations(bodyType);
  const colorRecommendation = getColorRecommendation(bodyType);
  const tips = getTips(bodyType);
  const avoid = getAvoid(bodyType);

  return {
    mainMessage,
    bodyAnalysis,
    styles: styleRecommendations,
    colors: colorRecommendation,
    tips,
    avoid,
  };
}

function getMainMessage(bodyType: string): string {
  const key = `fashion:mainMessage.${bodyType}`;
  const message = i18next.t(key);

  // If translation key doesn't exist, return default
  if (message === key) {
    return i18next.t('fashion:mainMessage.default');
  }

  return message;
}

function getStyleRecommendations(bodyType: string): StyleRecommendation[] {
  const styles: Record<string, () => StyleRecommendation[]> = {
    tallSlim: () => [
      {
        category: i18next.t('fashion:styleCategory.tops'),
        items: i18next.t('fashion:style.tallSlim.tops.items').split(', '),
        description: i18next.t('fashion:style.tallSlim.tops.desc'),
        icon: '👕',
      },
      {
        category: i18next.t('fashion:styleCategory.bottoms'),
        items: i18next.t('fashion:style.tallSlim.bottoms.items').split(', '),
        description: i18next.t('fashion:style.tallSlim.bottoms.desc'),
        icon: '👖',
      },
      {
        category: i18next.t('fashion:styleCategory.style'),
        items: i18next.t('fashion:style.tallSlim.style.items').split(', '),
        description: i18next.t('fashion:style.tallSlim.style.desc'),
        icon: '✨',
      },
    ],
    tallLarge: () => [
      {
        category: i18next.t('fashion:styleCategory.tops'),
        items: i18next.t('fashion:style.tallLarge.tops.items').split(', '),
        description: i18next.t('fashion:style.tallLarge.tops.desc'),
        icon: '👕',
      },
      {
        category: i18next.t('fashion:styleCategory.bottoms'),
        items: i18next.t('fashion:style.tallLarge.bottoms.items').split(', '),
        description: i18next.t('fashion:style.tallLarge.bottoms.desc'),
        icon: '👖',
      },
      {
        category: i18next.t('fashion:styleCategory.style'),
        items: i18next.t('fashion:style.tallLarge.style.items').split(', '),
        description: i18next.t('fashion:style.tallLarge.style.desc'),
        icon: '✨',
      },
    ],
    averageSlim: () => [
      {
        category: i18next.t('fashion:styleCategory.tops'),
        items: i18next.t('fashion:style.averageSlim.tops.items').split(', '),
        description: i18next.t('fashion:style.averageSlim.tops.desc'),
        icon: '👕',
      },
      {
        category: i18next.t('fashion:styleCategory.bottoms'),
        items: i18next.t('fashion:style.averageSlim.bottoms.items').split(', '),
        description: i18next.t('fashion:style.averageSlim.bottoms.desc'),
        icon: '👖',
      },
      {
        category: i18next.t('fashion:styleCategory.style'),
        items: i18next.t('fashion:style.averageSlim.style.items').split(', '),
        description: i18next.t('fashion:style.averageSlim.style.desc'),
        icon: '✨',
      },
    ],
    averageNormal: () => [
      {
        category: i18next.t('fashion:styleCategory.tops'),
        items: i18next.t('fashion:style.averageNormal.tops.items').split(', '),
        description: i18next.t('fashion:style.averageNormal.tops.desc'),
        icon: '👕',
      },
      {
        category: i18next.t('fashion:styleCategory.bottoms'),
        items: i18next.t('fashion:style.averageNormal.bottoms.items').split(', '),
        description: i18next.t('fashion:style.averageNormal.bottoms.desc'),
        icon: '👖',
      },
      {
        category: i18next.t('fashion:styleCategory.style'),
        items: i18next.t('fashion:style.averageNormal.style.items').split(', '),
        description: i18next.t('fashion:style.averageNormal.style.desc'),
        icon: '✨',
      },
    ],
    averageLarge: () => [
      {
        category: i18next.t('fashion:styleCategory.tops'),
        items: i18next.t('fashion:style.averageLarge.tops.items').split(', '),
        description: i18next.t('fashion:style.averageLarge.tops.desc'),
        icon: '👕',
      },
      {
        category: i18next.t('fashion:styleCategory.bottoms'),
        items: i18next.t('fashion:style.averageLarge.bottoms.items').split(', '),
        description: i18next.t('fashion:style.averageLarge.bottoms.desc'),
        icon: '👖',
      },
      {
        category: i18next.t('fashion:styleCategory.style'),
        items: i18next.t('fashion:style.averageLarge.style.items').split(', '),
        description: i18next.t('fashion:style.averageLarge.style.desc'),
        icon: '✨',
      },
    ],
    shortSlim: () => [
      {
        category: i18next.t('fashion:styleCategory.tops'),
        items: i18next.t('fashion:style.shortSlim.tops.items').split(', '),
        description: i18next.t('fashion:style.shortSlim.tops.desc'),
        icon: '👕',
      },
      {
        category: i18next.t('fashion:styleCategory.bottoms'),
        items: i18next.t('fashion:style.shortSlim.bottoms.items').split(', '),
        description: i18next.t('fashion:style.shortSlim.bottoms.desc'),
        icon: '👖',
      },
      {
        category: i18next.t('fashion:styleCategory.style'),
        items: i18next.t('fashion:style.shortSlim.style.items').split(', '),
        description: i18next.t('fashion:style.shortSlim.style.desc'),
        icon: '✨',
      },
    ],
    shortLarge: () => [
      {
        category: i18next.t('fashion:styleCategory.tops'),
        items: i18next.t('fashion:style.shortLarge.tops.items').split(', '),
        description: i18next.t('fashion:style.shortLarge.tops.desc'),
        icon: '👕',
      },
      {
        category: i18next.t('fashion:styleCategory.bottoms'),
        items: i18next.t('fashion:style.shortLarge.bottoms.items').split(', '),
        description: i18next.t('fashion:style.shortLarge.bottoms.desc'),
        icon: '👖',
      },
      {
        category: i18next.t('fashion:styleCategory.style'),
        items: i18next.t('fashion:style.shortLarge.style.items').split(', '),
        description: i18next.t('fashion:style.shortLarge.style.desc'),
        icon: '✨',
      },
    ],
  };

  const styleFactory = styles[bodyType] || styles.averageNormal;
  return styleFactory();
}

function getColorRecommendation(bodyType: string): ColorRecommendation {
  const slimTypes = ['tallSlim', 'averageSlim', 'shortSlim'];
  const largeTypes = ['tallLarge', 'averageLarge', 'shortLarge'];

  if (slimTypes.includes(bodyType)) {
    return {
      recommended: i18next.t('fashion:color.slim.recommended').split(', '),
      avoid: [],
      description: i18next.t('fashion:color.slim.desc'),
    };
  }

  if (largeTypes.includes(bodyType)) {
    return {
      recommended: i18next.t('fashion:color.large.recommended').split(', '),
      avoid: i18next.t('fashion:color.large.avoid').split(', '),
      description: i18next.t('fashion:color.large.desc'),
    };
  }

  return {
    recommended: i18next.t('fashion:color.normal.recommended').split(', '),
    avoid: [],
    description: i18next.t('fashion:color.normal.desc'),
  };
}

function getTips(bodyType: string): string[] {
  const tips: string[] = [];

  // Try to get up to 3 tips for the body type
  for (let i = 0; i < 10; i++) {
    const key = `fashion:tips.${bodyType}.${i}`;
    const tip = i18next.t(key);

    // If translation key doesn't exist, stop
    if (tip === key) {
      break;
    }

    tips.push(tip);
  }

  // If no tips found, try to get averageNormal tips
  if (tips.length === 0 && bodyType !== 'averageNormal') {
    for (let i = 0; i < 10; i++) {
      const key = `fashion:tips.averageNormal.${i}`;
      const tip = i18next.t(key);

      if (tip === key) {
        break;
      }

      tips.push(tip);
    }
  }

  return tips;
}

function getAvoid(bodyType: string): string[] {
  const avoid: string[] = [];

  // Try to get avoid items for the body type
  for (let i = 0; i < 10; i++) {
    const key = `fashion:avoid.${bodyType}.${i}`;
    const item = i18next.t(key);

    // If translation key doesn't exist, stop
    if (item === key) {
      break;
    }

    avoid.push(item);
  }

  return avoid;
}
