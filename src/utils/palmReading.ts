import i18next from 'i18next';
import { getLineQualityKorean } from './palmLineDetector';

// 손 크기별 해석 - getter functions to use i18next inside functions
function getHandSizeOmens(size: string): string[] {
  const omens = {
    large: [
      i18next.t('palm:handSizeOmen.large.0'),
      i18next.t('palm:handSizeOmen.large.1'),
      i18next.t('palm:handSizeOmen.large.2'),
    ],
    medium: [
      i18next.t('palm:handSizeOmen.medium.0'),
      i18next.t('palm:handSizeOmen.medium.1'),
      i18next.t('palm:handSizeOmen.medium.2'),
    ],
    small: [
      i18next.t('palm:handSizeOmen.small.0'),
      i18next.t('palm:handSizeOmen.small.1'),
      i18next.t('palm:handSizeOmen.small.2'),
    ],
  };
  return omens[size] || omens.medium;
}

// 손가락 비율별 해석 - getter functions to use i18next inside functions
function getFingerTypeOmens(type: string): string[] {
  const omens = {
    ringDominant: [
      i18next.t('palm:fingerOmen.ringDominant.0'),
      i18next.t('palm:fingerOmen.ringDominant.1'),
      i18next.t('palm:fingerOmen.ringDominant.2'),
    ],
    indexDominant: [
      i18next.t('palm:fingerOmen.indexDominant.0'),
      i18next.t('palm:fingerOmen.indexDominant.1'),
      i18next.t('palm:fingerOmen.indexDominant.2'),
    ],
    balanced: [
      i18next.t('palm:fingerOmen.balanced.0'),
      i18next.t('palm:fingerOmen.balanced.1'),
      i18next.t('palm:fingerOmen.balanced.2'),
    ],
  };
  return omens[type] || omens.balanced;
}

// 손바닥 형태별 해석 - getter functions to use i18next inside functions
function getPalmTypeOmens(type: string): string[] {
  const omens = {
    long: [
      i18next.t('palm:palmOmen.long.0'),
      i18next.t('palm:palmOmen.long.1'),
      i18next.t('palm:palmOmen.long.2'),
    ],
    square: [
      i18next.t('palm:palmOmen.square.0'),
      i18next.t('palm:palmOmen.square.1'),
      i18next.t('palm:palmOmen.square.2'),
    ],
    balanced: [
      i18next.t('palm:palmOmen.balanced.0'),
      i18next.t('palm:palmOmen.balanced.1'),
      i18next.t('palm:palmOmen.balanced.2'),
    ],
  };
  return omens[type] || omens.balanced;
}

// 손금 라인별 해석 (품질에 따라) - getter function to use i18next inside functions
function getLineOmens(lineType: string, quality: string): string {
  const omens = {
    lifeLine: {
      strong: i18next.t('palm:lineOmen.lifeLine.strong'),
      clear: i18next.t('palm:lineOmen.lifeLine.clear'),
      moderate: i18next.t('palm:lineOmen.lifeLine.moderate'),
      faint: i18next.t('palm:lineOmen.lifeLine.faint'),
      unclear: i18next.t('palm:lineOmen.lifeLine.unclear'),
    },
    headLine: {
      strong: i18next.t('palm:lineOmen.headLine.strong'),
      clear: i18next.t('palm:lineOmen.headLine.clear'),
      moderate: i18next.t('palm:lineOmen.headLine.moderate'),
      faint: i18next.t('palm:lineOmen.headLine.faint'),
      unclear: i18next.t('palm:lineOmen.headLine.unclear'),
    },
    heartLine: {
      strong: i18next.t('palm:lineOmen.heartLine.strong'),
      clear: i18next.t('palm:lineOmen.heartLine.clear'),
      moderate: i18next.t('palm:lineOmen.heartLine.moderate'),
      faint: i18next.t('palm:lineOmen.heartLine.faint'),
      unclear: i18next.t('palm:lineOmen.heartLine.unclear'),
    },
    fateLine: {
      strong: i18next.t('palm:lineOmen.fateLine.strong'),
      clear: i18next.t('palm:lineOmen.fateLine.clear'),
      moderate: i18next.t('palm:lineOmen.fateLine.moderate'),
      faint: i18next.t('palm:lineOmen.fateLine.faint'),
      unclear: i18next.t('palm:lineOmen.fateLine.unclear'),
    },
  };
  return omens[lineType]?.[quality] || '';
}

// 라인 라벨 getter function
function getLineLabels(lineType: string) {
  const labels = {
    lifeLine: {
      name: i18next.t('palm:line.lifeLine.name'),
      icon: '💚',
      description: i18next.t('palm:line.lifeLine.desc')
    },
    headLine: {
      name: i18next.t('palm:line.headLine.name'),
      icon: '🧠',
      description: i18next.t('palm:line.headLine.desc')
    },
    heartLine: {
      name: i18next.t('palm:line.heartLine.name'),
      icon: '💗',
      description: i18next.t('palm:line.heartLine.desc')
    },
    fateLine: {
      name: i18next.t('palm:line.fateLine.name'),
      icon: '⭐',
      description: i18next.t('palm:line.fateLine.desc')
    },
  };
  return labels[lineType];
}

