import { analyzeElements, getDayMasterType, ZODIAC_ANIMALS } from './saju';

// 일간별 운세 메시지
const dayMasterOmens = {
  갑: [
    '갑목의 기운이 그대에게 깃들어, 하늘을 향해 곧게 뻗어 나가는 대나무와 같도다.',
    '우뚝 선 거목의 기상으로 세상을 품으니, 의로운 길을 걸으리라.',
    '봄날의 새싹처럼 그대의 기운이 솟아오르니, 새로운 시작이 길하도다.',
  ],
  을: [
    '을목의 부드러운 기운이 그대를 감싸니, 바람에 흔들려도 꺾이지 않으리라.',
    '덩굴이 담장을 넘듯, 그대의 유연함이 만사를 이롭게 하리라.',
    '꽃이 피어 향기를 내듯, 그대의 매력이 사람을 끌어 모으리라.',
  ],
  병: [
    '병화의 빛이 그대에게 깃들어, 태양처럼 세상을 밝히는 존재로다.',
    '불꽃처럼 타오르는 열정이 그대의 것이니, 뜻한 바를 이루리라.',
    '밝은 기운이 어둠을 물리치니, 그대 가는 길에 장애가 없으리라.',
  ],
  정: [
    '정화의 따스함이 그대에게 있으니, 촛불처럼 주위를 밝히는도다.',
    '은은한 빛으로 사람의 마음을 녹이니, 인연이 끊이지 않으리라.',
    '섬세한 마음으로 세상을 보니, 남들이 보지 못하는 것을 보리라.',
  ],
  무: [
    '무토의 든든함이 그대에게 있으니, 큰 산처럼 의지가 되는도다.',
    '흔들림 없는 대지의 기운으로 주위를 안정시키니, 신뢰를 얻으리라.',
    '넓은 품으로 만물을 품으니, 그대 곁에 사람이 모이리라.',
  ],
  기: [
    '기토의 기운이 그대에게 있으니, 비옥한 정원처럼 만물을 키우리라.',
    '부드러운 흙이 씨앗을 품듯, 그대의 포용력이 사람을 감싸리라.',
    '중심을 잡아 조화를 이루니, 화합의 길이 열리리라.',
  ],
  경: [
    '경금의 굳건함이 그대에게 있으니, 바위처럼 흔들리지 않으리라.',
    '날카로운 검처럼 결단력이 있으니, 망설임 없이 나아가리라.',
    '원칙을 지키는 마음이 길을 열어, 정도를 걸으리라.',
  ],
  신: [
    '신금의 빛남이 그대에게 있으니, 보석처럼 가치가 드러나리라.',
    '정교한 손길로 세상을 다듬으니, 완성의 경지에 이르리라.',
    '예리한 통찰로 진실을 꿰뚫으니, 속지 않으리라.',
  ],
  임: [
    '임수의 깊음이 그대에게 있으니, 큰 강처럼 세상을 품으리라.',
    '흐르는 물처럼 막힘이 없으니, 만사가 순조롭게 풀리리라.',
    '지혜로운 마음으로 세상을 보니, 길을 잃지 않으리라.',
  ],
  계: [
    '계수의 영리함이 그대에게 있으니, 빗물처럼 스며들어 길을 찾으리라.',
    '작은 물방울이 바위를 뚫듯, 끈기로 뜻을 이루리라.',
    '변화에 유연하게 적응하니, 어떤 상황에서도 빛나리라.',
  ],
};

// 오행별 운세 메시지
const elementOmens = {
  목: {
    strong: '목의 기운이 왕성하니, 성장과 발전의 기운이 넘치도다. 새로운 시작에 길하나, 지나침을 경계하라.',
    weak: '목의 기운이 약하니, 인내와 성장의 힘을 기르라. 봄을 기다리는 씨앗처럼 때를 기다리라.',
    balanced: '목의 기운이 조화로우니, 자연스럽게 성장하리라.',
  },
  화: {
    strong: '화의 기운이 왕성하니, 열정과 밝음이 넘치도다. 그 빛으로 세상을 밝히되, 타오름에 지치지 않게 하라.',
    weak: '화의 기운이 약하니, 마음에 불씨를 지피라. 작은 촛불도 어둠을 밝히느니라.',
    balanced: '화의 기운이 조화로우니, 따스함이 넘치리라.',
  },
  토: {
    strong: '토의 기운이 왕성하니, 신뢰와 안정의 기운이 넘치도다. 중심을 잡되, 고집에 빠지지 않게 하라.',
    weak: '토의 기운이 약하니, 뿌리를 내릴 곳을 찾으라. 안정을 구하면 마음의 평화를 얻으리라.',
    balanced: '토의 기운이 조화로우니, 중심이 바로 서리라.',
  },
  금: {
    strong: '금의 기운이 왕성하니, 결단력과 추진력이 넘치도다. 날카로움을 갈되, 상처 주지 않게 하라.',
    weak: '금의 기운이 약하니, 마음을 단단히 하라. 연마하면 빛이 나리라.',
    balanced: '금의 기운이 조화로우니, 맑고 밝은 결정을 내리리라.',
  },
  수: {
    strong: '수의 기운이 왕성하니, 지혜와 통찰의 기운이 넘치도다. 깊이 생각하되, 흐름을 놓치지 않게 하라.',
    weak: '수의 기운이 약하니, 지혜의 샘을 채우라. 배움에 힘쓰면 빛이 보이리라.',
    balanced: '수의 기운이 조화로우니, 맑은 물처럼 모든 것을 비추리라.',
  },
};

