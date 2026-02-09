import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CameraCapture from '../camera/CameraCapture';
import { useHandDetection } from '../../hooks/useHandDetection';
import { interpretPalm, getPalmAdvice } from '../../utils/palmReading';
import { useAuth } from '../../contexts/AuthContext';

export default function PalmTab() {
  const { t } = useTranslation('palm');
  const { t: tc } = useTranslation();
  const { session } = useAuth();
  const [mode, setMode] = useState('intro');
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [previousPhotoUrl, setPreviousPhotoUrl] = useState<string | null>(null);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  const { detectHand, isLoading, error } = useHandDetection();

  // Check for previous palm photo via proxy API
  useEffect(() => {
    if (!session?.access_token) {
      setPreviousPhotoUrl(null);
      return;
    }
    fetch('/api/palm-photo', {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    }).then(res => {
      if (res.ok) {
        return res.blob().then(blob => {
          setPreviousPhotoUrl(URL.createObjectURL(blob));
        });
      }
      setPreviousPhotoUrl(null);
    }).catch(() => setPreviousPhotoUrl(null));
  }, [session?.access_token]);

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

      // Save palm photo to R2
      if (session?.access_token) {
        fetch('/api/upload-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ image: imageSrc, type: 'palm' }),
        }).then(() => {
          fetch('/api/palm-photo', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          }).then(r => r.ok ? r.blob() : null).then(blob => {
            if (blob) setPreviousPhotoUrl(URL.createObjectURL(blob));
          }).catch(() => {});
        }).catch(() => {});
      }
    } else {
      setMode('capture');
    }
  }, [detectHand, session?.access_token]);

  const handleUsePreviousPhoto = useCallback(async () => {
    if (!previousPhotoUrl) return;
    setLoadingPrevious(true);
    try {
      const res = await fetch(previousPhotoUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setLoadingPrevious(false);
        handleCapture(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch {
      setLoadingPrevious(false);
      setMode('capture');
    }
  }, [previousPhotoUrl, handleCapture]);

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
        <section className="relative overflow-hidden rounded-gal-xl">
          <div
            className="flex min-h-[45vh] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-end pb-12 px-6 text-center"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(255,255,255,0.95) 10%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.2) 100%), url("https://images.unsplash.com/photo-1572879023364-ab4f53e9d5fa?w=800&q=80")`,
            }}
          >
            <div className="flex flex-col gap-3 max-w-2xl">
              <h1 className="text-gal-black text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
                Lines of <br />
                <span className="text-gal-accent italic font-light">Destiny</span>
              </h1>
              <p className="text-gal-body text-sm font-light leading-relaxed max-w-xs mx-auto">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Previous Photo */}
        {previousPhotoUrl && (
          <section className="px-4">
            <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-accent p-5 shadow-gal-card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gal-accent text-[10px] font-bold uppercase tracking-[0.3em]">{tc('palm.previousPhoto')}</span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={previousPhotoUrl}
                  alt="Previous palm"
                  className="w-20 h-20 rounded-gal-lg object-cover border border-gal-border"
                />
                <p className="text-gal-muted text-sm flex-1">{tc('palm.previousPhotoDesc')}</p>
              </div>
              <button
                onClick={handleUsePreviousPhoto}
                className="w-full py-3 bg-gal-accent hover:bg-gal-accent-dark rounded-gal-lg text-white text-sm font-bold transition-colors"
              >
                ✋ {tc('palm.analyzeWithPrevious')}
              </button>
            </div>
          </section>
        )}

        {/* Instructions */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card">
            <h3 className="text-gal-accent font-bold uppercase tracking-widest text-xs mb-4">{tc('palm.beforeReading')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="bg-gal-accent-light p-2 rounded-gal-md">
                  <span className="text-lg">✋</span>
                </div>
                <div>
                  <p className="text-gal-body text-sm">{t('instruction.showPalm')}</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-gal-accent-light p-2 rounded-gal-md">
                  <span className="text-lg">💡</span>
                </div>
                <div>
                  <p className="text-gal-body text-sm">{t('instruction.lighting')}</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-gal-accent-light p-2 rounded-gal-md">
                  <span className="text-lg">📷</span>
                </div>
                <div>
                  <p className="text-gal-body text-sm">{t('instruction.fullPalm')}</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Start Button */}
        <div className="px-4 pb-8">
          <button
            onClick={handleStart}
            className="w-full max-w-md mx-auto flex items-center justify-center rounded-gal-xl h-14 px-8 bg-gal-accent text-white text-base font-bold tracking-widest uppercase transition-all shadow-gal-button hover:bg-gal-accent-dark hover:scale-105 active:scale-95"
          >
            {previousPhotoUrl ? tc('palm.newReading') : tc('palm.startReading')}
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
          captureLabel={tc('palm.readPalmLines')}
          instruction={t('instruction.showPalm')}
          detectType="hand"
        />

        {error && (
          <div className="max-w-md mx-auto bg-red-50 rounded-gal-xl border border-red-200 p-4 text-center text-red-600">
            {error}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleReset}
            className="px-6 py-2 text-gal-accent text-sm hover:text-gal-accent-dark transition-colors"
          >
            {tc('palm.back')}
          </button>
        </div>
      </div>
    );
  }

  // 분석 중 화면
  if (loadingPrevious || mode === 'analyzing' || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border border-gal-accent/30 animate-ping"></div>
          <div className="h-24 w-24 rounded-full border border-gal-accent flex items-center justify-center shadow-gal-card">
            <span className="text-4xl animate-pulse">🔮</span>
          </div>
        </div>
        <h3 className="text-gal-black text-xl font-bold mt-8 mb-2">{tc('palm.readingPalm')}</h3>
        <p className="text-gal-muted text-sm text-center max-w-xs">
          {t('analyzing')}
        </p>
        <div className="mt-6 flex gap-1">
          <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
              <div className="absolute -inset-2 rounded-gal-xl border border-gal-accent/30 shadow-gal-card"></div>
              <img
                src={capturedImage}
                alt={t('result.analyzedHand')}
                className="w-48 h-48 rounded-gal-xl object-cover border border-gal-border relative z-10"
              />
            </div>
          </div>
        )}

        {/* 메인 해석 카드 */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-gal-accent text-[10px] font-bold uppercase tracking-[0.3em]">{tc('palm.palmReading')}</span>
                <h3 className="text-gal-black text-xl font-bold tracking-tight">
                  {result.handedness === 'Left' ? t('result.leftHand') : t('result.rightHand')}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full border border-gal-accent flex items-center justify-center shadow-gal-soft">
                <span className="text-xl">✨</span>
              </div>
            </div>

            <p className="text-gal-body text-lg italic leading-relaxed text-center">
              "{result.mainMessage}"
            </p>
          </div>
        </section>

        {/* 세부 해석 */}
        <section className="px-4">
          <div className="max-w-md mx-auto space-y-4">
            <h4 className="text-gal-accent font-bold uppercase tracking-widest text-xs px-1">{tc('palm.lineDetails')}</h4>
            {result.details.map((detail, i) => (
              <div
                key={i}
                className="bg-white rounded-gal-xl border border-gal-border p-5 shadow-gal-soft"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{detail.icon}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gal-black font-bold">{detail.category}</span>
                    <span className="px-2 py-0.5 bg-gal-accent-light rounded-gal-md text-gal-accent text-xs">{detail.type}</span>
                  </div>
                </div>
                <p className="text-gal-body text-sm leading-relaxed">
                  {detail.message}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 조언 */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-accent p-6 shadow-gal-card">
            <h4 className="text-gal-accent font-bold uppercase tracking-widest text-xs mb-4">{tc('palm.mysticAdvice')}</h4>
            <p className="text-gal-body text-sm leading-relaxed text-center">
              💫 {result.advice}
            </p>
          </div>
        </section>

        {/* Reset Button */}
        <div className="px-4 pt-4">
          <button
            onClick={handleReset}
            className="w-full max-w-md mx-auto flex items-center justify-center bg-gal-accent text-white h-12 rounded-gal-xl font-bold text-sm uppercase tracking-widest hover:bg-gal-accent-dark transition-colors shadow-gal-button"
          >
            {tc('palm.newReading')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
