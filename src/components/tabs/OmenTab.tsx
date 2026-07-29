import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeather } from '../../hooks/useWeather';
import { useParallelData } from '../../hooks/useParallelData';
import { useMoonPhase } from '../../hooks/useMoonPhase';
import { generateOmen, getOverallEnergy, getEnergyLabel } from '../../utils/omenGenerator';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { LoadingState } from '../ui/LoadingState';
import { LevelPill } from '../ui/LevelPill';

const DataPanel = lazy(() => import('../DataPanel'));

const PERSONAL_OMEN_CACHE_KEY = 'personal_omen_cache';

function getCachedPersonalOmen(birthDate: string, energyLabel: string) {
  try {
    const raw = localStorage.getItem(PERSONAL_OMEN_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    if (cached.date === today && cached.birth_date === birthDate && cached.energy_label === energyLabel) {
      return cached.data;
    }
  } catch {}
  return null;
}

function setCachedPersonalOmen(birthDate: string, energyLabel: string, data: any) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(PERSONAL_OMEN_CACHE_KEY, JSON.stringify({ date: today, birth_date: birthDate, energy_label: energyLabel, data }));
}

interface OmenTabProps {
  onLoginRequired: () => void;
}

export default function OmenTab({ onLoginRequired }: OmenTabProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const { isSubscribed, subscribe } = useSubscription();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showData, setShowData] = useState(false);
  const [dailyStyle, setDailyStyle] = useState<any>(null);
  const [styleLoading, setStyleLoading] = useState(false);
  const [minWait, setMinWait] = useState(false);
  const [personalOmen, setPersonalOmen] = useState<any>(null);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ birth_date?: string; birth_hour?: number; height?: number; weight?: number } | null>(null);
  const personalFetched = useRef(false);

  const { data: weather, loading: weatherLoading, error: weatherError } = useWeather(
    location?.lat,
    location?.lon
  );
  const { earthquake, loading: parallelLoading, errors: parallelErrors } = useParallelData();
  const { data: moon } = useMoonPhase();

  // 서울 기본 좌표
  const DEFAULT_LOCATION = { lat: 37.5665, lon: 126.9780 };

  // 위치 감지: 프로필 > IP > 서울 기본값 (한 번만 설정)
  useEffect(() => {
    let cancelled = false;

    const resolveLocation = async () => {
      // 1. 로그인 사용자: 저장된 위치 + 프로필 데이터 확인
      if (session?.access_token) {
        try {
          const r = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const d = await r.json();
          if (!cancelled && d.profile) {
            const p = d.profile;
            setUserProfile({
              birth_date: p.birth_date,
              birth_hour: p.birth_hour,
              height: p.height,
              weight: p.weight,
            });
            if (p.last_lat && p.last_lon) {
              setLocation({ lat: p.last_lat, lon: p.last_lon });
              return;
            }
          }
        } catch {}
      }

      // 2. IP 기반 위치 감지
      try {
        const r = await fetch('https://ipapi.co/json/');
        const d = await r.json();
        if (!cancelled && d.latitude && d.longitude) {
          setLocation({ lat: d.latitude, lon: d.longitude });
          return;
        }
      } catch {}

      // 3. 서울 기본값
      if (!cancelled) setLocation(DEFAULT_LOCATION);
    };

    resolveLocation();
    return () => { cancelled = true; };
  }, [session?.access_token]);

  // location 변경 시 최소 2초간 로딩 유지
  useEffect(() => {
    if (location) {
      setMinWait(true);
      const timer = setTimeout(() => setMinWait(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const requestLocation = useCallback(() => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError(t('location.notSupported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setLocation(loc);
        // Save location to profile
        if (session?.access_token) {
          fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ last_lat: loc.lat, last_lon: loc.lon }),
          }).catch(() => { });
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(t('location.denied'));
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(t('location.unavailable'));
            break;
          case error.TIMEOUT:
            setLocationError(t('location.timeout'));
            break;
          default:
            setLocationError(t('location.unavailable'));
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [session?.access_token]);


  const isLoading = useMemo(
    () => location && (weatherLoading || parallelLoading || minWait),
    [location, weatherLoading, parallelLoading, minWait]
  );

  const omen = useMemo(() => {
    if (!weather || !moon || !earthquake) return null;
    return generateOmen(weather, moon, earthquake);
  }, [weather, moon, earthquake]);

  // 괘/에너지 생성 시 daily_readings에 저장
  const omenSaved = useRef(false);
  useEffect(() => {
    if (!omen?.main?.message || !weather || !moon || !earthquake) return;
    if (!session?.access_token || omenSaved.current) return;
    omenSaved.current = true;

    const energy = getOverallEnergy(weather, moon, earthquake);
    fetch('/api/save-reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        omen_message: omen.main.message,
        energy_score: energy,
      }),
    }).catch(() => {});
  }, [omen, weather, moon, earthquake, session?.access_token]);

  // Fetch daily reading (pre-generated by cron) or fall back to on-the-fly style
  useEffect(() => {
    if (!isSubscribed || !session?.access_token) return;
    if (dailyStyle) return;

    const fetchDailyReading = async () => {
      setStyleLoading(true);
      try {
        // Try pre-generated daily reading first
        const readingRes = await fetch('/api/daily-reading', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        if (readingRes.ok) {
          const { reading } = await readingRes.json();
          if (reading?.style_data) {
            setDailyStyle(reading.style_data);
            setStyleLoading(false);
            return;
          }
        }

        // Fall back to on-the-fly generation
        if (!omen?.main?.message) { setStyleLoading(false); return; }
        const energy = getOverallEnergy(weather!, moon!, earthquake!);
        const energyInfo = getEnergyLabel(energy);
        const res = await fetch('/api/daily-style', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            omenMessage: omen.main.message,
            energy: energyInfo.label,
            lang: i18n.language,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setDailyStyle(data.data);
        }
      } catch (err) {
        console.error('Daily style error:', err);
      } finally {
        setStyleLoading(false);
      }
    };
    fetchDailyReading();
  }, [isSubscribed, omen, session?.access_token]);

  // 맞춤 사주 조언 fetch
  useEffect(() => {
    console.log('[PersonalOmen] Effect check:', {
      hasSession: !!session?.access_token,
      hasOmen: !!omen?.main?.message,
      fetched: personalFetched.current,
      profile: userProfile,
    });
    if (!session?.access_token || !omen?.main?.message || personalFetched.current) return;
    const profile = userProfile;
    if (!profile?.birth_date) return;

    personalFetched.current = true;
    const energyVal = getOverallEnergy(weather!, moon!, earthquake!);
    const eLabel = getEnergyLabel(energyVal).label;

    // 캐시 확인
    const cached = getCachedPersonalOmen(profile.birth_date, eLabel);
    if (cached) {
      setPersonalOmen(cached);
      return;
    }

    setPersonalLoading(true);
    setPersonalError(null);
    fetch('/api/personal-omen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        birth_date: profile.birth_date,
        birth_hour: profile.birth_hour,
        omen_message: omen.main.message,
        energy_label: eLabel,
        lang: i18n.language,
        height: profile.height,
        weight: profile.weight,
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setPersonalOmen(d.data);
          setCachedPersonalOmen(profile.birth_date!, eLabel, d.data);
        } else {
          console.error('Personal omen API error:', d);
          setPersonalError(d.error || 'Unknown error');
          personalFetched.current = false;
        }
      })
      .catch((err) => {
        console.error('Personal omen fetch failed:', err);
        setPersonalError('Network error');
        personalFetched.current = false;
      })
      .finally(() => setPersonalLoading(false));
  }, [session?.access_token, omen, userProfile]);

  const toggleShowData = useCallback(() => {
    setShowData(prev => !prev);
  }, []);

  // 위치 요청 화면
  if (!location) {
    return (
      <div className="space-y-8">
        {/*
          이 자리에는 omenTab.heroTitle1/2 를 렌더하는 h1 이 있었다 — 저장소의
          세 번째 브랜드 표기이고, 기본 탭의 첫 화면이라 앱을 열면 헤더 로고와
          다른 이름이 곧바로 보였다. 브랜드 문자열 통일은 Task 8 소관이므로
          여기서는 렌더만 지우고 로케일 키는 그대로 둔다.
          제목은 이미 LocationPrompt 가 쓰는 location.title 을 재사용한다.
        */}
        <PageHeader
          title={t('location.title')}
          subtitle={t('omenTab.heroSubtitle')}
        />

        {/* Location Request */}
        <section className="px-4">
          <Card className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full border border-gal-accent/30 flex items-center justify-center shadow-gal-soft mx-auto mb-4">
                <span className="text-3xl">🔮</span>
              </div>
              <h3 className="text-gal-black text-xl font-bold tracking-tight">{t('omenTab.locationSensing')}</h3>
              <p className="text-gal-muted text-sm mt-2">
                {t('omenTab.locationAffects1')}<br />
                {t('omenTab.locationAffects2')}
              </p>
            </div>

            {/* Card 에 상태 변형이 없어 배너는 div 로 남긴다 — 색만 status 토큰으로. */}
            {locationError && (
              <div className="rounded-gal-lg border border-status-danger/30 bg-status-danger-light p-4 mb-6 text-center text-status-danger text-sm">
                {locationError}
              </div>
            )}

            <div className="space-y-3">
              <Button variant="primary" size="lg" fullWidth onClick={requestLocation}>
                {t('location.startButton')}
              </Button>

            </div>
          </Card>
        </section>
      </div>
    );
  }

  // 로딩 화면
  // LoadingState 는 라벨 한 줄만 받는다 — omenTab.sensing 둘째 줄은 슬롯이 없어 빠진다.
  if (isLoading) {
    return <LoadingState label={t('omenTab.readingSigns')} />;
  }

  // 에러 화면
  const hasError = weatherError || parallelErrors.nasa || parallelErrors.earthquake;
  if (hasError) {
    const errorMessages = [
      weatherError,
      parallelErrors.nasa,
      parallelErrors.earthquake,
    ].filter(Boolean);

    return (
      <div className="px-4 py-8">
        {/* Card 에 상태 변형이 없어 오류 표면은 div 로 남긴다 — 색만 status 토큰으로. */}
        <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-status-danger/30 p-8 text-center shadow-gal-card">
          <div className="h-16 w-16 rounded-full border border-status-danger/40 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-gal-black text-xl font-bold mb-2">{t('omenTab.cannotRead')}</h2>
          <div className="text-gal-muted text-sm mb-6 space-y-1">
            {errorMessages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
          <Button variant="primary" onClick={() => window.location.reload()}>
            {t('omenTab.readAgain')}
          </Button>
        </div>
      </div>
    );
  }

  // 결과 화면
  const energy = getOverallEnergy(weather, moon, earthquake);
  const energyInfo = getEnergyLabel(energy);

  return (
    <div className="space-y-8 pb-8">
      {/* 위치 표시 + GPS 정밀 위치 버튼 */}
      {weather?.cityName && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <p className="text-gal-muted text-sm">
            {t('omenTab.underSky', { city: weather.cityName })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={requestLocation}
            aria-label={t('location.startButton')}
          >
            <span aria-hidden="true">📍</span>
          </Button>
        </div>
      )}

      {/* 메인 괘 카드 */}
      <section className="px-4">
        <Card className="max-w-md mx-auto">
          {/* 에너지 지표 */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-gal-muted text-xs uppercase tracking-widest">{t('omenCard.energyFlow')}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gal-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gal-accent to-gal-accent-dark transition-all duration-1000"
                  style={{ width: `${energy}%` }}
                />
              </div>
              <LevelPill level={energyInfo.label} />
            </div>
          </div>

          {/* 메인 메시지 */}
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-full border border-gal-accent/30 flex items-center justify-center shadow-gal-soft mx-auto mb-4">
              <span className="text-xl">✨</span>
            </div>
            <p className="text-gal-body text-lg italic leading-relaxed">
              "{omen?.main?.message}"
            </p>
          </div>

          {/* 타임스탬프 */}
          <div className="pt-4 border-t border-gal-border text-center">
            <p className="text-gal-muted text-xs">
              {omen?.timestamp?.toLocaleString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })} {t('omenCard.celestialSign')}
            </p>
          </div>
        </Card>
      </section>

      {/* 세부 괘 */}
      <section className="px-4">
        <div className="max-w-md mx-auto space-y-6">
          <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent px-1">{t('omenTab.detailedOmens')}</h4>
          {omen?.details?.map((detail, index) => (
            <Card key={index}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{detail.icon}</span>
                <span className="text-gal-black font-bold">{detail.category}</span>
              </div>
              <p className="text-gal-body text-sm leading-relaxed">
                {detail.message}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 맞춤 사주 조언 */}
      {session && (personalOmen || personalLoading || personalError) && (
        <section className="px-4">
          <div className="max-w-md mx-auto">
            <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent px-1 mb-4">
              {t('omenTab.personalSaju')}
            </h4>
            {personalLoading ? (
              <Card variant="accent" className="text-center">
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-gal-muted text-sm">{t('omenTab.loadingPersonal')}</p>
              </Card>
            ) : personalError ? (
              // Card 에 상태 변형이 없어 오류 표면은 div 로 남긴다 — 색만 status 토큰으로.
              <div className="bg-white rounded-gal-xl border border-status-danger/30 p-6 text-center shadow-gal-card">
                <p className="text-status-danger text-sm">{personalError}</p>
              </div>
            ) : personalOmen ? (
              <Card variant="accent" className="space-y-4">
                {personalOmen.headline && <p className="text-gal-dark text-base italic text-center">"{personalOmen.headline}"</p>}

                {personalOmen.saju_reading && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔮</span>
                    <span className="text-gal-body text-xs font-bold uppercase tracking-widest">{t('omenTab.sajuReading')}</span>
                  </div>
                  <p className="text-gal-body text-sm leading-relaxed">{personalOmen.saju_reading}</p>
                </div>
                )}

                {personalOmen.feng_shui_tip && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🧭</span>
                    <span className="text-gal-body text-xs font-bold uppercase tracking-widest">{t('omenTab.fengShuiTip')}</span>
                  </div>
                  <p className="text-gal-body text-sm leading-relaxed">{personalOmen.feng_shui_tip}</p>
                </div>
                )}

                {personalOmen.health_advice && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💚</span>
                      <span className="text-gal-body text-xs font-bold uppercase tracking-widest">{t('omenTab.healthAdvice')}</span>
                    </div>
                    <p className="text-gal-body text-sm leading-relaxed">{personalOmen.health_advice}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gal-border">
                  {personalOmen.lucky_item && (
                  <div>
                    <span className="text-gal-muted text-xs block mb-1">{t('omenTab.luckyItem')}</span>
                    <span className="text-gal-black text-sm">{personalOmen.lucky_item}</span>
                  </div>
                  )}
                  {personalOmen.caution && (
                  <div>
                    <span className="text-gal-muted text-xs block mb-1">{t('omenTab.caution')}</span>
                    <span className="text-status-warning text-sm">{personalOmen.caution}</span>
                  </div>
                  )}
                </div>
              </Card>
            ) : null}
          </div>
        </section>
      )}

      {/* Daily Style - Premium */}
      <section className="px-4">
        <div className="max-w-md mx-auto">
          {isSubscribed ? (
            // Subscriber: show daily style
            <Card variant="accent">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">👔</span>
                <h4 className="text-gal-black font-bold text-sm">{t('sub.dailyStyleTitle')}</h4>
                <span className="ml-auto text-label text-gal-accent bg-gal-accent-light px-2 py-0.5 rounded-gal-md font-bold uppercase">
                  {t('sub.badge')}
                </span>
              </div>
              {styleLoading ? (
                <div className="text-center py-6">
                  <div className="flex gap-1 justify-center mb-2">
                    <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <p className="text-gal-muted text-sm">{t('sub.loadingStyle')}</p>
                </div>
              ) : dailyStyle ? (
                <div className="space-y-4">
                  {dailyStyle.headline && <p className="text-gal-dark text-base italic">"{dailyStyle.headline}"</p>}
                  {dailyStyle.style && <p className="text-gal-body text-sm leading-relaxed">{dailyStyle.style}</p>}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-gal-muted text-xs">{t('sub.styleColors')}:</span>
                    {dailyStyle.colors?.map((color: string, i: number) => (
                      <span key={i} className="text-gal-accent text-xs bg-gal-accent-light px-2 py-0.5 rounded-gal-md">
                        {color}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gal-border">
                    {dailyStyle.item && <div>
                      <span className="text-gal-muted text-xs block mb-1">{t('sub.styleItem')}</span>
                      <span className="text-gal-black text-sm">{dailyStyle.item}</span>
                    </div>}
                    {dailyStyle.tip && <div>
                      <span className="text-gal-muted text-xs block mb-1">{t('sub.styleTip')}</span>
                      <span className="text-gal-black text-sm">{dailyStyle.tip}</span>
                    </div>}
                  </div>
                </div>
              ) : null}
            </Card>
          ) : (
            // Non-subscriber: locked preview with blur
            <Card padding="sm" className="relative overflow-hidden">
              {/* Blurred fake content */}
              <div className="blur-sm select-none pointer-events-none">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">👔</span>
                  <span className="text-gal-black font-bold text-sm">{t('sub.dailyStyleTitle')}</span>
                </div>
                <p className="text-gal-body text-sm mb-3">오늘의 에너지에 맞는 스타일을 추천해드립니다. 보라색 계열의 색상이 오늘의 기운과 잘 어울립니다.</p>
                <div className="flex gap-2">
                  <span className="text-xs bg-gal-accent-light px-2 py-1 rounded-gal-md text-gal-accent">Purple</span>
                  <span className="text-xs bg-gal-light px-2 py-1 rounded-gal-md text-gal-body">Navy</span>
                  <span className="text-xs bg-gal-light px-2 py-1 rounded-gal-md text-gal-muted">Silver</span>
                </div>
              </div>
              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70">
                <div className="h-12 w-12 rounded-full border border-gal-accent/30 flex items-center justify-center mb-3 shadow-gal-soft">
                  <span className="text-xl">🔒</span>
                </div>
                <p className="text-gal-body text-sm font-medium mb-1">{t('sub.locked')}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    if (!session) { onLoginRequired(); return; }
                    subscribe();
                  }}
                >
                  {t('sub.unlockStyle')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* 천기 원천 토글 */}
      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={toggleShowData}>
          {showData ? `${t('data.source')} ▲` : `${t('data.source')} ▼`}
        </Button>
      </div>

      {showData && (
        <div className="px-4 animate-fade-in">
          <Suspense fallback={
            <Card className="max-w-md mx-auto text-center text-gal-muted">
              {t('omenTab.gatheringEnergy')}
            </Card>
          }>
            <DataPanel
              weather={weather}
              moon={moon}
              earthquake={earthquake}
              nasa={null}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
