import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useTranslation } from 'react-i18next';

// TensorFlow 모듈들을 dynamic import로 변경 (bundle-defer-third-party)
// 2MB+ 번들을 초기 로딩에서 제외하고 필요할 때만 로드
type TFModule = typeof import('@tensorflow/tfjs');
type FaceModule = typeof import('@tensorflow-models/face-landmarks-detection');
type HandModule = typeof import('@tensorflow-models/hand-pose-detection');

let tf: TFModule | null = null;
let faceLandmarksDetection: FaceModule | null = null;
let handPoseDetection: HandModule | null = null;

// async-parallel: Parallelize TensorFlow module imports for faster loading
async function loadFaceDetection() {
  if (!tf || !faceLandmarksDetection) {
    const [tfModule, faceModule] = await Promise.all([
      tf || import('@tensorflow/tfjs'),
      faceLandmarksDetection || import('@tensorflow-models/face-landmarks-detection')
    ]);

    if (!tf) {
      tf = tfModule;
      await tf.ready();
    }
    if (!faceLandmarksDetection) {
      faceLandmarksDetection = faceModule;
    }
  }
  return faceLandmarksDetection;
}

async function loadHandDetection() {
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
  return handPoseDetection;
}

const videoConstraints = {
  width: 480,
  height: 480,
  facingMode: 'user',
};

// 손가락 연결 정의 (MediaPipe Hands)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // 엄지
  [0, 5], [5, 6], [6, 7], [7, 8],       // 검지
  [0, 9], [9, 10], [10, 11], [11, 12],  // 중지
  [0, 13], [13, 14], [14, 15], [15, 16], // 약지
  [0, 17], [17, 18], [18, 19], [19, 20], // 소지
  [5, 9], [9, 13], [13, 17],             // 손바닥 가로 연결
];

// 키포인트 이름 키 (i18n)
const KEYPOINT_KEYS = [
  'keypoint.wrist', 'keypoint.thumb1', 'keypoint.thumb2', 'keypoint.thumb3', 'keypoint.thumbTip',
  'keypoint.index1', 'keypoint.index2', 'keypoint.index3', 'keypoint.indexTip',
  'keypoint.middle1', 'keypoint.middle2', 'keypoint.middle3', 'keypoint.middleTip',
  'keypoint.ring1', 'keypoint.ring2', 'keypoint.ring3', 'keypoint.ringTip',
  'keypoint.pinky1', 'keypoint.pinky2', 'keypoint.pinky3', 'keypoint.pinkyTip'
];

