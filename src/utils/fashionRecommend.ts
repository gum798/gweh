// 체형 분석 및 패션 스타일 추천

export interface BodyInfo {
  height: number; // cm
  weight: number; // kg
  gender: 'male' | 'female';
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

  // 체형 분류 (키와 BMI 조합)
  let bodyType: string;
  let bodyTypeKorean: string;

  if (info.gender === 'male') {
    if (info.height >= 180) {
      if (bmi < 23) {
        bodyType = 'tallSlim';
        bodyTypeKorean = '키 크고 마른 체형';
      } else {
        bodyType = 'tallLarge';
        bodyTypeKorean = '키 크고 건장한 체형';
      }
    } else if (info.height >= 170) {
      if (bmi < 20) {
        bodyType = 'averageSlim';
        bodyTypeKorean = '보통 키에 마른 체형';
      } else if (bmi < 25) {
        bodyType = 'averageNormal';
        bodyTypeKorean = '균형 잡힌 체형';
      } else {
        bodyType = 'averageLarge';
        bodyTypeKorean = '보통 키에 넓은 체형';
      }
    } else {
      if (bmi < 23) {
        bodyType = 'shortSlim';
        bodyTypeKorean = '아담하고 마른 체형';
      } else {
        bodyType = 'shortLarge';
        bodyTypeKorean = '아담하고 다부진 체형';
      }
    }
  } else {
    // 여성
    if (info.height >= 168) {
      if (bmi < 21) {
        bodyType = 'tallSlim';
        bodyTypeKorean = '키 크고 마른 체형';
      } else {
        bodyType = 'tallLarge';
        bodyTypeKorean = '키 크고 풍성한 체형';
      }
    } else if (info.height >= 158) {
      if (bmi < 19) {
        bodyType = 'averageSlim';
        bodyTypeKorean = '보통 키에 마른 체형';
      } else if (bmi < 23) {
        bodyType = 'averageNormal';
        bodyTypeKorean = '균형 잡힌 체형';
      } else {
        bodyType = 'averageLarge';
        bodyTypeKorean = '보통 키에 풍성한 체형';
      }
    } else {
      if (bmi < 21) {
        bodyType = 'shortSlim';
        bodyTypeKorean = '아담하고 마른 체형';
      } else {
        bodyType = 'shortLarge';
        bodyTypeKorean = '아담하고 사랑스러운 체형';
      }
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
  const isMale = bodyInfo.gender === 'male';

  // 체형별 메인 메시지
  const mainMessages: Record<string, string> = {
    tallSlim: '늘씬한 비율을 살려 세련된 스타일이 어울리는 체형입니다.',
    tallLarge: '당당한 체격을 살려 클래식한 스타일이 어울리는 체형입니다.',
    averageSlim: '다양한 스타일을 소화할 수 있는 체형입니다.',
    averageNormal: '어떤 스타일이든 잘 어울리는 균형 잡힌 체형입니다.',
    averageLarge: '체형을 커버하면서 세련된 느낌을 줄 수 있는 스타일이 어울립니다.',
    shortSlim: '깔끔하고 미니멀한 스타일로 세련된 느낌을 낼 수 있습니다.',
    shortLarge: '세로 라인을 강조해 비율을 좋게 보이게 하는 스타일이 어울립니다.',
  };

  // 체형별 스타일 추천
  const styleRecommendations = getStyleRecommendations(bodyType, isMale);
  const colorRecommendation = getColorRecommendation(bodyType);
  const tips = getTips(bodyType, isMale);
  const avoid = getAvoid(bodyType, isMale);

  return {
    mainMessage: mainMessages[bodyType] || '당신만의 스타일을 찾아보세요.',
    bodyAnalysis,
    styles: styleRecommendations,
    colors: colorRecommendation,
    tips,
    avoid,
  };
}

function getStyleRecommendations(bodyType: string, isMale: boolean): StyleRecommendation[] {
  if (isMale) {
    return getMaleStyles(bodyType);
  }
  return getFemaleStyles(bodyType);
}

function getMaleStyles(bodyType: string): StyleRecommendation[] {
  const styles: Record<string, StyleRecommendation[]> = {
    tallSlim: [
      {
        category: '상의',
        items: ['오버사이즈 코트', '레이어드 스타일', '가로 스트라이프'],
        description: '볼륨감을 더해 균형 잡힌 실루엣을 만들어줍니다.',
        icon: '🧥',
      },
      {
        category: '하의',
        items: ['와이드 팬츠', '카고 팬츠', '배기 진'],
        description: '하체에 볼륨감을 더해줍니다.',
        icon: '👖',
      },
      {
        category: '스타일',
        items: ['캐주얼 레이어드', '스트릿 패션', '아메카지'],
        description: '자유로운 실루엣이 잘 어울립니다.',
        icon: '✨',
      },
    ],
    tallLarge: [
      {
        category: '상의',
        items: ['테일러드 코트', '싱글 자켓', '세로 스트라이프 셔츠'],
        description: '클래식하고 정돈된 느낌을 강조합니다.',
        icon: '🧥',
      },
      {
        category: '하의',
        items: ['스트레이트 팬츠', '슬랙스', '치노 팬츠'],
        description: '깔끔한 실루엣을 유지합니다.',
        icon: '👖',
      },
      {
        category: '스타일',
        items: ['비즈니스 캐주얼', '미니멀', '클래식'],
        description: '당당한 체격을 살리는 정제된 스타일.',
        icon: '✨',
      },
    ],
    averageSlim: [
      {
        category: '상의',
        items: ['피티드 셔츠', '니트', '블루종'],
        description: '몸에 맞는 핏으로 깔끔하게.',
        icon: '🧥',
      },
      {
        category: '하의',
        items: ['슬림핏 청바지', '조거 팬츠', '테이퍼드 팬츠'],
        description: '다양한 핏을 소화할 수 있습니다.',
        icon: '👖',
      },
      {
        category: '스타일',
        items: ['캐주얼', '댄디', '모던'],
        description: '깔끔하고 세련된 스타일이 잘 어울립니다.',
        icon: '✨',
      },
    ],
    averageNormal: [
      {
        category: '상의',
        items: ['다양한 자켓', '후드티', '가디건'],
        description: '어떤 스타일이든 잘 소화합니다.',
        icon: '🧥',
      },
      {
        category: '하의',
        items: ['레귤러핏 청바지', '면바지', '반바지'],
        description: '자유롭게 선택해도 좋습니다.',
        icon: '👖',
      },
      {
        category: '스타일',
        items: ['올라운더', '트렌디', '믹스매치'],
        description: '다양한 스타일을 시도해보세요.',
        icon: '✨',
      },
    ],
    averageLarge: [
      {
        category: '상의',
        items: ['V넥 상의', '세로 스트라이프', '어두운 색 자켓'],
        description: '세로 라인을 강조해 슬림하게.',
        icon: '🧥',
      },
      {
        category: '하의',
        items: ['스트레이트 팬츠', '어두운 색 바지'],
        description: '깔끔한 실루엣을 유지합니다.',
        icon: '👖',
      },
      {
        category: '스타일',
        items: ['모던 클래식', '미니멀', '심플'],
        description: '정돈된 느낌의 스타일이 좋습니다.',
        icon: '✨',
      },
    ],
    shortSlim: [
      {
        category: '상의',
        items: ['숏 자켓', '크롭 아우터', '하이웨이스트 코디'],
        description: '다리 길이를 길어 보이게 합니다.',
        icon: '🧥',
      },
      {
        category: '하의',
        items: ['하이웨이스트 팬츠', '슬림핏 바지', '9부 팬츠'],
        description: '세로 라인을 강조합니다.',
        icon: '👖',
      },
      {
        category: '스타일',
        items: ['미니멀', '모노톤', '슬림 캐주얼'],
        description: '심플하고 정돈된 스타일이 좋습니다.',
        icon: '✨',
      },
    ],
    shortLarge: [
      {
        category: '상의',
        items: ['V넥', '세로 스트라이프', '단색 상의'],
        description: '세로 라인으로 키가 커 보이게.',
        icon: '🧥',
      },
      {
        category: '하의',
        items: ['하이웨이스트', '스트레이트 팬츠', '어두운 색'],
        description: '다리 라인을 길게 보이게 합니다.',
        icon: '👖',
      },
      {
        category: '스타일',
        items: ['모던', '심플', '원톤 코디'],
        description: '깔끔한 통일감으로 비율을 좋게.',
        icon: '✨',
      },
    ],
  };

  return styles[bodyType] || styles.averageNormal;
}

function getFemaleStyles(bodyType: string): StyleRecommendation[] {
  const styles: Record<string, StyleRecommendation[]> = {
    tallSlim: [
      {
        category: '상의',
        items: ['오버사이즈 니트', '볼륨 블라우스', '레이어드'],
        description: '볼륨감을 더해 여성스러운 실루엣을.',
        icon: '👚',
      },
      {
        category: '하의',
        items: ['와이드 팬츠', 'A라인 스커트', '플레어 스커트'],
        description: '우아한 실루엣을 연출합니다.',
        icon: '👗',
      },
      {
        category: '스타일',
        items: ['엘레강스', '로맨틱', '보헤미안'],
        description: '우아하고 여성스러운 스타일이 잘 어울립니다.',
        icon: '✨',
      },
    ],
    tallLarge: [
      {
        category: '상의',
        items: ['랩 블라우스', 'V넥 원피스', '롱 카디건'],
        description: '세로 라인으로 슬림하게.',
        icon: '👚',
      },
      {
        category: '하의',
        items: ['부츠컷', 'A라인 스커트', '미디 스커트'],
        description: '균형 잡힌 실루엣을 만듭니다.',
        icon: '👗',
      },
      {
        category: '스타일',
        items: ['클래식', '시크', '모던'],
        description: '세련되고 당당한 스타일.',
        icon: '✨',
      },
    ],
    averageSlim: [
      {
        category: '상의',
        items: ['피티드 블라우스', '크롭탑', '니트'],
        description: '몸에 맞는 핏이 예쁩니다.',
        icon: '👚',
      },
      {
        category: '하의',
        items: ['스키니 진', '미니 스커트', '하이웨이스트'],
        description: '다양한 스타일을 소화할 수 있어요.',
        icon: '👗',
      },
      {
        category: '스타일',
        items: ['캐주얼 시크', '걸리시', '미니멀'],
        description: '다양한 시도가 가능합니다.',
        icon: '✨',
      },
    ],
    averageNormal: [
      {
        category: '상의',
        items: ['다양한 블라우스', '티셔츠', '자켓'],
        description: '어떤 스타일이든 잘 어울려요.',
        icon: '👚',
      },
      {
        category: '하의',
        items: ['청바지', '슬랙스', '스커트'],
        description: '자유롭게 선택하세요.',
        icon: '👗',
      },
      {
        category: '스타일',
        items: ['올라운더', '트렌디', '믹스매치'],
        description: '모든 스타일을 시도해보세요.',
        icon: '✨',
      },
    ],
    averageLarge: [
      {
        category: '상의',
        items: ['V넥', '랩 스타일', '세로 라인'],
        description: '상체를 날씬하게 보이게 합니다.',
        icon: '👚',
      },
      {
        category: '하의',
        items: ['A라인', '부츠컷', '미디 스커트'],
        description: '하체 라인을 부드럽게.',
        icon: '👗',
      },
      {
        category: '스타일',
        items: ['페미닌', '엘레강스', '클래식'],
        description: '여성스럽고 우아한 스타일.',
        icon: '✨',
      },
    ],
    shortSlim: [
      {
        category: '상의',
        items: ['크롭탑', '숏 자켓', '하이웨이스트 코디'],
        description: '다리가 길어 보이게 합니다.',
        icon: '👚',
      },
      {
        category: '하의',
        items: ['하이웨이스트', '미니 스커트', '9부 팬츠'],
        description: '비율을 좋게 만듭니다.',
        icon: '👗',
      },
      {
        category: '스타일',
        items: ['미니멀', '걸리시', '프렌치 시크'],
        description: '깔끔하고 사랑스러운 스타일.',
        icon: '✨',
      },
    ],
    shortLarge: [
      {
        category: '상의',
        items: ['V넥', '세로 스트라이프', '단색'],
        description: '세로 라인을 강조합니다.',
        icon: '👚',
      },
      {
        category: '하의',
        items: ['하이웨이스트', 'A라인', '롱 스커트'],
        description: '다리가 길어 보이게 합니다.',
        icon: '👗',
      },
      {
        category: '스타일',
        items: ['원톤 코디', '미니멀', '심플'],
        description: '통일감 있는 스타일로 비율을 좋게.',
        icon: '✨',
      },
    ],
  };

  return styles[bodyType] || styles.averageNormal;
}

function getColorRecommendation(bodyType: string): ColorRecommendation {
  const slimTypes = ['tallSlim', 'averageSlim', 'shortSlim'];
  const largeTypes = ['tallLarge', 'averageLarge', 'shortLarge'];

  if (slimTypes.includes(bodyType)) {
    return {
      recommended: ['밝은 색', '파스텔톤', '화이트', '베이지', '밝은 회색'],
      avoid: [],
      description: '밝은 색상으로 볼륨감을 더해보세요.',
    };
  }

  if (largeTypes.includes(bodyType)) {
    return {
      recommended: ['네이비', '블랙', '차콜', '버건디', '다크 그린'],
      avoid: ['가로 스트라이프', '밝은 원색'],
      description: '어두운 색상으로 슬림한 느낌을 연출하세요.',
    };
  }

  return {
    recommended: ['다양한 색상', '시즌 컬러', '자신만의 색'],
    avoid: [],
    description: '다양한 색상을 자유롭게 시도해보세요.',
  };
}

function getTips(bodyType: string, isMale: boolean): string[] {
  const tips: Record<string, string[]> = {
    tallSlim: [
      '레이어드 스타일로 볼륨감을 더해보세요.',
      '가로 스트라이프가 잘 어울립니다.',
      '오버사이즈 아이템을 활용해보세요.',
    ],
    tallLarge: [
      '세로 라인을 강조하는 아이템을 선택하세요.',
      '잘 맞는 핏의 옷을 선택하세요.',
      '단색 코디로 깔끔하게 연출하세요.',
    ],
    averageSlim: [
      '다양한 스타일을 시도해보세요.',
      '액세서리로 포인트를 줘보세요.',
      '컬러풀한 아이템도 잘 어울립니다.',
    ],
    averageNormal: [
      '트렌드를 적극 활용해보세요.',
      '자신만의 시그니처 스타일을 찾아보세요.',
      '다양한 믹스매치를 시도해보세요.',
    ],
    averageLarge: [
      'V넥이나 세로 라인을 활용하세요.',
      '허리 라인을 강조하면 좋습니다.',
      '단색 코디가 깔끔해 보입니다.',
    ],
    shortSlim: [
      '하이웨이스트로 다리를 길어 보이게 하세요.',
      '원톤 코디로 세로 라인을 강조하세요.',
      '숏 아우터가 잘 어울립니다.',
    ],
    shortLarge: [
      '세로 라인을 최대한 활용하세요.',
      '하이웨이스트는 필수입니다.',
      '발목이 보이는 기장이 좋습니다.',
    ],
  };

  return tips[bodyType] || tips.averageNormal;
}

function getAvoid(bodyType: string, isMale: boolean): string[] {
  const avoid: Record<string, string[]> = {
    tallSlim: ['너무 타이트한 옷', '세로 스트라이프만 입기'],
    tallLarge: ['가로 스트라이프', '너무 밝은 색상 전체 코디'],
    averageSlim: ['너무 큰 오버사이즈'],
    averageNormal: [],
    averageLarge: ['타이트한 옷', '밝은 색 가로 스트라이프'],
    shortSlim: ['긴 기장의 아우터', '로우웨이스트'],
    shortLarge: ['가로 스트라이프', '로우웨이스트', '롱 아우터'],
  };

  return avoid[bodyType] || [];
}
