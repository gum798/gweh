/**
 * 손금 라인 감지 유틸리티
 * Canvas 이미지 처리를 통해 손바닥의 주름(손금)을 감지
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

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 손바닥 영역 추출
  const palmRegion = extractPalmRegion(keypoints, img.width, img.height);

  // 손바닥 영역의 이미지 데이터 가져오기
  const imageData = ctx.getImageData(
    palmRegion.x,
    palmRegion.y,
    palmRegion.width,
    palmRegion.height
  );

  // 이미지 처리: 그레이스케일 → 대비 강화 → 엣지 감지
  const processed = processImageForLines(imageData);

  // 손금 라인 분석
  const lines = analyzeLines(processed, palmRegion, keypoints);

  return lines;
}

// 손바닥 영역 추출
function extractPalmRegion(keypoints, imgWidth, imgHeight) {
  // 손바닥 영역 정의 (손목 ~ 손가락 시작점)
  const palmPoints = [0, 1, 5, 9, 13, 17];
  let minX = Infinity, maxX = 0, minY = Infinity, maxY = 0;

  palmPoints.forEach(idx => {
    const p = keypoints[idx];
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  // 여유 공간 추가
  const padding = 20;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(imgWidth, maxX + padding);
  maxY = Math.min(imgHeight, maxY + padding);

  return {
    x: Math.floor(minX),
    y: Math.floor(minY),
    width: Math.floor(maxX - minX),
    height: Math.floor(maxY - minY),
  };
}

// 이미지 처리: 손금 라인 강조
function processImageForLines(imageData) {
  const { data, width, height } = imageData;
  const gray = new Uint8ClampedArray(width * height);
  const edges = new Uint8ClampedArray(width * height);

  // 1. 그레이스케일 변환
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // 2. 가우시안 블러 (노이즈 제거)
  const blurred = gaussianBlur(gray, width, height);

  // 3. Sobel 엣지 감지
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel X
      const gx =
        -blurred[(y - 1) * width + (x - 1)] +
        blurred[(y - 1) * width + (x + 1)] +
        -2 * blurred[y * width + (x - 1)] +
        2 * blurred[y * width + (x + 1)] +
        -blurred[(y + 1) * width + (x - 1)] +
        blurred[(y + 1) * width + (x + 1)];

      // Sobel Y
      const gy =
        -blurred[(y - 1) * width + (x - 1)] +
        -2 * blurred[(y - 1) * width + x] +
        -blurred[(y - 1) * width + (x + 1)] +
        blurred[(y + 1) * width + (x - 1)] +
        2 * blurred[(y + 1) * width + x] +
        blurred[(y + 1) * width + (x + 1)];

      edges[idx] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
    }
  }

  // 4. 임계값 적용
  const threshold = calculateOtsuThreshold(edges, width, height);
  const binary = new Uint8ClampedArray(width * height);

  for (let i = 0; i < edges.length; i++) {
    binary[i] = edges[i] > threshold ? 255 : 0;
  }

  return { binary, edges, width, height };
}

// 가우시안 블러
function gaussianBlur(data, width, height) {
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kernelSum = 16;
  const result = new Uint8ClampedArray(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      let ki = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          sum += data[(y + ky) * width + (x + kx)] * kernel[ki++];
        }
      }
      result[y * width + x] = Math.round(sum / kernelSum);
    }
  }

  return result;
}

// Otsu 임계값 계산
function calculateOtsuThreshold(data, width, height) {
  const histogram = new Array(256).fill(0);
  const total = width * height;

  for (let i = 0; i < data.length; i++) {
    histogram[data[i]]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  return threshold;
}

// 손금 라인 분석
function analyzeLines(processed, palmRegion, keypoints) {
  const { binary, edges, width, height } = processed;

  // 손금 영역 분석 (생명선, 두뇌선, 감정선, 운명선)
  const lines = {
    lifeLine: analyzeLifeLine(edges, width, height, keypoints, palmRegion),
    headLine: analyzeHeadLine(edges, width, height, keypoints, palmRegion),
    heartLine: analyzeHeartLine(edges, width, height, keypoints, palmRegion),
    fateLine: analyzeFateLine(edges, width, height, keypoints, palmRegion),
  };

  return lines;
}

// 생명선 분석 (엄지와 검지 사이에서 손목 방향으로 휘어지는 선)
function analyzeLifeLine(edges, width, height, keypoints, region) {
  // 생명선: 엄지-검지 사이에서 시작, 엄지 둘레를 감싸며 손목 방향으로
  // 시작점: 엄지 기저부와 검지 기저부 사이
  const thumbBase = keypoints[1];
  const indexBase = keypoints[5];
  const wrist = keypoints[0];

  // 시작점: 엄지와 검지 사이 (손바닥 안쪽)
  const startX = thumbBase.x + (indexBase.x - thumbBase.x) * 0.3;
  const startY = thumbBase.y + (indexBase.y - thumbBase.y) * 0.5;

  // 끝점: 손목 위쪽, 엄지 쪽으로 치우침
  const endX = wrist.x + (thumbBase.x - wrist.x) * 0.4;
  const endY = wrist.y - (wrist.y - thumbBase.y) * 0.15;

  const points = [];
  const numPoints = 10;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // 생명선은 엄지를 감싸는 곡선
    const curve = Math.sin(t * Math.PI) * 0.25;
    const baseX = startX + (endX - startX) * t - curve * Math.abs(endY - startY);
    const baseY = startY + (endY - startY) * t;

    const optimalPoint = findOptimalPoint(
      edges, width, height,
      baseX - region.x,
      baseY - region.y,
      region
    );

    points.push({
      x: optimalPoint.x + region.x,
      y: optimalPoint.y + region.y,
      strength: optimalPoint.strength,
    });
  }

  const avgStrength = points.reduce((sum, p) => sum + p.strength, 0) / points.length;

  return {
    detected: true,
    strength: avgStrength,
    quality: getLineQuality(avgStrength),
    points: points,
  };
}

// 두뇌선 분석 (손바닥 중간을 가로지르는 선)
function analyzeHeadLine(edges, width, height, keypoints, region) {
  // 두뇌선: 생명선 시작점 근처에서 시작, 손바닥을 가로질러 소지 방향으로
  const thumbBase = keypoints[1];
  const indexBase = keypoints[5];
  const pinkyBase = keypoints[17];
  const wrist = keypoints[0];

  // 시작점: 검지 아래 손바닥 (생명선 시작점 근처)
  const startX = thumbBase.x + (indexBase.x - thumbBase.x) * 0.4;
  const startY = indexBase.y + (wrist.y - indexBase.y) * 0.35;

  // 끝점: 손바닥 반대편 (소지 아래)
  const endX = pinkyBase.x;
  const endY = pinkyBase.y + (wrist.y - pinkyBase.y) * 0.4;

  const points = [];
  const numPoints = 10;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // 두뇌선은 약간 아래로 처지는 곡선
    const curve = Math.sin(t * Math.PI) * 0.08;
    const baseX = startX + (endX - startX) * t;
    const baseY = startY + (endY - startY) * t + curve * Math.abs(endX - startX);

    const optimalPoint = findOptimalPoint(
      edges, width, height,
      baseX - region.x,
      baseY - region.y,
      region
    );

    points.push({
      x: optimalPoint.x + region.x,
      y: optimalPoint.y + region.y,
      strength: optimalPoint.strength,
    });
  }

  const avgStrength = points.reduce((sum, p) => sum + p.strength, 0) / points.length;

  return {
    detected: true,
    strength: avgStrength,
    quality: getLineQuality(avgStrength),
    points: points,
  };
}

// 감정선 분석 (손가락 바로 아래, 손바닥 상단을 가로지르는 선)
function analyzeHeartLine(edges, width, height, keypoints, region) {
  // 감정선: 소지 아래에서 시작, 검지 방향으로 가는 손바닥 상단의 선
  const indexBase = keypoints[5];
  const middleBase = keypoints[9];
  const pinkyBase = keypoints[17];
  const wrist = keypoints[0];

  // 시작점: 소지 아래 손바닥 (감정선은 소지쪽에서 시작)
  const startX = pinkyBase.x;
  const startY = pinkyBase.y + (wrist.y - pinkyBase.y) * 0.2;

  // 끝점: 검지-중지 사이 아래
  const endX = indexBase.x + (middleBase.x - indexBase.x) * 0.5;
  const endY = indexBase.y + (wrist.y - indexBase.y) * 0.15;

  const points = [];
  const numPoints = 10;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // 감정선은 약간 위로 휘어지는 곡선
    const curve = -Math.sin(t * Math.PI) * 0.05;
    const baseX = startX + (endX - startX) * t;
    const baseY = startY + (endY - startY) * t + curve * Math.abs(endX - startX);

    const optimalPoint = findOptimalPoint(
      edges, width, height,
      baseX - region.x,
      baseY - region.y,
      region
    );

    points.push({
      x: optimalPoint.x + region.x,
      y: optimalPoint.y + region.y,
      strength: optimalPoint.strength,
    });
  }

  const avgStrength = points.reduce((sum, p) => sum + p.strength, 0) / points.length;

  return {
    detected: true,
    strength: avgStrength,
    quality: getLineQuality(avgStrength),
    points: points,
  };
}

// 운명선 분석 (손바닥 중앙을 세로로 가로지르는 선)
function analyzeFateLine(edges, width, height, keypoints, region) {
  // 운명선: 손목 중앙에서 중지 기저부로 올라가는 세로선
  const middleBase = keypoints[9];
  const wrist = keypoints[0];
  const indexBase = keypoints[5];
  const pinkyBase = keypoints[17];

  // 손바닥 중앙 X 좌표
  const palmCenterX = (indexBase.x + pinkyBase.x) / 2;

  // 시작점: 손목 위쪽 (손바닥 하단)
  const startX = palmCenterX;
  const startY = wrist.y - (wrist.y - middleBase.y) * 0.1;

  // 끝점: 중지 기저부 아래
  const endX = middleBase.x;
  const endY = middleBase.y + (wrist.y - middleBase.y) * 0.25;

  const points = [];
  const numPoints = 10;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // 운명선은 거의 직선이지만 약간 구불거림
    const curve = Math.sin(t * Math.PI) * 0.02;
    const baseX = startX + (endX - startX) * t + curve * Math.abs(startY - endY);
    const baseY = startY + (endY - startY) * t;

    const optimalPoint = findOptimalPoint(
      edges, width, height,
      baseX - region.x,
      baseY - region.y,
      region
    );

    points.push({
      x: optimalPoint.x + region.x,
      y: optimalPoint.y + region.y,
      strength: optimalPoint.strength,
    });
  }

  const avgStrength = points.reduce((sum, p) => sum + p.strength, 0) / points.length;

  return {
    detected: true,
    strength: avgStrength,
    quality: getLineQuality(avgStrength),
    points: points,
  };
}

// 주변에서 가장 강한 엣지 포인트 찾기
function findOptimalPoint(edges, width, height, baseX, baseY, region) {
  const searchRadius = 8; // 탐색 반경
  let maxStrength = 0;
  let bestX = baseX;
  let bestY = baseY;

  const x = Math.round(baseX);
  const y = Math.round(baseY);

  for (let dy = -searchRadius; dy <= searchRadius; dy++) {
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const strength = edges[ny * width + nx];
        // 중심에서 가까울수록 가중치 부여
        const dist = Math.sqrt(dx * dx + dy * dy);
        const weightedStrength = strength * (1 - dist / (searchRadius * 1.5));

        if (weightedStrength > maxStrength) {
          maxStrength = weightedStrength;
          bestX = nx;
          bestY = ny;
        }
      }
    }
  }

  return {
    x: bestX,
    y: bestY,
    strength: maxStrength > 0 ? edges[Math.round(bestY) * width + Math.round(bestX)] : 0,
  };
}

// 라인 강도 측정
function measureLineStrength(edges, width, height, x1, y1, x2, y2, region) {
  const samples = 20;
  let totalStrength = 0;
  let validSamples = 0;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = Math.round(x1 + (x2 - x1) * t);
    const y = Math.round(y1 + (y2 - y1) * t);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      // 주변 픽셀도 샘플링 (라인 폭 고려)
      let maxEdge = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            maxEdge = Math.max(maxEdge, edges[ny * width + nx]);
          }
        }
      }
      totalStrength += maxEdge;
      validSamples++;
    }
  }

  return validSamples > 0 ? totalStrength / validSamples : 0;
}

// 라인 품질 판정
function getLineQuality(strength) {
  if (strength > 80) return 'strong';
  if (strength > 50) return 'clear';
  if (strength > 30) return 'moderate';
  if (strength > 15) return 'faint';
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