export default function CameraCapture({
  onCapture,
  captureLabel,
  instruction,
  detectType = 'none'
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

  const { t } = useTranslation();
  const displayCaptureLabel = captureLabel || t('camera.capture');

  useEffect(() => {
    if (mode !== 'camera' || detectType === 'none') return;

    const loadModel = async () => {
      setIsModelLoading(true);
      try {
        if (detectType === 'face') {
          const faceModule = await loadFaceDetection();
          modelRef.current = await faceModule.createDetector(
            faceModule.SupportedModels.MediaPipeFaceMesh,
            { runtime: 'tfjs', refineLandmarks: true, maxFaces: 1 }
          );
        } else if (detectType === 'hand') {
          const handModule = await loadHandDetection();
          modelRef.current = await handModule.createDetector(
            handModule.SupportedModels.MediaPipeHands,
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
          drawDetectionEffect(ctx, predictions[0], detectType, canvas.width, canvas.height);
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
        <p className="text-gal-muted mb-4 text-sm">{instruction}</p>
      )}

      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setMode('camera')}
          className={`px-4 py-2 rounded-gal-lg text-sm transition-colors ${
            mode === 'camera'
              ? 'bg-gal-accent-light text-gal-accent'
              : 'text-gal-muted hover:text-gal-accent'
          }`}
        >
          📷 {t('camera.cameraMode')}
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded-gal-lg text-sm transition-colors ${
            mode === 'upload'
              ? 'bg-gal-accent-light text-gal-accent'
              : 'text-gal-muted hover:text-gal-accent'
          }`}
        >
          📁 {t('camera.uploadMode')}
        </button>
      </div>

      {mode === 'camera' && !hasError ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative rounded-gal-xl overflow-hidden border-2 border-gal-accent/30">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              className="rounded-gal-xl"
              mirrored={true}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: 'scaleX(-1)' }}
            />
            {(!isReady || isModelLoading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <p className="text-gal-muted">
                  {isModelLoading ? t('camera.modelLoading') : t('camera.connecting')}
                </p>
              </div>
            )}
            {isReady && !isModelLoading && detectType !== 'none' && (
              <div className={`absolute top-3 left-3 px-3 py-1 rounded-gal-md text-xs transition-all ${
                isDetected
                  ? 'bg-gal-accent-light text-gal-accent'
                  : 'bg-gal-light text-gal-muted'
              }`}>
                {isDetected
                  ? (detectType === 'face' ? t('camera.faceDetected') : t('camera.handDetected'))
                  : (detectType === 'face' ? t('camera.showFace') : t('camera.showPalm'))
                }
              </div>
            )}
          </div>

          <button
            onClick={capture}
            disabled={!isReady || isModelLoading}
            className={`px-8 py-3 rounded-gal-xl font-medium transition-all ${
              isReady && !isModelLoading
                ? 'bg-gal-accent text-white hover:bg-gal-accent-dark shadow-gal-button'
                : 'bg-gal-light text-gal-muted cursor-not-allowed'
            }`}
          >
            {displayCaptureLabel}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {hasError && (
            <p className="text-orange-500 text-sm mb-2">
              {t('camera.noAccess')}
            </p>
          )}

          <div
            onClick={triggerFileInput}
            className="border-2 border-dashed border-gal-accent/30 rounded-gal-xl p-12 cursor-pointer
                       hover:border-gal-accent/50 transition-colors"
          >
            <div className="text-4xl mb-2">📷</div>
            <p className="text-gal-muted">{t('camera.clickToSelect')}</p>
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

function drawDetectionEffect(ctx, detection, type, width, height) {
  const time = Date.now() * 0.003;

  if (type === 'face') {
    drawFaceEffect(ctx, detection, time);
  } else if (type === 'hand') {
    drawHandEffect(ctx, detection, time);
  }
}

function drawFaceEffect(ctx, face, time) {
  const keypoints = face.keypoints;
  if (!keypoints || keypoints.length === 0) return;

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

  drawDetectionCircle(ctx, centerX, centerY, radius, time);

  const importantPoints = [10, 152, 234, 454, 1];
  importantPoints.forEach((idx, i) => {
    if (keypoints[idx]) {
      drawSparkle(ctx, keypoints[idx].x, keypoints[idx].y, time + i * 0.5);
    }
  });
}

function drawHandEffect(ctx, hand, time) {
  const keypoints = hand.keypoints;
  if (!keypoints || keypoints.length === 0) return;

  // 1. 뼈대 연결선 그리기
  drawHandSkeleton(ctx, keypoints, time);

  // 2. 21개 키포인트 그리기
  drawHandKeypoints(ctx, keypoints, time);

  // 3. 손바닥 영역에 효과
  drawPalmArea(ctx, keypoints, time);
}

// 손 뼈대 그리기
function drawHandSkeleton(ctx, keypoints, time) {
  HAND_CONNECTIONS.forEach(([start, end], index) => {
    const p1 = keypoints[start];
    const p2 = keypoints[end];

    if (p1 && p2) {
      // 그라데이션 라인
      const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      const alpha = 0.6 + Math.sin(time * 2 + index * 0.2) * 0.2;
      gradient.addColorStop(0, `rgba(46, 163, 242, ${alpha})`);
      gradient.addColorStop(1, `rgba(26, 143, 216, ${alpha})`);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 글로우 효과
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(46, 163, 242, 0.3)`;
      ctx.lineWidth = 8;
      ctx.stroke();
    }
  });
}

// 21개 키포인트 그리기
function drawHandKeypoints(ctx, keypoints, time) {
  keypoints.forEach((point, index) => {
    const pulseSize = Math.sin(time * 3 + index * 0.3) * 2;

    // 손가락 끝은 더 크게
    const isFingerTip = [4, 8, 12, 16, 20].includes(index);
    const isWrist = index === 0;
    const baseSize = isFingerTip ? 8 : (isWrist ? 10 : 5);
    const size = baseSize + pulseSize;

    // 외부 글로우
    ctx.beginPath();
    ctx.arc(point.x, point.y, size + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(46, 163, 242, 0.2)';
    ctx.fill();

    // 메인 포인트
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(46, 163, 242, 1)');
    gradient.addColorStop(1, 'rgba(26, 143, 216, 0.8)');

    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 손가락 끝에 별 효과
    if (isFingerTip) {
      drawSparkle(ctx, point.x, point.y, time + index * 0.2);
    }

    // 손목에 특별 효과
    if (isWrist) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, size + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(46, 163, 242, ${0.3 + Math.sin(time * 2) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -time * 10;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

// 손바닥 영역 효과
function drawPalmArea(ctx, keypoints, time) {
  // 손바닥 중심 계산
  const palmPoints = [0, 5, 9, 13, 17];
  let centerX = 0, centerY = 0;
  palmPoints.forEach(idx => {
    centerX += keypoints[idx].x;
    centerY += keypoints[idx].y;
  });
  centerX /= palmPoints.length;
  centerY /= palmPoints.length;

  // 손바닥 크기
  const palmSize = Math.sqrt(
    Math.pow(keypoints[9].x - keypoints[0].x, 2) +
    Math.pow(keypoints[9].y - keypoints[0].y, 2)
  ) * 0.7;

  // 중앙 심볼
  const symbolAlpha = 0.2 + Math.sin(time * 2) * 0.1;
  ctx.font = `${palmSize * 0.5}px serif`;
  ctx.fillStyle = `rgba(46, 163, 242, ${symbolAlpha})`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☯', centerX, centerY);

  // 회전하는 원
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(time * 0.5);

  ctx.beginPath();
  ctx.arc(0, 0, palmSize * 0.8, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(46, 163, 242, 0.15)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function drawDetectionCircle(ctx, x, y, radius, time) {
  const pulseRadius = radius + Math.sin(time * 2) * 5;

  const gradient = ctx.createRadialGradient(x, y, pulseRadius * 0.8, x, y, pulseRadius * 1.3);
  gradient.addColorStop(0, 'rgba(46, 163, 242, 0)');
  gradient.addColorStop(0.5, 'rgba(46, 163, 242, 0.15)');
  gradient.addColorStop(1, 'rgba(46, 163, 242, 0)');

  ctx.beginPath();
  ctx.arc(x, y, pulseRadius * 1.3, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(46, 163, 242, 0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.lineDashOffset = -time * 20;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(x, y, pulseRadius * 0.85, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(46, 163, 242, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    const angle = time + (i * Math.PI / 2);
    const dx = Math.cos(angle) * pulseRadius;
    const dy = Math.sin(angle) * pulseRadius;

    ctx.beginPath();
    ctx.arc(x + dx, y + dy, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(46, 163, 242, 0.9)';
    ctx.fill();
  }

  ctx.font = `${radius * 0.3}px serif`;
  ctx.fillStyle = `rgba(46, 163, 242, ${0.3 + Math.sin(time * 3) * 0.1})`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☯', x, y);
}

function drawSparkle(ctx, x, y, time) {
  const size = 3 + Math.sin(time * 4) * 2;
  const alpha = 0.5 + Math.sin(time * 3) * 0.3;

  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.fill();

  ctx.strokeStyle = `rgba(46, 163, 242, ${alpha * 0.7})`;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x - size * 2.5, y);
  ctx.lineTo(x + size * 2.5, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y - size * 2.5);
  ctx.lineTo(x, y + size * 2.5);
  ctx.stroke();

  // 대각선 광선
  ctx.beginPath();
  ctx.moveTo(x - size * 1.5, y - size * 1.5);
  ctx.lineTo(x + size * 1.5, y + size * 1.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size * 1.5, y - size * 1.5);
  ctx.lineTo(x - size * 1.5, y + size * 1.5);
  ctx.stroke();
}