// 종합 손금 해석
export function interpretPalm(handFeatures, palmLines = null, fingerGesture = null) {
  if (!handFeatures) return null;

  const interpretations = [];

  // 손가락 자세 해석 (맨 위에 배치)
  if (fingerGesture?.interpretation) {
    const gesture = fingerGesture.interpretation;
    // 성정과 건강을 한 문장으로 결합
    const combinedMessage = `${gesture.trait}이니, ${gesture.health.replace(/\.$/, '')}`;

    interpretations.push({
      category: i18next.t('palm:category.fingerGesture'),
      icon: '🤚',
      type: gesture.gestureName,
      message: combinedMessage,
      isDetected: true,
    });
  }

  // 손 크기 해석
  const sizeOmens = getHandSizeOmens(handFeatures.handSize);
  interpretations.push({
    category: i18next.t('palm:category.handSize'),
    icon: '✋',
    type: handFeatures.handSize === 'large' ? i18next.t('palm:handSize.large') :
          handFeatures.handSize === 'small' ? i18next.t('palm:handSize.small') : i18next.t('palm:handSize.medium'),
    message: sizeOmens[Math.floor(Math.random() * sizeOmens.length)],
    isDetected: true,
  });

  // 손가락 비율 해석
  const fingerOmens = getFingerTypeOmens(handFeatures.fingerType);
  interpretations.push({
    category: i18next.t('palm:category.fingerRatio'),
    icon: '👆',
    type: handFeatures.fingerType === 'ringDominant' ? i18next.t('palm:fingerType.ringDominant') :
          handFeatures.fingerType === 'indexDominant' ? i18next.t('palm:fingerType.indexDominant') : i18next.t('palm:fingerType.balanced'),
    message: fingerOmens[Math.floor(Math.random() * fingerOmens.length)],
    isDetected: true,
  });

  // 손바닥 형태 해석
  const palmOmens = getPalmTypeOmens(handFeatures.palmType);
  interpretations.push({
    category: i18next.t('palm:category.palmShape'),
    icon: '🖐️',
    type: handFeatures.palmType === 'long' ? i18next.t('palm:palmType.long') :
          handFeatures.palmType === 'square' ? i18next.t('palm:palmType.square') : i18next.t('palm:palmType.balanced'),
    message: palmOmens[Math.floor(Math.random() * palmOmens.length)],
    isDetected: true,
  });

  // 실제 감지된 손금 라인 해석
  const lineTypes = ['lifeLine', 'headLine', 'heartLine', 'fateLine'];

  lineTypes.forEach(lineType => {
    const lineInfo = getLineLabels(lineType);
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

    const message = getLineOmens(lineType, quality);

    interpretations.push({
      category: lineInfo.name,
      icon: lineInfo.icon,
      type: isDetected ? getLineQualityKorean(quality) : i18next.t('palm:detecting'),
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
        return i18next.t('palm:mainMessage.strongLines');
      }
      return i18next.t('palm:mainMessage.detectedLines');
    }
  }

  // 손 특성 기반 메시지
  const messages = [
    i18next.t('palm:mainMessage.default.0'),
    i18next.t('palm:mainMessage.default.1'),
    i18next.t('palm:mainMessage.default.2'),
    i18next.t('palm:mainMessage.default.3'),
  ];

  // 특성 조합에 따른 메시지
  if (features.handSize === 'large' && features.palmType === 'square') {
    return i18next.t('palm:mainMessage.largeSqaure');
  }

  if (features.fingerType === 'indexDominant' && features.palmType === 'long') {
    return i18next.t('palm:mainMessage.indexLong');
  }

  if (features.handSize === 'small' && features.palmType === 'long') {
    return i18next.t('palm:mainMessage.smallLong');
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

// 손금 조언 생성
export function getPalmAdvice(interpretation) {
  const advices = [
    i18next.t('palm:advice.0'),
    i18next.t('palm:advice.1'),
    i18next.t('palm:advice.2'),
    i18next.t('palm:advice.3'),
  ];

  // 손금 감지 결과에 따른 맞춤 조언
  if (interpretation?.palmLines) {
    const lines = interpretation.palmLines;

    if (lines.lifeLine?.quality === 'faint') {
      return i18next.t('palm:advice.lifeLineFaint');
    }

    if (lines.headLine?.quality === 'strong') {
      return i18next.t('palm:advice.headLineStrong');
    }

    if (lines.heartLine?.quality === 'strong') {
      return i18next.t('palm:advice.heartLineStrong');
    }

    if (lines.fateLine?.detected === false) {
      return i18next.t('palm:advice.fateLineNotDetected');
    }
  }

  return advices[Math.floor(Math.random() * advices.length)];
}
