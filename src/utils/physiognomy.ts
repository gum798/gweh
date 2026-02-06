// MediaPipe FaceMesh 주요 랜드마크 인덱스
const LANDMARKS = {
  // 얼굴 윤곽
  faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],

  // 눈
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  rightEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],

  // 눈썹
  leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  rightEyebrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],

  // 코
  nose: [1, 2, 98, 327, 4, 5, 195, 197, 6, 168],
  noseTip: 1,
  noseBottom: 2,

  // 입
  lips: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
  upperLip: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  lowerLip: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],

  // 이마 (근사치)
  forehead: [10, 338, 297, 332, 284, 251, 389, 356],

  // 턱
  chin: 152,
};

// 랜드마크 간 거리 계산
function distance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// 삼정(三停) 비율 분석: 상정(이마~눈썹), 중정(눈썹~코끝), 하정(코끝~턱)
function analyzeSamJeong(landmarks) {
  const foreheadTop = landmarks[10];   // 발제(상정 시작)
  const eyebrowMid = landmarks[168];   // 눈썹 사이(인당) — 상정/중정 경계
  const noseTip = landmarks[2];        // 준두(코끝) — 중정/하정 경계
  const chinBottom = landmarks[152];   // 턱끝(지각) — 하정 끝

  const upper = distance(foreheadTop, eyebrowMid);   // 상정: 초년운, 부모복, 지성
  const middle = distance(eyebrowMid, noseTip);       // 중정: 중년운, 의지력, 재물운
  const lower = distance(noseTip, chinBottom);         // 하정: 말년운, 자녀복

  const total = upper + middle + lower;
  const upperRatio = upper / total;
  const middleRatio = middle / total;
  const lowerRatio = lower / total;

  // 1:1:1에 가까울수록 균형 잡힌 인생
  const balance = 1 - (Math.abs(upperRatio - 0.333) + Math.abs(middleRatio - 0.333) + Math.abs(lowerRatio - 0.333));

  return { upperRatio, middleRatio, lowerRatio, balance };
}

// 십이궁 핵심 부위 분석
function analyzeTwelvePalaces(landmarks, eyeDistance: number) {
  // 명궁(命宮): 두 눈썹 사이(인당) — 넓고 평평할수록 길
  const leftBrowInner = landmarks[107];
  const rightBrowInner = landmarks[336];
  const myeongGungWidth = distance(leftBrowInner, rightBrowInner) / eyeDistance;

  // 재백궁(財帛宮): 코 전체 — 콧대 곧고 준두 풍만할수록 재물운
  const noseTop = landmarks[168];
  const noseTip = landmarks[1];
  const noseLeft = landmarks[98];
  const noseRight = landmarks[327];
  const noseLength = distance(noseTop, noseTip) / eyeDistance;
  const noseWidth = distance(noseLeft, noseRight) / eyeDistance;

  // 전택궁(田宅宮): 눈과 눈썹 사이 — 넓을수록 부동산운
  const leftEyeTop = landmarks[159];
  const leftBrowBottom = landmarks[65];
  const jeonTaekHeight = distance(leftEyeTop, leftBrowBottom) / eyeDistance;

  // 처궁(妻宮): 눈꼬리 — 주름 적고 살집 적당
  // 자녀궁(子女宮): 눈 하단(와잠) — 도톰할수록 길
  // 질액궁(疾厄宮): 산근(콧날 시작점) — 꺾이지 않고 솟아야 건강
  const sanGeun = landmarks[6];
  const sanGeunHeight = distance(sanGeun, landmarks[168]) / eyeDistance;

  return {
    myeongGung: { width: myeongGungWidth, good: myeongGungWidth > 0.25 },
    jaeBaek: { length: noseLength, width: noseWidth, good: noseLength > 0.7 && noseWidth < 0.45 },
    jeonTaek: { height: jeonTaekHeight, good: jeonTaekHeight > 0.12 },
    jilAek: { height: sanGeunHeight, good: sanGeunHeight > 0.15 },
  };
}