// 띠별 운세 메시지
const zodiacOmens = {
  쥐: '영리한 자시의 기운으로 기회를 포착하니, 작은 것에서 큰 것을 얻으리라.',
  소: '묵묵한 축시의 기운으로 꾸준히 나아가니, 노력이 결실을 맺으리라.',
  호랑이: '용맹한 인시의 기운으로 세상을 호령하니, 두려움 없이 나아가리라.',
  토끼: '온화한 묘시의 기운으로 사람을 끌어당기니, 화합의 길이 열리리라.',
  용: '신비로운 진시의 기운으로 하늘을 날으니, 큰 뜻을 펼치리라.',
  뱀: '지혜로운 사시의 기운으로 깊이 생각하니, 진실을 꿰뚫으리라.',
  말: '활달한 오시의 기운으로 달려 나가니, 막힘이 없으리라.',
  양: '순한 미시의 기운으로 조화를 이루니, 평화가 깃들리라.',
  원숭이: '재치 있는 신시의 기운으로 위기를 넘기니, 어려움이 기회가 되리라.',
  닭: '부지런한 유시의 기운으로 정확히 살피니, 실수가 없으리라.',
  개: '충직한 술시의 기운으로 믿음을 지키니, 신뢰를 얻으리라.',
  돼지: '복된 해시의 기운으로 풍요를 누리니, 만사에 여유가 있으리라.',
};

// 종합 해석 생성
export function interpretSaju(saju) {
  const dayMasterType = getDayMasterType(saju.day.stem);
  const elementAnalysis = analyzeElements(saju);

  // 일간 기반 메인 메시지
  const dayMasterMessages = dayMasterOmens[saju.day.stem];
  const mainMessage = dayMasterMessages[Math.floor(Math.random() * dayMasterMessages.length)];

  // 오행 분석 메시지
  const strongestElement = elementAnalysis.strongest;
  const weakestElement = elementAnalysis.weakest;

  let elementMessage;
  if (elementAnalysis.balanced) {
    elementMessage = '오행이 고르게 분포하여 균형 잡힌 명조로다. 조화로운 삶을 살아가리라.';
  } else {
    elementMessage = `${strongestElement}의 기운이 강하고 ${weakestElement}의 기운이 약하니, ` +
      elementOmens[strongestElement].strong.split('.')[0] + '. ' +
      elementOmens[weakestElement].weak.split('.')[0] + '.';
  }

  // 띠 메시지
  const zodiacMessage = zodiacOmens[saju.zodiac];

  // 사주 요약
  const pillars = [
    { name: '연주', pillar: saju.year, meaning: '조상과 어린 시절' },
    { name: '월주', pillar: saju.month, meaning: '부모와 청년기' },
    { name: '일주', pillar: saju.day, meaning: '본인과 배우자' },
    { name: '시주', pillar: saju.hour, meaning: '자녀와 말년' },
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
    { level: '대길', message: '오늘은 만사가 순조롭게 풀리는 날이니, 뜻한 바를 행하라.' },
    { level: '길', message: '좋은 기운이 감도는 날이니, 적극적으로 나아가라.' },
    { level: '평', message: '평온한 하루가 예상되니, 평상심을 유지하라.' },
    { level: '소흉', message: '작은 어려움이 있을 수 있으니, 조심스럽게 행하라.' },
    { level: '흉', message: '기운이 막힌 날이니, 중요한 일은 미루고 정양하라.' },
  ];

  return fortunes[fortuneIndex];
}
