import { useState, useCallback, useRef } from 'react';
import i18next from 'i18next';
import { detectPalmLines } from '../utils/palmLineDetector';
import { analyzeFingerGesture } from '../utils/fingerGestureAnalyzer';

// TensorFlow 동적 import (bundle-defer-third-party)
type TFModule = typeof import('@tensorflow/tfjs');
type HandModule = typeof import('@tensorflow-models/hand-pose-detection');

let tf: TFModule | null = null;
let handPoseDetection: HandModule | null = null;

// async-parallel: Parallelize TensorFlow module imports for faster loading
async function loadModules() {
  if (!tf || !handPoseDetection) {
    const [tfModule, handModule] = await Promise.all([
      tf || import('@tensorflow/tfjs'),
      handPoseDetection || import('@tensorflow-models/hand-pose-detection')
    ]);

    if (!tf) {
      tf = tfModule;
      await tf.ready();
    }
    if (!handPoseDetection) {
      handPoseDetection = handModule;
    }
  }
  return { tf, handPoseDetection };
}

export function useHandDetection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modelRef = useRef<any>(null);

  const loadModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current;

    try {
      const { handPoseDetection: handModule } = await loadModules();

      const model = await handModule!.createDetector(
        handModule!.SupportedModels.MediaPipeHands,
        {
          runtime: 'tfjs',
          modelType: 'full',
          maxHands: 1,
        }
      );

      modelRef.current = model;
      return model;
    } catch (err) {
      console.error('Hand detection model load error:', err);
      throw new Error(i18next.t('error.handModel'));
    }
  }, []);

  const detectHand = useCallback(async (imageSrc) => {
    setIsLoading(true);
    setError(null);

    try {
      const model = await loadModel();

      // 이미지 로드
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      // 손 감지
      const predictions = await model.estimateHands(img);

      if (!predictions || predictions.length === 0) {
        throw new Error(i18next.t('error.handModel'));
      }

      const hand = predictions[0];

      // 손 특성 분석
      const handFeatures = analyzeHandFeatures(hand.keypoints, img.width, img.height);

      // 손금 라인 감지 (이미지 처리)
      let palmLines = null;
      try {
        palmLines = await detectPalmLines(imageSrc, hand.keypoints);
        console.log('Palm lines detected:', palmLines);
        console.log('Keypoints:', hand.keypoints);
      } catch (lineError) {
        console.warn('Palm line detection failed:', lineError);
        // 손금 감지 실패해도 계속 진행
      }

      // 손가락 자세 분석
      const fingerGesture = analyzeFingerGesture(hand.keypoints);

      // 손 스켈레톤이 그려진 이미지 생성
      const annotatedImage = drawHandSkeleton(img, hand.keypoints, palmLines);

      setIsLoading(false);
      return {
        keypoints: hand.keypoints,
        handedness: hand.handedness,
        features: handFeatures,
        palmLines, // 실제 감지된 손금 라인
        fingerGesture, // 손가락 자세 분석 결과
        annotatedImage, // 손 스켈레톤이 그려진 이미지
        imageWidth: img.width,
        imageHeight: img.height,
      };
    } catch (err) {
      setError(err.message || i18next.t('error.handModel'));
      setIsLoading(false);
      return null;
    }
  }, [loadModel]);

  return {
    detectHand,
    isLoading,
    error,
  };
}

