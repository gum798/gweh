/**
 * 손가락 자세 분석 유틸리티
 * 400살 신령이 어린 인간에게 신비롭게 알려주는 컨셉
 */

// 손가락 자세 분석
export function analyzeFingerGesture(keypoints) {
  if (!keypoints || keypoints.length < 21) return null;

  // 각 손가락의 펼침/구부림 상태 분석
  const fingers = {
    thumb: analyzeThumb(keypoints),
    index: analyzeFinger(keypoints, [5, 6, 7, 8]),
    middle: analyzeFinger(keypoints, [9, 10, 11, 12]),
    ring: analyzeFinger(keypoints, [13, 14, 15, 16]),
    pinky: analyzeFinger(keypoints, [17, 18, 19, 20]),
  };

  // 손가락 벌림 정도 분석
  const spreadLevel = analyzeFingerSpread(keypoints);

  // 구부린 손가락 개수
  const bentFingers = Object.values(fingers).filter(f => f.isBent).length;
  const extendedFingers = Object.values(fingers).filter(f => !f.isBent).length;

  // 자세 유형 판정
  const gestureType = determineGestureType(fingers, spreadLevel, bentFingers);

  return {
    fingers,
    spreadLevel,
    bentFingers,
    extendedFingers,
    gestureType,
    interpretation: interpretGesture(gestureType, fingers, spreadLevel),
  };
}

// 엄지 분석 (다른 손가락과 구조가 다름)
function analyzeThumb(keypoints) {
  const base = keypoints[2];
  const mid = keypoints[3];
  const tip = keypoints[4];
  const wrist = keypoints[0];

  // 엄지가 손바닥에서 멀리 있으면 펴진 것
  const distanceFromPalm = Math.sqrt(
    Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2)
  );
  const baseDistance = Math.sqrt(
    Math.pow(base.x - wrist.x, 2) + Math.pow(base.y - wrist.y, 2)
  );

  const extension = distanceFromPalm / baseDistance;
  const isBent = extension < 1.3;

  return { isBent, extension };
}

// 일반 손가락 분석 (검지~소지)
function analyzeFinger(keypoints, indices) {
  const [baseIdx, pip, dip, tipIdx] = indices;
  const base = keypoints[baseIdx];
  const tip = keypoints[tipIdx];
  const mid = keypoints[dip];

  // 손가락 끝이 기저부보다 위에 있으면 펴진 것 (y가 작으면 위)
  // 각도로도 확인
  const fingerVector = { x: tip.x - base.x, y: tip.y - base.y };
  const fingerLength = Math.sqrt(fingerVector.x ** 2 + fingerVector.y ** 2);

  // 중간 마디가 직선에서 벗어난 정도
  const midToLine = pointToLineDistance(base, tip, mid);
  const curvature = midToLine / fingerLength;

  // 손가락 끝이 기저부보다 아래로 내려갔으면 구부린 것
  const isBent = tip.y > base.y + 20 || curvature > 0.15;

  return { isBent, curvature, length: fingerLength };
}

// 점과 직선 사이 거리
function pointToLineDistance(lineStart, lineEnd, point) {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq !== 0 ? dot / lenSq : -1;

  let xx, yy;
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  return Math.sqrt((point.x - xx) ** 2 + (point.y - yy) ** 2);
}

// 손가락 벌림 정도 분석
function analyzeFingerSpread(keypoints) {
  // 손가락 끝 사이 거리 측정
  const tips = [
    keypoints[8],  // 검지
    keypoints[12], // 중지
    keypoints[16], // 약지
    keypoints[20], // 소지
  ];

  let totalSpread = 0;
  for (let i = 0; i < tips.length - 1; i++) {
    const dist = Math.sqrt(
      Math.pow(tips[i + 1].x - tips[i].x, 2) +
      Math.pow(tips[i + 1].y - tips[i].y, 2)
    );
    totalSpread += dist;
  }

  // 손 크기로 정규화 (손목~중지 끝)
  const handSize = Math.sqrt(
    Math.pow(keypoints[12].x - keypoints[0].x, 2) +
    Math.pow(keypoints[12].y - keypoints[0].y, 2)
  );

  const normalizedSpread = totalSpread / handSize;

  if (normalizedSpread > 1.2) return 'wide';      // 쫙 펼침
  if (normalizedSpread > 0.8) return 'normal';    // 보통
  if (normalizedSpread > 0.5) return 'close';     // 가지런히 붙임
  return 'tight';                                  // 꽉 모음
}

