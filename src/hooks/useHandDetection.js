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

      setIsLoading(false);
      return {
        keypoints: hand.keypoints,
        handedness: hand.handedness,
        features: handFeatures,
        palmLines, // 실제 감지된 손금 라인
        fingerGesture, // 손가락 자세 분석 결과
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
