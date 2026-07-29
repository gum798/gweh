import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { storeFashionData, getFashionData, deleteFashionData } from '../../utils/imageStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { CircularProgress } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';

const FASHION_DATA_KEY = 'mystic_fashion_data';

type Mode = 'input' | 'analyzing' | 'result' | 'error';

function authHeaders(token: string | undefined): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
  const { t: tc } = useTranslation();
  const { session } = useAuth();
  const { isSubscribed, subscribe } = useSubscription();
  const [mode, setMode] = useState<Mode>('input');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<FashionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [usedToday, setUsedToday] = useState(false);
  const [previousPhotoUrl, setPreviousPhotoUrl] = useState<string | null>(null);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  // 이전 정보 불러오기 (height, weight)
  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/profile', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.profile?.height && !height) setHeight(String(d.profile.height));
        if (d.profile?.weight && !weight) setWeight(String(d.profile.weight));
      })
      .catch(() => {});
  }, [session?.access_token]);

  // 이전 사진 불러오기
  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/fashion-photo', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => {
        if (r.ok) return r.blob();
        return null;
      })
      .then(blob => {
        if (blob) setPreviousPhotoUrl(URL.createObjectURL(blob));
      })
      .catch(() => {});
  }, [session?.access_token]);

  // 구독자 하루 1회 사용 체크
  useEffect(() => {
    if (!isSubscribed || !session?.access_token) return;
    fetch('/api/fashion-usage', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.usedToday) setUsedToday(true); })
      .catch(() => {});
  }, [isSubscribed, session?.access_token]);

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
        headers: { 'Content-Type': 'application/json', ...authHeaders(session?.access_token) },
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

  // 날씨 정보 가져오기
  const fetchWeather = async (): Promise<{ temperature: number; description: string } | undefined> => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      const { latitude, longitude } = pos.coords;
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey) return undefined;
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`);
      if (!res.ok) return undefined;
      const data = await res.json();
      return { temperature: Math.round(data.main.temp), description: data.weather?.[0]?.description || '' };
    } catch {
      return undefined;
    }
  };

  // 공통 분석 실행
  const runAnalysis = async (options?: { markUsedToday?: boolean }) => {
    setMode('analyzing');
    setAnalysisProgress(0);

    // 프로그레스 시뮬레이션 (0 → 90% 점진적 증가)
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 8 + 2; // 2~10% 씩 증가
      });
    }, 400);

    try {
      setAnalysisProgress(10); // 시작
      const weather = await fetchWeather();
      setAnalysisProgress(25); // 날씨 완료

      const response = await fetch('/api/fashion-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(session?.access_token) },
        body: JSON.stringify({
          image: capturedImage,
          height: parseFloat(height),
          weight: parseFloat(weight),
          weather,
        }),
      });
      setAnalysisProgress(85); // API 응답 수신

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || tc('fashion.errorAnalysis'));
      }

      setAnalysisProgress(100); // 완료
      clearInterval(progressInterval);

      // 100% 표시 후 결과 화면으로 전환
      await new Promise(r => setTimeout(r, 300));

      setResult(data.data);
      setMode('result');
      if (options?.markUsedToday) {
        setUsedToday(true);
        if (session?.access_token) {
          fetch('/api/fashion-usage', {
            method: 'POST',
            headers: authHeaders(session.access_token),
          }).catch(() => {});
        }
      }
      saveProfileData();
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Fashion consult error:', err);
      setErrorMessage(err instanceof Error ? err.message : tc('fashion.errorGeneric'));
      setMode('error');
    }
  };

  const handleFreeAnalysis = async () => {
    if (!capturedImage || !height || !weight) return;
    runAnalysis({ markUsedToday: true });
  };

  const handleAnalyzeAfterPayment = () => runAnalysis();

  const saveProfileData = async () => {
    if (!session?.access_token) return;
    const jsonAuthHeaders = {
      'Content-Type': 'application/json',
      ...authHeaders(session.access_token),
    };
    try {
      const profilePayload: Record<string, number> = {};
      const h = parseFloat(height);
      const w = parseFloat(weight);
      if (h) profilePayload.height = h;
      if (w) profilePayload.weight = w;

      await fetch('/api/profile', {
        method: 'POST',
        headers: jsonAuthHeaders,
        body: JSON.stringify(profilePayload),
      });

      if (capturedImage) {
        const uploadRes = await fetch('/api/upload-photo', {
          method: 'POST',
          headers: jsonAuthHeaders,
          body: JSON.stringify({ image: capturedImage, type: 'fashion' }),
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          await fetch('/api/profile', {
            method: 'POST',
            headers: jsonAuthHeaders,
            body: JSON.stringify({ photo_url: url }),
          });
        }
      }
    } catch (err) {
      console.error('Save profile error:', err);
    }
  };

  const handleUsePreviousPhoto = useCallback(async () => {
    if (!previousPhotoUrl) return;
    setLoadingPrevious(true);
    try {
      const res = await fetch(previousPhotoUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        setLoadingPrevious(false);
      };
      reader.readAsDataURL(blob);
    } catch {
      setLoadingPrevious(false);
    }
  }, [previousPhotoUrl]);

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

    setErrorMessage('');
    runAnalysis();
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
        {/*
          이 자리의 두 번째 히어로는 "Define Your / Shadow Self" 를 하드코딩하고 있었다
          (fashion 네임스페이스에도 common.json 에도 대응 키가 없다). 새 키를 만들지 않기
          위해 이미 있는 hero.fashion 을 제목으로 쓴다 — PalmTab 이 Task 4 에서
          하드코딩 제목을 기존 키로 옮긴 것과 같은 처리다.
        */}
        <PageHeader title={tc('hero.fashion')} subtitle={t('subtitle')} />

        {/* Physical Essence Section */}
        <section className="py-6 px-4 space-y-6">
          <div className="text-center">
            <h3 className="text-gal-black text-xl font-bold tracking-tight pb-1">{t('section.physicalEssence')}</h3>
            <div className="h-1 w-12 bg-gal-accent mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <label className="flex flex-col gap-2">
              <p className="text-gal-body text-xs font-bold uppercase tracking-widest pl-1">{t('label.height')}</p>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full rounded-gal-lg text-gal-black focus:outline-none focus:ring-1 focus:ring-gal-accent-ink border border-gal-border bg-gal-bg h-14 placeholder:text-gal-muted p-4 text-lg font-medium transition-all focus:bg-gal-light"
                placeholder={t('placeholder.height')}
              />
            </label>
            <label className="flex flex-col gap-2">
              <p className="text-gal-body text-xs font-bold uppercase tracking-widest pl-1">{t('label.weight')}</p>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-gal-lg text-gal-black focus:outline-none focus:ring-1 focus:ring-gal-accent-ink border border-gal-border bg-gal-bg h-14 placeholder:text-gal-muted p-4 text-lg font-medium transition-all focus:bg-gal-light"
                placeholder={t('placeholder.weight')}
              />
            </label>
          </div>
        </section>

        {/* 이전 사진 */}
        {previousPhotoUrl && !capturedImage && (
          <section className="px-4">
            <Card variant="accent" padding="sm" className="max-w-md mx-auto">
              <div className="flex items-center gap-4">
                <img
                  src={previousPhotoUrl}
                  alt="Previous"
                  className="w-20 h-20 rounded-gal-lg object-cover border border-gal-border"
                />
                <div className="flex-1">
                  <p className="text-gal-black text-sm font-bold mb-1">{tc('face.previousPhoto')}</p>
                  <p className="text-gal-muted text-xs mb-3">{tc('face.previousPhotoDesc')}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleUsePreviousPhoto}
                    disabled={loadingPrevious}
                  >
                    {loadingPrevious ? '...' : tc('face.previousPhotoDesc')}
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Upload Section: The Portal */}
        <section className="py-6 px-4">
          <div className="text-center mb-8">
            <h3 className="text-gal-black text-xl font-bold tracking-tight pb-1">{t('section.thePortal')}</h3>
            <p className="text-gal-muted text-sm font-light">{t('upload.subtitle')}</p>
          </div>
          <div className="max-w-md mx-auto aspect-square relative flex items-center justify-center">
            {/* Border */}
            <div className="absolute inset-0 rounded-gal-xl border border-gal-accent/20 shadow-gal-soft"></div>
            {/* 맨 div onClick 이 아니라 진짜 button 이어야 키보드로 사진을 넣을 수 있다.
                프록시하는 input[type=file] 이 hidden 이라 대체 경로가 없었다. */}
            <button
              type="button"
              onClick={triggerFileInput}
              className="w-full h-full bg-gal-light rounded-gal-xl flex flex-col items-center justify-center p-8 text-center border-dashed border-2 border-gal-accent/20 hover:border-gal-accent/50 transition-all group shadow-gal-card"
            >
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt={t('upload.title')}
                  className="w-full h-full object-cover rounded-gal-lg"
                />
              ) : (
                <>
                  <div className="mb-6 bg-gal-accent-light p-6 rounded-full group-hover:bg-gal-accent/15 transition-colors">
                    <span className="text-5xl text-gal-accent-ink">☁️</span>
                  </div>
                  <h4 className="text-gal-black text-lg font-bold mb-2">{t('upload.title')}</h4>
                  <p className="text-gal-muted text-sm leading-relaxed">
                    {t('upload.description')}
                  </p>
                  <div className="mt-6 flex gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-gal-md bg-gal-bg border border-gal-border text-xs font-bold uppercase text-gal-body">
                      ✓ {t('upload.frontView')}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-gal-md bg-gal-bg border border-gal-border text-xs font-bold uppercase text-gal-body">
                      ○ {t('upload.sideView')}
                    </div>
                  </div>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </section>

        {/* Action Buttons */}
        <div className="px-4 pb-8 space-y-3 max-w-md mx-auto">
          {isSubscribed ? (
            /* 구독자: 무료 분석 (하루 1회) + 추가 결제 */
            usedToday ? (
              <>
                <p className="text-gal-muted text-sm text-center">{tc('fashion.usedToday')}</p>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={goToCheckout}
                  disabled={!capturedImage || !height || !weight}
                >
                  {tc('fashion.extraAnalysis')}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleFreeAnalysis}
                disabled={!capturedImage || !height || !weight}
              >
                {tc('fashion.freeAnalysis')}
              </Button>
            )
          ) : (
            <>
              {/* 비구독자: 결제 분석 */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={goToCheckout}
                disabled={!capturedImage || !height || !weight}
              >
                {capturedImage && height && weight ? t('button.startAnalysis') : t('button.fillAll')}
              </Button>
              {/* 무료체험 및 구독 */}
              <Button variant="secondary" fullWidth onClick={() => subscribe()}>
                {tc('fashion.subscribeButton')}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 분석 중 화면
  if (mode === 'analyzing') {
    const getStatusText = () => {
      if (analysisProgress < 20) return '이미지 준비 중...';
      if (analysisProgress < 40) return '날씨 정보 확인 중...';
      if (analysisProgress < 80) return 'AI 분석 중...';
      if (analysisProgress < 100) return '결과 생성 중...';
      return '완료!';
    };

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <CircularProgress progress={analysisProgress} size={120} strokeWidth={6} />
        <h3 className="text-gal-black text-xl font-bold mt-8 mb-2">{t('analyzing.title')}</h3>
        <p className="text-gal-muted text-sm text-center max-w-xs mb-2">
          {t('analyzing.description')}
        </p>
        <p className="text-gal-accent-ink text-sm font-medium">
          {getStatusText()}
        </p>
      </div>
    );
  }

  // 에러 화면
  if (mode === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="h-20 w-20 rounded-full border border-status-danger/40 flex items-center justify-center mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        <h3 className="text-gal-black text-xl font-bold mb-2">{t('error.title')}</h3>
        <p className="text-gal-muted text-sm mb-6 max-w-xs">{errorMessage}</p>
        <Button variant="secondary" onClick={handleReset}>
          {t('error.tryAgain')}
        </Button>
      </div>
    );
  }

  // 결과 화면
  if (mode === 'result' && result) {
    return (
      <div className="space-y-8 pb-8">
        {/* Header */}
        <section className="py-8 px-4 bg-gradient-to-b from-transparent to-gal-bg/50">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-gal-accent-ink text-label font-bold uppercase">{t('result.complete')}</span>
                <h3 className="text-gal-black text-2xl font-bold tracking-tight">{result.bodyAnalysis?.bodyType || ''}</h3>
              </div>
              <div className="h-12 w-12 rounded-full border border-gal-accent/30 flex items-center justify-center shadow-gal-soft">
                <span className="text-gal-accent-ink text-xl">✨</span>
              </div>
            </div>

            {/*
              업로드된 사진 — Card 는 패딩 없는 변형이 없어 이미지를 카드 가장자리까지
              흘릴 수 없다. 여기만 div 로 남기고 Card 와 같은 표면 값을 쓴다.
            */}
            {capturedImage && (
              <div className="relative rounded-gal-xl overflow-hidden bg-gal-light border border-gal-border shadow-gal-card">
                <div className="aspect-[4/5] bg-cover bg-center" style={{ backgroundImage: `url(${capturedImage})` }}></div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-gal-black text-lg font-bold">{t('result.styleProfile')}</h4>
                    <span className="text-gal-accent-ink font-bold">{t('result.aiMatch')}</span>
                  </div>
                  <p className="text-gal-body text-sm italic leading-relaxed">
                    "{result.mainMessage || ''}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Body Analysis */}
        <section className="px-4">
          <Card className="max-w-md mx-auto space-y-4">
            <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent-ink">{t('result.bodyAnalysis')}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm border-b border-gal-border/50 pb-3">
                <span className="text-gal-dark font-medium">{t('result.bodyFeatures')}</span>
                <span className="text-gal-muted text-right max-w-[60%]">{result.bodyAnalysis?.features || ''}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gal-dark font-medium">{t('result.proportions')}</span>
                <span className="text-gal-muted text-right max-w-[60%]">{result.bodyAnalysis?.proportions || ''}</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Style Recommendations */}
        <section className="px-4">
          <div className="max-w-md mx-auto space-y-4">
            <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent-ink px-1">{t('result.styleRecommendations')}</h4>
            {(result.styles || []).map((style, i) => (
              <Card key={i}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{style.icon}</span>
                  <span className="text-gal-black font-bold">{style.category}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(style.items || []).map((item, j) => (
                    <span
                      key={j}
                      className="px-3 py-1.5 bg-gal-accent-light rounded-gal-md text-gal-accent-ink text-xs font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <p className="text-gal-muted text-sm">{style.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Color Palette */}
        <section className="px-4">
          <Card className="max-w-md mx-auto">
            <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent-ink mb-4">{t('result.colorPalette')}</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {(result.colors?.recommended || []).map((color, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-gal-bg rounded-gal-md text-gal-dark text-sm border border-gal-border"
                >
                  {color}
                </span>
              ))}
            </div>
            {result.colors?.avoid?.length > 0 && (
              <div className="pt-4 border-t border-gal-border">
                <p className="text-gal-muted text-xs uppercase tracking-widest mb-2">{t('result.avoid')}</p>
                <div className="flex flex-wrap gap-2">
                  {(result.colors?.avoid || []).map((color, i) => (
                    <span key={i} className="px-3 py-1 bg-status-danger-light rounded-gal-md text-status-danger text-xs">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.colors?.description && <p className="text-gal-muted text-sm mt-4">{result.colors.description}</p>}
          </Card>
        </section>

        {/* Styling Tips */}
        <section className="px-4">
          <Card className="max-w-md mx-auto">
            <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent-ink mb-4">{t('result.stylingTips')}</h4>
            <ul className="space-y-3">
              {(result.tips || []).map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-gal-accent-ink">✓</span>
                  <span className="text-gal-body">{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Avoid Section */}
        {result.avoid?.length > 0 && (
          <section className="px-4">
            <Card className="max-w-md mx-auto">
              <h4 className="font-bold uppercase tracking-widest text-xs text-status-danger mb-4">{t('result.styleWarnings')}</h4>
              <ul className="space-y-3">
                {result.avoid.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-status-danger">✕</span>
                    <span className="text-gal-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {/* Accessories */}
        {result.accessories && result.accessories.length > 0 && (
          <section className="px-4">
            <Card className="max-w-md mx-auto">
              <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent-ink mb-4">{t('result.accessories')}</h4>
              <div className="flex flex-wrap gap-2">
                {result.accessories.map((item, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-gal-accent-light rounded-gal-md text-gal-accent-ink text-sm border border-gal-accent/15"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Card>
          </section>
        )}

        {/* Seasonal Advice */}
        {result.seasonalAdvice && (
          <section className="px-4">
            <Card className="max-w-md mx-auto">
              <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent-ink mb-4">{t('result.seasonalGuide')}</h4>
              <p className="text-gal-body text-sm leading-relaxed">{result.seasonalAdvice}</p>
            </Card>
          </section>
        )}

        {/* Reset Button */}
        <div className="px-4 pt-4">
          <div className="max-w-md mx-auto">
            <Button variant="secondary" fullWidth onClick={handleReset}>
              {t('button.newAnalysis')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
