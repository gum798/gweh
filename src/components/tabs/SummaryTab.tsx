import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getEnergyLabel } from '../../utils/omenGenerator';

interface FortuneResult {
  level: string;
  overall: string;
  love: string;
  career: string;
  wealth: string;
  health: string;
  advice: string;
  luckyColor: string;
  luckyNumber: number;
  luckyDirection: string;
}

interface SummaryTabProps {
  onLoginRequired: () => void;
}

export default function SummaryTab({ onLoginRequired }: SummaryTabProps) {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const { isSubscribed, subscribe } = useSubscription();

  const [fortune, setFortune] = useState<FortuneResult | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [dailyReading, setDailyReading] = useState<any>(null);
  const [energyLabel, setEnergyLabel] = useState<{ label: string; color: string } | null>(null);
  const [dailyStyle, setDailyStyle] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // daily-reading에서 스타일 + 괘 데이터 가져오기 (구독자)
  useEffect(() => {
    if (!isSubscribed || !session?.access_token) return;

    const fetchDailyReading = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/daily-reading', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const { reading } = await res.json();
          if (reading) {
            setDailyReading(reading);
            if (reading.style_data) setDailyStyle(reading.style_data);
            if (reading.energy_score != null) {
              setEnergyLabel(getEnergyLabel(reading.energy_score));
            }
          }
        }
      } catch {}
      setLoading(false);
    };

    fetchDailyReading();
  }, [isSubscribed, session?.access_token]);

  // 프로필에서 생년 가져와서 운세 API 직접 호출
  useEffect(() => {
    if (!session?.access_token) return;

    const fetchFortune = async () => {
      setFortuneLoading(true);
      try {
        // 프로필에서 생년 가져오기
        const profileRes = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const profileData = await profileRes.json();
        const birthDate = profileData.profile?.birth_date;
        if (!birthDate) { setFortuneLoading(false); return; }

        const year = birthDate.split('-')[0];

        // 운세 API 호출
        const fortuneRes = await fetch('/api/fortune', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ birth_date: year }),
        });
        const fortuneData = await fortuneRes.json();
        if (fortuneData.success) {
          setFortune(fortuneData.fortune);
        }
      } catch {}
      setFortuneLoading(false);
    };

    fetchFortune();
  }, [session?.access_token]);

  const today = new Date();
  const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';
  const dateStr = today.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const hasAnyData = fortune || dailyReading || dailyStyle;
  const isLoading = loading || fortuneLoading;

  const getLevelStyle = (level: string) => {
    const l = level.toLowerCase();
    if (level === '대길' || l === 'excellent') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (level === '길' || l === 'good') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (level === '평' || l === 'neutral') return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    if (level === '소흉' || l === 'caution') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  // 비구독자: blurred preview + lock
  if (!isSubscribed) {
    return (
      <div className="space-y-6 pb-8">
        <div className="text-center pt-4">
          <p className="text-white/40 text-sm">{dateStr}</p>
        </div>

        <section className="px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-white text-xl font-bold tracking-tight pb-1">{t('summary.title')}</h3>
              <div className="h-1 w-12 bg-[#5b13ec] mx-auto rounded-full" />
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <div className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl p-5 blur-sm select-none pointer-events-none space-y-4">
                <div className="text-center">
                  <span className="text-4xl" aria-hidden="true">📊</span>
                  <p className="text-white font-bold mt-2">{t('summary.title')}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">{i18n.language === 'ko' ? '오늘의 에너지가 길(吉)로 흐르고 있습니다. 금(金) 기운이 안정적이며, 보름달의 양(陽) 기운이 충만합니다.' : 'Today\'s energy flows with good fortune. Metal energy is stable, and the full moon\'s yang energy is abundant.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <span className="text-green-400 font-bold">길</span>
                    <p className="text-white/40 text-xs">운세</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <span className="text-yellow-400 font-bold">대길</span>
                    <p className="text-white/40 text-xs">사주</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <div className="h-12 w-12 rounded-full border border-[#5b13ec]/50 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(91,19,236,0.3)]">
                  <span className="text-xl">🔒</span>
                </div>
                <p className="text-white/70 text-sm font-medium mb-1">{t('sub.locked')}</p>
                <button
                  onClick={() => {
                    if (!session) { onLoginRequired(); return; }
                    subscribe();
                  }}
                  className="mt-2 px-6 py-2 bg-[#5b13ec] hover:bg-[#4a0fd0] rounded-full text-white text-xs font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(91,19,236,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                >
                  {t('summary.unlock')}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // 구독자: 데이터 없으면 안내 (로딩 중이면 대기)
  if (!hasAnyData && !isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="text-center pt-4">
          <p className="text-white/40 text-sm">{dateStr}</p>
        </div>
        <section className="px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <span className="text-5xl mb-4 block" aria-hidden="true">📊</span>
              <h3 className="text-white text-lg font-bold mb-2">{t('summary.title')}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{t('summary.noData')}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // 구독자: 종합 분석 — 순서: 스타일 → 괘 → 운세
  return (
    <div className="space-y-6 pb-8">
      <div className="text-center pt-4">
        <p className="text-white/40 text-sm">{dateStr}</p>
      </div>

      {/* 헤더 */}
      <section className="px-4">
        <div className="max-w-md mx-auto text-center">
          <span className="text-[#5b13ec] text-[10px] font-bold uppercase tracking-[0.3em]">{t('sub.badge')}</span>
          <h3 className="text-white text-xl font-bold tracking-tight pb-1">{t('summary.title')}</h3>
          <div className="h-1 w-12 bg-[#5b13ec] mx-auto rounded-full" />
        </div>
      </section>

      {/* 1. 스타일 추천 */}
      {(dailyStyle || loading) && (
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-[#5b13ec]/30 p-6 shadow-[0_0_15px_rgba(91,19,236,0.2)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">👔</span>
              <h4 className="text-[#5b13ec] text-xs font-bold uppercase tracking-widest">{t('sub.dailyStyleTitle')}</h4>
            </div>
            {loading && !dailyStyle ? (
              <div className="text-center py-4">
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-white/40 text-sm">{t('sub.loadingStyle')}</p>
              </div>
            ) : dailyStyle ? (
              <div className="space-y-3">
                <p className="text-white/80 text-sm italic">"{dailyStyle.headline}"</p>
                <p className="text-white/60 text-xs leading-relaxed">{dailyStyle.style}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-white/40 text-xs">{t('sub.styleColors')}:</span>
                  {dailyStyle.colors?.map((color: string, i: number) => (
                    <span key={i} className="text-[#5b13ec] text-xs bg-[#5b13ec]/10 px-2 py-0.5 rounded-full">
                      {color}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  <div>
                    <span className="text-white/40 text-xs block mb-1">{t('sub.styleItem')}</span>
                    <span className="text-white text-sm">{dailyStyle.item}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-xs block mb-1">{t('sub.styleTip')}</span>
                    <span className="text-white text-sm">{dailyStyle.tip}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* 2. 에너지 + 괘 */}
      {(energyLabel || dailyReading?.omen_message) && (
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-[#5b13ec]/30 p-6 shadow-[0_0_15px_rgba(91,19,236,0.2)]">
            <h4 className="text-[#5b13ec] text-xs font-bold uppercase tracking-widest mb-4">{t('summary.todayEnergy')}</h4>
            {energyLabel && (
              <div className="text-center">
                <span className={`text-3xl font-bold ${energyLabel.color}`}>{energyLabel.label}</span>
              </div>
            )}
            {dailyReading?.omen_message && (
              <p className="text-white/60 text-sm leading-relaxed mt-4 text-center italic">
                "{dailyReading.omen_message}"
              </p>
            )}
          </div>
        </section>
      )}

      {/* 3. 운세 요약 */}
      {fortune && (
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h4 className="text-[#5b13ec] text-xs font-bold uppercase tracking-widest mb-4">{t('summary.fortuneSummary')}</h4>
            <div className="text-center mb-4">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getLevelStyle(fortune.level)}`}>
                {fortune.level}
              </span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed text-center italic mb-4">
              "{fortune.overall}"
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '💕', label: t('fortune.love'), text: fortune.love },
                { icon: '💼', label: t('fortune.career'), text: fortune.career },
                { icon: '💰', label: t('fortune.wealth'), text: fortune.wealth },
                { icon: '🏥', label: t('fortune.health'), text: fortune.health },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-white text-xs font-bold">{item.label}</span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed line-clamp-3">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3-1. 조언 + 행운 정보 */}
      {fortune && (
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-[#5b13ec]/30 p-6">
            <h4 className="text-[#5b13ec] text-xs font-bold uppercase tracking-widest mb-4">{t('fortune.advice')}</h4>
            <p className="text-white/80 text-sm leading-relaxed mb-5">"{fortune.advice}"</p>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyColor')}</span>
                <span className="text-white text-sm font-medium">{fortune.luckyColor}</span>
              </div>
              <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyNumber')}</span>
                <span className="text-white text-sm font-medium">{fortune.luckyNumber}</span>
              </div>
              <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyDirection')}</span>
                <span className="text-white text-sm font-medium">{fortune.luckyDirection}</span>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
