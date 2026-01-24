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

      // 얼굴 영역 크롭 및 랜드마크 그리기
      const annotatedImage = drawFaceLandmarks(img, face.keypoints);

      setIsLoading(false);
      return {
        landmarks: face.keypoints,
        skinSamples,
        annotatedImage,
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

// 얼굴 랜드마크 그리기 (얼굴 영역만 크롭)
function drawFaceLandmarks(img, keypoints) {
  // 얼굴 영역 바운딩 박스 계산
  let minX = Infinity, maxX = 0, minY = Infinity, maxY = 0;
  keypoints.forEach(point => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  // 여유 공간 추가 (25%)
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

  // 신비로운 효과를 위한 글로우
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 8;

  // MediaPipe FaceMesh 랜드마크 연결선 정의
  // 얼굴 윤곽
  const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];

  // 왼쪽 눈
  const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];

  // 오른쪽 눈
  const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362];

  // 왼쪽 눈썹
  const LEFT_EYEBROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];

  // 오른쪽 눈썹
  const RIGHT_EYEBROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];

  // 입술 외곽
  const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61];

  // 입술 내곽
  const LIPS_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78];

  // 코
  const NOSE = [168, 6, 197, 195, 5, 4, 1, 19, 94, 2];
  const NOSE_BOTTOM = [98, 97, 2, 326, 327];

  // 선 그리기 함수
  const drawPath = (indices, color, lineWidth = 1.5) => {
    if (indices.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(croppedKeypoints[indices[0]].x, croppedKeypoints[indices[0]].y);

    for (let i = 1; i < indices.length; i++) {
      ctx.lineTo(croppedKeypoints[indices[i]].x, croppedKeypoints[indices[i]].y);
    }

    ctx.stroke();
  };

  // 색상 설정
  const colors = {
    faceOval: 'rgba(255, 215, 0, 0.6)',      // 금색 (얼굴 윤곽)
    eyebrow: 'rgba(147, 112, 219, 0.8)',     // 보라색 (눈썹)
    eye: 'rgba(0, 206, 209, 0.8)',           // 청록색 (눈)
    nose: 'rgba(255, 182, 193, 0.8)',        // 핑크색 (코)
    lips: 'rgba(255, 99, 71, 0.8)',          // 빨간색 (입술)
  };

  // 각 부위 그리기
  ctx.shadowBlur = 10;

  // 얼굴 윤곽
  ctx.shadowColor = colors.faceOval;
  drawPath(FACE_OVAL, colors.faceOval, 2);

  // 눈썹
  ctx.shadowColor = colors.eyebrow;
  drawPath(LEFT_EYEBROW, colors.eyebrow, 2);
  drawPath(RIGHT_EYEBROW, colors.eyebrow, 2);

  // 눈
  ctx.shadowColor = colors.eye;
  drawPath(LEFT_EYE, colors.eye, 2);
  drawPath(RIGHT_EYE, colors.eye, 2);

  // 코
  ctx.shadowColor = colors.nose;
  drawPath(NOSE, colors.nose, 1.5);
  drawPath(NOSE_BOTTOM, colors.nose, 1.5);

  // 입술
  ctx.shadowColor = colors.lips;
  drawPath(LIPS_OUTER, colors.lips, 2);
  drawPath(LIPS_INNER, 'rgba(255, 99, 71, 0.5)', 1.5);

  // 주요 포인트 표시 (눈, 코끝, 입 중심)
  const keyPointIndices = [
    { idx: 168, color: colors.faceOval },  // 이마 중심
    { idx: 1, color: colors.nose },        // 코끝
    { idx: 13, color: colors.lips },       // 입 중심
    { idx: 33, color: colors.eye },        // 왼쪽 눈 안쪽
    { idx: 263, color: colors.eye },       // 오른쪽 눈 안쪽
  ];

  ctx.shadowBlur = 5;
  keyPointIndices.forEach(({ idx, color }) => {
    const point = croppedKeypoints[idx];
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  return canvas.toDataURL('image/jpeg', 0.9);
}
