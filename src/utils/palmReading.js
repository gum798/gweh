import { getLineQualityKorean } from './palmLineDetector';

// 손 크기별 해석
const handSizeOmens = {
  large: [
    '큰 손은 큰 뜻을 품은 상이니, 세상을 품을 그릇이 있도다.',
    '넓은 손바닥은 재물을 모으는 상이니, 부귀가 따르리라.',
    '대인의 손이니, 사람을 이끄는 힘이 있도다.',
  ],
  medium: [
    '조화로운 손은 균형 잡힌 삶을 뜻하니, 과불급 없이 살리라.',
    '적절한 크기의 손은 실용적 지혜를 품었도다.',
    '만사에 두루 능한 손이니, 어떤 일이든 해내리라.',
  ],
  small: [
    '섬세한 손은 정교한 일에 능하니, 예술의 재능이 있도다.',
    '영리한 손이니, 작은 것에서 큰 가치를 찾으리라.',
    '민첩한 손은 기회를 빠르게 잡는 상이로다.',
  ],
};

// 손가락 비율별 해석
const fingerTypeOmens = {
  ringDominant: [
    '약지가 긴 손은 결단력이 강한 상이니, 승부에 강하리라.',
    '행동력이 앞서는 상이니, 실천으로 성취를 이루리라.',
    '모험심이 있는 손이니, 새로운 도전에서 성공하리라.',
  ],
  indexDominant: [
    '검지가 긴 손은 리더십이 강한 상이니, 사람을 이끌리라.',
    '자기 확신이 강한 상이니, 주관이 뚜렷하리라.',
    '야망이 있는 손이니, 높은 곳을 향해 나아가리라.',
  ],
  balanced: [
    '균형 잡힌 손가락은 조화로운 성품을 뜻하니, 인화가 좋으리라.',
    '이성과 감성이 조화를 이룬 상이니, 판단이 정확하리라.',
    '중용을 아는 손이니, 극단에 빠지지 않으리라.',
  ],
};

// 손바닥 형태별 해석
const palmTypeOmens = {
  long: [
    '긴 손바닥은 직관력이 강한 상이니, 예감이 잘 맞으리라.',
    '깊이 생각하는 손이니, 학문에 재능이 있도다.',
    '예술적 감성이 풍부한 상이니, 아름다움을 추구하리라.',
  ],
  square: [
    '네모난 손바닥은 실용적인 상이니, 현실에서 성공하리라.',
    '안정적인 손이니, 신뢰를 주는 상이로다.',
    '조직력이 뛰어난 상이니, 체계적으로 일을 처리하리라.',
  ],
  balanced: [
    '조화로운 손바닥은 이상과 현실의 균형을 뜻하니, 두루 통달하리라.',
    '유연한 손이니, 어떤 상황에도 적응하리라.',
    '다재다능한 상이니, 여러 분야에서 능력을 발휘하리라.',
  ],
};

