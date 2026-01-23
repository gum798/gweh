import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const videoConstraints = {
  width: 480,
  height: 480,
  facingMode: 'user',
};

export default function CameraCapture({ onCapture, captureLabel = '촬영하기', instruction }) {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [mode, setMode] = useState('camera'); // 'camera' or 'upload'

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

      {/* 모드 전환 버튼 */}
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
        <div className="space-y-4">
          <div className="relative inline-block rounded-2xl overflow-hidden border-2 border-cosmic-gold/30">
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
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-mystic-800/80">
                <p className="text-gray-400">카메라 연결 중...</p>
              </div>
            )}
          </div>

          <button
            onClick={capture}
            disabled={!isReady}
            className={`px-8 py-3 rounded-xl font-medium font-mystic transition-all ${
              isReady
                ? 'bg-gradient-to-r from-cosmic-gold to-yellow-500 text-mystic-900 hover:from-yellow-500 hover:to-cosmic-gold shadow-lg shadow-cosmic-gold/20'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {captureLabel}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
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