// 얼굴 특징 분석 (오관 + 삼정 + 십이궁)
export function analyzeFaceFeatures(landmarks) {
  if (!landmarks || landmarks.length < 468) {
    return null;
  }

  // 얼굴 기준 크기 (눈 사이 거리)
  const leftEyeCenter = landmarks[33];
  const rightEyeCenter = landmarks[263];
  const eyeDistance = distance(leftEyeCenter, rightEyeCenter);

  // === 오관(五官) 분석 ===

  // 이마 분석 (관록궁/官祿宮 — 출세, 지위, 명예)
  const foreheadTop = landmarks[10];
  const foreheadBottom = landmarks[168];
  const foreheadHeight = distance(foreheadTop, foreheadBottom);
  const foreheadRatio = foreheadHeight / eyeDistance;

  let foreheadType;
  if (foreheadRatio > 0.9) {
    foreheadType = 'high';
  } else if (foreheadRatio < 0.6) {
    foreheadType = 'low';
  } else {
    foreheadType = 'balanced';
  }

  // 눈 분석 (감찰관/鑑察官 — 정신의 정화도, 통찰력)
  const leftEyeOuter = landmarks[33];
  const leftEyeInner = landmarks[133];
  const rightEyeOuter = landmarks[263];
  const rightEyeInner = landmarks[362];

  const leftEyeWidth = distance(leftEyeOuter, leftEyeInner);
  const rightEyeWidth = distance(rightEyeOuter, rightEyeInner);
  const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
  const eyeRatio = avgEyeWidth / eyeDistance;

  let eyeType;
  if (eyeRatio > 0.35) {
    eyeType = 'large';
  } else if (eyeRatio < 0.25) {
    eyeType = 'small';
  } else {
    eyeType = 'balanced';
  }

  // 코 분석 (심변관/審辨官 — 재물운, 자존심)
  const noseTop = landmarks[168];
  const noseBottom = landmarks[2];
  const noseLength = distance(noseTop, noseBottom);
  const noseRatio = noseLength / eyeDistance;

  let noseType;
  if (noseRatio > 1.2) {
    noseType = 'long';
  } else if (noseRatio < 0.8) {
    noseType = 'short';
  } else {
    noseType = 'balanced';
  }

  // 입 분석 (출납관/出納官 — 신용, 말년 복운)
  const lipLeft = landmarks[61];
  const lipRight = landmarks[291];
  const lipWidth = distance(lipLeft, lipRight);
  const lipRatio = lipWidth / eyeDistance;

  // 입꼬리 방향 분석
  const lipCornerLeft = landmarks[61];
  const lipCornerRight = landmarks[291];
  const lipCenter = landmarks[17];
  const lipCornerAvgY = (lipCornerLeft.y + lipCornerRight.y) / 2;
  const lipCornerUp = lipCornerAvgY < lipCenter.y;

  let lipType;
  if (lipRatio > 1.1) {
    lipType = 'wide';
  } else if (lipRatio < 0.8) {
    lipType = 'small';
  } else {
    lipType = 'balanced';
  }

  // 얼굴형 분석
  const faceTop = landmarks[10];
  const faceBottom = landmarks[152];
  const faceLeft = landmarks[234];
  const faceRight = landmarks[454];

  const faceHeight = distance(faceTop, faceBottom);
  const faceWidth = distance(faceLeft, faceRight);
  const faceShapeRatio = faceHeight / faceWidth;

  let faceShape;
  if (faceShapeRatio > 1.4) {
    faceShape = 'oval';
  } else if (faceShapeRatio < 1.1) {
    faceShape = 'round';
  } else {
    faceShape = 'balanced';
  }

  // === 삼정(三停) 분석 ===
  const samJeong = analyzeSamJeong(landmarks);

  // === 십이궁(十二宮) 핵심 분석 ===
  const palaces = analyzeTwelvePalaces(landmarks, eyeDistance);

  return {
    forehead: { type: foreheadType, ratio: foreheadRatio },
    eyes: { type: eyeType, ratio: eyeRatio },
    nose: { type: noseType, ratio: noseRatio },
    lips: { type: lipType, ratio: lipRatio, cornerUp: lipCornerUp },
    faceShape: { type: faceShape, ratio: faceShapeRatio },
    samJeong,
    palaces,
  };
}

