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

// 운명선 해석 (손금 시뮬레이션)
const lineOmens = {
  lifeLine: [
    '생명선이 뚜렷하니 건강한 기운이 넘치도다. 장수의 상이로다.',
    '생명의 기운이 강하니, 활력이 넘치는 삶을 살리라.',
    '생명선이 안정되었으니, 큰 병 없이 평안하리라.',
  ],
  headLine: [
    '두뇌선이 맑으니 지혜가 뛰어나도다. 학문에 성취가 있으리라.',
    '생각이 깊은 상이니, 계획이 빈틈없으리라.',
    '영리한 머리를 타고났으니, 일처리가 명쾌하리라.',
  ],
  heartLine: [
    '감정선이 깊으니 정이 많은 상이로다. 사랑에 진심을 다하리라.',
    '마음이 따스한 상이니, 인연이 풍성하리라.',
    '감성이 풍부하니, 예술적 재능이 있도다.',
  ],
  fateLine: [
    '운명선이 뚜렷하니 큰 뜻을 이룰 상이로다. 사회적 성취가 있으리라.',
    '목표가 뚜렷한 상이니, 한 길을 걸으리라.',
    '운명의 인도가 강하니, 때가 되면 빛나리라.',
  ],
};

// 종합 손금 해석
export function interpretPalm(handFeatures) {
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
  });

  // 손가락 비율 해석
  const fingerOmens = fingerTypeOmens[handFeatures.fingerType];
  interpretations.push({
    category: '손가락',
    icon: '👆',
    type: handFeatures.fingerType === 'ringDominant' ? '약지 우세' :
          handFeatures.fingerType === 'indexDominant' ? '검지 우세' : '균형',
    message: fingerOmens[Math.floor(Math.random() * fingerOmens.length)],
  });

  // 손바닥 형태 해석
  const palmOmens = palmTypeOmens[handFeatures.palmType];
  interpretations.push({
    category: '손바닥',
    icon: '🖐️',
    type: handFeatures.palmType === 'long' ? '긴 손바닥' :
          handFeatures.palmType === 'square' ? '네모난 손바닥' : '조화로운 형태',
    message: palmOmens[Math.floor(Math.random() * palmOmens.length)],
  });

  // 손금 시뮬레이션 (랜덤)
  const lines = ['lifeLine', 'headLine', 'heartLine', 'fateLine'];
  const lineLabels = {
    lifeLine: { name: '생명선', icon: '💚' },
    headLine: { name: '두뇌선', icon: '🧠' },
    heartLine: { name: '감정선', icon: '💗' },
    fateLine: { name: '운명선', icon: '⭐' },
  };

  // 2~3개의 손금 랜덤 선택
  const selectedLines = lines.sort(() => 0.5 - Math.random()).slice(0, 3);

  for (const line of selectedLines) {
    const omens = lineOmens[line];
    interpretations.push({
      category: lineLabels[line].name,
      icon: lineLabels[line].icon,
      type: '뚜렷함',
      message: omens[Math.floor(Math.random() * omens.length)],
    });
  }

  // 메인 메시지 생성
  const mainMessage = generateMainMessage(handFeatures);

  return {
    mainMessage,
    details: interpretations,
    handFeatures,
  };
}

function generateMainMessage(features) {
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

  return advices[Math.floor(Math.random() * advices.length)];
}
