import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CameraCapture from '../camera/CameraCapture';
import { useHandDetection } from '../../hooks/useHandDetection';
import { interpretPalm, getPalmAdvice } from '../../utils/palmReading';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { LoadingState } from '../ui/LoadingState';

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
        <PageHeader
          eyebrow={tc('palm.heroTitle1')}
          title={tc('palm.heroTitle2')}
          subtitle={t('subtitle')}
        />

        {/* Previous Photo */}
        {previousPhotoUrl && (
          <section className="px-4">
            <Card variant="accent" className="max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gal-accent text-label font-bold uppercase">{tc('palm.previousPhoto')}</span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={previousPhotoUrl}
                  alt="Previous palm"
                  className="w-20 h-20 rounded-gal-lg object-cover border border-gal-border"
                />
                <p className="text-gal-muted text-sm flex-1">{tc('palm.previousPhotoDesc')}</p>
              </div>
              <Button variant="primary" fullWidth onClick={handleUsePreviousPhoto}>
                ✋ {tc('palm.analyzeWithPrevious')}
              </Button>
            </Card>
          </section>
        )}

        {/* Instructions */}
        <section className="px-4">
          <Card className="max-w-md mx-auto">
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
          </Card>
        </section>

        {/* Start Button */}
        <div className="px-4 pb-8">
          <div className="max-w-md mx-auto">
            <Button variant="primary" size="lg" fullWidth onClick={handleStart}>
              {previousPhotoUrl ? tc('palm.newReading') : tc('palm.startReading')}
            </Button>
          </div>
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
          <div className="max-w-md mx-auto rounded-gal-xl border border-status-danger/30 bg-status-danger-light p-4 text-center text-status-danger">
            {error}
          </div>
        )}

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            {tc('palm.back')}
          </Button>
        </div>
      </div>
    );
  }

  // 분석 중 화면
  if (loadingPrevious || mode === 'analyzing' || isLoading) {
    return <LoadingState label={tc('palm.readingPalm')} />;
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
          <Card className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-gal-accent text-label font-bold uppercase">{tc('palm.palmReading')}</span>
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
          </Card>
        </section>

        {/* 세부 해석 */}
        <section className="px-4">
          <div className="max-w-md mx-auto space-y-4">
            <h4 className="text-gal-accent font-bold uppercase tracking-widest text-xs px-1">{tc('palm.lineDetails')}</h4>
            {result.details.map((detail, i) => (
              <Card key={i}>
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
              </Card>
            ))}
          </div>
        </section>

        {/* 조언 */}
        <section className="px-4">
          <Card variant="accent" className="max-w-md mx-auto">
            <h4 className="text-gal-accent font-bold uppercase tracking-widest text-xs mb-4">{tc('palm.mysticAdvice')}</h4>
            <p className="text-gal-body text-sm leading-relaxed text-center">
              💫 {result.advice}
            </p>
          </Card>
        </section>

        {/* Reset Button */}
        <div className="px-4 pt-4">
          <div className="max-w-md mx-auto">
            <Button variant="secondary" fullWidth onClick={handleReset}>
              {tc('palm.newReading')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