// 손금 라인별 해석 (품질에 따라)
const lineOmens = {
  lifeLine: {
    strong: '생명선이 깊고 선명하니 강건한 체력을 타고났도다. 장수하며 큰 병 없이 살리라.',
    clear: '생명선이 뚜렷하니 건강한 기운이 넘치도다. 활력 있는 삶을 살리라.',
    moderate: '생명선이 보통이니 평범하게 건강하리라. 건강 관리에 힘쓰면 좋으리라.',
    faint: '생명선이 옅으니 체력 관리가 필요하도다. 규칙적인 생활이 도움이 되리라.',
    unclear: '생명선을 찾기 어려우니, 손바닥을 더 펴고 다시 살펴보라.',
  },
  headLine: {
    strong: '두뇌선이 깊고 길으니 지혜가 뛰어나도다. 학문에 큰 성취가 있으리라.',
    clear: '두뇌선이 맑으니 명석한 두뇌를 타고났도다. 계획이 빈틈없으리라.',
    moderate: '두뇌선이 보통이니 실용적 지혜가 있도다. 경험을 통해 성장하리라.',
    faint: '두뇌선이 옅으니 직관에 의지하는 편이로다. 감성이 이성을 앞서리라.',
    unclear: '두뇌선을 찾기 어려우니, 조명을 밝게 하고 다시 살펴보라.',
  },
  heartLine: {
    strong: '감정선이 깊고 길으니 정이 깊은 상이로다. 사랑에 진심을 다하리라.',
    clear: '감정선이 뚜렷하니 따스한 마음을 품었도다. 인연이 풍성하리라.',
    moderate: '감정선이 보통이니 감정의 균형을 이루었도다. 이성과 감성이 조화롭리라.',
    faint: '감정선이 옅으니 감정을 표현하기 어려워하는도다. 마음을 여는 것이 좋으리라.',
    unclear: '감정선을 찾기 어려우니, 손을 편히 펴고 다시 살펴보라.',
  },
  fateLine: {
    strong: '운명선이 깊고 뚜렷하니 큰 뜻을 이룰 상이로다. 사회적 성취가 크리라.',
    clear: '운명선이 선명하니 목표가 뚜렷한 상이로다. 한 길을 꾸준히 걸으리라.',
    moderate: '운명선이 보통이니 자신의 길을 찾아가는 중이로다. 때가 되면 빛나리라.',
    faint: '운명선이 옅으니 자유로운 삶을 추구하는도다. 틀에 얽매이지 않으리라.',
    unclear: '운명선을 찾기 어려우니 아직 운명이 정해지지 않았도다. 스스로 만들어가리라.',
  },
};

const lineLabels = {
  lifeLine: { name: '생명선', icon: '💚', description: '엄지와 검지 사이에서 손목으로 휘어지는 선' },
  headLine: { name: '두뇌선', icon: '🧠', description: '손바닥 가로로 뻗은 선 (감정선 아래)' },
  heartLine: { name: '감정선', icon: '💗', description: '손가락 바로 아래 가로선' },
  fateLine: { name: '운명선', icon: '⭐', description: '손바닥 중앙 세로선' },
};

// 종합 손금 해석
export function interpretPalm(handFeatures, palmLines = null) {
  if (!handFeatures) return null;

  const interpretations = [];

  // 손 크기 해석
  const sizeOmens = handSizeOmens[handFeatures.handSize];
  interpretations.push({
    category: '손의 크기',
    icon: '✋',
    type: handFeatures.handSize === 'large' ? '큰 손' :
          handFeatures.handSize === 'small' ? '섬세한 손' : '조화로운 손',
    message: sizeOmens[Math.floor(Math.random() * sizeOmens.length)],
    isDetected: true,
  });

  // 손가락 비율 해석
  const fingerOmens = fingerTypeOmens[handFeatures.fingerType];
  interpretations.push({
    category: '손가락 비율',
    icon: '👆',
    type: handFeatures.fingerType === 'ringDominant' ? '약지 우세' :
          handFeatures.fingerType === 'indexDominant' ? '검지 우세' : '균형',
    message: fingerOmens[Math.floor(Math.random() * fingerOmens.length)],
    isDetected: true,
  });

  // 손바닥 형태 해석
  const palmOmens = palmTypeOmens[handFeatures.palmType];
  interpretations.push({
    category: '손바닥 형태',
    icon: '🖐️',
    type: handFeatures.palmType === 'long' ? '긴 손바닥' :
          handFeatures.palmType === 'square' ? '네모난 손바닥' : '조화로운 형태',
    message: palmOmens[Math.floor(Math.random() * palmOmens.length)],
    isDetected: true,
  });

  // 실제 감지된 손금 라인 해석
  const lineTypes = ['lifeLine', 'headLine', 'heartLine', 'fateLine'];

  lineTypes.forEach(lineType => {
    const lineInfo = lineLabels[lineType];
    let quality = 'unclear';
    let isDetected = false;
    let strength = 0;

    // 실제 감지된 손금이 있으면 사용
    if (palmLines && palmLines[lineType]) {
      const line = palmLines[lineType];
      quality = line.quality;
      isDetected = line.detected;
      strength = line.strength;
    }

    const message = lineOmens[lineType][quality];

    interpretations.push({
      category: lineInfo.name,
      icon: lineInfo.icon,
      type: isDetected ? getLineQualityKorean(quality) : '감지 중...',
      message,
      isDetected,
      strength: Math.round(strength),
      description: lineInfo.description,
    });
  });

  // 메인 메시지 생성
  const mainMessage = generateMainMessage(handFeatures, palmLines);

  return {
    mainMessage,
    details: interpretations,
    handFeatures,
    palmLines,
  };
}

