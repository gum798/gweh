import { useState, useCallback } from 'react';
import CameraCapture from '../camera/CameraCapture';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { analyzeSkinTone, getPersonalColorOmen, colorTips } from '../../utils/personalColor';
import { analyzeFaceFeatures, interpretPhysiognomy } from '../../utils/physiognomy';

export default function FaceTab() {
  const [mode, setMode] = useState('select'); // 'select', 'capture', 'analyzing', 'result'
  const [analysisType, setAnalysisType] = useState(null); // 'personalColor', 'physiognomy', 'both'
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);

  const { detectFace, isLoading, error } = useFaceDetection();

  const handleModeSelect = (type) => {
    setAnalysisType(type);
    setMode('capture');
  };

  const handleCapture = useCallback(async (imageSrc) => {
    setCapturedImage(imageSrc);
    setMode('analyzing');

    const faceData = await detectFace(imageSrc);

    if (faceData) {
      const results = {};

      // 퍼스널 컬러 분석
      if (analysisType === 'personalColor' || analysisType === 'both') {
        const skinTone = analyzeSkinTone(faceData.skinSamples);
        if (skinTone) {
          results.personalColor = {
            ...skinTone,
            omen: getPersonalColorOmen(skinTone.season),
            tips: colorTips[skinTone.season],
          };
        }
      }

      // 관상 분석
      if (analysisType === 'physiognomy' || analysisType === 'both') {
        const features = analyzeFaceFeatures(faceData.landmarks);
        if (features) {
          results.physiognomy = interpretPhysiognomy(features);
        }
      }

      // 크롭된 얼굴 이미지 (랜드마크 표시) 사용
      setCapturedImage(faceData.annotatedImage || imageSrc);
      setResult(results);
      setMode('result');
    } else {
      setMode('capture');
    }
  }, [detectFace, analysisType]);

  const handleReset = () => {
    setMode('select');
    setAnalysisType(null);
    setCapturedImage(null);
    setResult(null);
  };

  // 모드 선택 화면
  if (mode === 'select') {
    return (
      <div className="glass-panel p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">👁️</div>
          <h2 className="text-2xl mystic-text text-shadow-glow mb-2 font-mystic">
            관상과 색채의 신비
          </h2>
          <p className="text-gray-400">
            얼굴에 담긴 운명의 징표를 풀이하리라
          </p>
        </div>

        <div className="grid gap-4 max-w-md mx-auto">
          <button
            onClick={() => handleModeSelect('personalColor')}
            className="glass-panel p-6 text-left hover:border-cosmic-gold/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🎨</span>
              <div>
                <h3 className="mystic-text text-lg">퍼스널 컬러</h3>
                <p className="text-gray-400 text-sm mt-1">
                  피부톤에 담긴 계절의 기운을 살펴 어울리는 색을 알려드리리라
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleModeSelect('physiognomy')}
            className="glass-panel p-6 text-left hover:border-cosmic-gold/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">👤</span>
              <div>
                <h3 className="mystic-text text-lg">관상</h3>
                <p className="text-gray-400 text-sm mt-1">
                  이목구비에 담긴 운명의 징표를 풀이하리라
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleModeSelect('both')}
            className="glass-panel p-6 text-left hover:border-cosmic-gold/40 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">✨</span>
              <div>
                <h3 className="mystic-text text-lg">종합 풀이</h3>
                <p className="text-gray-400 text-sm mt-1">
                  퍼스널 컬러와 관상을 함께 살펴드리리라
                </p>
              </div>
            </div>
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
          captureLabel="분석하기"
          instruction="정면을 바라보고 얼굴이 잘 보이도록 해주세요"
          detectType="face"
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
            ← 다른 분석 선택하기
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
            얼굴에 담긴 기운을 살피는 중...
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
        {/* 캡처된 이미지 (크롭 + 랜드마크) */}
        {capturedImage && (
          <div className="flex justify-center">
            <img
              src={capturedImage}
              alt="분석된 얼굴"
              className="w-64 h-64 rounded-2xl object-cover border-2 border-cosmic-gold/30 shadow-lg shadow-cosmic-gold/20"
            />
          </div>
        )}

        {/* 퍼스널 컬러 결과 */}
        {result.personalColor && (
          <div className="glass-panel p-6 md:p-8 animate-fade-in">
            <div className="text-center mb-6">
              <span className="text-3xl">🎨</span>
              <h3 className="mystic-text text-xl mt-2 font-mystic">퍼스널 컬러</h3>
            </div>

            {/* 시즌 */}
            <div className="text-center mb-6">
              <span className="inline-block px-6 py-2 bg-cosmic-gold/20 rounded-full mystic-text text-lg">
                {result.personalColor.seasonKorean}
              </span>
            </div>

            {/* 메인 메시지 */}
            <p className="text-center text-xl mystic-text leading-relaxed text-shadow-glow font-mystic mb-6">
              "{result.personalColor.omen}"
            </p>

            {/* 색상 팔레트 */}
            <div className="mb-6">
              <p className="data-label text-center mb-3">어울리는 색상</p>
              <div className="flex justify-center gap-2">
                {result.personalColor.colorPalette.map((color, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border border-white/20"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* 특성 설명 */}
            <p className="text-gray-300 text-center text-sm leading-relaxed">
              {result.personalColor.characteristics}
            </p>

            {/* 스타일 팁 */}
            <div className="mt-6 pt-6 border-t border-cosmic-gold/10 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="data-label">추천 색상</span>
                <p className="text-gray-300 mt-1">{result.personalColor.tips.best}</p>
              </div>
              <div>
                <span className="data-label">피할 색상</span>
                <p className="text-gray-300 mt-1">{result.personalColor.tips.avoid}</p>
              </div>
            </div>
          </div>
        )}

        {/* 관상 결과 */}
        {result.physiognomy && (
          <div className="glass-panel p-6 md:p-8 animate-fade-in">
            <div className="text-center mb-6">
              <span className="text-3xl">👤</span>
              <h3 className="mystic-text text-xl mt-2 font-mystic">관상 풀이</h3>
            </div>

            {/* 메인 메시지 */}
            <p className="text-center text-xl mystic-text leading-relaxed text-shadow-glow font-mystic mb-6">
              "{result.physiognomy.mainMessage}"
            </p>

            {/* 세부 해석 */}
            <div className="space-y-4">
              {result.physiognomy.details.map((detail, i) => (
                <div
                  key={i}
                  className="bg-mystic-700/50 rounded-xl p-4 border border-cosmic-gold/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="mystic-text text-sm">
                      {detail.typeKorean} {detail.partKorean}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {detail.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 다시하기 버튼 */}
        <div className="text-center">
          <button
            onClick={handleReset}
            className="text-cosmic-gold/70 hover:text-cosmic-gold transition-colors text-sm"
          >
            다시 분석하기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