// 손 특성 분석
function analyzeHandFeatures(keypoints, width, height) {
  // MediaPipe Hands 키포인트:
  // 0: 손목, 1-4: 엄지, 5-8: 검지, 9-12: 중지, 13-16: 약지, 17-20: 소지

  const wrist = keypoints[0];
  const middleFingerTip = keypoints[12];
  const indexFingerTip = keypoints[8];
  const ringFingerTip = keypoints[16];
  const pinkyFingerTip = keypoints[20];
  const thumbTip = keypoints[4];

  // 손바닥 크기 (손목에서 중지 끝까지)
  const palmLength = distance(wrist, middleFingerTip);
  const normalizedPalmLength = palmLength / height;

  // 손가락 길이 비율
  const indexLength = distance(keypoints[5], keypoints[8]);
  const middleLength = distance(keypoints[9], keypoints[12]);
  const ringLength = distance(keypoints[13], keypoints[16]);
  const pinkyLength = distance(keypoints[17], keypoints[20]);

  // 손 크기 분류
  let handSize;
  if (normalizedPalmLength > 0.55) {
    handSize = 'large';
  } else if (normalizedPalmLength < 0.4) {
    handSize = 'small';
  } else {
    handSize = 'medium';
  }

  // 손가락 비율 분석
  const fingerRatio = ringLength / indexLength;
  let fingerType;
  if (fingerRatio > 1.05) {
    fingerType = 'ringDominant'; // 약지가 검지보다 긴 경우
  } else if (fingerRatio < 0.95) {
    fingerType = 'indexDominant'; // 검지가 약지보다 긴 경우
  } else {
    fingerType = 'balanced';
  }

  // 손바닥 형태 (넓이 vs 길이)
  const palmBase = keypoints[0];
  const palmTop = keypoints[9];
  const palmLeft = keypoints[5];
  const palmRight = keypoints[17];

  const palmHeight = distance(palmBase, palmTop);
  const palmWidth = distance(palmLeft, palmRight);
  const palmShape = palmHeight / palmWidth;

  let palmType;
  if (palmShape > 1.3) {
    palmType = 'long'; // 긴 손바닥
  } else if (palmShape < 1.0) {
    palmType = 'square'; // 네모난 손바닥
  } else {
    palmType = 'balanced';
  }

  return {
    handSize,
    fingerType,
    fingerRatio,
    palmType,
    palmShape,
    normalizedPalmLength,
  };
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// 손 스켈레톤을 이미지에 그리기 (손 영역만 크롭)
function drawHandSkeleton(img, keypoints, palmLines) {
  // 손 영역 바운딩 박스 계산
  let minX = Infinity, maxX = 0, minY = Infinity, maxY = 0;
  keypoints.forEach(point => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  // 여유 공간 추가 (20%)
  const padding = Math.max(maxX - minX, maxY - minY) * 0.25;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(img.width, maxX + padding);
  maxY = Math.min(img.height, maxY + padding);

  const cropWidth = maxX - minX;
  const cropHeight = maxY - minY;

  const canvas = document.createElement('canvas');
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const ctx = canvas.getContext('2d');

  // 크롭된 영역만 그리기
  ctx.drawImage(img, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  // 키포인트 좌표를 크롭 영역 기준으로 변환
  const croppedKeypoints = keypoints.map(p => ({
    x: p.x - minX,
    y: p.y - minY,
  }));

  // 손 연결선 정의
  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // 엄지
    [0, 5], [5, 6], [6, 7], [7, 8],       // 검지
    [0, 9], [9, 10], [10, 11], [11, 12],  // 중지
    [0, 13], [13, 14], [14, 15], [15, 16], // 약지
    [0, 17], [17, 18], [18, 19], [19, 20], // 소지
    [5, 9], [9, 13], [13, 17],            // 손바닥 가로
  ];

  // 신비로운 효과를 위한 글로우
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 10;

  // 연결선 그리기
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
  ctx.lineWidth = 2;

  HAND_CONNECTIONS.forEach(([i, j]) => {
    const p1 = croppedKeypoints[i];
    const p2 = croppedKeypoints[j];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });

  // 키포인트 그리기
  croppedKeypoints.forEach((point, idx) => {
    ctx.beginPath();
    // 손가락 끝은 더 크게
    const isFingerTip = [4, 8, 12, 16, 20].includes(idx);
    const radius = isFingerTip ? 6 : 4;

    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isFingerTip ? '#FFD700' : 'rgba(255, 215, 0, 0.8)';
    ctx.fill();

    // 외곽선
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // 손금 라인 색상 정의
  const lineColors = {
    lifeLine: { color: '#FF4444', name: 'Life' },
    headLine: { color: '#00CED1', name: 'Head' },
    heartLine: { color: '#FF1493', name: 'Heart' },
    fateLine: { color: '#8A2BE2', name: 'Fate' },
  };

  // 손금 라인 그리기
  if (palmLines) {
    // 크롭 오프셋 저장
    const offsetX = minX;
    const offsetY = minY;

    console.log('Drawing palm lines, offset:', offsetX, offsetY);
    console.log('Canvas size:', cropWidth, cropHeight);

    Object.entries(palmLines).forEach(([lineType, lineData]) => {
      console.log('Line type:', lineType, 'Data:', lineData);
      if (lineData?.points?.length > 0) {
        const lineConfig = lineColors[lineType];

        // 크롭 영역 기준으로 좌표 변환
        const croppedPoints = lineData.points.map(p => ({
          x: p.x - offsetX,
          y: p.y - offsetY,
        }));
        console.log('Cropped points for', lineType, ':', croppedPoints);

        // 글로우 효과 (2번 그려서 더 두껍게)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 외곽 글로우
        ctx.shadowColor = lineConfig.color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = lineConfig.color;
        ctx.lineWidth = 5;
        drawSmoothCurve(ctx, croppedPoints);

        // 내부 선 (더 밝게)
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        drawSmoothCurve(ctx, croppedPoints);

        // 포인트 표시 (작은 점)
        ctx.shadowBlur = 0;
        croppedPoints.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = lineConfig.color;
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }
    });
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

// 부드러운 곡선 그리기 (Catmull-Rom 스플라인)
function drawSmoothCurve(ctx, points) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    // Catmull-Rom to Bezier 변환
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 >= points.length ? i + 1 : i + 2];

      // 제어점 계산
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }

  ctx.stroke();
}
