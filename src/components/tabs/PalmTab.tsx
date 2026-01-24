import { useState, useCallback } from 'react';
import CameraCapture from '../camera/CameraCapture';
import { useHandDetection } from '../../hooks/useHandDetection';
import { interpretPalm, getPalmAdvice } from '../../utils/palmReading';

export default function PalmTab() {
  const [mode, setMode] = useState('intro');
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
      const interpretation = interpretPalm(handData.features, handData.palmLines, handData.fingerGesture);
      setCapturedImage(handData.annotatedImage || imageSrc);
      setResult({
        ...interpretation,
        handedness: handData.handedness,
        advice: getPalmAdvice(interpretation),
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
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl">
          <div
            className="flex min-h-[45vh] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-end pb-12 px-6 text-center"
            style={{
              backgroundImage: `linear-gradient(to top, #161022 10%, rgba(22, 16, 34, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url("https://images.unsplash.com/photo-1572879023364-ab4f53e9d5fa?w=800&q=80")`,
            }}
          >
            <div className="flex flex-col gap-3 max-w-2xl">
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
                Lines of <br />
                <span className="text-[#5b13ec] italic font-light">Destiny</span>
              </h1>
              <p className="text-white/70 text-sm font-light leading-relaxed max-w-xs mx-auto">
                손바닥에 새겨진 운명의 선을 읽어드립니다
              </p>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] mb-4">Before Reading</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="bg-[#5b13ec]/20 p-2 rounded-full">
                  <span className="text-lg">✋</span>
                </div>
                <div>
                  <p className="text-white/80 text-sm">손바닥을 펴고 카메라에 비춰주세요</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-[#5b13ec]/20 p-2 rounded-full">
                  <span className="text-lg">💡</span>
                </div>
                <div>
                  <p className="text-white/80 text-sm">밝은 곳에서 손금이 잘 보이도록 해주세요</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-[#5b13ec]/20 p-2 rounded-full">
                  <span className="text-lg">📷</span>
                </div>
                <div>
                  <p className="text-white/80 text-sm">손바닥 전체가 화면에 들어오도록 해주세요</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Start Button */}
        <div className="px-4 pb-8">
          <button
            onClick={handleStart}
            className="w-full max-w-md mx-auto flex items-center justify-center rounded-full h-14 px-8 bg-[#5b13ec] text-white text-base font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(91,19,236,0.3)] border border-[#5b13ec]/50 hover:scale-105 active:scale-95"
          >
            Start Palm Reading
          </button>
        </div>
      </div>
    );
  }

  // 카메라 캡처 화면
  if (mode === 'capture') {
    return (
      <div className="space-y-6">
        <CameraCapture
          onCapture={handleCapture}
          captureLabel="Read Palm Lines"
          instruction="손바닥을 펴서 카메라에 보여주세요"
          detectType="hand"
        />

        {error && (
          <div className="max-w-md mx-auto bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-500/30 p-4 text-center text-red-400">
            {error}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleReset}
            className="px-6 py-2 text-[#5b13ec] text-sm hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // 분석 중 화면
  if (mode === 'analyzing' || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border border-[#5b13ec]/30 shadow-[0_0_30px_rgba(91,19,236,0.5)] animate-ping"></div>
          <div className="h-24 w-24 rounded-full border border-[#5b13ec]/50 flex items-center justify-center shadow-[0_0_15px_rgba(91,19,236,0.3)]">
            <span className="text-4xl animate-pulse">🔮</span>
          </div>
        </div>
        <h3 className="text-white text-xl font-bold mt-8 mb-2">Reading Your Palm...</h3>
        <p className="text-white/50 text-sm text-center max-w-xs">
          손금에 담긴 운명을 읽는 중입니다
        </p>
        <div className="mt-6 flex gap-1">
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // 결과 화면
  if (mode === 'result' && result) {
    return (
      <div className="space-y-8 pb-8">
        {/* 캡처된 이미지 */}
        {capturedImage && (
          <div className="flex justify-center pt-4">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl border border-[#5b13ec]/30 shadow-[0_0_20px_rgba(91,19,236,0.3)] animate-pulse"></div>
              <img
                src={capturedImage}
                alt="분석된 손"
                className="w-48 h-48 rounded-2xl object-cover border border-white/10 relative z-10"
              />
            </div>
          </div>
        )}

        {/* 메인 해석 카드 */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[#5b13ec] text-[10px] font-bold uppercase tracking-[0.3em]">Palm Reading</span>
                <h3 className="text-white text-xl font-bold tracking-tight">
                  {result.handedness === 'Left' ? '왼손' : '오른손'} 손금
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full border border-[#5b13ec]/50 flex items-center justify-center shadow-[0_0_15px_rgba(91,19,236,0.3)]">
                <span className="text-xl">✨</span>
              </div>
            </div>

            <p className="text-white/70 text-lg italic leading-relaxed text-center">
              "{result.mainMessage}"
            </p>
          </div>
        </section>

        {/* 세부 해석 */}
        <section className="px-4">
          <div className="max-w-md mx-auto space-y-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] px-1">Line Details</h4>
            {result.details.map((detail, i) => (
              <div
                key={i}
                className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{detail.icon}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{detail.category}</span>
                    <span className="px-2 py-0.5 bg-[#5b13ec]/20 rounded-full text-[#5b13ec] text-xs">{detail.type}</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  {detail.message}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 조언 */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-[#5b13ec]/30 p-6 shadow-[0_0_15px_rgba(91,19,236,0.2)]">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] mb-4">Mystic Advice</h4>
            <p className="text-white/70 text-sm leading-relaxed text-center">
              💫 {result.advice}
            </p>
          </div>
        </section>

        {/* Reset Button */}
        <div className="px-4 pt-4">
          <button
            onClick={handleReset}
            className="w-full max-w-md mx-auto flex items-center justify-center bg-white text-black h-12 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#5b13ec] hover:text-white transition-colors"
          >
            New Reading
          </button>
        </div>
      </div>
    );
  }

  return null;
}
