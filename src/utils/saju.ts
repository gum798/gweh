import i18next from 'i18next';

// 천간 (10 Heavenly Stems)
export const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];

// 지지 (12 Earthly Branches)
export const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 오행 (Five Elements)
export const FIVE_ELEMENTS = {
  갑: '목', 을: '목',
  병: '화', 정: '화',
  무: '토', 기: '토',
  경: '금', 신: '금',
  임: '수', 계: '수',
};

// 지지 오행
export const BRANCH_ELEMENTS = {
  자: '수', 축: '토', 인: '목', 묘: '목',
  진: '토', 사: '화', 오: '화', 미: '토',
  신: '금', 유: '금', 술: '토', 해: '수',
};

// 띠 동물
export const ZODIAC_ANIMALS = {
  자: '쥐', 축: '소', 인: '호랑이', 묘: '토끼',
  진: '용', 사: '뱀', 오: '말', 미: '양',
  신: '원숭이', 유: '닭', 술: '개', 해: '돼지',
};

// 시간대별 지지
const HOUR_BRANCHES = [
  { start: 23, end: 1, branch: '자' },
  { start: 1, end: 3, branch: '축' },
  { start: 3, end: 5, branch: '인' },
  { start: 5, end: 7, branch: '묘' },
  { start: 7, end: 9, branch: '진' },
  { start: 9, end: 11, branch: '사' },
  { start: 11, end: 13, branch: '오' },
  { start: 13, end: 15, branch: '미' },
  { start: 15, end: 17, branch: '신' },
  { start: 17, end: 19, branch: '유' },
  { start: 19, end: 21, branch: '술' },
  { start: 21, end: 23, branch: '해' },
];

// 연주(年柱) 계산 - 양력 기준 (입춘 기준으로 연도 전환, 간소화 버전)
function getYearPillar(year) {
  // 갑자년 기준 (1984년이 갑자년)
  const baseYear = 1984;
  const diff = year - baseYear;

  const stemIndex = ((diff % 10) + 10) % 10;
  const branchIndex = ((diff % 12) + 12) % 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
  };
}

// 월주(月柱) 계산
function getMonthPillar(year, month) {
  // 월건 계산 (음력 월 기준, 양력으로 근사)
  // 인월(1월)부터 시작, 천간은 연간에 따라 결정
  const yearPillar = getYearPillar(year);
  const yearStemIndex = HEAVENLY_STEMS.indexOf(yearPillar.stem);

  // 월지 (인월 = 1월, 묘월 = 2월, ...)
  const monthBranchIndex = (month + 1) % 12; // 1월이 인(2)
  const adjustedIndex = (monthBranchIndex + 2) % 12;

  // 월간 계산 (연간에 따른 월간 시작점)
  // 갑/기년 → 병인월 시작, 을/경년 → 무인월 시작, 등
  const stemStartMap = [2, 4, 6, 8, 0]; // 갑기, 을경, 병신, 정임, 무계
  const stemStart = stemStartMap[yearStemIndex % 5];
  const monthStemIndex = (stemStart + month - 1) % 10;

  return {
    stem: HEAVENLY_STEMS[monthStemIndex],
    branch: EARTHLY_BRANCHES[adjustedIndex],
  };
}

// 일주(日柱) 계산 - 간소화된 알고리즘
function getDayPillar(year, month, day) {
  // 기준일: 1900년 1월 1일 = 갑진일
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));

  // 1900년 1월 1일의 천간지지 인덱스 (갑진 = 갑(0), 진(4))
  const baseStemIndex = 0;
  const baseBranchIndex = 4;

  const stemIndex = ((baseStemIndex + diffDays) % 10 + 10) % 10;
  const branchIndex = ((baseBranchIndex + diffDays) % 12 + 12) % 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
  };
}

// 시주(時柱) 계산
function getHourPillar(hour, dayStem) {
  // 시지 결정
  let hourBranch;
  for (const hb of HOUR_BRANCHES) {
    if (hb.start > hb.end) {
      if (hour >= hb.start || hour < hb.end) {
        hourBranch = hb.branch;
        break;
      }
    } else {
      if (hour >= hb.start && hour < hb.end) {
        hourBranch = hb.branch;
        break;
      }
    }
  }

  const branchIndex = EARTHLY_BRANCHES.indexOf(hourBranch);

  // 시간 계산 (일간에 따른 시간 시작점)
  const dayStemIndex = HEAVENLY_STEMS.indexOf(dayStem);
  const stemStartMap = [0, 2, 4, 6, 8]; // 갑기일 → 갑자시, 을경일 → 병자시, 등
  const stemStart = stemStartMap[dayStemIndex % 5];
  const hourStemIndex = (stemStart + branchIndex) % 10;

  return {
    stem: HEAVENLY_STEMS[hourStemIndex],
    branch: hourBranch,
  };
}

// 사주팔자 전체 계산
export function calculateSaju(birthDate, birthHour) {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  const yearPillar = getYearPillar(year);
  const monthPillar = getMonthPillar(year, month);
  const dayPillar = getDayPillar(year, month, day);
  const hourPillar = getHourPillar(birthHour, dayPillar.stem);

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    zodiac: ZODIAC_ANIMALS[yearPillar.branch],
    elements: {
      year: FIVE_ELEMENTS[yearPillar.stem],
      month: FIVE_ELEMENTS[monthPillar.stem],
      day: FIVE_ELEMENTS[dayPillar.stem],
      hour: FIVE_ELEMENTS[hourPillar.stem],
    },
  };
}

// 오행 분포 분석
export function analyzeElements(saju) {
  const elements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  // 천간 오행
  elements[FIVE_ELEMENTS[saju.year.stem]]++;
  elements[FIVE_ELEMENTS[saju.month.stem]]++;
  elements[FIVE_ELEMENTS[saju.day.stem]]++;
  elements[FIVE_ELEMENTS[saju.hour.stem]]++;

  // 지지 오행
  elements[BRANCH_ELEMENTS[saju.year.branch]]++;
  elements[BRANCH_ELEMENTS[saju.month.branch]]++;
  elements[BRANCH_ELEMENTS[saju.day.branch]]++;
  elements[BRANCH_ELEMENTS[saju.hour.branch]]++;

  // 가장 강한 오행과 약한 오행
  const sorted = Object.entries(elements).sort((a, b) => b[1] - a[1]);

  return {
    distribution: elements,
    strongest: sorted[0][0],
    weakest: sorted[sorted.length - 1][0],
    balanced: sorted[0][1] - sorted[sorted.length - 1][1] <= 2,
  };
}

// 일간(일주 천간) 기반 성격 분석
export function getDayMasterType(dayStem) {
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

  return {
    name: i18next.t(`saju:dayMasterType.${stemKey}.name`),
    nature: i18next.t(`saju:dayMasterType.${stemKey}.nature`),
    trait: i18next.t(`saju:dayMasterType.${stemKey}.trait`),
  };
}
