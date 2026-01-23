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

// 생명선: 엄지-검지 사이에서 시작, 엄지를 감싸며 손목 방향
function calculateLifeLine(kp) {
  // 손바닥 높이
  const palmTop = lerp(kp[5], kp[17], 0.5);
  const palmHeight = Math.abs(kp[0].y - palmTop.y);

  // 시작: 엄지-검지 사이, 감정선과 두뇌선 사이 높이
  const start = {
    x: kp[5].x - (kp[5].x - kp[2].x) * 0.4,
    y: palmTop.y + palmHeight * 0.35,
  };

  // 끝: 손목 근처, 엄지 쪽으로 치우침
  const end = {
    x: kp[0].x + (kp[1].x - kp[0].x) * 0.6,
    y: kp[0].y - palmHeight * 0.1,
  };

  // 제어점: 엄지를 감싸도록 왼쪽으로 볼록
  const ctrl = {
    x: kp[1].x - (kp[5].x - kp[1].x) * 0.2,
    y: (start.y + end.y) / 2 + palmHeight * 0.1,
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
  // 손바닥 영역: 손가락 기저부(5,9,13,17)와 손목(0) 사이
  // 두뇌선은 손바닥 중간 (약 50-55%)
  const palmTop = lerp(kp[5], kp[17], 0.5);
  const palmHeight = Math.abs(kp[0].y - palmTop.y);

  // 손바닥 55% 지점 (중간보다 약간 아래)
  const lineY = palmTop.y + palmHeight * 0.55;

  // 시작: 엄지-검지 사이 안쪽
  const start = {
    x: kp[5].x - (kp[5].x - kp[2].x) * 0.3,
    y: lineY,
  };

  // 끝: 소지 기저부 안쪽
  const end = {
    x: kp[17].x + (kp[13].x - kp[17].x) * 0.1,
    y: lineY + palmHeight * 0.05,
  };

  // 약간 아래로 처지는 곡선
  const ctrl = {
    x: (start.x + end.x) / 2,
    y: lineY + palmHeight * 0.08,
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
  // 감정선은 손가락 기저부 바로 아래 (손바닥 상단 30%)
  const palmTop = lerp(kp[5], kp[17], 0.5);
  const palmHeight = Math.abs(kp[0].y - palmTop.y);

  // 손바닥 30% 지점 (손가락 바로 아래)
  const lineY = palmTop.y + palmHeight * 0.30;

  // 시작: 소지 기저부 아래
  const start = {
    x: kp[17].x + (kp[13].x - kp[17].x) * 0.05,
    y: lineY,
  };

  // 끝: 검지 기저부 아래
  const end = {
    x: kp[5].x + (kp[9].x - kp[5].x) * 0.3,
    y: lineY - palmHeight * 0.02,
  };

  // 약간 위로 휘는 곡선
  const ctrl = {
    x: (start.x + end.x) / 2,
    y: lineY - palmHeight * 0.03,
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
  // 손바닥 영역
  const palmTop = lerp(kp[5], kp[17], 0.5);
  const palmHeight = Math.abs(kp[0].y - palmTop.y);

  // 손바닥 중심 X (중지 기저부 기준)
  const centerX = kp[9].x;

  // 시작: 손목 위 (손바닥 하단 15%)
  const start = {
    x: centerX,
    y: kp[0].y - palmHeight * 0.15,
  };

  // 끝: 중지 기저부 아래 (두뇌선 근처)
  const end = {
    x: centerX,
    y: palmTop.y + palmHeight * 0.5,
  };

  // 약간의 곡선
  const ctrl = {
    x: centerX - palmHeight * 0.02,
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
