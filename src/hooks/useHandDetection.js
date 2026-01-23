import { useState, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { detectPalmLines } from '../utils/palmLineDetector';
import { analyzeFingerGesture } from '../utils/fingerGestureAnalyzer';

export function useHandDetection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const modelRef = useRef(null);

  const loadModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current;

    try {
      await tf.ready();

      const model = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
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
      throw new Error('손 감지 모델을 불러올 수 없습니다.');
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
        throw new Error('손을 찾을 수 없습니다. 손바닥을 펴서 다시 시도해주세요.');
      }

      const hand = predictions[0];

      // 손 특성 분석
      const handFeatures = analyzeHandFeatures(hand.keypoints, img.width, img.height);

      // 손금 라인 감지 (이미지 처리)
      let palmLines = null;
      try {
        palmLines = await detectPalmLines(imageSrc, hand.keypoints);
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
      setError(err.message || '손 분석 중 오류가 발생했습니다.');
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

// 손 스켈레톤을 이미지에 그리기
function drawHandSkeleton(img, keypoints, palmLines) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');

  // 원본 이미지 그리기
  ctx.drawImage(img, 0, 0);

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
    const p1 = keypoints[i];
    const p2 = keypoints[j];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });

  // 키포인트 그리기
  keypoints.forEach((point, idx) => {
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

  // 손금 라인 그리기 (감지된 경우)
  if (palmLines) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FF6B6B';
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
    ctx.lineWidth = 2;

    // 생명선
    if (palmLines.lifeLine?.detected) {
      drawPalmLine(ctx, keypoints[2], keypoints[0], 'curve');
    }

    // 두뇌선
    if (palmLines.headLine?.detected) {
      const endPoint = { x: keypoints[17].x, y: (keypoints[5].y + keypoints[0].y) / 2 };
      drawPalmLine(ctx, keypoints[5], endPoint, 'straight');
    }

    // 감정선
    if (palmLines.heartLine?.detected) {
      const midY = Math.min(keypoints[5].y, keypoints[17].y) + 10;
      drawPalmLine(ctx,
        { x: keypoints[5].x, y: midY },
        { x: keypoints[17].x, y: midY },
        'straight'
      );
    }

    // 운명선
    if (palmLines.fateLine?.detected) {
      const midX = (keypoints[0].x + keypoints[9].x) / 2;
      drawPalmLine(ctx,
        { x: midX, y: keypoints[0].y },
        { x: midX, y: keypoints[9].y },
        'straight'
      );
    }
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

// 손금 라인 그리기 헬퍼
function drawPalmLine(ctx, start, end, type) {
  ctx.beginPath();
  if (type === 'curve') {
    // 곡선으로 그리기 (생명선)
    const cpX = start.x - 30;
    const cpY = (start.y + end.y) / 2;
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(cpX, cpY, end.x, end.y);
  } else {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
  }
  ctx.stroke();
}
