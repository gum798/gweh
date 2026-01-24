import { useState, useCallback, useRef } from 'react';

type Mode = 'input' | 'analyzing' | 'result' | 'error';

interface StyleRecommendation {
  category: string;
  items: string[];
  description: string;
  icon: string;
}

interface ColorRecommendation {
  recommended: string[];
  avoid: string[];
  description: string;
}

interface BodyAnalysis {
  bodyType: string;
  features: string;
  proportions: string;
}

interface FashionResult {
  bodyAnalysis: BodyAnalysis;
  mainMessage: string;
  styles: StyleRecommendation[];
  colors: ColorRecommendation;
  tips: string[];
  avoid: string[];
  accessories?: string[];
  seasonalAdvice?: string;
}

export default function FashionTab() {
  const [mode, setMode] = useState<Mode>('input');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<FashionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 이미지 리사이즈 (API 비용 절감)
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = useCallback(async () => {
    if (!capturedImage) {
      alert('사진을 업로드해주세요.');
      return;
    }

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
    setErrorMessage('');

    try {
      const response = await fetch('/api/fashion-consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage,
          height: heightNum,
          weight: weightNum,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI 분석에 실패했습니다.');
      }

      setResult(data.data);
      setMode('result');
    } catch (error) {
      console.error('Fashion consult error:', error);
      setErrorMessage(error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.');
      setMode('error');
    }
  }, [height, weight, capturedImage]);

  const handleReset = () => {
    setMode('input');
    setHeight('');
    setWeight('');
    setCapturedImage(null);
    setResult(null);
    setErrorMessage('');
  };

  // 입력 화면
  if (mode === 'input') {
    return (
      <div className="glass-panel p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">👔</div>
          <h2 className="text-2xl mystic-text text-shadow-glow mb-2 font-mystic">
            AI 패션 스타일 컨설팅
          </h2>
          <p className="text-gray-400">
            AI가 당신의 체형을 분석하고 맞춤 스타일을 추천합니다
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-6">
          {/* 사진 업로드 (필수) */}
          <div>
            <label className="data-label block mb-2">사진 <span className="text-red-400">*</span></label>
            <div
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors text-center ${
                capturedImage
                  ? 'border-cosmic-gold/50'
                  : 'border-cosmic-gold/30 hover:border-cosmic-gold/50'
              }`}
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
                  <p className="text-red-400/70 text-xs mt-1">(필수)</p>
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
            disabled={!capturedImage || !height || !weight}
            className={`w-full py-3 rounded-xl font-medium font-mystic transition-all ${
              capturedImage && height && weight
                ? 'bg-gradient-to-r from-cosmic-gold to-yellow-500 text-mystic-900 hover:from-yellow-500 hover:to-cosmic-gold shadow-lg shadow-cosmic-gold/20'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            AI 스타일 컨설팅 받기
          </button>

          <p className="text-gray-500 text-xs text-center">
            * GPT-4 Vision을 사용하여 분석합니다
          </p>
        </div>
      </div>
    );
  }

  // 분석 중 화면
  if (mode === 'analyzing') {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="animate-pulse">
          <div className="text-4xl mb-4">🤖</div>
          <p className="mystic-text text-lg font-mystic">
            AI가 체형과 스타일을 분석하고 있습니다...
          </p>
          <p className="text-gray-400 text-sm mt-2">
            잠시만 기다려주세요 (약 10-20초)
          </p>
          <div className="mt-6 flex justify-center gap-1">
            <div className="w-2 h-2 bg-cosmic-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-cosmic-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-cosmic-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // 에러 화면
  if (mode === 'error') {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="text-4xl mb-4">😥</div>
        <p className="text-red-400 text-lg mb-2">분석에 실패했습니다</p>
        <p className="text-gray-400 text-sm mb-6">{errorMessage}</p>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-cosmic-gold/20 text-cosmic-gold rounded-xl hover:bg-cosmic-gold/30 transition-colors"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  // 결과 화면
  if (mode === 'result' && result) {
    return (
      <div className="space-y-6">
        {/* 사진 */}
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
            <h3 className="mystic-text text-xl mt-2 font-mystic">AI 체형 분석</h3>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-mystic-700/50 rounded-xl p-4">
              <p className="data-label mb-1">체형 유형</p>
              <p className="text-cosmic-gold font-medium">{result.bodyAnalysis.bodyType}</p>
            </div>
            <div className="bg-mystic-700/50 rounded-xl p-4">
              <p className="data-label mb-1">체형 특징</p>
              <p className="text-gray-300 text-sm">{result.bodyAnalysis.features}</p>
            </div>
            <div className="bg-mystic-700/50 rounded-xl p-4">
              <p className="data-label mb-1">비율 분석</p>
              <p className="text-gray-300 text-sm">{result.bodyAnalysis.proportions}</p>
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
          {result.colors.avoid.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-500 text-sm text-center mb-2">피해야 할 색상/패턴</p>
              <div className="flex flex-wrap justify-center gap-2">
                {result.colors.avoid.map((color, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-red-900/30 rounded-full text-red-400 text-sm"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-gray-400 text-sm text-center">{result.colors.description}</p>
        </div>

        {/* 액세서리 추천 */}
        {result.accessories && result.accessories.length > 0 && (
          <div className="glass-panel p-6">
            <h3 className="mystic-text text-lg mb-4 text-center font-mystic">추천 액세서리</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {result.accessories.map((item, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-purple-900/30 rounded-full text-purple-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

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

        {/* 계절별 조언 */}
        {result.seasonalAdvice && (
          <div className="glass-panel p-6">
            <h3 className="mystic-text text-lg mb-4 text-center font-mystic">계절별 스타일링</h3>
            <p className="text-gray-300 text-center">{result.seasonalAdvice}</p>
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
