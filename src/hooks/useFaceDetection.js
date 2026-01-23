import { useState, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

export function useFaceDetection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const modelRef = useRef(null);

  const loadModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current;

    try {
      await tf.ready();

      const model = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1,
        }
      );

      modelRef.current = model;
      return model;
    } catch (err) {
      console.error('Face detection model load error:', err);
      throw new Error('얼굴 감지 모델을 불러올 수 없습니다.');
    }
  }, []);

  const detectFace = useCallback(async (imageSrc) => {
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

      // 얼굴 감지
      const predictions = await model.estimateFaces(img);

      if (!predictions || predictions.length === 0) {
        throw new Error('얼굴을 찾을 수 없습니다. 다시 시도해주세요.');
      }

      const face = predictions[0];

      // 캔버스에서 피부색 샘플링
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // 얼굴 랜드마크에서 피부 영역 추출
      const skinSamples = extractSkinSamples(ctx, face.keypoints, img.width, img.height);

      setIsLoading(false);
      return {
        landmarks: face.keypoints,
        skinSamples,
        imageWidth: img.width,
        imageHeight: img.height,
      };
    } catch (err) {
      setError(err.message || '얼굴 분석 중 오류가 발생했습니다.');
      setIsLoading(false);
      return null;
    }
  }, [loadModel]);

  return {
    detectFace,
    isLoading,
    error,
  };
}

// 피부색 샘플 추출
function extractSkinSamples(ctx, keypoints, width, height) {
  const samples = [];

  // MediaPipe FaceMesh 랜드마크 인덱스
  // 왼쪽 볼: 234, 오른쪽 볼: 454, 이마: 10
  const samplePoints = [
    { index: 234, name: 'leftCheek' },
    { index: 454, name: 'rightCheek' },
    { index: 10, name: 'forehead' },
  ];

  for (const point of samplePoints) {
    const kp = keypoints[point.index];
    if (kp) {
      const x = Math.round(kp.x);
      const y = Math.round(kp.y);

      // 주변 픽셀 샘플링 (5x5 영역)
      const colors = [];
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const px = Math.min(Math.max(x + dx, 0), width - 1);
          const py = Math.min(Math.max(y + dy, 0), height - 1);
          const pixel = ctx.getImageData(px, py, 1, 1).data;
          colors.push({ r: pixel[0], g: pixel[1], b: pixel[2] });
        }
      }

      // 평균 색상 계산
      const avgColor = {
        r: Math.round(colors.reduce((s, c) => s + c.r, 0) / colors.length),
        g: Math.round(colors.reduce((s, c) => s + c.g, 0) / colors.length),
        b: Math.round(colors.reduce((s, c) => s + c.b, 0) / colors.length),
      };

      samples.push({
        name: point.name,
        color: avgColor,
      });
    }
  }

  return samples;
}