// 관상 해석 메시지 — 오관(五官) 체계 기반
const physiognomyOmens = {
  forehead: {
    // 관록궁(官祿宮) — 출세, 지위, 명예
    high: [
      '관록궁이 넓고 도톰하니, 상정(上停)에 하늘의 기운이 충만한 상이로다. 조상의 덕이 있고 지혜로운 기질로 학문과 관직에 뛰어나리라.',
      '이마가 높아 상정이 발달하였으니, 초년운이 좋고 귀인의 도움이 끊이지 않는 상이로다. 지성과 직관력이 남다르리라.',
      '관록궁에 맑은 기색이 서려 있으니, 명예와 출세의 길이 열려 있는 상이로다. 부모궁(일각·월각)도 넉넉하여 부모 복이 있으리라.',
    ],
    low: [
      '상정이 단정하니 실용적 지혜를 품은 상이로다. 학문보다 경험에서 깊은 통찰을 얻어 현실에서 큰 성취를 이루리라.',
      '이마가 다부지니 집중력이 강한 상이로다. 한 분야를 깊이 파고드는 전문가의 기질이 있으니, 꾸준함으로 큰 일을 이루리라.',
      '상정이 아담하니 일찍부터 자수성가의 기운이 있는 상이로다. 착실한 노력이 중년 이후 빛을 발하리라.',
    ],
    balanced: [
      '관록궁이 조화로우니 상정의 균형이 이상적인 상이로다. 문무를 겸비하여 어떤 일에도 막힘이 없으리라.',
      '이마가 균형 잡혀 있으니, 지혜와 실행력이 함께하는 상이로다. 초년부터 중년까지 운의 흐름이 순탄하리라.',
    ],
  },
  eyes: {
    // 감찰관(鑑察官) — 정신의 정화도, 통찰력
    large: [
      '감찰관이 크고 맑으니, 정신의 광채가 빛나는 상이로다. 흑백이 분명한 눈은 귀한 기질의 표식이니, 예술과 감성에 뛰어나리라.',
      '눈이 커 세상을 넓게 보는 상이로다. 통찰력이 깊어 사람의 진심을 읽는 능력이 있으니, 인연이 풍성하리라.',
      '감찰관에 열린 기운이 있으니, 사람을 끌어당기는 매력의 상이로다. 전택궁(눈과 눈썹 사이)도 넉넉하여 부동산 운이 좋으리라.',
    ],
    small: [
      '감찰관에 깊이가 있으니, 신중하고 관찰력이 뛰어난 상이로다. 작은 것도 놓치지 않는 눈매는 전문 분야에서 두각을 나타낼 징표이니라.',
      '눈에 깊은 지혜가 서려 있으니, 실수가 적고 판단이 정확한 상이로다. 집중력이 뛰어나 한 분야의 대가가 되리라.',
      '감찰관이 예리하니, 사람을 잘 알아보는 눈을 가진 상이로다. 처궁(눈꼬리 옆)도 깨끗하여 배우자 복이 있으리라.',
    ],
    balanced: [
      '감찰관이 조화로우니 이성과 감성이 균형 잡힌 상이로다. 맑은 눈은 진실을 꿰뚫는 힘이 있으니, 사람을 잘 분별하리라.',
      '눈이 조화로워 안정감 있는 상이로다. 흑백이 분명하여 귀한 기질이 느껴지니, 주변의 신뢰를 한 몸에 받으리라.',
    ],
  },
  nose: {
    // 심변관(審辨官) — 재물운, 자존심, 재백궁(財帛宮)
    long: [
      '심변관이 곧고 오뚝하니, 재백궁에 재물이 모이는 상이로다. 콧대가 곧으니 자존심이 강하고 주관이 뚜렷하여 중년에 크게 번성하리라.',
      '코가 높아 재백궁이 발달한 상이로다. 준두(코끝)가 풍만하니 재물 창고가 튼튼하여 쓰는 것보다 모이는 것이 많으리라.',
      '심변관에 리더의 기운이 서려 있으니, 사람을 이끄는 능력과 재물을 다스리는 지혜가 함께하는 상이로다.',
    ],
    short: [
      '심변관이 단정하니, 원만한 성품으로 사람과의 화합에 능한 상이로다. 협력을 통해 재물이 들어오리라.',
      '코가 아담하니 친화력이 강한 상이로다. 겸손한 기운이 있어 귀인이 스스로 찾아와 도움을 주리라.',
      '재백궁이 검소한 상이니, 큰 투자보다 꾸준한 저축으로 안정적인 재물을 모으리라.',
    ],
    balanced: [
      '심변관이 조화로우니, 재백궁의 기운이 안정적인 상이로다. 재물과 인연이 모두 좋아 큰 실패 없이 꾸준히 성장하리라.',
      '코가 균형 잡혀 중용을 아는 상이로다. 질액궁(산근)도 매끄러우니 건강 운세가 양호하리라.',
    ],
  },
  lips: {
    // 출납관(出納官) — 신용, 식록, 말년 복운
    wide: [
      '출납관이 크니, 식록이 풍성한 상이로다. 입술 선이 뚜렷하니 표현력이 뛰어나 말로 사람을 움직이는 능력이 있으리라.',
      '넓은 입은 먹을 복과 인복의 징표이니, 호탕한 기운으로 사람들이 자연히 따르는 상이로다.',
      '출납관이 발달하니, 노복궁(입술 옆 턱)도 넉넉하여 부하 직원이나 후배들과의 관계가 좋은 상이로다.',
    ],
    small: [
      '출납관이 단정하니, 신중한 언행으로 말에 무게가 실리는 상이로다. 비밀을 잘 지켜 깊은 신뢰를 얻으리라.',
      '입이 아담하니 섬세한 표현력의 상이로다. 글재주가 있어 문서나 계약에서 복이 따르리라.',
      '출납관에 절도 있는 기운이 서려 있으니, 낭비 없이 재물을 잘 관리하여 말년이 풍요롭리라.',
    ],
    balanced: [
      '출납관이 조화로우니, 언변과 신중함을 겸비한 상이로다. 입꼬리의 기운이 좋아 적절한 때에 적절한 말을 하는 지혜가 있으리라.',
      '입이 균형 잡혀 신의가 두터운 상이로다. 식록과 인복이 고르게 따르리라.',
    ],
  },
  faceShape: {
    oval: [
      '천지인(天地人) 삼재의 조화가 이상적인 계란형 얼굴이니, 삼정의 균형이 뛰어난 귀한 상이로다. 일생에 큰 어려움 없이 복이 고르게 흐르리라.',
      '상정·중정·하정이 고르게 발달한 상이니, 초년·중년·말년 모두 순탄한 운의 흐름이 기대되는 상이로다.',
    ],
    round: [
      '둥근 얼굴은 복덕궁의 기운이 충만한 상이니, 식복과 인복이 모두 넘치는 상이로다. 사람과의 화합이 좋아 어디서든 환영받으리라.',
      '원만한 얼굴형은 하정이 안정된 상이니, 말년에 자녀 복과 후덕함으로 평안한 삶을 누리리라.',
    ],
    balanced: [
      '삼정의 비율이 고르게 균형 잡힌 상이니, 천지인의 조화 속에 만사가 순조로우리라. 과하지도 모자라지도 않은 중도의 지혜가 있으리라.',
      '얼굴형이 조화로우니 복덕궁의 기운이 안정적이로다. 정신적 안락과 물질적 풍요가 함께하는 상이로다.',
    ],
  },
};

// 삼정 해석 메시지 생성
function interpretSamJeong(samJeong) {
  const { upperRatio, middleRatio, lowerRatio, balance } = samJeong;

  if (balance > 0.85) {
    return '삼정(上中下)의 비율이 천지인(天地人)의 이상적인 균형을 이루고 있으니, 초년·중년·말년 모두 고르게 복이 흐르는 상이로다.';
  }

  const dominant = upperRatio > middleRatio && upperRatio > lowerRatio ? 'upper'
    : middleRatio > lowerRatio ? 'middle' : 'lower';

  if (dominant === 'upper') {
    return '상정(上停)이 발달하였으니, 초년에 운이 트이고 부모 복과 학문 운이 좋은 상이로다. 지혜와 귀인의 도움으로 일찍 기반을 다지리라.';
  } else if (dominant === 'middle') {
    return '중정(中停)이 발달하였으니, 인생의 황금기인 중년에 크게 성취하는 상이로다. 의지력과 재물운이 강하여 자수성가의 기운이 있으리라.';
  }
  return '하정(下停)이 발달하였으니, 말년이 안정되고 풍요로운 상이로다. 자녀 복이 있고 부하 직원의 덕을 보아 노년이 평안하리라.';
}

// 십이궁 핵심 해석 생성
function interpretPalaces(palaces) {
  const msgs: string[] = [];

  if (palaces.myeongGung.good) {
    msgs.push('명궁(인당)이 넓고 맑으니 수명과 학식이 뛰어난 길상이로다.');
  } else {
    msgs.push('명궁(인당)이 좁으니, 마음을 넓게 먹고 명상으로 기운을 보충하면 좋으리라.');
  }

  if (palaces.jaeBaek.good) {
    msgs.push('재백궁(코)이 곧고 준두가 풍만하니 재물이 잘 모이는 상이로다.');
  }

  if (palaces.jeonTaek.good) {
    msgs.push('전택궁(눈과 눈썹 사이)이 넉넉하니 부동산 운과 가업 계승의 복이 있으리라.');
  }

  if (palaces.jilAek.good) {
    msgs.push('질액궁(산근)이 매끄러우니 건강 운세가 양호한 상이로다.');
  } else {
    msgs.push('질액궁(산근)에 주의가 필요하니, 건강 관리에 각별히 신경 쓰면 좋으리라.');
  }

  return msgs;
}

