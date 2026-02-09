import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeather } from '../../hooks/useWeather';
import { useParallelData } from '../../hooks/useParallelData';
import { useMoonPhase } from '../../hooks/useMoonPhase';
import { generateOmen, getOverallEnergy, getEnergyLabel } from '../../utils/omenGenerator';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

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
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-gal-xl">
          <div
            className="flex min-h-[45vh] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-end pb-12 px-6 text-center"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(255,255,255,0.95) 10%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 100%), url("https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&q=80")`,
            }}
          >
            <div className="flex flex-col gap-3 max-w-2xl">
              <h1 className="text-gal-black text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
                {t('omenTab.heroTitle1')} <br />
                <span className="text-gal-accent italic font-light">{t('omenTab.heroTitle2')}</span>
              </h1>
              <p className="text-gal-accent text-base font-medium mb-1">
                {t('omenTab.heroSubtitle')}
              </p>
              <p className="text-gal-body text-sm font-light leading-relaxed max-w-xs mx-auto">
                {t('omenTab.heroDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Location Request */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card">
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

            {locationError && (
              <div className="bg-red-50 rounded-gal-lg border border-red-200 p-4 mb-6 text-center text-red-600 text-sm">
                {locationError}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={requestLocation}
                className="w-full flex items-center justify-center rounded-gal-xl h-14 px-8 bg-gal-accent text-white text-base font-bold tracking-widest uppercase transition-all shadow-gal-button border border-gal-accent hover:bg-gal-accent-dark hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent focus-visible:ring-offset-2"
              >
                {t('location.startButton')}
              </button>

            </div>
          </div>
        </section>
      </div>
    );
  }

  // 로딩 화면
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border border-gal-accent/30 animate-ping"></div>
          <div className="h-24 w-24 rounded-full border border-gal-accent/50 flex items-center justify-center shadow-gal-soft">
            <span className="text-4xl animate-pulse">🔮</span>
          </div>
        </div>
        <h3 className="text-gal-black text-xl font-bold mt-8 mb-2">{t('omenTab.readingSigns')}</h3>
        <p className="text-gal-muted text-sm text-center max-w-xs">
          {t('omenTab.sensing')}
        </p>
        <div className="mt-6 flex gap-1">
          <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
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
        <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-red-200 p-8 text-center shadow-gal-card">
          <div className="h-16 w-16 rounded-full border border-red-300 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-gal-black text-xl font-bold mb-2">{t('omenTab.cannotRead')}</h2>
          <div className="text-gal-muted text-sm mb-6 space-y-1">
            {errorMessages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gal-accent text-white rounded-gal-xl font-bold uppercase tracking-widest text-sm hover:bg-gal-accent-dark hover:scale-105 transition-all shadow-gal-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent focus-visible:ring-offset-2"
          >
            {t('omenTab.readAgain')}
          </button>
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
          <button
            onClick={requestLocation}
            className="text-gal-accent/60 hover:text-gal-accent text-xs transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent rounded-gal-md"
            aria-label={t('location.startButton')}
          >
            <span aria-hidden="true">📍</span>
          </button>
        </div>
      )}

      {/* 메인 괘 카드 */}
      <section className="px-4">
        <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card">
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
              <span className={`text-sm font-medium ${energyInfo.label === '대길' ? 'text-amber-500' :
                energyInfo.label === '길' ? 'text-green-500' :
                  energyInfo.label === '평' ? 'text-gal-body' :
                    energyInfo.label === '소흉' ? 'text-orange-500' :
                      'text-red-500'
                }`}>
                {energyInfo.label}
              </span>
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
        </div>
      </section>

      {/* 세부 괘 */}
      <section className="px-4">
        <div className="max-w-md mx-auto space-y-6">
          <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent px-1">{t('omenTab.detailedOmens')}</h4>
          {omen?.details?.map((detail, index) => (
            <div
              key={index}
              className="bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{detail.icon}</span>
                <span className="text-gal-black font-bold">{detail.category}</span>
              </div>
              <p className="text-gal-body text-sm leading-relaxed">
                {detail.message}
              </p>
            </div>
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
              <div className="bg-white rounded-gal-xl border border-gal-accent/20 p-6 text-center shadow-gal-card">
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-gal-muted text-sm">{t('omenTab.loadingPersonal')}</p>
              </div>
            ) : personalError ? (
              <div className="bg-white rounded-gal-xl border border-red-200 p-6 text-center shadow-gal-card">
                <p className="text-red-500 text-sm">{personalError}</p>
              </div>
            ) : personalOmen ? (
              <div className="bg-white rounded-gal-xl border border-gal-accent/20 p-5 space-y-4 shadow-gal-card">
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
                    <span className="text-orange-500 text-sm">{personalOmen.caution}</span>
                  </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* Daily Style - Premium */}
      <section className="px-4">
        <div className="max-w-md mx-auto">
          {isSubscribed ? (
            // Subscriber: show daily style
            <div className="bg-white rounded-gal-xl border border-gal-accent/20 p-5 shadow-gal-card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">👔</span>
                <h4 className="text-gal-black font-bold text-sm">{t('sub.dailyStyleTitle')}</h4>
                <span className="ml-auto text-[10px] text-gal-accent bg-gal-accent-light px-2 py-0.5 rounded-gal-md font-bold uppercase tracking-wider">
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
            </div>
          ) : (
            // Non-subscriber: locked preview with blur
            <div className="relative overflow-hidden rounded-gal-xl border border-gal-border">
              {/* Blurred fake content */}
              <div className="bg-white p-5 blur-sm select-none pointer-events-none">
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
                <button
                  onClick={() => {
                    if (!session) { onLoginRequired(); return; }
                    subscribe();
                  }}
                  className="mt-2 px-6 py-2 bg-gal-accent hover:bg-gal-accent-dark rounded-gal-xl text-white text-xs font-bold tracking-wide transition-all shadow-gal-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent focus-visible:ring-offset-2"
                >
                  {t('sub.unlockStyle')}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 천기 원천 토글 */}
      <div className="text-center">
        <button
          onClick={toggleShowData}
          className="px-6 py-2 text-gal-accent text-sm hover:text-gal-accent-dark transition-colors"
        >
          {showData ? `${t('data.source')} ▲` : `${t('data.source')} ▼`}
        </button>
      </div>

      {showData && (
        <div className="px-4 animate-fade-in">
          <Suspense fallback={
            <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-6 text-center text-gal-muted shadow-gal-card">
              {t('omenTab.gatheringEnergy')}
            </div>
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