// 자세 유형 판정
function determineGestureType(fingers, spreadLevel, bentFingers) {
  const fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky'];
  const bentList = fingerNames.filter(name => fingers[name].isBent);

  // 모든 손가락을 쫙 펼침
  if (bentFingers === 0 && spreadLevel === 'wide') {
    return 'openWide';
  }

  // 모든 손가락을 가지런히 붙임
  if (bentFingers === 0 && (spreadLevel === 'close' || spreadLevel === 'tight')) {
    return 'closedTogether';
  }

  // 주먹
  if (bentFingers >= 4) {
    return 'fist';
  }

  // 손가락 하나만 구부림
  if (bentFingers === 1) {
    return `oneBent_${bentList[0]}`;
  }

  // 손가락 하나만 펼침
  if (bentFingers === 4) {
    const extended = fingerNames.find(name => !fingers[name].isBent);
    return `oneExtended_${extended}`;
  }

  // 검지와 중지만 펼침 (V자)
  if (!fingers.index.isBent && !fingers.middle.isBent &&
      fingers.ring.isBent && fingers.pinky.isBent) {
    return 'victory';
  }

  // 엄지만 펼침
  if (!fingers.thumb.isBent && bentFingers === 4) {
    return 'thumbsUp';
  }

  return 'mixed';
}

