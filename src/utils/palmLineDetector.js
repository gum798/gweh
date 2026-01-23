/**
 * 손금 라인 감지 유틸리티
 * Canvas 기반 Canny Edge Detection으로 실제 손금 감지
 */

// 손금 라인 감지
export async function detectPalmLines(imageSrc, keypoints) {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageSrc;
  });

  // 손바닥 영역 추출
  const palmRegion = getPalmRegion(keypoints);

  // Canvas에서 손바닥 영역 추출
  const canvas = document.createElement('canvas');
  const regionWidth = palmRegion.width;
  const regionHeight = palmRegion.height;
  canvas.width = regionWidth;
  canvas.height = regionHeight;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    img,
    palmRegion.x, palmRegion.y, regionWidth, regionHeight,
    0, 0, regionWidth, regionHeight
  );

  const imageData = ctx.getImageData(0, 0, regionWidth, regionHeight);

  // 엣지 감지로 손금 찾기
  const edges = detectEdges(imageData);

  // 손금 라인별로 실제 엣지 포인트 추출
  const lines = {
    lifeLine: extractLifeLine(edges, keypoints, palmRegion),
    headLine: extractHeadLine(edges, keypoints, palmRegion),
    heartLine: extractHeartLine(edges, keypoints, palmRegion),
    fateLine: extractFateLine(edges, keypoints, palmRegion),
  };

  return lines;
}

// 손바닥 영역 계산
function getPalmRegion(keypoints) {
  // 손바닥 관련 키포인트만 사용 (0, 1, 5, 9, 13, 17)
  const palmIndices = [0, 1, 2, 5, 9, 13, 17];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  palmIndices.forEach(i => {
    minX = Math.min(minX, keypoints[i].x);
    maxX = Math.max(maxX, keypoints[i].x);
    minY = Math.min(minY, keypoints[i].y);
    maxY = Math.max(maxY, keypoints[i].y);
  });

  const padding = 30;
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

// Canny 스타일 엣지 감지
function detectEdges(imageData) {
  const { data, width, height } = imageData;

  // 1. 그레이스케일
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // 2. 가우시안 블러 (5x5)
  const blurred = gaussianBlur5x5(gray, width, height);

  // 3. Sobel 그래디언트
  const { magnitude, direction } = sobelGradient(blurred, width, height);

  // 4. Non-maximum suppression
  const suppressed = nonMaxSuppression(magnitude, direction, width, height);

  // 5. Double threshold + Edge tracking
  const edges = hysteresisThreshold(suppressed, width, height, 30, 80);

  return { edges, width, height };
}

// 5x5 가우시안 블러
function gaussianBlur5x5(data, width, height) {
  const kernel = [
    1, 4, 6, 4, 1,
    4, 16, 24, 16, 4,
    6, 24, 36, 24, 6,
    4, 16, 24, 16, 4,
    1, 4, 6, 4, 1
  ];
  const kernelSum = 256;
  const result = new Float32Array(width * height);

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      let sum = 0;
      let ki = 0;
      for (let ky = -2; ky <= 2; ky++) {
        for (let kx = -2; kx <= 2; kx++) {
          sum += data[(y + ky) * width + (x + kx)] * kernel[ki++];
        }
      }
      result[y * width + x] = sum / kernelSum;
    }
  }
  return result;
}

// Sobel 그래디언트
function sobelGradient(data, width, height) {
  const magnitude = new Float32Array(width * height);
  const direction = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel X
      const gx =
        -data[(y - 1) * width + (x - 1)] + data[(y - 1) * width + (x + 1)] +
        -2 * data[y * width + (x - 1)] + 2 * data[y * width + (x + 1)] +
        -data[(y + 1) * width + (x - 1)] + data[(y + 1) * width + (x + 1)];

      // Sobel Y
      const gy =
        -data[(y - 1) * width + (x - 1)] - 2 * data[(y - 1) * width + x] - data[(y - 1) * width + (x + 1)] +
        data[(y + 1) * width + (x - 1)] + 2 * data[(y + 1) * width + x] + data[(y + 1) * width + (x + 1)];

      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      direction[idx] = Math.atan2(gy, gx);
    }
  }

  return { magnitude, direction };
}

