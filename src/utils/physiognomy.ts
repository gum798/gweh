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

// 오행 상생·상극 궁합표
const ELEMENT_HARMONY: Record<string, Record<string, { score: number; desc: string }>> = {
  wood:  { wood: { score: 70, desc: '동기목(同氣木) — 같은 기운이라 이해가 깊으나, 때로 양보가 필요하리라' }, fire: { score: 95, desc: '목생화(木生火) — 나무가 불을 일으키듯, 서로에게 영감을 불어넣는 상생의 인연이로다' }, earth: { score: 55, desc: '목극토(木剋土) — 나무가 땅을 뚫으니, 성장을 위한 선의의 긴장이 있으리라' }, metal: { score: 40, desc: '금극목(金剋木) — 쇠가 나무를 베니, 서로 다듬어주되 상처에 주의할지니라' }, water: { score: 90, desc: '수생목(水生木) — 물이 나무를 기르듯, 서로를 성장시키는 아름다운 인연이로다' } },
  fire:  { wood: { score: 90, desc: '목생화(木生火) — 서로에게 활력을 불어넣는 최상의 인연이로다' }, fire: { score: 65, desc: '동기화(同氣火) — 열정이 넘치나, 둘 다 물러서지 않으니 조율이 필요하리라' }, earth: { score: 88, desc: '화생토(火生土) — 불이 흙을 만드니, 함께할수록 단단해지는 인연이로다' }, metal: { score: 45, desc: '화극금(火剋金) — 불이 쇠를 녹이니, 변화와 성장이 크나 인내가 필요하리라' }, water: { score: 35, desc: '수극화(水剋火) — 물이 불을 끄니, 서로의 열정을 존중하는 지혜가 필요하리라' } },
  earth: { wood: { score: 50, desc: '목극토(木剋土) — 서로의 차이를 인정하면 깊은 성장이 있으리라' }, fire: { score: 92, desc: '화생토(火生土) — 열정이 안정을 만드니, 이상적인 짝이로다' }, earth: { score: 75, desc: '동기토(同氣土) — 같은 대지의 기운이라 안정감이 넘치나 변화도 필요하리라' }, metal: { score: 88, desc: '토생금(土生金) — 땅에서 보석이 나오듯, 함께하면 귀한 것을 만들어내리라' }, water: { score: 42, desc: '토극수(土剋水) — 흙이 물을 막으니, 소통의 물꼬를 터주어야 하리라' } },
  metal: { wood: { score: 45, desc: '금극목(金剋木) — 서로 다듬는 관계이니, 날카로움을 부드러움으로 감싸라' }, fire: { score: 40, desc: '화극금(火剋金) — 불과 쇠의 만남이니, 단련을 통해 명검이 될 수 있으리라' }, earth: { score: 92, desc: '토생금(土生金) — 안정 속에서 빛이 나는 보석 같은 인연이로다' }, metal: { score: 68, desc: '동기금(同氣金) — 날카로운 통찰력이 함께하나, 양보의 미학이 필요하리라' }, water: { score: 90, desc: '금생수(金生水) — 쇠에서 이슬이 맺히듯, 서로의 지혜를 길러주는 상생이로다' } },
  water: { wood: { score: 88, desc: '수생목(水生木) — 물이 나무를 기르니, 헌신과 성장의 인연이로다' }, fire: { score: 38, desc: '수극화(水剋火) — 기운이 상반되나, 균형을 이루면 하늘과 땅의 조화로다' }, earth: { score: 48, desc: '토극수(土剋水) — 서로의 흐름을 이해하면 비옥한 대지를 이루리라' }, metal: { score: 92, desc: '금생수(金生水) — 쇠가 물을 낳으니, 서로에게 지혜를 선사하는 귀한 인연이로다' }, water: { score: 72, desc: '동기수(同氣水) — 깊은 공감이 흐르나, 방향을 잡아줄 중심이 필요하리라' } },
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
      ? '두 분의 관록궁이 조화롭게 맞물리니, 지적 대화가 끊이지 않고 서로의 생각을 자극하는 상이로다.'
      : foreheadCompat >= 65
      ? '지적 성향이 비슷하니 편안한 대화가 오가나, 새로운 관점을 열어주는 노력이 필요하리라.'
      : '관록궁의 기운이 다르니, 서로 다른 지혜를 나누어 한층 넓은 세상을 보리라.',
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
      ? '한 분은 넓게 보고 한 분은 깊이 보니, 감찰관의 상보(相補)가 완벽한 상이로다. 서로의 눈이 되어주리라.'
      : eyeScore >= 78
      ? '감찰관의 기운이 비슷하니 감성의 교류가 깊으리라. 같은 것을 보고 같은 것을 느끼는 인연이로다.'
      : '눈의 기운이 다르니, 서로의 시선을 따라가 보면 새로운 세계가 열리리라.',
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
      ? '재백궁의 기운이 서로 통하니, 재물관과 인생 가치관이 일치하여 함께 부를 이루리라.'
      : '재백궁의 방향이 다소 다르니, 재물에 대한 대화를 충분히 나누어 합일점을 찾으라.',
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
      ? '한 분이 말하면 한 분이 들으니, 출납관의 음양이 완벽하게 조화로운 상이로다.'
      : lipScore >= 76
      ? '출납관의 기운이 비슷하여 편안한 소통이 이루어지리라.'
      : '소통의 방식이 다르니, 말보다 마음을 먼저 전하는 연습이 필요하리라.',
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
      ? '한 분은 진취적이고 한 분은 포용적이니, 삶의 방향과 안정을 동시에 갖춘 최상의 짝이로다.'
      : shapeScore >= 80
      ? '생활 패턴이 비슷하여 함께하는 일상이 편안하고 자연스러우리라.'
      : '생활 리듬이 다소 다르니, 서로의 공간을 존중하며 조율하면 좋으리라.',
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
        ? '삼정(초년·중년·말년)의 비율이 서로 조화롭게 맞물리니, 인생의 모든 시기를 함께 걸어갈 인연이로다.'
        : samJeongScore >= 65
        ? '삼정의 흐름이 일부 엇갈리나, 서로의 부족한 시기를 채워주는 보완적 인연이로다.'
        : '삼정의 리듬이 다르니, 서로의 시기를 이해하고 기다려주는 인내가 복을 부르리라.',
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
    return `하늘이 점지한 인연이로다. ${ELEMENT_NAMES[elemPair.a]}과 ${ELEMENT_NAMES[elemPair.b]}이 상생하고, 음양이 완벽히 조화를 이루니 두 분은 마치 해와 달처럼 서로를 빛내는 천생연분의 상이로다. 백년해로할 기운이 충만하도다.`;
  }
  if (totalScore >= 80) {
    return `두 분의 오관에서 조화로운 기운이 흐르고 있도다. ${ELEMENT_NAMES[elemPair.a]}과 ${ELEMENT_NAMES[elemPair.b]}이 서로를 보완하니, 함께할수록 빛이 나는 금슬지합의 인연이로다. 서로의 부족한 면을 자연스레 채워주리라.`;
  }
  if (totalScore >= 70) {
    return `좋은 인연의 기운이 감지되도다. ${elemPair.harmony} 서로의 다름을 인정하고 소통에 힘쓰면, 세월이 흐를수록 깊어지는 인연이 되리라.`;
  }
  if (yinYangComplement > 1) {
    return `음양의 차이가 크니, 서로 끌리는 힘은 강하나 이해에 노력이 필요한 인연이로다. ${elemPair.harmony} 차이를 존중하면 놀라운 시너지를 이루리라.`;
  }
  return `${elemPair.harmony} 아직 서로를 알아가는 시기이니, 마음을 열고 천천히 다가가면 뜻밖의 인연이 드러나리라.`;
}

// 조언 생성
function generateHarmonyAdvice(dims: HarmonyDimension[], elemPair: { a: string; b: string }): string {
  const weakest = dims.reduce((min, d) => d.score < min.score ? d : min, dims[0]);
  const strongest = dims.reduce((max, d) => d.score > max.score ? d : max, dims[0]);

  return `두 분의 가장 빛나는 궁합은 "${strongest.label}" (${strongest.score}점)이니, 이 영역을 중심으로 관계를 키워나가면 좋으리라. ` +
    `"${weakest.label}" (${weakest.score}점)이 상대적으로 약하니, 이 부분에서 서로 배려하고 소통하면 궁합의 기운이 한층 올라가리라. ` +
    `${ELEMENT_NAMES[elemPair.a]}과 ${ELEMENT_NAMES[elemPair.b]}의 조화를 위해, 함께하는 시간 속에서 서로의 기운을 느껴보라.`;
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
