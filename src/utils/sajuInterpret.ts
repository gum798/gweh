import i18next from 'i18next';
import { analyzeElements, getDayMasterType, ZODIAC_ANIMALS } from './saju';

// 일간별 운세 메시지
function getDayMasterOmen(dayStem) {
  const stemKeyMap = {
    갑: 'gap',
    을: 'eul',
    병: 'byeong',
    정: 'jeong',
    무: 'mu',
    기: 'gi',
    경: 'gyeong',
    신: 'sin',
    임: 'im',
    계: 'gye',
  };

  const stemKey = stemKeyMap[dayStem];

  return [
    i18next.t(`saju:dayMasterOmen.${stemKey}.0`),
    i18next.t(`saju:dayMasterOmen.${stemKey}.1`),
    i18next.t(`saju:dayMasterOmen.${stemKey}.2`),
  ];
}

// 오행별 운세 메시지
function getElementOmen(element, strength) {
  const elementKeyMap = {
    목: 'wood',
    화: 'fire',
    토: 'earth',
    금: 'metal',
    수: 'water',
  };

  const elementKey = elementKeyMap[element];

  return {
    strong: i18next.t(`saju:elementOmen.${elementKey}.strong`),
    weak: i18next.t(`saju:elementOmen.${elementKey}.weak`),
    balanced: i18next.t(`saju:elementOmen.${elementKey}.balanced`),
  };
}

// 띠별 운세 메시지
function getZodiacOmen(zodiac) {
  const zodiacKeyMap = {
    쥐: 'rat',
    소: 'ox',
    호랑이: 'tiger',
    토끼: 'rabbit',
    용: 'dragon',
    뱀: 'snake',
    말: 'horse',
    양: 'sheep',
    원숭이: 'monkey',
    닭: 'rooster',
    개: 'dog',
    돼지: 'pig',
  };

  const zodiacKey = zodiacKeyMap[zodiac];

  return i18next.t(`saju:zodiacOmen.${zodiacKey}`);
}

// 종합 해석 생성
export function interpretSaju(saju) {
  const dayMasterType = getDayMasterType(saju.day.stem);
  const elementAnalysis = analyzeElements(saju);

  // 일간 기반 메인 메시지
  const dayMasterMessages = getDayMasterOmen(saju.day.stem);
  const mainMessage = dayMasterMessages[Math.floor(Math.random() * dayMasterMessages.length)];

  // 오행 분석 메시지
  const strongestElement = elementAnalysis.strongest;
  const weakestElement = elementAnalysis.weakest;

  let elementMessage;
  if (elementAnalysis.balanced) {
    elementMessage = i18next.t('saju:elementBalanced');
  } else {
    const strongestOmen = getElementOmen(strongestElement, 'strong');
    const weakestOmen = getElementOmen(weakestElement, 'weak');

    elementMessage =
      strongestOmen.strong.split('.')[0] + '. ' +
      weakestOmen.weak.split('.')[0] + '.';
  }

  // 띠 메시지
  const zodiacMessage = getZodiacOmen(saju.zodiac);

  // 사주 요약
  const pillars = [
    { name: i18next.t('saju:pillar.year'), pillar: saju.year, meaning: i18next.t('saju:pillar.year.meaning') },
    { name: i18next.t('saju:pillar.month'), pillar: saju.month, meaning: i18next.t('saju:pillar.month.meaning') },
    { name: i18next.t('saju:pillar.day'), pillar: saju.day, meaning: i18next.t('saju:pillar.day.meaning') },
    { name: i18next.t('saju:pillar.hour'), pillar: saju.hour, meaning: i18next.t('saju:pillar.hour.meaning') },
  ];

  return {
    mainMessage,
    dayMaster: dayMasterType,
    elementAnalysis,
    elementMessage,
    zodiac: saju.zodiac,
    zodiacMessage,
    pillars,
    saju,
  };
}

// 오늘의 운세 (일진 기반)
export function getTodayFortune(saju) {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // 일간과 오늘 날짜 조합으로 운세 결정
  const stemIndex = '갑을병정무기경신임계'.indexOf(saju.day.stem);
  const fortuneIndex = (seed + stemIndex) % 5;

  const fortunes = [
    { level: i18next.t('saju:fortune.great'), message: i18next.t('saju:fortune.great.message') },
    { level: i18next.t('saju:fortune.good'), message: i18next.t('saju:fortune.good.message') },
    { level: i18next.t('saju:fortune.neutral'), message: i18next.t('saju:fortune.neutral.message') },
    { level: i18next.t('saju:fortune.minor'), message: i18next.t('saju:fortune.minor.message') },
    { level: i18next.t('saju:fortune.poor'), message: i18next.t('saju:fortune.poor.message') },
  ];

  return fortunes[fortuneIndex];
}
