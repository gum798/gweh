/**
 * 손금 라인 감지 유틸리티
 * 키포인트 기반으로 손금 위치 계산 (손 방향에 무관하게)
 */

// 손금 라인 감지 (키포인트 기반)
export async function detectPalmLines(imageSrc, keypoints) {
  const lines = {
    lifeLine: calculateLifeLine(keypoints),
    headLine: calculateHeadLine(keypoints),
    heartLine: calculateHeartLine(keypoints),
    fateLine: calculateFateLine(keypoints),
  };

  return lines;
}

// 두 점 사이를 보간
function lerp(p1, p2, t) {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

// 베지어 곡선 포인트 생성
function bezierPoints(start, ctrl, end, numPoints = 10) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * ctrl.x + t * t * end.x;
    const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * ctrl.y + t * t * end.y;
    points.push({ x, y, strength: 60 });
  }
  return points;
}

// 생명선: 엄지-검지 사이에서 시작, 엄지 둘레를 감싸며 손목 방향
function calculateLifeLine(kp) {
  // 시작: 엄지 MCP와 검지 MCP 사이 (손바닥 안쪽)
  const start = lerp(kp[2], kp[5], 0.3);

  // 끝: 손목과 엄지 CMC 사이
  const end = lerp(kp[0], kp[1], 0.4);

  // 제어점: 엄지 CMC 바깥쪽으로 (곡선 만들기)
  const ctrl = {
    x: kp[1].x + (kp[1].x - kp[5].x) * 0.3,
    y: (start.y + end.y) / 2,
  };

  return {
    detected: true,
    strength: 70,
    quality: 'clear',
    points: bezierPoints(start, ctrl, end),
  };
}

// 두뇌선: 손바닥 중간 가로선 (검지쪽에서 소지쪽으로)
function calculateHeadLine(kp) {
  // 손바닥 중심 높이 계산 (손가락 기저부와 손목 사이)
  const palmTop = lerp(kp[5], kp[17], 0.5); // 손가락 기저부 중간
  const palmMid = lerp(palmTop, kp[0], 0.45); // 손바닥 45% 지점

  // 시작: 검지 아래 (생명선 시작 근처)
  const start = lerp(kp[2], kp[5], 0.4);
  start.y = palmMid.y;

  // 끝: 소지 아래
  const end = { x: kp[17].x, y: palmMid.y };

  // 약간 아래로 처지는 곡선
  const ctrl = {
    x: (start.x + end.x) / 2,
    y: palmMid.y + Math.abs(kp[0].y - palmTop.y) * 0.08,
  };

  return {
    detected: true,
    strength: 65,
    quality: 'clear',
    points: bezierPoints(start, ctrl, end),
  };
}

// 감정선: 손바닥 상단 가로선 (소지쪽에서 검지쪽으로)
function calculateHeartLine(kp) {
  // 손가락 기저부 바로 아래
  const palmTop = lerp(kp[5], kp[17], 0.5);
  const heartLineY = lerp(palmTop, kp[0], 0.2); // 손바닥 상단 20% 지점

  // 시작: 소지 아래
  const start = { x: kp[17].x, y: heartLineY.y };

  // 끝: 검지-중지 사이 아래
  const end = lerp(kp[5], kp[9], 0.4);
  end.y = heartLineY.y - Math.abs(kp[0].y - palmTop.y) * 0.03;

  // 약간 위로 휘는 곡선
  const ctrl = {
    x: (start.x + end.x) / 2,
    y: heartLineY.y - Math.abs(kp[0].y - palmTop.y) * 0.05,
  };

  return {
    detected: true,
    strength: 60,
    quality: 'clear',
    points: bezierPoints(start, ctrl, end),
  };
}

// 운명선: 손목에서 중지 방향 세로선
function calculateFateLine(kp) {
  // 손바닥 중심 X 좌표
  const palmCenterX = (kp[5].x + kp[17].x) / 2;

  // 시작: 손목 약간 위
  const start = lerp(kp[0], kp[9], 0.15);
  start.x = palmCenterX;

  // 끝: 중지 기저부 아래
  const end = lerp(kp[9], kp[0], 0.25);
  end.x = kp[9].x;

  // 거의 직선
  const ctrl = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  return {
    detected: true,
    strength: 50,
    quality: 'moderate',
    points: bezierPoints(start, ctrl, end),
  };
}

// 손금 품질 한글 변환
export function getLineQualityKorean(quality) {
  const map = {
    strong: '매우 뚜렷함',
    clear: '뚜렷함',
    moderate: '보통',
    faint: '희미함',
    unclear: '불분명',
  };
  return map[quality] || '불분명';
}