// 관상 종합 해석 생성
export function interpretPhysiognomy(features) {
  if (!features) return null;

  const interpretations = [];

  // 각 부위별 해석 (오관 기반)
  const parts = ['forehead', 'eyes', 'nose', 'lips', 'faceShape'];

  for (const part of parts) {
    const feature = features[part];
    const omens = physiognomyOmens[part][feature.type];
    const omen = omens[Math.floor(Math.random() * omens.length)];

    interpretations.push({
      part,
      partKorean: getPartKorean(part),
      type: feature.type,
      typeKorean: getTypeKorean(part, feature.type),
      message: omen,
    });
  }

  // 삼정(三停) 해석 추가
  if (features.samJeong) {
    interpretations.push({
      part: 'samJeong',
      partKorean: '삼정',
      type: 'balance',
      typeKorean: features.samJeong.balance > 0.85 ? '균형' : '특성',
      message: interpretSamJeong(features.samJeong),
    });
  }

  // 십이궁 핵심 해석 추가
  if (features.palaces) {
    const palaceMsgs = interpretPalaces(features.palaces);
    interpretations.push({
      part: 'palaces',
      partKorean: '십이궁',
      type: 'analysis',
      typeKorean: '종합',
      message: palaceMsgs.join(' '),
    });
  }

  // 종합 메시지 생성
  const mainMessage = generateMainMessage(features);

  return {
    mainMessage,
    details: interpretations,
    features,
  };
}

function getPartKorean(part) {
  const names = {
    forehead: '이마',
    eyes: '눈',
    nose: '코',
    lips: '입',
    faceShape: '얼굴형',
  };
  return names[part];
}

function getTypeKorean(part, type) {
  const types = {
    forehead: { high: '높은', low: '낮은', balanced: '조화로운' },
    eyes: { large: '큰', small: '작은', balanced: '조화로운' },
    nose: { long: '오뚝한', short: '단정한', balanced: '조화로운' },
    lips: { wide: '넓은', small: '작은', balanced: '조화로운' },
    faceShape: { oval: '계란형', round: '둥근', balanced: '조화로운' },
  };
  return types[part][type];
}

