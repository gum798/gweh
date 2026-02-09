import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CameraCapture from '../camera/CameraCapture';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { analyzeSkinTone, getPersonalColorOmen, colorTips } from '../../utils/personalColor';
import { analyzeFaceFeatures, interpretPhysiognomy } from '../../utils/physiognomy';
import { useAuth } from '../../contexts/AuthContext';

export default function FaceTab() {
  const { t } = useTranslation('face');
  const { t: tc } = useTranslation();
  const { session, user } = useAuth();
  const [mode, setMode] = useState('select');
  const [analysisType, setAnalysisType] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [previousPhotoUrl, setPreviousPhotoUrl] = useState<string | null>(null);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  const { detectFace, isLoading, error } = useFaceDetection();

  // Check for previous face photo via proxy API
  useEffect(() => {
    if (!session?.access_token) {
      setPreviousPhotoUrl(null);
      return;
    }
    fetch('/api/face-photo', {
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

  const handleModeSelect = (type) => {
    setAnalysisType(type);
    setMode('capture');
  };

  const handleCapture = useCallback(async (imageSrc, overrideType?: string) => {
    const type = overrideType || analysisType;
    setCapturedImage(imageSrc);
    setMode('analyzing');

    const faceData = await detectFace(imageSrc);

    if (faceData) {
      const results = {};

      if (type === 'personalColor' || type === 'both') {
        const skinTone = analyzeSkinTone(faceData.skinSamples);
        if (skinTone) {
          results.personalColor = {
            ...skinTone,
            omen: getPersonalColorOmen(skinTone.season),
            tips: colorTips[skinTone.season],
          };
        }
      }

      if (type === 'physiognomy' || type === 'both') {
        const features = analyzeFaceFeatures(faceData.landmarks);
        if (features) {
          results.physiognomy = interpretPhysiognomy(features);
        }
      }

      const finalImage = faceData.annotatedImage || imageSrc;
      setCapturedImage(finalImage);
      setResult(results);
      setMode('result');

      // Save face photo to R2
      if (session?.access_token && user?.id) {
        fetch('/api/upload-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ image: imageSrc, type: 'face' }),
        }).then(() => {
          // Refresh previous photo via proxy
          fetch('/api/face-photo', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          }).then(r => r.ok ? r.blob() : null).then(blob => {
            if (blob) setPreviousPhotoUrl(URL.createObjectURL(blob));
          }).catch(() => {});
        }).catch(() => {});
      }
    } else {
      setMode('capture');
    }
  }, [detectFace, analysisType, session?.access_token]);

  const handleUsePreviousPhoto = useCallback(async (type: string) => {
    if (!previousPhotoUrl) return;
    setAnalysisType(type);
    setLoadingPrevious(true);
    try {
      const res = await fetch(previousPhotoUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setLoadingPrevious(false);
        handleCapture(reader.result as string, type);
      };
      reader.readAsDataURL(blob);
    } catch {
      setLoadingPrevious(false);
      setAnalysisType(type);
      setMode('capture');
    }
  }, [previousPhotoUrl, handleCapture]);

  const handleReset = () => {
    setMode('select');
    setAnalysisType(null);
    setCapturedImage(null);
    setResult(null);
  };

  // 모드 선택 화면
  if (mode === 'select') {
    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-gal-xl">
          <div
            className="flex min-h-[40vh] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-end pb-12 px-6 text-center"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(255,255,255,0.95) 10%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.2) 100%), url("https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80")`,
            }}
          >
            <div className="flex flex-col gap-3 max-w-2xl">
              <h1 className="text-gal-black text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
                {tc('face.heroTitle1')} <br />
                <span className="text-gal-accent italic font-light">{tc('face.heroTitle2')}</span>
              </h1>
              <p className="text-gal-body text-sm font-light leading-relaxed max-w-xs mx-auto">
                {t('subtitle', 'AI interprets the signs of destiny in your face')}
              </p>
            </div>
          </div>
        </section>

        {/* Previous Photo */}
        {previousPhotoUrl && (
          <section className="px-4">
            <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-5 shadow-gal-card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gal-accent text-[10px] font-bold uppercase tracking-[0.3em]">{tc('face.previousPhoto')}</span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={previousPhotoUrl}
                  alt="Previous face"
                  className="w-20 h-20 rounded-gal-lg object-cover border border-gal-border"
                />
                <p className="text-gal-muted text-sm flex-1">{tc('face.previousPhotoDesc')}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleUsePreviousPhoto('personalColor')}
                  className="py-2.5 bg-gal-accent-light hover:bg-gal-accent/10 rounded-gal-lg text-gal-body text-xs font-medium transition-colors"
                >
                  🎨 {tc('face.personalColor')}
                </button>
                <button
                  onClick={() => handleUsePreviousPhoto('physiognomy')}
                  className="py-2.5 bg-gal-accent-light hover:bg-gal-accent/10 rounded-gal-lg text-gal-body text-xs font-medium transition-colors"
                >
                  👤 {tc('face.physiognomy')}
                </button>
                <button
                  onClick={() => handleUsePreviousPhoto('both')}
                  className="py-2.5 bg-gal-accent hover:bg-gal-accent-dark rounded-gal-lg text-white text-xs font-bold transition-colors"
                >
                  ✨ {tc('face.completeAnalysis')}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Analysis Type Selection */}
        <section className="px-4 space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-gal-black text-xl font-bold tracking-tight pb-1">{previousPhotoUrl ? tc('face.newPhotoAnalysis') : tc('face.chooseAnalysis')}</h3>
            <div className="h-1 w-12 bg-gal-accent mx-auto rounded-full"></div>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            <button
              onClick={() => handleModeSelect('personalColor')}
              className="w-full bg-white rounded-gal-xl border border-gal-border p-6 text-left hover:border-gal-accent transition-all group shadow-gal-soft hover:shadow-gal-hover"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gal-accent-light p-4 rounded-gal-lg group-hover:bg-gal-accent/10 transition-colors">
                  <span className="text-3xl">🎨</span>
                </div>
                <div>
                  <h3 className="text-gal-black font-bold text-lg">{tc('face.personalColor')}</h3>
                  <p className="text-gal-muted text-sm mt-1">
                    {t('mode.personalColor.desc')}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleModeSelect('physiognomy')}
              className="w-full bg-white rounded-gal-xl border border-gal-border p-6 text-left hover:border-gal-accent transition-all group shadow-gal-soft hover:shadow-gal-hover"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gal-accent-light p-4 rounded-gal-lg group-hover:bg-gal-accent/10 transition-colors">
                  <span className="text-3xl">👤</span>
                </div>
                <div>
                  <h3 className="text-gal-black font-bold text-lg">{tc('face.physiognomy')}</h3>
                  <p className="text-gal-muted text-sm mt-1">
                    {t('mode.physiognomy.desc')}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleModeSelect('both')}
              className="w-full bg-white rounded-gal-xl border border-gal-accent p-6 text-left hover:border-gal-accent-dark transition-all group shadow-gal-card hover:shadow-gal-hover"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gal-accent-light p-4 rounded-gal-lg group-hover:bg-gal-accent/10 transition-colors">
                  <span className="text-3xl">✨</span>
                </div>
                <div>
                  <h3 className="text-gal-black font-bold text-lg">{tc('face.completeAnalysis')}</h3>
                  <p className="text-gal-muted text-sm mt-1">
                    {t('mode.complete.desc')}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </section>
      </div>
    );
  }

  // 카메라 캡처 화면
  if (mode === 'capture') {
    return (
      <div className="space-y-6">
        <CameraCapture
          onCapture={handleCapture}
          captureLabel={tc('face.analyzeButton')}
          instruction={t('instruction')}
          detectType="face"
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
            {tc('face.backToSelection')}
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
        <h3 className="text-gal-black text-xl font-bold mt-8 mb-2">{tc('face.readingFace')}</h3>
        <p className="text-gal-muted text-sm text-center max-w-xs">
          {t('analyzing', 'Examining the energy in your face')}
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
                alt={t('result.analyzedFace')}
                className="w-48 h-48 rounded-gal-xl object-cover border border-gal-border relative z-10"
              />
            </div>
          </div>
        )}

        {/* 퍼스널 컬러 결과 */}
        {result.personalColor && (
          <section className="px-4">
            <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-gal-accent text-[10px] font-bold uppercase tracking-[0.3em]">{tc('face.personalColor')}</span>
                  <h3 className="text-gal-black text-2xl font-bold tracking-tight">{result.personalColor.seasonKorean}</h3>
                </div>
                <div className="h-12 w-12 rounded-full border border-gal-accent flex items-center justify-center shadow-gal-soft">
                  <span className="text-xl">🎨</span>
                </div>
              </div>

              <p className="text-gal-body text-sm italic leading-relaxed mb-6">
                "{result.personalColor.omen}"
              </p>

              {/* 색상 팔레트 */}
              <div className="mb-6">
                <p className="text-gal-muted text-xs uppercase tracking-widest mb-3">{tc('face.colorPalette')}</p>
                <div className="flex justify-center gap-3">
                  {result.personalColor.colorPalette.map((color, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-full border-2 border-gal-border shadow-gal-soft"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <p className="text-gal-muted text-sm text-center mb-6">
                {result.personalColor.characteristics}
              </p>

              <div className="pt-4 border-t border-gal-border grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gal-accent text-xs uppercase tracking-widest">{tc('face.bestColors')}</span>
                  <p className="text-gal-body mt-1">{result.personalColor.tips.best}</p>
                </div>
                <div>
                  <span className="text-red-500 text-xs uppercase tracking-widest">{tc('face.avoidColors')}</span>
                  <p className="text-gal-muted mt-1">{result.personalColor.tips.avoid}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 관상 결과 */}
        {result.physiognomy && (
          <section className="px-4">
            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-gal-accent text-[10px] font-bold uppercase tracking-[0.3em]">{tc('face.physiognomy')}</span>
                    <h3 className="text-gal-black text-xl font-bold tracking-tight">{t('result.physiognomyReading')}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full border border-gal-accent flex items-center justify-center shadow-gal-soft">
                    <span className="text-xl">👤</span>
                  </div>
                </div>

                <p className="text-gal-body text-lg italic leading-relaxed text-center">
                  "{result.physiognomy.mainMessage}"
                </p>
              </div>

              {/* 세부 해석 */}
              {result.physiognomy.details.map((detail, i) => (
                <div
                  key={i}
                  className="bg-white rounded-gal-xl border border-gal-border p-5 shadow-gal-soft"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-gal-accent-light rounded-gal-md text-gal-accent text-xs font-medium">
                      {detail.typeKorean} {detail.partKorean}
                    </span>
                  </div>
                  <p className="text-gal-body text-sm leading-relaxed">
                    {detail.message}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reset Button */}
        <div className="px-4 pt-4">
          <button
            onClick={handleReset}
            className="w-full max-w-md mx-auto flex items-center justify-center bg-gal-accent text-white h-12 rounded-gal-xl font-bold text-sm uppercase tracking-widest hover:bg-gal-accent-dark transition-colors shadow-gal-button"
          >
            {tc('face.newAnalysis')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
