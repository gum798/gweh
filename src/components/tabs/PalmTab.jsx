import { useState, useCallback } from 'react';
import CameraCapture from '../camera/CameraCapture';
import { useHandDetection } from '../../hooks/useHandDetection';
import { interpretPalm, getPalmAdvice } from '../../utils/palmReading';

export default function PalmTab() {
  const [mode, setMode] = useState('intro'); // 'intro', 'capture', 'analyzing', 'result'
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);

  const { detectHand, isLoading, error } = useHandDetection();

  const handleStart = () => {
    setMode('capture');
  };

  const handleCapture = useCallback(async (imageSrc) => {
    setCapturedImage(imageSrc);
    setMode('analyzing');

    const handData = await detectHand(imageSrc);

    if (handData) {
      const interpretation = interpretPalm(handData.features, handData.palmLines);
      setResult({
        ...interpretation,
        handedness: handData.handedness,
        advice: getPalmAdvice(interpretation),
        fingerGesture: handData.fingerGesture,
      });
      setMode('result');
    } else {
      setMode('capture');
    }
  }, [detectHand]);

  const handleReset = () => {
    setMode('intro');
    setCapturedImage(null);
    setResult(null);
  };

  // 소개 화면
  if (mode === 'intro') {
    return (
      <div className="glass-panel p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🖐️</div>
          <h2 className="text-2xl mystic-text text-shadow-glow mb-2 font-mystic">
            손금 풀이
          </h2>
          <p className="text-gray-400">
            손바닥에 새겨진 운명의 선을 읽어드리리라
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {/* 안내 사항 */}
          <div className="bg-mystic-700/50 rounded-xl p-4 mb-6 border border-cosmic-gold/10">
            <h3 className="mystic-text text-sm mb-3">손금을 보기 전에</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span>✋</span>
                <span>손바닥을 펴고 카메라에 비춰주세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span>💡</span>
                <span>밝은 곳에서 손금이 잘 보이도록 해주세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📷</span>
                <span>손바닥 전체가 화면에 들어오도록 해주세요</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-gradient-to-r from-cosmic-gold to-yellow-500
                       text-mystic-900 rounded-xl font-medium font-mystic
                       hover:from-yellow-500 hover:to-cosmic-gold transition-all
                       shadow-lg shadow-cosmic-gold/20"
          >
            손금 보기 시작
          </button>
        </div>
      </div>
    );
  }

  // 카메라 캡처 화면
  if (mode === 'capture') {
    return (
      <div className="space-y-4">
        <CameraCapture
          onCapture={handleCapture}
          captureLabel="손금 분석하기"
          instruction="손바닥을 펴서 카메라에 보여주세요"
          detectType="hand"
        />

        {error && (
          <div className="glass-panel p-4 text-center text-red-400">
            {error}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleReset}
            className="text-cosmic-gold/70 hover:text-cosmic-gold transition-colors text-sm"
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 분석 중 화면
  if (mode === 'analyzing' || isLoading) {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="animate-pulse">
          <div className="text-4xl mb-4">🔮</div>
          <p className="mystic-text text-lg font-mystic">
            손금에 담긴 운명을 읽는 중...
          </p>
          <p className="text-gray-400 text-sm mt-2">
            잠시만 기다려주세요
          </p>
        </div>
      </div>
    );
  }

  // 결과 화면
  if (mode === 'result' && result) {
    return (
      <div className="space-y-6">
        {/* 캡처된 이미지 */}
        {capturedImage && (
          <div className="flex justify-center">
            <img
              src={capturedImage}
              alt="분석된 손"
              className="w-32 h-32 rounded-full object-cover border-2 border-cosmic-gold/30"
            />
          </div>
        )}

        {/* 메인 해석 카드 */}
        <div className="glass-panel p-6 md:p-8 animate-float">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">✨</div>
            <p className="text-xl md:text-2xl mystic-text leading-relaxed text-shadow-glow font-mystic">
              "{result.mainMessage}"
            </p>
          </div>

          {/* 손 정보 */}
          <div className="text-center mb-4">
            <span className="inline-block px-4 py-1 bg-cosmic-gold/20 rounded-full text-cosmic-gold text-sm">
              {result.handedness === 'Left' ? '왼손' : '오른손'}
            </span>
          </div>
        </div>

        {/* 손가락 자세 해석 */}
        {result.fingerGesture?.interpretation && (
          <div className="glass-panel p-6 md:p-8 border-2 border-cosmic-gold/30">
            <div className="text-center mb-6">
              <div className="text-3xl mb-3">🤚</div>
              <h3 className="mystic-text text-lg mb-2 font-mystic">손가락의 모양</h3>
              <div className="inline-block px-3 py-1 bg-cosmic-gold/20 rounded-full text-cosmic-gold text-sm mb-4">
                {result.fingerGesture.interpretation.gestureName}
              </div>
            </div>

            {/* 성격 풀이 */}
            <div className="bg-mystic-700/50 rounded-xl p-4 mb-4 border border-cosmic-gold/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🌟</span>
                <span className="data-label">성정 풀이</span>
              </div>
              <p className="text-gray-200 leading-relaxed font-mystic">
                "{result.fingerGesture.interpretation.personality}"
              </p>
              <p className="text-cosmic-gold text-sm mt-3">
                → {result.fingerGesture.interpretation.trait}
              </p>
            </div>

            {/* 건강 풀이 */}
            <div className="bg-mystic-700/50 rounded-xl p-4 mb-4 border border-cosmic-gold/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💫</span>
                <span className="data-label">건강 풀이</span>
              </div>
              <p className="text-gray-200 leading-relaxed font-mystic">
                "{result.fingerGesture.interpretation.health}"
              </p>
            </div>

            {/* 손가락 벌림 */}
            {result.fingerGesture.interpretation.spreadDescription && (
              <div className="text-center text-gray-400 text-sm">
                ✦ {result.fingerGesture.interpretation.spreadDescription}
              </div>
            )}
          </div>
        )}

        {/* 세부 해석 */}
        <div className="glass-panel p-6">
          <h3 className="mystic-text text-lg mb-4 text-center font-mystic">손금 상세 풀이</h3>
          <div className="space-y-4">
            {result.details.map((detail, i) => (
              <div
                key={i}
                className="bg-mystic-700/50 rounded-xl p-4 border border-cosmic-gold/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{detail.icon}</span>
                  <span className="data-label">{detail.category}</span>
                  <span className="text-gray-400 text-xs">· {detail.type}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {detail.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 조언 */}
        <div className="glass-panel p-6 text-center">
          <h3 className="mystic-text text-lg mb-3 font-mystic">조언</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            💫 {result.advice}
          </p>
        </div>

        {/* 다시하기 버튼 */}
        <div className="text-center">
          <button
            onClick={handleReset}
            className="text-cosmic-gold/70 hover:text-cosmic-gold transition-colors text-sm"
          >
            다시 손금 보기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
