import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CameraCapture from '../camera/CameraCapture';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { analyzeSkinTone, getPersonalColorOmen, colorTips } from '../../utils/personalColor';
import { analyzeFaceFeatures, interpretPhysiognomy } from '../../utils/physiognomy';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { LoadingState } from '../ui/LoadingState';

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
        <PageHeader
          eyebrow={tc('face.heroTitle1')}
          title={tc('face.heroTitle2')}
          subtitle={t('subtitle', 'AI interprets the signs of destiny in your face')}
        />

        {/* Previous Photo */}
        {previousPhotoUrl && (
          <section className="px-4">
            <Card className="max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gal-accent text-label font-bold uppercase">{tc('face.previousPhoto')}</span>
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
                <Button variant="secondary" size="sm" onClick={() => handleUsePreviousPhoto('personalColor')}>
                  🎨 {tc('face.personalColor')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleUsePreviousPhoto('physiognomy')}>
                  👤 {tc('face.physiognomy')}
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleUsePreviousPhoto('both')}>
                  ✨ {tc('face.completeAnalysis')}
                </Button>
              </div>
            </Card>
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
              type="button"
              onClick={() => handleModeSelect('personalColor')}
              className="w-full text-left group"
            >
              <Card className="transition-all group-hover:border-gal-accent group-hover:shadow-gal-hover">
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
              </Card>
            </button>

            <button
              type="button"
              onClick={() => handleModeSelect('physiognomy')}
              className="w-full text-left group"
            >
              <Card className="transition-all group-hover:border-gal-accent group-hover:shadow-gal-hover">
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
              </Card>
            </button>

            <button
              type="button"
              onClick={() => handleModeSelect('both')}
              className="w-full text-left group"
            >
              <Card variant="accent" className="transition-all group-hover:border-gal-accent-dark group-hover:shadow-gal-hover">
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
              </Card>
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
          <div className="max-w-md mx-auto rounded-gal-xl border border-status-danger/30 bg-status-danger-light p-4 text-center text-status-danger">
            {error}
          </div>
        )}

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            {tc('face.backToSelection')}
          </Button>
        </div>
      </div>
    );
  }

  // 분석 중 화면
  if (loadingPrevious || mode === 'analyzing' || isLoading) {
    return <LoadingState label={tc('face.readingFace')} />;
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
            <Card className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-gal-accent text-label font-bold uppercase">{tc('face.personalColor')}</span>
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
                  <span className="text-status-danger text-xs uppercase tracking-widest">{tc('face.avoidColors')}</span>
                  <p className="text-gal-muted mt-1">{result.personalColor.tips.avoid}</p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* 관상 결과 */}
        {result.physiognomy && (
          <section className="px-4">
            <div className="max-w-md mx-auto space-y-4">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-gal-accent text-label font-bold uppercase">{tc('face.physiognomy')}</span>
                    <h3 className="text-gal-black text-xl font-bold tracking-tight">{t('result.physiognomyReading')}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full border border-gal-accent flex items-center justify-center shadow-gal-soft">
                    <span className="text-xl">👤</span>
                  </div>
                </div>

                <p className="text-gal-body text-lg italic leading-relaxed text-center">
                  "{result.physiognomy.mainMessage}"
                </p>
              </Card>

              {/* 세부 해석 */}
              {result.physiognomy.details.map((detail, i) => (
                <Card key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-gal-accent-light rounded-gal-md text-gal-accent text-xs font-medium">
                      {detail.typeKorean} {detail.partKorean}
                    </span>
                  </div>
                  <p className="text-gal-body text-sm leading-relaxed">
                    {detail.message}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Reset Button */}
        <div className="px-4 pt-4">
          <div className="max-w-md mx-auto">
            <Button variant="secondary" fullWidth onClick={handleReset}>
              {tc('face.newAnalysis')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