// Non-maximum suppression
function nonMaxSuppression(magnitude, direction, width, height) {
  const result = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const angle = direction[idx] * 180 / Math.PI;
      const mag = magnitude[idx];

      let q = 0, r = 0;

      // 방향에 따라 비교할 이웃 결정
      if ((angle >= -22.5 && angle < 22.5) || (angle >= 157.5 || angle < -157.5)) {
        q = magnitude[y * width + (x + 1)];
        r = magnitude[y * width + (x - 1)];
      } else if ((angle >= 22.5 && angle < 67.5) || (angle >= -157.5 && angle < -112.5)) {
        q = magnitude[(y - 1) * width + (x + 1)];
        r = magnitude[(y + 1) * width + (x - 1)];
      } else if ((angle >= 67.5 && angle < 112.5) || (angle >= -112.5 && angle < -67.5)) {
        q = magnitude[(y - 1) * width + x];
        r = magnitude[(y + 1) * width + x];
      } else {
        q = magnitude[(y - 1) * width + (x - 1)];
        r = magnitude[(y + 1) * width + (x + 1)];
      }

      result[idx] = (mag >= q && mag >= r) ? mag : 0;
    }
  }

  return result;
}

// Hysteresis thresholding
function hysteresisThreshold(data, width, height, lowThresh, highThresh) {
  const result = new Uint8Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (data[idx] >= highThresh) {
        result[idx] = 255;
      } else if (data[idx] >= lowThresh) {
        // 주변에 강한 엣지가 있으면 연결
        let hasStrongNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (data[(y + dy) * width + (x + dx)] >= highThresh) {
              hasStrongNeighbor = true;
              break;
            }
          }
          if (hasStrongNeighbor) break;
        }
        result[idx] = hasStrongNeighbor ? 255 : 0;
      }
    }
  }

  return result;
}

// 특정 영역에서 엣지 포인트 추출
function extractEdgePoints(edges, startX, startY, endX, endY, palmRegion, searchWidth = 15) {
  const { edges: edgeData, width, height } = edges;
  const points = [];
  const numSamples = 10;

  for (let i = 0; i < numSamples; i++) {
    const t = i / (numSamples - 1);
    const baseX = startX + (endX - startX) * t - palmRegion.x;
    const baseY = startY + (endY - startY) * t - palmRegion.y;

    // 주변에서 가장 강한 엣지 포인트 찾기
    let bestX = baseX;
    let bestY = baseY;
    let maxEdge = 0;

    for (let dy = -searchWidth; dy <= searchWidth; dy++) {
      for (let dx = -searchWidth; dx <= searchWidth; dx++) {
        const nx = Math.round(baseX + dx);
        const ny = Math.round(baseY + dy);

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const edgeValue = edgeData[ny * width + nx];
          // 기본 위치에 가까울수록 가중치
          const dist = Math.sqrt(dx * dx + dy * dy);
          const weighted = edgeValue * (1 - dist / (searchWidth * 2));

          if (weighted > maxEdge) {
            maxEdge = weighted;
            bestX = nx;
            bestY = ny;
          }
        }
      }
    }

    points.push({
      x: bestX + palmRegion.x,
      y: bestY + palmRegion.y,
      strength: maxEdge,
    });
  }

  return points;
}

// 생명선 추출
function extractLifeLine(edges, kp, region) {
  // 생명선: 엄지-검지 사이 → 손목 방향 (엄지를 감싸는 곡선)
  const startX = kp[2].x + (kp[5].x - kp[2].x) * 0.3;
  const startY = kp[2].y + (kp[5].y - kp[2].y) * 0.3;

  const endX = kp[0].x + (kp[1].x - kp[0].x) * 0.5;
  const endY = kp[0].y - Math.abs(kp[0].y - kp[5].y) * 0.1;

  // 곡선 경로를 따라 포인트 생성
  const points = [];
  const numPoints = 10;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // 베지어 곡선으로 엄지를 감싸는 모양
    const ctrlX = kp[1].x - Math.abs(kp[5].x - kp[1].x) * 0.3;
    const ctrlY = (startY + endY) / 2;

    const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
    const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;

    // 해당 위치 근처에서 실제 엣지 찾기
    const edgePoint = findNearestEdge(edges, x - region.x, y - region.y, 12);
    points.push({
      x: edgePoint.x + region.x,
      y: edgePoint.y + region.y,
      strength: edgePoint.strength,
    });
  }

  const avgStrength = points.reduce((s, p) => s + p.strength, 0) / points.length;
  return { detected: true, strength: avgStrength, quality: getQuality(avgStrength), points };
}

