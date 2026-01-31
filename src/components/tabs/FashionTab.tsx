import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { storeFashionData, getFashionData, deleteFashionData } from '../../utils/imageStorage';

const FASHION_DATA_KEY = 'mystic_fashion_data';

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
  const { t } = useTranslation('fashion');
  const [mode, setMode] = useState<Mode>('input');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<FashionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPaid, setIsPaid] = useState(false);

  // 결제 완료 후 자동 분석
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutSuccess = urlParams.get('checkout_success');

    if (checkoutSuccess === 'true') {
      // client-localstorage-schema: Use IndexedDB for large image data
      const restoreData = async () => {
        const savedData = await getFashionData(FASHION_DATA_KEY);
        if (savedData) {
          setCapturedImage(savedData.image);
          setHeight(savedData.height);
          setWeight(savedData.weight);
          setIsPaid(true);
          await deleteFashionData(FASHION_DATA_KEY);
        }
      };
      restoreData();
      // URL 정리
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 결제 완료 + 데이터 복원 후 자동 분석
  useEffect(() => {
    if (isPaid && capturedImage && height && weight) {
      setIsPaid(false);
      // 자동 분석 시작
      handleAnalyzeAfterPayment();
    }
  }, [isPaid, capturedImage, height, weight]);

  // 결제 페이지로 이동 (데이터 저장 후)
  const goToCheckout = async () => {
    // 데이터 검증
    if (!capturedImage) {
      alert(t('alert.uploadPhoto'));
      return;
    }
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    if (!heightNum || !weightNum) {
      alert(t('alert.enterMeasurements'));
      return;
    }

    // client-localstorage-schema: Use IndexedDB for large image data
    await storeFashionData(FASHION_DATA_KEY, {
      image: capturedImage,
      height,
      weight,
    });

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Checkout failed');
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert(t('alert.checkoutFailed'));
    }
  };

  // 결제 후 분석 실행
  const handleAnalyzeAfterPayment = async () => {
    setMode('analyzing');
    try {
      const response = await fetch('/api/fashion-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedImage,
          height: parseFloat(height),
          weight: parseFloat(weight),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI 분석 중 오류가 발생했습니다.');
      }

      setResult(data.data);
      setMode('result');
    } catch (err) {
      console.error('Fashion consult error:', err);
      setErrorMessage(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
      setMode('error');
    }
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      alert(t('alert.uploadPhoto'));
      return;
    }

    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (!heightNum || !weightNum) {
      alert(t('alert.enterMeasurements'));
      return;
    }

    if (heightNum < 100 || heightNum > 250) {
      alert(t('alert.invalidHeight'));
      return;
    }

    if (weightNum < 30 || weightNum > 200) {
      alert(t('alert.invalidWeight'));
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
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl">
          <div
            className="flex min-h-[50vh] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-end pb-12 px-6 text-center"
            style={{
              backgroundImage: `linear-gradient(to top, #161022 10%, rgba(22, 16, 34, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuA4nQj-qJlva8AQ6WBFm3QhpPEeeapJF1IfHXPUu19hcl-DeIb4gp1NFiD7cK9Pw8fMBwyjMNr_Emptb4FTirBhNggUaoYUCHBt29yId1WMncHm6pyf7AYB1NtzwjobDfm_8xhmmpNZ6n6-k65AR7UQkqxVzZGqozd6Q7uKSh6momPRI92tzI-d63_pt4uJ5a19xneYDkRaUGHEi5Fn_oqi9XLXwQbElKPY50jBQuQuEFBoElWdeyurnrd8abMJ8cBD6ULBVWW6ERI")`,
            }}
          >
            <div className="flex flex-col gap-3 max-w-2xl">
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
                Define Your <br />
                <span className="text-[#5b13ec] italic font-light">Shadow Self</span>
              </h1>
              <p className="text-white/70 text-sm font-light leading-relaxed max-w-xs mx-auto">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Physical Essence Section */}
        <section className="py-6 px-4 space-y-6">
          <div className="text-center">
            <h3 className="text-white text-xl font-bold tracking-tight pb-1">{t('section.physicalEssence')}</h3>
            <div className="h-1 w-12 bg-[#5b13ec] mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <label className="flex flex-col gap-2">
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1">{t('label.height')}</p>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#5b13ec] border border-white/10 bg-white/5 h-14 placeholder:text-white/20 p-4 text-lg font-medium transition-all focus:bg-white/10"
                placeholder={t('placeholder.height')}
              />
            </label>
            <label className="flex flex-col gap-2">
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1">{t('label.weight')}</p>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#5b13ec] border border-white/10 bg-white/5 h-14 placeholder:text-white/20 p-4 text-lg font-medium transition-all focus:bg-white/10"
                placeholder={t('placeholder.weight')}
              />
            </label>
          </div>
        </section>

        {/* Upload Section: The Portal */}
        <section className="py-6 px-4">
          <div className="text-center mb-8">
            <h3 className="text-white text-xl font-bold tracking-tight pb-1">{t('section.thePortal')}</h3>
            <p className="text-white/40 text-sm font-light">{t('upload.subtitle')}</p>
          </div>
          <div className="max-w-md mx-auto aspect-square relative flex items-center justify-center">
            {/* Neon Border */}
            <div className="absolute inset-0 rounded-3xl border border-[#5b13ec]/30 shadow-[0_0_15px_rgba(91,19,236,0.3)] animate-pulse"></div>
            <div
              onClick={triggerFileInput}
              className="w-full h-full bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center p-8 text-center cursor-pointer border-dashed border-2 border-[#5b13ec]/20 hover:border-[#5b13ec]/50 transition-all group"
            >
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt={t('upload.title')}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <>
                  <div className="mb-6 bg-[#5b13ec]/20 p-6 rounded-full group-hover:bg-[#5b13ec]/40 transition-colors">
                    <span className="text-5xl text-[#5b13ec]">☁️</span>
                  </div>
                  <h4 className="text-lg font-bold mb-2">{t('upload.title')}</h4>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {t('upload.description')}
                  </p>
                  <div className="mt-6 flex gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-tight text-white/60">
                      ✓ {t('upload.frontView')}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-tight text-white/60">
                      ○ {t('upload.sideView')}
                    </div>
                  </div>
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
        </section>

        {/* Action Button - 결제 후 분석 */}
        <div className="px-4 pb-8">
          <button
            onClick={goToCheckout}
            disabled={!capturedImage || !height || !weight}
            className={`w-full max-w-md mx-auto flex items-center justify-center rounded-full h-14 px-8 text-base font-bold tracking-widest uppercase transition-all ${
              capturedImage && height && weight
                ? 'bg-[#5b13ec] text-white shadow-[0_0_15px_rgba(91,19,236,0.3)] border border-[#5b13ec]/50 hover:scale-105 active:scale-95'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {capturedImage && height && weight ? t('button.startAnalysis') : t('button.fillAll')}
          </button>
        </div>
      </div>
    );
  }

  // 분석 중 화면
  if (mode === 'analyzing') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border border-[#5b13ec]/30 shadow-[0_0_30px_rgba(91,19,236,0.5)] animate-ping"></div>
          <div className="h-24 w-24 rounded-full border border-[#5b13ec]/50 flex items-center justify-center shadow-[0_0_15px_rgba(91,19,236,0.3)]">
            <span className="text-4xl animate-pulse">✨</span>
          </div>
        </div>
        <h3 className="text-white text-xl font-bold mt-8 mb-2">{t('analyzing.title')}</h3>
        <p className="text-white/50 text-sm text-center max-w-xs">
          {t('analyzing.description')}
        </p>
        <div className="mt-6 flex gap-1">
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // 에러 화면
  if (mode === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="h-20 w-20 rounded-full border border-red-500/50 flex items-center justify-center mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        <h3 className="text-white text-xl font-bold mb-2">{t('error.title')}</h3>
        <p className="text-white/50 text-sm mb-6 max-w-xs">{errorMessage}</p>
        <button
          onClick={handleReset}
          className="px-8 py-3 bg-[#5b13ec]/20 text-[#5b13ec] rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#5b13ec]/30 transition-colors border border-[#5b13ec]/30"
        >
          {t('error.tryAgain')}
        </button>
      </div>
    );
  }

  // 결과 화면
  if (mode === 'result' && result) {
    return (
      <div className="space-y-8 pb-8">
        {/* Header */}
        <section className="py-8 px-4 bg-gradient-to-b from-transparent to-black/20">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[#5b13ec] text-[10px] font-bold uppercase tracking-[0.3em]">{t('result.complete')}</span>
                <h3 className="text-white text-2xl font-bold tracking-tight">{result.bodyAnalysis.bodyType}</h3>
              </div>
              <div className="h-12 w-12 rounded-full border border-[#5b13ec]/50 flex items-center justify-center shadow-[0_0_15px_rgba(91,19,236,0.3)]">
                <span className="text-[#5b13ec] text-xl">✨</span>
              </div>
            </div>

            {/* 업로드된 사진 */}
            {capturedImage && (
              <div className="relative rounded-2xl overflow-hidden bg-[rgba(34,25,51,0.6)] backdrop-blur-xl border border-white/10">
                <div className="aspect-[4/5] bg-cover bg-center" style={{ backgroundImage: `url(${capturedImage})` }}></div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold">{t('result.styleProfile')}</h4>
                    <span className="text-[#5b13ec] font-bold">{t('result.aiMatch')}</span>
                  </div>
                  <p className="text-white/60 text-sm italic leading-relaxed">
                    "{result.mainMessage}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Body Analysis */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec]">{t('result.bodyAnalysis')}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm border-b border-white/5 pb-3">
                <span className="text-white/80 font-medium">{t('result.bodyFeatures')}</span>
                <span className="text-white/40 text-right max-w-[60%]">{result.bodyAnalysis.features}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80 font-medium">{t('result.proportions')}</span>
                <span className="text-white/40 text-right max-w-[60%]">{result.bodyAnalysis.proportions}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Style Recommendations */}
        <section className="px-4">
          <div className="max-w-md mx-auto space-y-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] px-1">{t('result.styleRecommendations')}</h4>
            {result.styles.map((style, i) => (
              <div key={i} className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{style.icon}</span>
                  <span className="text-white font-bold">{style.category}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {style.items.map((item, j) => (
                    <span
                      key={j}
                      className="px-3 py-1.5 bg-[#5b13ec]/20 rounded-full text-[#5b13ec] text-xs font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <p className="text-white/50 text-sm">{style.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Color Palette */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] mb-4">{t('result.colorPalette')}</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {result.colors.recommended.map((color, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-white/5 rounded-full text-white/80 text-sm border border-white/10"
                >
                  {color}
                </span>
              ))}
            </div>
            {result.colors.avoid.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{t('result.avoid')}</p>
                <div className="flex flex-wrap gap-2">
                  {result.colors.avoid.map((color, i) => (
                    <span key={i} className="px-3 py-1 bg-red-500/10 rounded-full text-red-400/80 text-xs">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-white/40 text-sm mt-4">{result.colors.description}</p>
          </div>
        </section>

        {/* Styling Tips */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] mb-4">{t('result.stylingTips')}</h4>
            <ul className="space-y-3">
              {result.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-[#5b13ec]">✓</span>
                  <span className="text-white/70">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Avoid Section */}
        {result.avoid.length > 0 && (
          <section className="px-4">
            <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-xs text-red-400 mb-4">{t('result.styleWarnings')}</h4>
              <ul className="space-y-3">
                {result.avoid.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-red-400">✕</span>
                    <span className="text-white/50">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Accessories */}
        {result.accessories && result.accessories.length > 0 && (
          <section className="px-4">
            <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] mb-4">{t('result.accessories')}</h4>
              <div className="flex flex-wrap gap-2">
                {result.accessories.map((item, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-purple-500/10 rounded-full text-purple-300 text-sm border border-purple-500/20"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Seasonal Advice */}
        {result.seasonalAdvice && (
          <section className="px-4">
            <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] mb-4">{t('result.seasonalGuide')}</h4>
              <p className="text-white/60 text-sm leading-relaxed">{result.seasonalAdvice}</p>
            </div>
          </section>
        )}

        {/* Reset Button */}
        <div className="px-4 pt-4">
          <button
            onClick={handleReset}
            className="w-full max-w-md mx-auto flex items-center justify-center bg-white text-black h-12 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#5b13ec] hover:text-white transition-colors"
          >
            {t('button.newAnalysis')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
