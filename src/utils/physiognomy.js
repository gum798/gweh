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

// 얼굴 특징 분석
export function analyzeFaceFeatures(landmarks) {
  if (!landmarks || landmarks.length < 468) {
    return null;
  }

  // 얼굴 기준 크기 (눈 사이 거리)
  const leftEyeCenter = landmarks[33];
  const rightEyeCenter = landmarks[263];
  const eyeDistance = distance(leftEyeCenter, rightEyeCenter);

  // 이마 분석
  const foreheadTop = landmarks[10];
  const foreheadBottom = landmarks[168]; // 눈썹 사이
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

  // 눈 분석
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

  // 코 분석
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

  // 입 분석
  const lipLeft = landmarks[61];
  const lipRight = landmarks[291];
  const lipWidth = distance(lipLeft, lipRight);
  const lipRatio = lipWidth / eyeDistance;

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

  return {
    forehead: { type: foreheadType, ratio: foreheadRatio },
    eyes: { type: eyeType, ratio: eyeRatio },
    nose: { type: noseType, ratio: noseRatio },
    lips: { type: lipType, ratio: lipRatio },
    faceShape: { type: faceShape, ratio: faceShapeRatio },
  };
}

// 관상 해석 메시지
const physiognomyOmens = {
  forehead: {
    high: [
      '이마가 넓고 높으니 지혜가 깊은 상이로다. 학문과 사색에 재능이 있으리라.',
      '높은 이마는 선천적 복록의 징표이니, 귀인의 도움이 끊이지 않으리라.',
      '하늘의 기운을 많이 받은 상이니, 직관력이 뛰어나리라.',
    ],
    low: [
      '이마가 단정하니 실용적인 지혜를 품었도다. 현실에서 성공을 거두리라.',
      '집중력이 강한 상이니, 한 분야에서 깊은 성취를 이루리라.',
      '착실한 기운이 서려 있으니, 꾸준함으로 큰 일을 이루리라.',
    ],
    balanced: [
      '이마가 조화로우니 문무를 겸비한 상이로다.',
      '균형 잡힌 지혜를 품었으니, 어떤 일에도 막힘이 없으리라.',
    ],
  },
  eyes: {
    large: [
      '눈이 크고 맑으니 감성이 풍부한 상이로다. 예술에 재능이 있으리라.',
      '세상을 넓게 보는 눈을 가졌으니, 통찰력이 뛰어나리라.',
      '열린 마음의 상이니, 사람과의 인연이 풍성하리라.',
    ],
    small: [
      '눈에 깊이가 있으니 집중력이 강한 상이로다. 전문 분야에서 두각을 나타내리라.',
      '신중한 눈매는 지혜의 표식이니, 실수가 적으리라.',
      '관찰력이 뛰어난 상이니, 작은 것도 놓치지 않으리라.',
    ],
    balanced: [
      '눈이 조화로우니 이성과 감성이 균형 잡힌 상이로다.',
      '맑은 눈은 진실을 보는 힘이 있으니, 사람을 잘 알아보리라.',
    ],
  },
  nose: {
    long: [
      '코가 오뚝하니 자존심이 강하고 주관이 뚜렷한 상이로다.',
      '높은 코는 재복의 징표이니, 중년에 재물이 모이리라.',
      '리더의 상이니, 사람을 이끄는 능력이 있으리라.',
    ],
    short: [
      '코가 단정하니 원만한 성품을 지닌 상이로다. 협력에 능하리라.',
      '친화력이 강한 상이니, 어디서든 환영받으리라.',
      '겸손한 기운이 있으니, 귀인이 스스로 찾아오리라.',
    ],
    balanced: [
      '코가 조화로우니 재물과 인연이 모두 좋은 상이로다.',
      '중용을 아는 상이니, 큰 실패가 없으리라.',
    ],
  },
  lips: {
    wide: [
      '입이 크니 표현력이 뛰어난 상이로다. 말로 사람을 움직이리라.',
      '넓은 입은 식록의 상이니, 먹을 복이 많으리라.',
      '호탕한 기운이 있으니, 사람들이 따르리라.',
    ],
    small: [
      '입이 단정하니 신중한 언행의 상이로다. 말에 무게가 실리리라.',
      '섬세한 표현력을 가졌으니, 글재주가 있으리라.',
      '비밀을 잘 지키는 상이니, 신뢰를 얻으리라.',
    ],
    balanced: [
      '입이 조화로우니 언변과 신중함을 겸비한 상이로다.',
      '적절한 때에 적절한 말을 하는 지혜가 있으리라.',
    ],
  },
  faceShape: {
    oval: [
      '계란형 얼굴은 귀한 상이니, 일생에 큰 어려움이 없으리라.',
      '조화로운 얼굴형은 복이 고르다는 징표이로다.',
    ],
    round: [
      '둥근 얼굴은 복스러운 상이니, 식복과 인복이 모두 있으리라.',
      '원만한 얼굴형은 사람과의 화합을 뜻하니, 인연이 좋으리라.',
    ],
    balanced: [
      '균형 잡힌 얼굴형은 만사에 조화를 이루는 상이로다.',
      '과하지도 모자라지도 않으니, 중도를 걷는 지혜가 있으리라.',
    ],
  },
};

// 관상 종합 해석 생성
export function interpretPhysiognomy(features) {
  if (!features) return null;

  const interpretations = [];

  // 각 부위별 해석
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
  const messages = [
    '그대의 얼굴에서 복된 기운이 흐르도다. 타고난 상이 좋으니 일생이 평탄하리라.',
    '하늘이 내린 상을 가졌으니, 운명이 그대를 도우리라.',
    '귀한 상을 타고났으니, 큰 뜻을 품어도 좋으리라.',
    '천생의 복상이니, 노력에 따라 큰 성취가 있으리라.',
  ];

  // 특징에 따른 추가 메시지
  if (features.forehead.type === 'high' && features.eyes.type === 'large') {
    return '지혜와 통찰이 함께하는 귀한 상이로다. 학문과 예술에 뛰어나리라.';
  }

  if (features.nose.type === 'long' && features.lips.type === 'wide') {
    return '재물과 인복이 함께하는 상이니, 중년 이후 크게 번성하리라.';
  }

  if (features.faceShape.type === 'round' && features.lips.type === 'wide') {
    return '먹을 복과 인연이 넘치는 상이니, 일생 풍요롭게 살리라.';
  }

  return messages[Math.floor(Math.random() * messages.length)];
}
