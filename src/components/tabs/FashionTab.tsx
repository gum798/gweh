import { useState, useCallback, useRef } from 'react';
import {
  analyzeBody,
  generateFashionRecommendation,
  BodyInfo,
  FashionRecommendation,
} from '../../utils/fashionRecommend';

type Mode = 'input' | 'analyzing' | 'result';
type Gender = 'male' | 'female';

export default function FashionTab() {
  const [mode, setMode] = useState<Mode>('input');
  const [gender, setGender] = useState<Gender>('female');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<FashionRecommendation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = useCallback(() => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (!heightNum || !weightNum) {
      alert('키와 몸무게를 입력해주세요.');
      return;
    }

    if (heightNum < 100 || heightNum > 250) {
      alert('키를 올바르게 입력해주세요. (100~250cm)');
      return;
    }

    if (weightNum < 30 || weightNum > 200) {
      alert('몸무게를 올바르게 입력해주세요. (30~200kg)');
      return;
    }

    setMode('analyzing');

    // 분석 시뮬레이션 (실제로는 바로 계산)
    setTimeout(() => {
      const bodyInfo: BodyInfo = {
        height: heightNum,
        weight: weightNum,
        gender,
      };

      const bodyAnalysis = analyzeBody(bodyInfo);
      const recommendation = generateFashionRecommendation(bodyInfo, bodyAnalysis);

      setResult(recommendation);
      setMode('result');
    }, 1500);
  }, [height, weight, gender]);

  const handleReset = () => {
    setMode('input');
    setHeight('');
    setWeight('');
    setCapturedImage(null);
    setResult(null);
  };

  // 입력 화면
  if (mode === 'input') {
    return (
      <div className="glass-panel p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">👔</div>
          <h2 className="text-2xl mystic-text text-shadow-glow mb-2 font-mystic">
            패션 스타일 추천
          </h2>
          <p className="text-gray-400">
            체형에 맞는 패션 스타일을 추천해드립니다
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-6">
          {/* 사진 업로드 (선택) */}
          <div>
            <label className="data-label block mb-2">사진 (선택)</label>
            <div
              onClick={triggerFileInput}
              className="border-2 border-dashed border-cosmic-gold/30 rounded-xl p-6 cursor-pointer
                         hover:border-cosmic-gold/50 transition-colors text-center"
            >
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="업로드된 사진"
                  className="w-32 h-32 mx-auto rounded-xl object-cover"
                />
              ) : (
                <>
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-gray-400 text-sm">전신 사진을 업로드하세요</p>
                  <p className="text-gray-500 text-xs mt-1">(선택 사항)</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* 성별 선택 */}
          <div>
            <label className="data-label block mb-2">성별</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGender('female')}
                className={`flex-1 py-3 rounded-xl transition-colors ${
                  gender === 'female'
                    ? 'bg-cosmic-gold/20 text-cosmic-gold border border-cosmic-gold/40'
                    : 'bg-mystic-700/50 text-gray-400 border border-transparent'
                }`}
              >
                👩 여성
              </button>
              <button
                onClick={() => setGender('male')}
                className={`flex-1 py-3 rounded-xl transition-colors ${
                  gender === 'male'
                    ? 'bg-cosmic-gold/20 text-cosmic-gold border border-cosmic-gold/40'
                    : 'bg-mystic-700/50 text-gray-400 border border-transparent'
                }`}
              >
                👨 남성
              </button>
            </div>
          </div>

          {/* 키 입력 */}
          <div>
            <label className="data-label block mb-2">키 (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="예: 165"
              className="w-full px-4 py-3 bg-mystic-700/50 border border-cosmic-gold/20 rounded-xl
                         text-white placeholder-gray-500 focus:border-cosmic-gold/50 focus:outline-none"
            />
          </div>

          {/* 몸무게 입력 */}
          <div>
            <label className="data-label block mb-2">몸무게 (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="예: 55"
              className="w-full px-4 py-3 bg-mystic-700/50 border border-cosmic-gold/20 rounded-xl
                         text-white placeholder-gray-500 focus:border-cosmic-gold/50 focus:outline-none"
            />
          </div>

          {/* 분석 버튼 */}
          <button
            onClick={handleAnalyze}
            disabled={!height || !weight}
            className={`w-full py-3 rounded-xl font-medium font-mystic transition-all ${
              height && weight
                ? 'bg-gradient-to-r from-cosmic-gold to-yellow-500 text-mystic-900 hover:from-yellow-500 hover:to-cosmic-gold shadow-lg shadow-cosmic-gold/20'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            스타일 추천받기
          </button>
        </div>
      </div>
    );
  }

  // 분석 중 화면
  if (mode === 'analyzing') {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="animate-pulse">
          <div className="text-4xl mb-4">👗</div>
          <p className="mystic-text text-lg font-mystic">
            체형을 분석하고 스타일을 추천하는 중...
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
        {/* 사진 (있는 경우) */}
        {capturedImage && (
          <div className="flex justify-center">
            <img
              src={capturedImage}
              alt="업로드된 사진"
              className="w-48 h-48 rounded-2xl object-cover border-2 border-cosmic-gold/30 shadow-lg shadow-cosmic-gold/20"
            />
          </div>
        )}

        {/* 체형 분석 결과 */}
        <div className="glass-panel p-6 md:p-8 animate-fade-in">
          <div className="text-center mb-6">
            <span className="text-3xl">📊</span>
            <h3 className="mystic-text text-xl mt-2 font-mystic">체형 분석</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-mystic-700/50 rounded-xl p-4 text-center">
              <p className="data-label">체형</p>
              <p className="text-cosmic-gold font-medium mt-1">
                {result.bodyAnalysis.bodyTypeKorean}
              </p>
            </div>
            <div className="bg-mystic-700/50 rounded-xl p-4 text-center">
              <p className="data-label">BMI</p>
              <p className="text-cosmic-gold font-medium mt-1">
                {result.bodyAnalysis.bmi}
              </p>
            </div>
          </div>

          {/* 메인 메시지 */}
          <p className="text-center text-lg mystic-text leading-relaxed text-shadow-glow font-mystic">
            "{result.mainMessage}"
          </p>
        </div>

        {/* 스타일 추천 */}
        <div className="glass-panel p-6">
          <h3 className="mystic-text text-lg mb-4 text-center font-mystic">추천 스타일</h3>
          <div className="space-y-4">
            {result.styles.map((style, i) => (
              <div
                key={i}
                className="bg-mystic-700/50 rounded-xl p-4 border border-cosmic-gold/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{style.icon}</span>
                  <span className="mystic-text">{style.category}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {style.items.map((item, j) => (
                    <span
                      key={j}
                      className="px-3 py-1 bg-cosmic-gold/20 rounded-full text-cosmic-gold text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <p className="text-gray-400 text-sm">{style.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 색상 추천 */}
        <div className="glass-panel p-6">
          <h3 className="mystic-text text-lg mb-4 text-center font-mystic">추천 색상</h3>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {result.colors.recommended.map((color, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-cosmic-gold/20 rounded-full text-cosmic-gold"
              >
                {color}
              </span>
            ))}
          </div>
          <p className="text-gray-400 text-sm text-center">{result.colors.description}</p>
        </div>

        {/* 스타일링 팁 */}
        <div className="glass-panel p-6">
          <h3 className="mystic-text text-lg mb-4 text-center font-mystic">스타일링 팁</h3>
          <ul className="space-y-2">
            {result.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <span className="text-cosmic-gold">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 피해야 할 것 */}
        {result.avoid.length > 0 && (
          <div className="glass-panel p-6">
            <h3 className="mystic-text text-lg mb-4 text-center font-mystic">피하면 좋은 것</h3>
            <ul className="space-y-2">
              {result.avoid.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-400">
                  <span className="text-red-400">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