function generateMainMessage(features) {
  // 삼정 균형 기반 종합 판단
  const samBalance = features.samJeong?.balance || 0;
  const palaces = features.palaces;

  // 특징 조합에 따른 전문적 종합 메시지
  if (features.forehead.type === 'high' && features.eyes.type === 'large') {
    return '관록궁이 높고 감찰관이 밝으니, 지혜와 통찰이 함께하는 귀한 상이로다. 학문과 예술에 뛰어나며, 상정의 기운이 강하여 초년부터 귀인의 도움이 있으리라.';
  }

  if (features.nose.type === 'long' && features.lips.type === 'wide') {
    return '재백궁(코)이 발달하고 출납관(입)이 넉넉하니, 재물과 식록이 함께하는 상이로다. 중정의 기운이 강하여 중년 이후 크게 번성하리라.';
  }

  if (features.faceShape.type === 'round' && features.lips.type === 'wide') {
    return '얼굴에 복덕궁의 기운이 충만하고 출납관이 풍성하니, 식복과 인복이 넘치는 상이로다. 하정이 안정되어 말년까지 풍요로우리라.';
  }

  if (samBalance > 0.85) {
    return '삼정(天地人)의 비율이 이상적으로 균형 잡혀 있으니, 초년·중년·말년 모두 복이 고르게 흐르는 귀한 상이로다. 노력에 따라 큰 성취가 있으리라.';
  }

  if (palaces?.myeongGung.good && palaces?.jaeBaek.good) {
    return '명궁이 맑고 재백궁이 튼튼하니, 학식과 재물이 함께하는 상이로다. 하늘이 내린 복상이니 큰 뜻을 품어도 좋으리라.';
  }

  const messages = [
    '그대의 얼굴에서 오관(五官)의 조화가 느껴지니, 타고난 상이 좋아 일생이 평탄하리라.',
    '천지인 삼재의 기운이 서려 있으니, 운명이 그대를 도우리라. 귀한 상을 품었도다.',
    '오관에 복된 기운이 흐르니, 큰 뜻을 품어도 좋은 상이로다. 노력이 반드시 결실을 맺으리라.',
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

// ═══════════════════════════════════════════════════════════════
// 관상 궁합 분석 엔진 (Face Harmony Compatibility Analysis)
// 오관 상보(五官 相補), 삼정 조화(三停 調和), 십이궁 합(十二宮 合)
// ═══════════════════════════════════════════════════════════════

export interface HarmonyDimension {
  key: string;
  label: string;
  icon: string;
  score: number;        // 0–100
  interpretation: string;
}

export interface HarmonyResult {
  totalScore: number;
  grade: string;
  gradeEmoji: string;
  mainMessage: string;
  dimensions: HarmonyDimension[];
  advice: string;
  yinYangBalance: number; // –1 (pure yin) to +1 (pure yang)
  elementPair: { a: string; b: string; harmony: string };
}

// 오행(五行) 원소 결정 — 얼굴 비율 기반
function faceElement(features: ReturnType<typeof analyzeFaceFeatures>) {
  if (!features) return 'earth';
  const { forehead, eyes, nose, lips, faceShape } = features;

  // 목(木): 길고 좁은 얼굴, 높은 이마
  if (faceShape.type === 'oval' && forehead.type === 'high') return 'wood';
  // 화(火): 큰 눈, 넓은 입 — 열정적
  if (eyes.type === 'large' && lips.type === 'wide') return 'fire';
  // 토(土): 균형형 — 안정적
  if (faceShape.type === 'balanced' && nose.type === 'balanced') return 'earth';
  // 금(金): 작은 눈, 긴 코 — 예리함
  if (eyes.type === 'small' && nose.type === 'long') return 'metal';
  // 수(水): 둥근 얼굴, 작은 입 — 유연함
  if (faceShape.type === 'round' || lips.type === 'small') return 'water';

  return 'earth';
}

const ELEMENT_NAMES: Record<string, string> = {
  wood: '木(목)', fire: '火(화)', earth: '土(토)', metal: '金(금)', water: '水(수)',
};

// 오행 상생·상극 궁합표 — 시적(詩的) 해설 강화
const ELEMENT_HARMONY: Record<string, Record<string, { score: number; desc: string }>> = {
  wood: {
    wood: { score: 70, desc: '동기목(同氣木) — 푸른 숲이 나란히 서니, 서로의 뿌리를 이해하는 깊은 인연이로다. 허나 같은 하늘을 바라보니 가끔은 양보의 미풍이 필요하리라. 함께 자라되 서로의 가지를 존중하라.' },
    fire: { score: 95, desc: '목생화(木生火) — 마른 장작이 불꽃을 피워 올리듯, 한 사람의 존재가 다른 이의 열정에 불을 붙이는 천상의 상생이로다. 나무의 인내와 불의 열정이 합하니, 세상을 환히 밝히는 봉화와 같으리라. 만인이 부러워할 상이로다.' },
    earth: { score: 55, desc: '목극토(木剋土) — 나무가 대지를 뚫고 솟아오르듯, 성장을 향한 선의의 긴장이 흐르는 인연이로다. 뿌리가 땅을 갈라놓되, 그 틈에서 새 생명이 자라나니, 갈등 속에서도 성장의 씨앗이 있으리라.' },
    metal: { score: 40, desc: '금극목(金剋木) — 날카로운 도끼가 나무를 다듬으니, 아픔이 있되 아름다운 형상을 빚어내는 인연이로다. 쇠의 냉정함이 나무의 부드러움을 깎으나, 그 결과 명목(名木)이 탄생하리라. 서로의 날을 무디게 갈아주라.' },
    water: { score: 90, desc: '수생목(水生木) — 깊은 지하수가 나무의 뿌리에 생명을 전하듯, 보이지 않는 곳에서 서로를 살리는 아름다운 상생이로다. 물의 지혜가 나무의 성장을 이끌고, 나무의 그늘이 물을 지키니 천생의 인연이로다.' },
  },
  fire: {
    wood: { score: 90, desc: '목생화(木生火) — 나무의 헌신이 불꽃의 춤을 가능케 하니, 서로에게 활력을 불어넣는 최상의 상이로다. 따뜻한 불빛 아래 모든 것이 꽃피우리라.' },
    fire: { score: 65, desc: '동기화(同氣火) — 두 불꽃이 하나의 화로에서 타오르니, 열정은 넘치되 누구도 먼저 꺼지려 하지 않으리라. 뜨거운 만남이나 재가 되지 않으려면, 서로 바람이 되어 적당히 조절하는 지혜가 필요하리라.' },
    earth: { score: 88, desc: '화생토(火生土) — 불이 모든 것을 태운 뒤에 비옥한 흙을 만들어 내듯, 열정이 안정을 잉태하는 상생의 인연이로다. 화산이 지나간 자리에 가장 기름진 땅이 생기나니, 함께할수록 단단해지리라.' },
    metal: { score: 45, desc: '화극금(火剋金) — 대장간의 불이 쇳덩이를 녹여 명검을 만들듯, 고통의 단련을 통해 빛나는 것을 만들어내는 인연이로다. 불의 뜨거움을 쇠가 견딘다면, 천하에 둘도 없는 보검이 되리라.' },
    water: { score: 35, desc: '수극화(水剋火) — 폭우가 봉화를 꺼뜨리듯, 상반된 기운이 부딪히는 격렬한 인연이로다. 허나 증기(蒸氣)가 되어 하늘로 오르듯, 갈등을 승화시키면 구름 위의 무지개를 보리라. 서로의 열정을 존중하는 지혜가 필요하도다.' },
  },
  earth: {
    wood: { score: 50, desc: '목극토(木剋土) — 대지를 뚫고 나오는 새싹처럼, 서로의 차이가 새로운 성장을 이끄는 인연이로다. 나무가 대지를 갈라놓되, 그 뿌리가 흙을 단단히 붙잡으니, 서로를 인정하면 깊은 결실이 있으리라.' },
    fire: { score: 92, desc: '화생토(火生土) — 뜨거운 용암이 식어 새로운 대지가 되듯, 열정이 안정을 낳는 이상적인 상생이로다. 태양의 열이 대지를 데우고, 대지가 그 온기를 품어 만물을 키우니, 하늘이 점지한 짝이로다.' },
    earth: { score: 75, desc: '동기토(同氣土) — 너른 들판이 이어지듯 한없이 편안한 인연이로다. 안정감이 넘치나 때로 산이 되어 바람을 막고, 강이 되어 흐름을 만들어야 하리라. 변화 속에서 새로운 지형을 만들어가라.' },
    metal: { score: 88, desc: '토생금(土生金) — 깊은 광맥에서 순금이 솟아나듯, 함께할수록 서로 안에서 보석을 캐어내는 상생이로다. 대지의 품이 넓어야 귀한 금이 숨겨지나니, 두 분이 함께라면 천금의 인연이로다.' },
    water: { score: 42, desc: '토극수(土剋水) — 제방이 물의 흐름을 막듯, 안정이 자유를 가두는 듯한 긴장이 있으리라. 허나 논이 물을 품어 벼를 기르듯, 올바른 방향으로 물꼬를 터주면 풍요로운 수확이 있으리라.' },
  },
  metal: {
    wood: { score: 45, desc: '금극목(金剋木) — 조각가의 끌이 원목을 깎아 예술품을 만들듯, 서로를 다듬는 인연이로다. 날카로움이 아프기도 하나, 그 끝에 아름다운 형상이 드러나리라. 부드러움으로 날을 감싸는 지혜를 갖추라.' },
    fire: { score: 40, desc: '화극금(火剋金) — 불가마에서 금이 정련되듯, 단련과 시련을 통해 순도 높은 관계로 빚어지는 인연이로다. 참을 수 없는 열기를 견디면, 마침내 순금의 빛이 나리라. 인내는 곧 보석이로다.' },
    earth: { score: 92, desc: '토생금(土生金) — 산의 품에서 옥이 자라듯, 깊은 안정 속에서 빛나는 보석 같은 상생이로다. 대지의 묵직함이 금의 예리함을 감싸고, 금의 빛남이 대지를 귀하게 하니, 백년해로의 인연이로다.' },
    metal: { score: 68, desc: '동기금(同氣金) — 두 자루의 명검이 맞부딪히니, 날카로운 통찰은 빼어나되 서로를 베지 않도록 칼집에 넣을 줄도 알아야 하리라. 강철의 의지가 합하면 무엇이든 절단하리니, 양보의 미학을 갖추라.' },
    water: { score: 90, desc: '금생수(金生水) — 새벽 쇠붙이에 맺힌 이슬처럼, 차가움 속에서 지혜의 물방울이 영글어가는 상생이로다. 금의 맑음이 물의 깊이를 더하고, 물의 유연함이 금의 강직함을 부드럽게 하리라.' },
  },
  water: {
    wood: { score: 88, desc: '수생목(水生木) — 봄비가 씨앗을 깨우듯, 한 사람의 헌신이 다른 이의 성장을 이끄는 상생이로다. 물은 가장 낮은 곳으로 흘러 뿌리를 적시니, 겸허한 사랑이 가장 큰 나무를 키우리라.' },
    fire: { score: 38, desc: '수극화(水剋火) — 빗줄기가 모닥불을 위협하듯, 기운이 정면으로 부딪히는 인연이로다. 허나 물안개 속의 등불처럼, 서로의 기운을 살짝 비껴가면 몽환적인 아름다움을 빚어내리라. 정면 충돌 대신 조화를 택하라.' },
    earth: { score: 48, desc: '토극수(土剋水) — 둑이 강물의 방향을 바꾸듯, 서로의 흐름을 이해하는 데 시간이 필요한 인연이로다. 허나 강이 산을 깎아 계곡을 만들듯, 세월이 흐르면 서로에게 맞는 길이 자연히 생기리라.' },
    metal: { score: 92, desc: '금생수(金生水) — 달빛에 비친 옥천(玉泉)의 물처럼, 서로에게 고귀한 지혜를 선사하는 상생이로다. 맑은 금속이 이슬을 머금듯, 서로의 존재만으로도 마음이 맑아지는 귀한 인연이로다.' },
    water: { score: 72, desc: '동기수(同氣水) — 두 줄기 강물이 합류하여 대하(大河)를 이루듯, 깊은 공감과 직관이 통하는 인연이로다. 허나 큰 강에도 중심의 물줄기가 있어야 하나니, 서로에게 닻이 되어줄 방향을 세우라.' },
  },
};

// 오관 상보성(五官 相補) 분석
function analyzeFeatureComplementarity(a: ReturnType<typeof analyzeFaceFeatures>, b: ReturnType<typeof analyzeFaceFeatures>): HarmonyDimension[] {
  if (!a || !b) return [];
  const dims: HarmonyDimension[] = [];

  // 1. 이마(관록궁) — 지적 궁합
  const foreheadCompat = a.forehead.type === b.forehead.type
    ? 75 : (a.forehead.type !== 'balanced' && b.forehead.type !== 'balanced' ? 60 : 88);
  dims.push({
    key: 'intellect',
    label: '지적 궁합 · 관록궁',
    icon: '🧠',
    score: foreheadCompat,
    interpretation: foreheadCompat >= 80
      ? '두 분의 관록궁(官祿宮)이 밤하늘의 쌍성(雙星)처럼 조화롭게 맞물리도다. 한 분이 달을 가리키면 다른 분은 별을 짚으니, 지적 교류가 은하수처럼 끊임없이 흐르는 명상(明相)이로다.'
      : foreheadCompat >= 65
      ? '관록궁의 기운이 같은 하늘 아래 빛나니, 편안한 지적 교감이 있으리라. 허나 같은 책장만 넘기지 말고, 서로의 서가(書架)를 방문하면 사유의 깊이가 한층 깊어지리라.'
      : '관록궁의 별자리가 다르니, 이는 곧 서로가 서로에게 스승이 될 수 있는 귀한 배치로다. 다른 지혜를 나누는 것이야말로 두 분만의 학문이 되리라.',
  });

  // 2. 눈(감찰관) — 감성·직관 궁합
  const eyeComplement = (a.eyes.type === 'large' && b.eyes.type === 'small') ||
    (a.eyes.type === 'small' && b.eyes.type === 'large');
  const eyeScore = eyeComplement ? 92 : (a.eyes.type === b.eyes.type ? 78 : 70);
  dims.push({
    key: 'emotion',
    label: '감성 궁합 · 감찰관',
    icon: '👁️',
    score: eyeScore,
    interpretation: eyeComplement
      ? '한 분은 먼 산의 능선을 바라보고, 한 분은 발밑의 이슬을 읽으니, 감찰관(鑑察官)의 상보(相補)가 완벽한 명상(明相)이로다. 서로의 눈이 되어 하늘과 땅을 동시에 보는 귀한 인연이니라.'
      : eyeScore >= 78
      ? '감찰관의 빛이 같은 파장으로 빛나니, 달밤에 같은 그림자를 보는 듯 감성의 교류가 깊으리라. 눈빛 하나로 천 마디 말을 대신하는 인연이로다.'
      : '감찰관이 서로 다른 별을 향하고 있으나, 이는 서로에게 새로운 별자리를 선물하는 기연(奇緣)이로다. 상대의 시선을 따라가 보면 그곳에 보물이 숨어있으리라.',
  });

  // 3. 코(심변관) — 재물·가치관 궁합
  const noseCompat = a.nose.type === b.nose.type ? 80
    : ((a.nose.type === 'balanced' || b.nose.type === 'balanced') ? 85 : 65);
  dims.push({
    key: 'values',
    label: '가치관 궁합 · 재백궁',
    icon: '💰',
    score: noseCompat,
    interpretation: noseCompat >= 80
      ? '재백궁(財帛宮)의 기운이 같은 광맥(鑛脈)을 따르니, 두 분이 함께 캐는 금은 세상에서 가장 순도 높은 금이 되리라. 재물관과 인생의 무게가 일치하는 귀한 상이로다.'
      : '재백궁이 서로 다른 산을 가리키고 있으나, 이는 두 갈래의 강이 합류하여 더 큰 강을 이루는 형국이로다. 서로의 가치를 경청하면, 한 사람만으로는 보지 못할 보물을 발견하리라.',
  });

  // 4. 입(출납관) — 소통·표현 궁합
  const lipComplement = (a.lips.type === 'wide' && b.lips.type === 'small') ||
    (a.lips.type === 'small' && b.lips.type === 'wide');
  const lipScore = lipComplement ? 90 : (a.lips.type === b.lips.type ? 76 : 72);
  dims.push({
    key: 'communication',
    label: '소통 궁합 · 출납관',
    icon: '💬',
    score: lipScore,
    interpretation: lipComplement
      ? '한 분은 거문고를 타고 한 분은 그 울림을 듣는 형상이니, 출납관(出納官)의 음양이 완벽히 어우러진 금슬(琴瑟)의 상이로다. 말과 침묵이 번갈아 춤추듯, 완벽한 대화의 리듬을 이루리라.'
      : lipScore >= 76
      ? '출납관의 기운이 같은 음률(音律)로 울리니, 마치 합창의 화음처럼 편안한 소통이 이루어지리라. 서로의 말 끝에 꽃이 피어나는 인연이로다.'
      : '출납관의 선율이 다소 엇갈리나, 이는 독주(獨奏)와 독주가 만나 예상치 못한 이중주를 만들어낼 수 있는 기연이로다. 말 대신 눈빛으로, 눈빛 대신 손끝으로 마음을 전해보라.',
  });

  // 5. 얼굴형 — 인생관·생활 궁합
  const shapeComplement = (a.faceShape.type === 'oval' && b.faceShape.type === 'round') ||
    (a.faceShape.type === 'round' && b.faceShape.type === 'oval');
  const shapeScore = shapeComplement ? 88 : (a.faceShape.type === b.faceShape.type ? 82 : 70);
  dims.push({
    key: 'lifestyle',
    label: '생활 궁합 · 복덕궁',
    icon: '🏡',
    score: shapeScore,
    interpretation: shapeComplement
      ? '한 분은 돛을 올리는 항해자요, 한 분은 항구를 지키는 등대지기로다. 복덕궁(福德宮)이 서로를 완성하니, 모험과 안식이 공존하는 이상적인 가정을 이루리라. 바다와 항구가 함께해야 완전한 것이로다.'
      : shapeScore >= 80
      ? '복덕궁의 기운이 같은 지붕 아래를 향하니, 함께하는 일상이 고택(古宅)의 정원처럼 편안하고 깊으리라. 같은 리듬으로 호흡하는 자연스러운 인연이로다.'
      : '복덕궁의 방향이 다소 다르니, 한 지붕 아래 두 개의 정원을 가꾸는 지혜가 필요하리라. 서로의 공간을 존중하면, 오히려 만남의 순간이 더 소중해지리라.',
  });

  // 6. 삼정 조화 — 인생 시기 궁합
  if (a.samJeong && b.samJeong) {
    const samJeongDiff = Math.abs(a.samJeong.upperRatio - b.samJeong.upperRatio)
      + Math.abs(a.samJeong.middleRatio - b.samJeong.middleRatio)
      + Math.abs(a.samJeong.lowerRatio - b.samJeong.lowerRatio);
    const samJeongScore = Math.round(Math.max(50, 100 - samJeongDiff * 200));
    dims.push({
      key: 'timeline',
      label: '시기 궁합 · 삼정 조화',
      icon: '⏳',
      score: samJeongScore,
      interpretation: samJeongScore >= 80
        ? '삼정(三停)의 비율이 봄·여름·가을처럼 자연스레 맞물리도다. 上停(초년)에 함께 꿈을 심고, 中停(중년)에 함께 열매를 거두고, 下停(말년)에 함께 낙엽을 바라보는 — 인생 전체를 관통하는 천정(天定)의 인연이로다.'
        : samJeongScore >= 65
        ? '삼정의 흐름이 일부 엇갈리나, 이는 한 분이 봄일 때 다른 분은 여름인 형국이라, 서로의 계절을 채워주는 보완적 인연이로다. 기다림 끝에 함께하는 계절이 더 찬란하리라.'
        : '삼정의 시계가 서로 다른 속도로 흐르나, 이것이 곧 서로에게 다른 계절의 선물을 줄 수 있는 연(緣)이로다. 서로의 시간을 존중하고 기다려주는 인내가 만 가지 복을 부르리라.',
    });
  }

  return dims;
}

// 음양 판별: 양(+)=큰눈·넓은입·높은이마, 음(-)=작은눈·작은입·둥근형
function yinYangScore(features: ReturnType<typeof analyzeFaceFeatures>): number {
  if (!features) return 0;
  let score = 0;
  if (features.eyes.type === 'large') score += 1;
  if (features.eyes.type === 'small') score -= 1;
  if (features.lips.type === 'wide') score += 1;
  if (features.lips.type === 'small') score -= 1;
  if (features.forehead.type === 'high') score += 1;
  if (features.forehead.type === 'low') score -= 1;
  if (features.faceShape.type === 'oval') score += 0.5;
  if (features.faceShape.type === 'round') score -= 0.5;
  return Math.max(-1, Math.min(1, score / 3.5));
}

// 궁합 등급 판정
function harmonyGrade(score: number): { grade: string; emoji: string } {
  if (score >= 92) return { grade: '천생연분(天生緣分)', emoji: '💫' };
  if (score >= 82) return { grade: '금슬지합(琴瑟之合)', emoji: '✨' };
  if (score >= 72) return { grade: '좋은 인연(良緣)', emoji: '🌙' };
  if (score >= 60) return { grade: '보통 인연(普緣)', emoji: '🌿' };
  return { grade: '수양의 인연(修緣)', emoji: '🌱' };
}

// 종합 궁합 메시지 생성
function generateHarmonyMessage(totalScore: number, elemPair: { a: string; b: string; harmony: string }, yinA: number, yinB: number): string {
  const yinYangComplement = Math.abs(yinA - yinB);

  if (totalScore >= 90) {
    return `천상(天上)의 적선(赤線)이 두 분을 이은 인연이로다. ${ELEMENT_NAMES[elemPair.a]}과 ${ELEMENT_NAMES[elemPair.b]}이 상생하고, 음양이 해와 달처럼 완벽히 조화를 이루도다. 마치 은하수를 사이에 둔 견우와 직녀가 다리를 놓아 마침내 만난 듯, 천생연분(天生緣分)의 상이로다. 백년해로의 기운이 충만하며, 함께할수록 빛이 나는 명상(明相)이니라.`;
  }
  if (totalScore >= 80) {
    return `두 분의 오관(五官)에서 비단 실처럼 고운 조화의 기운이 흐르고 있도다. ${ELEMENT_NAMES[elemPair.a]}과 ${ELEMENT_NAMES[elemPair.b]}이 거문고와 비파처럼 서로를 보완하니, 함께 연주할수록 깊어지는 금슬지합(琴瑟之合)의 인연이로다. 한 분의 빈자리를 다른 분이 자연스레 채우는 하늘의 배필이니라.`;
  }
  if (totalScore >= 70) {
    return `좋은 인연(良緣)의 기운이 새벽 안개처럼 두 분 사이에 감도는도다. ${elemPair.harmony} 서로의 다름을 봄바람처럼 부드럽게 받아들이고 진심으로 소통한다면, 오래된 고목에서 새순이 돋듯 세월이 흐를수록 깊어지는 인연이 되리라.`;
  }
  if (yinYangComplement > 1) {
    return `음양(陰陽)의 기운차가 크니, 자석의 양극처럼 강하게 끌리되 서로를 이해하는 데 정성이 필요한 인연이로다. ${elemPair.harmony} 차이를 정면으로 마주하고 존중한다면, 폭포가 무지개를 만들듯 놀라운 아름다움을 이루리라.`;
  }
  return `${elemPair.harmony} 아직 새벽녘이라 서로의 윤곽이 선명하지 않으나, 동이 트면 전혀 예상치 못한 인연의 빛이 드러나리라. 마음의 문을 열고 천천히 한 걸음씩 다가가라.`;
}

// 조언 생성
function generateHarmonyAdvice(dims: HarmonyDimension[], elemPair: { a: string; b: string }): string {
  const weakest = dims.reduce((min, d) => d.score < min.score ? d : min, dims[0]);
  const strongest = dims.reduce((max, d) => d.score > max.score ? d : max, dims[0]);

  return `두 분의 천기(天氣) 중 가장 찬란히 빛나는 영역은 "${strongest.label}" (${strongest.score}점)이로다. 이 별자리를 길잡이 삼아 관계의 방향을 잡으면, 인연의 실이 더욱 단단해지리라. ` +
    `반면 "${weakest.label}" (${weakest.score}점)은 아직 새벽빛을 기다리는 별이니, 이 영역에서 서로의 마음을 조금 더 기울이면 전체 궁합의 기운이 크게 상승하리라. ` +
    `${ELEMENT_NAMES[elemPair.a]}과 ${ELEMENT_NAMES[elemPair.b]}의 기운이 합하여 최상의 조화를 이루려면, 보름달 아래 함께 걷거나 차(茶)를 나누는 고요한 시간을 가져보라. 서로의 기운을 자연스레 느끼리라.`;
}

/**
 * 두 사람의 관상을 비교하여 궁합 분석 결과를 반환
 */
export function analyzeFaceHarmony(
  landmarksA: any[],
  landmarksB: any[],
): HarmonyResult | null {
  const featA = analyzeFaceFeatures(landmarksA);
  const featB = analyzeFaceFeatures(landmarksB);
  if (!featA || !featB) return null;

  // 오행 원소 결정
  const elemA = faceElement(featA);
  const elemB = faceElement(featB);
  const elemHarmony = ELEMENT_HARMONY[elemA][elemB];

  // 오관 상보성 분석 (6개 차원)
  const dimensions = analyzeFeatureComplementarity(featA, featB);

  // 음양 균형
  const yinA = yinYangScore(featA);
  const yinB = yinYangScore(featB);
  const yinYangComplement = 1 - Math.abs(yinA + yinB) / 2; // closer to 0 sum = better

  // 종합 점수 계산
  const dimAvg = dimensions.reduce((s, d) => s + d.score, 0) / (dimensions.length || 1);
  const totalScore = Math.round(
    dimAvg * 0.5 +
    elemHarmony.score * 0.3 +
    yinYangComplement * 100 * 0.2
  );
  const clamped = Math.max(30, Math.min(99, totalScore));

  const { grade, emoji } = harmonyGrade(clamped);
  const elementPair = { a: elemA, b: elemB, harmony: elemHarmony.desc };
  const mainMessage = generateHarmonyMessage(clamped, elementPair, yinA, yinB);
  const advice = generateHarmonyAdvice(dimensions, { a: elemA, b: elemB });

  return {
    totalScore: clamped,
    grade,
    gradeEmoji: emoji,
    mainMessage,
    dimensions,
    advice,
    yinYangBalance: (yinA + yinB) / 2,
    elementPair,
  };
}
