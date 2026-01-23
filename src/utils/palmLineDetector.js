/**
 * 손금 라인 감지 유틸리티
 * MediaPipe Hands 키포인트 기반으로 손금 위치 계산
 */

// 손금 라인 감지 (키포인트 기반)
export async function detectPalmLines(imageSrc, keypoints) {
  // 키포인트 기반으로 각 손금 라인의 위치 계산
  const lines = {
    lifeLine: calculateLifeLine(keypoints),
    headLine: calculateHeadLine(keypoints),
    heartLine: calculateHeartLine(keypoints),
    fateLine: calculateFateLine(keypoints),
  };

  return lines;
}

// 손바닥 기준점 계산
function getPalmMetrics(kp) {
  // 손바닥 상단 (검지-소지 기저부 중간)
  const palmTop = {
    x: (kp[5].x + kp[17].x) / 2,
    y: (kp[5].y + kp[17].y) / 2,
  };

  // 손바닥 높이 (손목 → 손바닥 상단)
  const palmHeight = Math.abs(kp[0].y - palmTop.y);

  // 손바닥 너비
  const palmWidth = Math.abs(kp[5].x - kp[17].x);

  return { palmTop, palmHeight, palmWidth };
}

// 생명선 계산: 엄지와 검지 사이에서 시작, 손목 방향으로 곡선
function calculateLifeLine(kp) {
  const { palmTop, palmHeight } = getPalmMetrics(kp);
  const points = [];
  const numPoints = 10;

  // 시작점: 엄지와 검지 기저부 사이
  const startX = kp[2].x + (kp[5].x - kp[2].x) * 0.4;
  const startY = kp[2].y + (kp[5].y - kp[2].y) * 0.4;

  // 끝점: 손목 근처, 엄지 쪽
  const endX = kp[0].x + (kp[1].x - kp[0].x) * 0.6;
  const endY = kp[0].y - palmHeight * 0.1;

  // 제어점: 엄지를 감싸는 곡선
  const ctrlX = kp[1].x;
  const ctrlY = (startY + endY) / 2 + palmHeight * 0.1;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // Quadratic Bezier
    const x = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * ctrlX + Math.pow(t, 2) * endX;
    const y = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * ctrlY + Math.pow(t, 2) * endY;
    points.push({ x, y, strength: 150 });
  }

  return { detected: true, strength: 150, quality: 'clear', points };
}

// 두뇌선 계산: 손바닥 중앙 가로선
function calculateHeadLine(kp) {
  const { palmTop, palmHeight, palmWidth } = getPalmMetrics(kp);
  const points = [];
  const numPoints = 10;

  // 손바닥 중간 높이 (상단에서 50%)
  const lineY = palmTop.y + palmHeight * 0.45;

  // 시작점: 검지 기저부 아래, 생명선 시작 근처
  const startX = kp[5].x - (kp[5].x - kp[2].x) * 0.3;

  // 끝점: 소지 기저부 쪽
  const endX = kp[17].x + palmWidth * 0.05;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = startX + (endX - startX) * t;
    // 약간 아래로 휘어지는 곡선
    const curve = Math.sin(t * Math.PI) * palmHeight * 0.08;
    const y = lineY + curve;
    points.push({ x, y, strength: 130 });
  }

  return { detected: true, strength: 130, quality: 'clear', points };
}

// 감정선 계산: 손바닥 상단 가로선 (손가락 바로 아래)
function calculateHeartLine(kp) {
  const { palmTop, palmHeight, palmWidth } = getPalmMetrics(kp);
  const points = [];
  const numPoints = 10;

  // 손바닥 상단 (25% 지점)
  const lineY = palmTop.y + palmHeight * 0.2;

  // 시작점: 소지 기저부 아래
  const startX = kp[17].x;

  // 끝점: 검지와 중지 사이 쪽으로
  const endX = kp[5].x + (kp[9].x - kp[5].x) * 0.5;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = startX + (endX - startX) * t;
    // 약간 위로 휘어지는 곡선
    const curve = -Math.sin(t * Math.PI) * palmHeight * 0.05;
    const y = lineY + curve;
    points.push({ x, y, strength: 140 });
  }

  return { detected: true, strength: 140, quality: 'clear', points };
}

// 운명선 계산: 손목에서 중지 방향 세로선
function calculateFateLine(kp) {
  const { palmTop, palmHeight } = getPalmMetrics(kp);
  const points = [];
  const numPoints = 10;

  // 중지 기저부 중심선
  const centerX = kp[9].x;

  // 시작점: 손목 위
  const startY = kp[0].y - palmHeight * 0.15;

  // 끝점: 중지 기저부 근처
  const endY = palmTop.y + palmHeight * 0.3;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // 약간 휘어지는 곡선
    const curve = Math.sin(t * Math.PI) * 5;
    const x = centerX + curve;
    const y = startY + (endY - startY) * t;
    points.push({ x, y, strength: 100 });
  }

  return { detected: true, strength: 100, quality: 'moderate', points };
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