// 두뇌선 추출
function extractHeadLine(edges, kp, region) {
  // 두뇌선: 손바닥 중간 가로선
  const palmTop = { x: (kp[5].x + kp[17].x) / 2, y: (kp[5].y + kp[17].y) / 2 };
  const palmHeight = Math.abs(kp[0].y - palmTop.y);

  const lineY = palmTop.y + palmHeight * 0.5;
  const startX = kp[5].x - (kp[5].x - kp[2].x) * 0.2;
  const endX = kp[17].x;

  const points = [];
  const numPoints = 10;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = startX + (endX - startX) * t;
    const y = lineY + Math.sin(t * Math.PI) * palmHeight * 0.05; // 약간 아래로 휘어짐

    const edgePoint = findNearestEdge(edges, x - region.x, y - region.y, 15);
    points.push({
      x: edgePoint.x + region.x,
      y: edgePoint.y + region.y,
      strength: edgePoint.strength,
    });
  }

  const avgStrength = points.reduce((s, p) => s + p.strength, 0) / points.length;
  return { detected: true, strength: avgStrength, quality: getQuality(avgStrength), points };
}

// 감정선 추출
function extractHeartLine(edges, kp, region) {
  // 감정선: 손바닥 상단 가로선 (손가락 바로 아래)
  const palmTop = { x: (kp[5].x + kp[17].x) / 2, y: (kp[5].y + kp[17].y) / 2 };
  const palmHeight = Math.abs(kp[0].y - palmTop.y);

  const lineY = palmTop.y + palmHeight * 0.25;
  const startX = kp[17].x;
  const endX = kp[5].x + (kp[9].x - kp[5].x) * 0.3;

  const points = [];
  const numPoints = 10;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = startX + (endX - startX) * t;
    const y = lineY - Math.sin(t * Math.PI) * palmHeight * 0.03; // 약간 위로 휘어짐

    const edgePoint = findNearestEdge(edges, x - region.x, y - region.y, 15);
    points.push({
      x: edgePoint.x + region.x,
      y: edgePoint.y + region.y,
      strength: edgePoint.strength,
    });
  }

  const avgStrength = points.reduce((s, p) => s + p.strength, 0) / points.length;
  return { detected: true, strength: avgStrength, quality: getQuality(avgStrength), points };
}

// 운명선 추출
function extractFateLine(edges, kp, region) {
  // 운명선: 손목 → 중지 세로선
  const palmTop = { x: (kp[5].x + kp[17].x) / 2, y: (kp[5].y + kp[17].y) / 2 };
  const palmHeight = Math.abs(kp[0].y - palmTop.y);

  const centerX = kp[9].x;
  const startY = kp[0].y - palmHeight * 0.1;
  const endY = palmTop.y + palmHeight * 0.45;

  const points = [];
  const numPoints = 10;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const x = centerX;
    const y = startY + (endY - startY) * t;

    const edgePoint = findNearestEdge(edges, x - region.x, y - region.y, 10);
    points.push({
      x: edgePoint.x + region.x,
      y: edgePoint.y + region.y,
      strength: edgePoint.strength,
    });
  }

  const avgStrength = points.reduce((s, p) => s + p.strength, 0) / points.length;
  return { detected: true, strength: avgStrength, quality: getQuality(avgStrength), points };
}

// 가장 가까운 엣지 포인트 찾기
function findNearestEdge(edges, baseX, baseY, searchRadius) {
  const { edges: edgeData, width, height } = edges;
  let bestX = baseX;
  let bestY = baseY;
  let maxStrength = 0;

  const x = Math.round(baseX);
  const y = Math.round(baseY);

  for (let dy = -searchRadius; dy <= searchRadius; dy++) {
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const strength = edgeData[ny * width + nx];
        const dist = Math.sqrt(dx * dx + dy * dy);
        const weighted = strength * (1 - dist / (searchRadius * 1.5));

        if (weighted > maxStrength) {
          maxStrength = weighted;
          bestX = nx;
          bestY = ny;
        }
      }
    }
  }

  return { x: bestX, y: bestY, strength: maxStrength };
}

// 품질 판정
function getQuality(strength) {
  if (strength > 200) return 'strong';
  if (strength > 100) return 'clear';
  if (strength > 50) return 'moderate';
  if (strength > 20) return 'faint';
  return 'unclear';
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
