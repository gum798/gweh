/**
 * 손금 라인 감지 유틸리티
 * MediaPipe Hands 키포인트 기반으로 손금 위치 계산
 *
 * 키포인트 번호:
 * 0: 손목
 * 1-4: 엄지 (1=CMC, 2=MCP, 3=IP, 4=TIP)
 * 5-8: 검지 (5=MCP, 6=PIP, 7=DIP, 8=TIP)
 * 9-12: 중지
 * 13-16: 약지
 * 17-20: 소지
 */

// 두 점 사이 보간
function lerp(p1, p2, t) {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

// 손금 라인 감지
export async function detectPalmLines(imageSrc, kp) {
  const lines = {
    heartLine: calculateHeartLine(kp),
    headLine: calculateHeadLine(kp),
    lifeLine: calculateLifeLine(kp),
    fateLine: calculateFateLine(kp),
  };

  console.log('Calculated palm lines:', lines);
  return lines;
}

// 감정선 (Heart Line): 소지 아래에서 시작 → 검지/중지 방향으로 가로선
// 손가락 기저부 바로 아래에 위치
function calculateHeartLine(kp) {
  const points = [];
  const numPoints = 10;

  // 시작점: 소지 기저부(17)와 손목(0) 사이, 20% 지점
  const start = lerp(kp[17], kp[0], 0.2);

  // 끝점: 검지 기저부(5)와 중지 기저부(9) 중간, 손목 방향으로 15%
  const fingerMid = lerp(kp[5], kp[9], 0.5);
  const end = lerp(fingerMid, kp[0], 0.15);

  // 제어점: 중지 기저부(9)와 손목(0) 사이 20% 지점
  const ctrl = lerp(kp[9], kp[0], 0.2);

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // Quadratic Bezier curve
    const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * ctrl.x + t * t * end.x;
    const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * ctrl.y + t * t * end.y;
    points.push({ x, y, strength: 140 });
  }

  return { detected: true, strength: 140, quality: 'clear', points };
}

// 두뇌선 (Head Line): 검지 기저부 아래에서 시작 → 손바닥 중앙 가로 방향
// 감정선보다 아래에 위치
function calculateHeadLine(kp) {
  const points = [];
  const numPoints = 10;

  // 시작점: 검지 기저부(5)와 엄지 기저부(2) 사이, 손목 방향으로 35%
  const thumbIndex = lerp(kp[2], kp[5], 0.6);
  const start = lerp(thumbIndex, kp[0], 0.35);

  // 끝점: 소지 기저부(17)와 손목(0) 사이 45% 지점
  const end = lerp(kp[17], kp[0], 0.45);

  // 제어점: 중지(9)와 손목(0) 사이 45% 지점
  const ctrl = lerp(kp[9], kp[0], 0.45);

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * ctrl.x + t * t * end.x;
    const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * ctrl.y + t * t * end.y;
    points.push({ x, y, strength: 130 });
  }

  return { detected: true, strength: 130, quality: 'clear', points };
}

// 생명선 (Life Line): 검지-엄지 사이에서 시작 → 엄지를 감싸며 손목 방향
function calculateLifeLine(kp) {
  const points = [];
  const numPoints = 10;

  // 시작점: 검지 기저부(5)와 엄지(2) 사이
  const start = lerp(kp[5], kp[2], 0.4);

  // 끝점: 손목(0)과 엄지(1) 사이
  const end = lerp(kp[0], kp[1], 0.3);

  // 제어점: 엄지(1) 쪽으로 휘어지게
  const ctrl = lerp(kp[1], kp[0], 0.5);

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * ctrl.x + t * t * end.x;
    const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * ctrl.y + t * t * end.y;
    points.push({ x, y, strength: 150 });
  }

  return { detected: true, strength: 150, quality: 'clear', points };
}

// 운명선 (Fate Line): 손목 중앙에서 중지 방향 세로선
function calculateFateLine(kp) {
  const points = [];
  const numPoints = 10;

  // 시작점: 손목(0)에서 중지(9) 방향 15% 지점
  const start = lerp(kp[0], kp[9], 0.15);

  // 끝점: 중지(9)에서 손목(0) 방향 60% 지점 (손바닥 중간까지)
  const end = lerp(kp[9], kp[0], 0.6);

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // 직선에 가깝게
    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
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
