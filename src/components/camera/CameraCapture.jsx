import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

const videoConstraints = {
  width: 480,
  height: 480,
  facingMode: 'user',
};

export default function CameraCapture({
  onCapture,
  captureLabel = '촬영하기',
  instruction,
  detectType = 'none' // 'face', 'hand', 'none'
}) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const modelRef = useRef(null);
  const animationRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [mode, setMode] = useState('camera');
  const [isDetected, setIsDetected] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // 모델 로드
  useEffect(() => {
    if (mode !== 'camera' || detectType === 'none') return;

    const loadModel = async () => {
      setIsModelLoading(true);
      try {
        await tf.ready();

        if (detectType === 'face') {
          modelRef.current = await faceLandmarksDetection.createDetector(
            faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
            { runtime: 'tfjs', refineLandmarks: true, maxFaces: 1 }
          );
        } else if (detectType === 'hand') {
          modelRef.current = await handPoseDetection.createDetector(
            handPoseDetection.SupportedModels.MediaPipeHands,
            { runtime: 'tfjs', modelType: 'full', maxHands: 1 }
          );
        }
      } catch (err) {
        console.error('Model load error:', err);
      }
      setIsModelLoading(false);
    };

    loadModel();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [detectType, mode]);

  // 실시간 감지 루프
  useEffect(() => {
    if (!isReady || !modelRef.current || mode !== 'camera') return;

    let isRunning = true;

    const detect = async () => {
      if (!isRunning || !webcamRef.current?.video || !canvasRef.current) return;

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.readyState !== 4) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      try {
        let predictions;
        if (detectType === 'face') {
          predictions = await modelRef.current.estimateFaces(video);
        } else if (detectType === 'hand') {
          predictions = await modelRef.current.estimateHands(video);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (predictions && predictions.length > 0) {
          setIsDetected(true);
          drawMysticEffect(ctx, predictions[0], detectType, canvas.width, canvas.height);
        } else {
          setIsDetected(false);
        }
      } catch (err) {
        // 감지 실패 시 무시
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      isRunning = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isReady, detectType, mode]);

  const handleUserMedia = useCallback(() => {
    setIsReady(true);
    setHasError(false);
  }, []);

  const handleUserMediaError = useCallback(() => {
    setHasError(true);
    setMode('upload');
  }, []);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
    }
  }, [onCapture]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onCapture(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, [onCapture]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="glass-panel p-6 text-center">
      {instruction && (
        <p className="text-gray-400 mb-4 text-sm">{instruction}</p>
      )}

      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setMode('camera')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            mode === 'camera'
              ? 'bg-cosmic-gold/20 text-cosmic-gold'
              : 'text-gray-400 hover:text-cosmic-gold'
          }`}
        >
          📷 카메라
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            mode === 'upload'
              ? 'bg-cosmic-gold/20 text-cosmic-gold'
              : 'text-gray-400 hover:text-cosmic-gold'
          }`}
        >
          📁 사진 업로드
        </button>
      </div>

      {mode === 'camera' && !hasError ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative rounded-2xl overflow-hidden border-2 border-cosmic-gold/30">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="rounded-2xl"
              mirrored={true}
            />
            {/* 감지 오버레이 캔버스 */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: 'scaleX(-1)' }}
            />
            {(!isReady || isModelLoading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-mystic-800/80">
                <p className="text-gray-400">
                  {isModelLoading ? '신비로운 눈을 뜨는 중...' : '카메라 연결 중...'}
                </p>
              </div>
            )}
            {/* 감지 상태 표시 */}
            {isReady && !isModelLoading && detectType !== 'none' && (
              <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs transition-all ${
                isDetected
                  ? 'bg-cosmic-gold/30 text-cosmic-gold'
                  : 'bg-gray-800/50 text-gray-400'
              }`}>
                {isDetected
                  ? (detectType === 'face' ? '✨ 얼굴 감지됨' : '✨ 손 감지됨')
                  : (detectType === 'face' ? '얼굴을 보여주세요' : '손바닥을 보여주세요')
                }
              </div>
            )}
          </div>

          <button
            onClick={capture}
            disabled={!isReady || isModelLoading}
            className={`px-8 py-3 rounded-xl font-medium font-mystic transition-all ${
              isReady && !isModelLoading
                ? 'bg-gradient-to-r from-cosmic-gold to-yellow-500 text-mystic-900 hover:from-yellow-500 hover:to-cosmic-gold shadow-lg shadow-cosmic-gold/20'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {captureLabel}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {hasError && (
            <p className="text-orange-400 text-sm mb-2">
              카메라에 접근할 수 없습니다. 사진을 업로드해주세요.
            </p>
          )}

          <div
            onClick={triggerFileInput}
            className="border-2 border-dashed border-cosmic-gold/30 rounded-2xl p-12 cursor-pointer
                       hover:border-cosmic-gold/50 transition-colors"
          >
            <div className="text-4xl mb-2">📷</div>
            <p className="text-gray-400">클릭하여 사진 선택</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

// 신비로운 효과 그리기
function drawMysticEffect(ctx, detection, type, width, height) {
  const time = Date.now() * 0.003;

  if (type === 'face') {
    drawFaceEffect(ctx, detection, time);
  } else if (type === 'hand') {
    drawHandEffect(ctx, detection, time);
  }
}

// 얼굴 감지 효과
function drawFaceEffect(ctx, face, time) {
  const keypoints = face.keypoints;
  if (!keypoints || keypoints.length === 0) return;

  // 얼굴 중심과 크기 계산
  const faceOvalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  faceOvalIndices.forEach(idx => {
    if (keypoints[idx]) {
      minX = Math.min(minX, keypoints[idx].x);
      maxX = Math.max(maxX, keypoints[idx].x);
      minY = Math.min(minY, keypoints[idx].y);
      maxY = Math.max(maxY, keypoints[idx].y);
    }
  });

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const radiusX = (maxX - minX) / 2 + 30;
  const radiusY = (maxY - minY) / 2 + 30;
  const radius = Math.max(radiusX, radiusY);

  // 신비로운 원형 효과
  drawMysticCircle(ctx, centerX, centerY, radius, time);

  // 주요 포인트에 작은 별 효과
  const importantPoints = [10, 152, 234, 454, 1]; // 이마, 턱, 양쪽 볼, 코
  importantPoints.forEach((idx, i) => {
    if (keypoints[idx]) {
      drawSparkle(ctx, keypoints[idx].x, keypoints[idx].y, time + i * 0.5);
    }
  });
}

// 손 감지 효과
function drawHandEffect(ctx, hand, time) {
  const keypoints = hand.keypoints;
  if (!keypoints || keypoints.length === 0) return;

  // 손바닥 중심 계산
  const palmPoints = [0, 5, 9, 13, 17];
  let centerX = 0, centerY = 0;
  palmPoints.forEach(idx => {
    centerX += keypoints[idx].x;
    centerY += keypoints[idx].y;
  });
  centerX /= palmPoints.length;
  centerY /= palmPoints.length;

  // 손 크기 계산
  const wrist = keypoints[0];
  const middleTip = keypoints[12];
  const radius = Math.sqrt(
    Math.pow(middleTip.x - wrist.x, 2) + Math.pow(middleTip.y - wrist.y, 2)
  ) * 0.6;

  // 신비로운 원형 효과
  drawMysticCircle(ctx, centerX, centerY, radius, time);

  // 손가락 끝에 별 효과
  const fingerTips = [4, 8, 12, 16, 20];
  fingerTips.forEach((idx, i) => {
    drawSparkle(ctx, keypoints[idx].x, keypoints[idx].y, time + i * 0.3);
  });

  // 손금 라인 가이드
  drawPalmLines(ctx, keypoints, time);
}

// 신비로운 원 그리기
function drawMysticCircle(ctx, x, y, radius, time) {
  const pulseRadius = radius + Math.sin(time * 2) * 5;

  // 외부 글로우
  const gradient = ctx.createRadialGradient(x, y, pulseRadius * 0.8, x, y, pulseRadius * 1.3);
  gradient.addColorStop(0, 'rgba(212, 175, 55, 0)');
  gradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.15)');
  gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

  ctx.beginPath();
  ctx.arc(x, y, pulseRadius * 1.3, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // 메인 원 (점선)
  ctx.beginPath();
  ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.lineDashOffset = -time * 20;
  ctx.stroke();
  ctx.setLineDash([]);

  // 내부 원
  ctx.beginPath();
  ctx.arc(x, y, pulseRadius * 0.85, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 회전하는 장식 요소
  for (let i = 0; i < 4; i++) {
    const angle = time + (i * Math.PI / 2);
    const dx = Math.cos(angle) * pulseRadius;
    const dy = Math.sin(angle) * pulseRadius;

    ctx.beginPath();
    ctx.arc(x + dx, y + dy, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
    ctx.fill();
  }

  // 신비로운 심볼 (☯)
  ctx.font = `${radius * 0.3}px serif`;
  ctx.fillStyle = `rgba(212, 175, 55, ${0.3 + Math.sin(time * 3) * 0.1})`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☯', x, y);
}

// 반짝이는 별 효과
function drawSparkle(ctx, x, y, time) {
  const size = 3 + Math.sin(time * 4) * 2;
  const alpha = 0.5 + Math.sin(time * 3) * 0.3;

  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
  ctx.fill();

  // 십자 광선
  ctx.strokeStyle = `rgba(212, 175, 55, ${alpha * 0.5})`;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x - size * 2, y);
  ctx.lineTo(x + size * 2, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y - size * 2);
  ctx.lineTo(x, y + size * 2);
  ctx.stroke();
}

// 손금 라인 가이드
function drawPalmLines(ctx, keypoints, time) {
  ctx.strokeStyle = `rgba(212, 175, 55, ${0.2 + Math.sin(time * 2) * 0.1})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = -time * 10;

  // 생명선 (대략적 위치)
  ctx.beginPath();
  ctx.moveTo(keypoints[2].x, keypoints[2].y);
  ctx.quadraticCurveTo(keypoints[0].x, keypoints[0].y * 0.9, keypoints[17].x, keypoints[17].y);
  ctx.stroke();

  ctx.setLineDash([]);
}