function generateMainMessage(features, palmLines) {
  // 손금이 감지되었으면 손금 기반 메시지
  if (palmLines) {
    const detectedLines = Object.values(palmLines).filter(l => l.detected);

    if (detectedLines.length >= 3) {
      const strongLines = detectedLines.filter(l => l.quality === 'strong' || l.quality === 'clear');
      if (strongLines.length >= 2) {
        return '손금이 선명하고 뚜렷하니, 타고난 운이 강한 상이로다. 복록이 넘치리라.';
      }
      return '손금을 살피니 길한 기운이 흐르도다. 손에 담긴 운명대로 살아가리라.';
    }
  }

  // 손 특성 기반 메시지
  const messages = [
    '그대의 손에서 길한 기운이 흐르도다. 손금에 복록이 담겨 있으니 평안하리라.',
    '손에 담긴 운명을 살피니, 하늘이 도우리라.',
    '귀한 손이니, 이 손으로 하는 일마다 복이 깃들리라.',
    '손바닥에 좋은 기운이 서려 있으니, 앞날이 밝도다.',
  ];

  // 특성 조합에 따른 메시지
  if (features.handSize === 'large' && features.palmType === 'square') {
    return '큰 손에 든든한 손바닥이니, 재물과 권세가 따르는 상이로다.';
  }

  if (features.fingerType === 'indexDominant' && features.palmType === 'long') {
    return '리더의 기질에 깊은 생각을 겸비했으니, 큰 일을 도모하리라.';
  }

  if (features.handSize === 'small' && features.palmType === 'long') {
    return '섬세하고 감성적인 손이니, 예술과 창작에서 빛나리라.';
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

// 손금 조언 생성
export function getPalmAdvice(interpretation) {
  const advices = [
    '손을 깨끗이 하고 손톱을 정갈히 하면 운이 더하리라.',
    '왼손은 타고난 운명, 오른손은 만들어가는 운명이니 두 손 모두 소중히 여기라.',
    '손을 자주 펴고 기운을 받으면 막힌 운이 트이리라.',
    '손바닥에 햇볕을 쬐면 양의 기운이 모이리라.',
  ];

  // 손금 감지 결과에 따른 맞춤 조언
  if (interpretation?.palmLines) {
    const lines = interpretation.palmLines;

    if (lines.lifeLine?.quality === 'faint') {
      return '생명선이 옅으니, 규칙적인 운동과 충분한 휴식으로 기운을 북돋우라.';
    }

    if (lines.headLine?.quality === 'strong') {
      return '두뇌선이 강하니, 학문이나 연구에 힘쓰면 큰 성취가 있으리라.';
    }

    if (lines.heartLine?.quality === 'strong') {
      return '감정선이 깊으니, 사랑하는 사람에게 마음을 표현하면 좋은 인연이 깊어지리라.';
    }

    if (lines.fateLine?.detected === false) {
      return '운명선이 희미하니, 이는 스스로 운명을 개척하라는 뜻이로다. 두려워 말고 나아가라.';
    }
  }

  return advices[Math.floor(Math.random() * advices.length)];
}