// 신비로운 해석 생성
function interpretGesture(gestureType, fingers, spreadLevel) {
  const interpretations = {
    openWide: {
      personality: [
        '허허... 손가락을 활짝 펴는구나. 그대에게서 큰 기백이 느껴지느니라.',
        '자신감이 충만하고 세상을 향해 열린 마음을 품었도다.',
        '두려움 없이 나아가는 용기가 있으니, 큰 뜻을 이루리라.',
      ],
      health: [
        '기혈이 막힘없이 흐르니 몸과 마음이 건강하도다.',
        '손끝까지 힘이 뻗치니 활력이 넘치는 상이로다.',
      ],
      trait: '개방적이고 자신감 넘치는 성정',
    },
    closedTogether: {
      personality: [
        '음... 손가락을 가지런히 모았구나. 신중하고 치밀한 성품이로다.',
        '차분하게 생각을 정리하는 자이니, 실수가 적으리라.',
        '절제와 규율을 아는 자이니, 맡은 바를 완수하리라.',
      ],
      health: [
        '마음이 안정되어 있으나, 때로는 긴장을 풀어야 하느니라.',
        '조심성이 있어 큰 탈은 없으나, 어깨에 힘을 빼라.',
      ],
      trait: '신중하고 절제력 있는 성정',
    },
    fist: {
      personality: [
        '호오... 주먹을 쥐었구나. 강한 의지와 결단력이 느껴지느니라.',
        '목표를 향해 돌진하는 추진력이 있으나, 때론 유연함도 필요하니라.',
        '분노나 열정이 가슴에 차 있으니, 그 힘을 바른 곳에 쓰라.',
      ],
      health: [
        '힘이 응축되어 있으니 스트레스 관리에 힘쓰라.',
        '간과 담에 열이 있을 수 있으니, 마음을 가라앉히라.',
      ],
      trait: '의지가 강하고 결단력 있는 성정',
    },
    oneBent_index: {
      personality: [
        '검지를 구부렸구나... 세상을 향한 지시나 명령에 의문을 품는 자이로다.',
        '남의 말을 쉬이 따르지 않으니, 자신만의 길을 걷는 상이니라.',
      ],
      health: [
        '목과 어깨에 긴장이 있을 수 있으니 펴주어라.',
      ],
      trait: '독립적이고 비판적 사고를 하는 성정',
    },
    oneBent_middle: {
      personality: [
        '중지를 구부렸구나... 균형의 중심이 흔들리는 것을 경계하는 자이로다.',
        '책임감이 있으나 때론 그 무게에 지칠 때가 있느니라.',
      ],
      health: [
        '척추와 허리 건강에 신경 쓰라. 중심을 잡는 것이 중요하니라.',
      ],
      trait: '책임감이 강하나 부담을 느끼는 성정',
    },
    oneBent_ring: {
      personality: [
        '약지를 구부렸구나... 감정이나 관계에서 조심스러운 자이로다.',
        '마음을 쉬이 열지 않으니, 신뢰를 얻기까지 시간이 필요하리라.',
      ],
      health: [
        '심장과 혈액순환에 관심을 가지라. 따뜻한 차가 좋으니라.',
      ],
      trait: '감정에 신중하고 관계를 소중히 여기는 성정',
    },
    oneBent_pinky: {
      personality: [
        '소지를 구부렸구나... 약속이나 인연에 대해 생각이 깊은 자이로다.',
        '작은 것에서 의미를 찾으니, 섬세한 성품이로다.',
      ],
      health: [
        '신장과 방광의 기운에 신경 쓰라. 물을 충분히 마시라.',
      ],
      trait: '섬세하고 인연을 중시하는 성정',
    },
    oneBent_thumb: {
      personality: [
        '엄지를 구부렸구나... 자아와 의지에 대해 고민이 있는 자이로다.',
        '확신이 흔들릴 때이니, 스스로를 믿으라.',
      ],
      health: [
        '폐와 호흡에 관심을 가지라. 깊은 숨이 도움이 되리라.',
      ],
      trait: '자아 성찰을 하는 시기',
    },
    oneExtended_index: {
      personality: [
        '검지만 펴서 세상을 가리키는구나. 방향을 제시하는 자의 기상이로다.',
        '리더십이 있으나, 독단에 빠지지 않도록 경계하라.',
      ],
      health: [
        '목과 갑상선 건강에 관심을 가지라.',
      ],
      trait: '지도력과 결단력이 있는 성정',
    },
    oneExtended_middle: {
      personality: [
        '허허... 중지를 세웠구나. 세상에 대한 불만이나 저항심이 있는 자이로다.',
        '용기는 있으나, 그 힘을 건설적으로 쓰라.',
      ],
      health: [
        '간에 열이 있을 수 있으니 화를 다스리라.',
      ],
      trait: '반항적이나 용기 있는 성정',
    },
    victory: {
      personality: [
        '승리의 표시로구나! 낙천적이고 긍정적인 기운이 넘치는 자이로다.',
        '어려움 속에서도 희망을 찾으니, 주변을 밝히리라.',
      ],
      health: [
        '기혈이 원활하니 건강하도다. 그 밝은 기운을 유지하라.',
      ],
      trait: '낙천적이고 희망을 품은 성정',
    },
    thumbsUp: {
      personality: [
        '엄지를 치켜세웠구나! 긍정과 격려의 마음을 품은 자이로다.',
        '스스로를 믿고 남도 북돋우니, 귀한 품성이로다.',
      ],
      health: [
        '활력이 넘치는 상이로다. 그 기운을 잘 유지하라.',
      ],
      trait: '긍정적이고 격려하는 성정',
    },
    mixed: {
      personality: [
        '여러 생각이 교차하는 상이로다. 마음이 복잡한 시기이니라.',
        '다양한 면모를 가진 자이니, 한 가지로 규정하기 어렵도다.',
      ],
      health: [
        '마음을 정리하면 몸도 따라 편안해지리라.',
      ],
      trait: '복잡하고 다면적인 성정',
    },
  };

  const interp = interpretations[gestureType] || interpretations.mixed;

  return {
    gestureType,
    gestureName: getGestureName(gestureType),
    personality: interp.personality[Math.floor(Math.random() * interp.personality.length)],
    health: interp.health[Math.floor(Math.random() * interp.health.length)],
    trait: interp.trait,
    spreadDescription: getSpreadDescription(spreadLevel),
  };
}

// 자세 이름
function getGestureName(gestureType) {
  const names = {
    openWide: '활짝 편 손',
    closedTogether: '가지런히 모은 손',
    fist: '주먹 쥔 손',
    oneBent_thumb: '엄지를 구부린 손',
    oneBent_index: '검지를 구부린 손',
    oneBent_middle: '중지를 구부린 손',
    oneBent_ring: '약지를 구부린 손',
    oneBent_pinky: '소지를 구부린 손',
    oneExtended_index: '검지만 편 손',
    oneExtended_middle: '중지만 편 손',
    oneExtended_thumb: '엄지만 편 손',
    victory: '승리의 V',
    thumbsUp: '엄지 척',
    mixed: '여러 모양의 손',
  };
  return names[gestureType] || '손';
}

// 벌림 정도 설명
function getSpreadDescription(spreadLevel) {
  const descriptions = {
    wide: '손가락이 활짝 펴져 기운이 사방으로 뻗치는도다.',
    normal: '손가락이 자연스럽게 펴져 조화로운 상이로다.',
    close: '손가락이 가지런하니 절제력이 있는 상이로다.',
    tight: '손가락이 꽉 모였으니 집중력이 강한 상이로다.',
  };
  return descriptions[spreadLevel] || '';
}
