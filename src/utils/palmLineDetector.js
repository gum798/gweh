/**
 * 손금 라인 감지 유틸리티
 * Canny 엣지 감지 + 키포인트 기반 손금 추출
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

// 이미지 로드
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 그레이스케일 변환
function toGrayscale(imageData) {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    // ITU-R BT.601 가중치
    gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }
  return gray;
}

// 가우시안 블러 (5x5 커널)
function gaussianBlur(gray, width, height) {
  const kernel = [
    [1, 4, 7, 4, 1],
    [4, 16, 26, 16, 4],
    [7, 26, 41, 26, 7],
    [4, 16, 26, 16, 4],
    [1, 4, 7, 4, 1],
  ];
  const kernelSum = 273;
  const result = new Uint8Array(width * height);

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      let sum = 0;
      for (let ky = -2; ky <= 2; ky++) {
        for (let kx = -2; kx <= 2; kx++) {
          sum += gray[(y + ky) * width + (x + kx)] * kernel[ky + 2][kx + 2];
        }
      }
      result[y * width + x] = Math.round(sum / kernelSum);
    }
  }
  return result;
}

// Sobel 그래디언트 계산
function sobelGradient(gray, width, height) {
  const gradX = new Float32Array(width * height);
  const gradY = new Float32Array(width * height);
  const magnitude = new Float32Array(width * height);
  const direction = new Float32Array(width * height);

  // Sobel 커널
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = gray[(y + ky) * width + (x + kx)];
          gx += pixel * sobelX[ky + 1][kx + 1];
          gy += pixel * sobelY[ky + 1][kx + 1];
        }
      }
      const idx = y * width + x;
      gradX[idx] = gx;
      gradY[idx] = gy;
      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      direction[idx] = Math.atan2(gy, gx);
    }
  }
  return { magnitude, direction };
}

// 비최대 억제 (Non-Maximum Suppression)
function nonMaxSuppression(magnitude, direction, width, height) {
  const result = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const mag = magnitude[idx];
      let angle = direction[idx] * (180 / Math.PI);
      if (angle < 0) angle += 180;

      let neighbor1 = 0, neighbor2 = 0;

      // 방향에 따른 이웃 픽셀 선택
      if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle < 180)) {
        neighbor1 = magnitude[idx - 1];
        neighbor2 = magnitude[idx + 1];
      } else if (angle >= 22.5 && angle < 67.5) {
        neighbor1 = magnitude[(y - 1) * width + (x + 1)];
        neighbor2 = magnitude[(y + 1) * width + (x - 1)];
      } else if (angle >= 67.5 && angle < 112.5) {
        neighbor1 = magnitude[(y - 1) * width + x];
        neighbor2 = magnitude[(y + 1) * width + x];
      } else {
        neighbor1 = magnitude[(y - 1) * width + (x - 1)];
        neighbor2 = magnitude[(y + 1) * width + (x + 1)];
      }

      result[idx] = (mag >= neighbor1 && mag >= neighbor2) ? mag : 0;
    }
  }
  return result;
}

// 히스테리시스 임계값 처리
function hysteresisThreshold(nms, width, height, lowThresh, highThresh) {
  const result = new Uint8Array(width * height);
  const strong = 255;
  const weak = 50;

  // 강한/약한 엣지 분류
  for (let i = 0; i < width * height; i++) {
    if (nms[i] >= highThresh) {
      result[i] = strong;
    } else if (nms[i] >= lowThresh) {
      result[i] = weak;
    }
  }

  // 약한 엣지 연결 (강한 엣지와 연결된 경우만 유지)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (result[idx] === weak) {
        // 8방향 이웃 확인
        let hasStrongNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (result[(y + dy) * width + (x + dx)] === strong) {
              hasStrongNeighbor = true;
              break;
            }
          }
          if (hasStrongNeighbor) break;
        }
        result[idx] = hasStrongNeighbor ? strong : 0;
      }
    }
  }
  return result;
}

// Canny 엣지 감지 메인 함수
async function cannyEdgeDetection(imageSrc, kp) {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // 손바닥 영역 계산 (키포인트 기반 바운딩 박스 + 여유)
  const xs = kp.map(p => p.x);
  const ys = kp.map(p => p.y);
  const minX = Math.max(0, Math.min(...xs) - 20);
  const maxX = Math.min(img.width, Math.max(...xs) + 20);
  const minY = Math.max(0, Math.min(...ys) - 20);
  const maxY = Math.min(img.height, Math.max(...ys) + 20);

  const roiWidth = Math.round(maxX - minX);
  const roiHeight = Math.round(maxY - minY);

  canvas.width = roiWidth;
  canvas.height = roiHeight;

  // ROI 추출
  ctx.drawImage(img, minX, minY, roiWidth, roiHeight, 0, 0, roiWidth, roiHeight);
  const imageData = ctx.getImageData(0, 0, roiWidth, roiHeight);

  // Canny 엣지 감지 파이프라인
  const gray = toGrayscale(imageData);
  const blurred = gaussianBlur(gray, roiWidth, roiHeight);
  const { magnitude, direction } = sobelGradient(blurred, roiWidth, roiHeight);
  const nms = nonMaxSuppression(magnitude, direction, roiWidth, roiHeight);
  const edges = hysteresisThreshold(nms, roiWidth, roiHeight, 20, 50);

  return {
    edges,
    width: roiWidth,
    height: roiHeight,
    offsetX: minX,
    offsetY: minY,
  };
}

// 엣지 이미지에서 손금 영역의 포인트 추출
function extractLinePoints(edges, width, height, offsetX, offsetY, startPoint, endPoint, controlPoint, searchRadius = 15) {
  const points = [];
  const numSamples = 12;

  for (let i = 0; i < numSamples; i++) {
    const t = i / (numSamples - 1);

    // 베지어 곡선상의 예상 위치
    let expectedX, expectedY;
    if (controlPoint) {
      // Quadratic Bezier
      expectedX = (1 - t) * (1 - t) * startPoint.x + 2 * (1 - t) * t * controlPoint.x + t * t * endPoint.x;
      expectedY = (1 - t) * (1 - t) * startPoint.y + 2 * (1 - t) * t * controlPoint.y + t * t * endPoint.y;
    } else {
      // Linear
      expectedX = startPoint.x + (endPoint.x - startPoint.x) * t;
      expectedY = startPoint.y + (endPoint.y - startPoint.y) * t;
    }

    // ROI 좌표로 변환
    const localX = Math.round(expectedX - offsetX);
    const localY = Math.round(expectedY - offsetY);

    // 주변에서 가장 강한 엣지 찾기
    let bestX = expectedX;
    let bestY = expectedY;
    let bestStrength = 0;

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const px = localX + dx;
        const py = localY + dy;
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const edgeVal = edges[py * width + px];
          if (edgeVal > bestStrength) {
            bestStrength = edgeVal;
            bestX = px + offsetX;
            bestY = py + offsetY;
          }
        }
      }
    }

    // 엣지를 찾지 못한 경우 예상 위치 사용
    const strength = bestStrength > 0 ? Math.min(200, 100 + bestStrength / 2) : 80;
    points.push({ x: bestX, y: bestY, strength });
  }

  return points;
}

// 손금 라인 감지 (Canny 엣지 기반)
export async function detectPalmLines(imageSrc, kp) {
  let edgeData = null;

  try {
    edgeData = await cannyEdgeDetection(imageSrc, kp);
  } catch (e) {
    console.warn('Canny edge detection failed, using fallback:', e);
  }

  const lines = {
    heartLine: calculateHeartLine(kp, edgeData),
    headLine: calculateHeadLine(kp, edgeData),
    lifeLine: calculateLifeLine(kp, edgeData),
    fateLine: calculateFateLine(kp, edgeData),
  };

  console.log('Detected palm lines:', lines);
  return lines;
}

// 감정선 (Heart Line): 소지 아래에서 시작 → 검지/중지 방향으로 가로선
function calculateHeartLine(kp, edgeData) {
  // 시작점: 소지 기저부(17)와 손목(0) 사이, 20% 지점
  const start = lerp(kp[17], kp[0], 0.2);

  // 끝점: 검지 기저부(5)와 중지 기저부(9) 중간, 손목 방향으로 15%
  const fingerMid = lerp(kp[5], kp[9], 0.5);
  const end = lerp(fingerMid, kp[0], 0.15);

  // 제어점: 중지 기저부(9)와 손목(0) 사이 20% 지점
  const ctrl = lerp(kp[9], kp[0], 0.2);

  let points;
  if (edgeData) {
    points = extractLinePoints(
      edgeData.edges, edgeData.width, edgeData.height,
      edgeData.offsetX, edgeData.offsetY,
      start, end, ctrl, 12
    );
  } else {
    points = generateFallbackPoints(start, end, ctrl, 10, 140);
  }

  const avgStrength = points.reduce((sum, p) => sum + p.strength, 0) / points.length;
  const quality = avgStrength > 150 ? 'strong' : avgStrength > 100 ? 'clear' : avgStrength > 70 ? 'moderate' : 'faint';

  return { detected: true, strength: avgStrength, quality, points };
}

// 두뇌선 (Head Line): 검지 기저부 아래에서 시작 → 손바닥 중앙 가로 방향
function calculateHeadLine(kp, edgeData) {
  // 시작점: 검지 기저부(5)와 엄지 기저부(2) 사이, 손목 방향으로 35%
  const thumbIndex = lerp(kp[2], kp[5], 0.6);
  const start = lerp(thumbIndex, kp[0], 0.35);

  // 끝점: 소지 기저부(17)와 손목(0) 사이 45% 지점
  const end = lerp(kp[17], kp[0], 0.45);

  // 제어점: 중지(9)와 손목(0) 사이 45% 지점
  const ctrl = lerp(kp[9], kp[0], 0.45);

  let points;
  if (edgeData) {
    points = extractLinePoints(
      edgeData.edges, edgeData.width, edgeData.height,
      edgeData.offsetX, edgeData.offsetY,
      start, end, ctrl, 12
    );
  } else {
    points = generateFallbackPoints(start, end, ctrl, 10, 130);
  }

  const avgStrength = points.reduce((sum, p) => sum + p.strength, 0) / points.length;
  const quality = avgStrength > 150 ? 'strong' : avgStrength > 100 ? 'clear' : avgStrength > 70 ? 'moderate' : 'faint';

  return { detected: true, strength: avgStrength, quality, points };
}

// 생명선 (Life Line): 검지-엄지 사이에서 시작 → 엄지를 감싸며 손목 방향
function calculateLifeLine(kp, edgeData) {
  // 시작점: 검지 기저부(5)와 엄지(2) 사이
  const start = lerp(kp[5], kp[2], 0.4);

  // 끝점: 손목(0)과 엄지(1) 사이
  const end = lerp(kp[0], kp[1], 0.3);

  // 제어점: 엄지(1) 쪽으로 휘어지게
  const ctrl = lerp(kp[1], kp[0], 0.5);

  let points;
  if (edgeData) {
    points = extractLinePoints(
      edgeData.edges, edgeData.width, edgeData.height,
      edgeData.offsetX, edgeData.offsetY,
      start, end, ctrl, 15
    );
  } else {
    points = generateFallbackPoints(start, end, ctrl, 10, 150);
  }

  const avgStrength = points.reduce((sum, p) => sum + p.strength, 0) / points.length;
  const quality = avgStrength > 150 ? 'strong' : avgStrength > 100 ? 'clear' : avgStrength > 70 ? 'moderate' : 'faint';

  return { detected: true, strength: avgStrength, quality, points };
}

// 운명선 (Fate Line): 손목 중앙에서 중지 방향 세로선
function calculateFateLine(kp, edgeData) {
  // 시작점: 손목(0)에서 중지(9) 방향 15% 지점
  const start = lerp(kp[0], kp[9], 0.15);

  // 끝점: 중지(9)에서 손목(0) 방향 60% 지점 (손바닥 중간까지)
  const end = lerp(kp[9], kp[0], 0.6);

  let points;
  if (edgeData) {
    points = extractLinePoints(
      edgeData.edges, edgeData.width, edgeData.height,
      edgeData.offsetX, edgeData.offsetY,
      start, end, null, 10
    );
  } else {
    points = generateFallbackPoints(start, end, null, 10, 100);
  }

  const avgStrength = points.reduce((sum, p) => sum + p.strength, 0) / points.length;
  const quality = avgStrength > 150 ? 'strong' : avgStrength > 100 ? 'clear' : avgStrength > 70 ? 'moderate' : 'faint';

  return { detected: true, strength: avgStrength, quality, points };
}

// 폴백용 포인트 생성 (엣지 감지 실패 시)
function generateFallbackPoints(start, end, ctrl, numPoints, defaultStrength) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    let x, y;
    if (ctrl) {
      x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * ctrl.x + t * t * end.x;
      y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * ctrl.y + t * t * end.y;
    } else {
      x = start.x + (end.x - start.x) * t;
      y = start.y + (end.y - start.y) * t;
    }
    points.push({ x, y, strength: defaultStrength });
  }
  return points;
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
