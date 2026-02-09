import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateSaju, FIVE_ELEMENTS } from '../../utils/saju';
import { interpretSaju, getTodayFortune } from '../../utils/sajuInterpret';
import { useAuth } from '../../contexts/AuthContext';

const ELEMENT_COLORS = {
  목: 'text-emerald-600',
  화: 'text-red-600',
  토: 'text-amber-600',
  금: 'text-gray-600',
  수: 'text-blue-600',
};

const SAJU_INPUT_KEY = 'mystic_saju_input';

const ELEMENT_BG = {
  목: 'bg-emerald-50 border-emerald-200',
  화: 'bg-red-50 border-red-200',
  토: 'bg-amber-50 border-amber-200',
  금: 'bg-gray-100 border-gray-200',
  수: 'bg-blue-50 border-blue-200',
};

export default function SajuTab() {
  const { t } = useTranslation('saju');
  const { t: tc } = useTranslation();
  const { session, loading: authLoading } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [birthHour, setBirthHour] = useState('12');
  const [result, setResult] = useState(null);
  const [ready, setReady] = useState(false);
  const autoSubmitted = useRef(false);

  // 우선순위: 1) localStorage(사주 전용) → 2) DB 프로필 → 3) 운세탭 연도 → 4) 사용자 입력
  useEffect(() => {
    if (authLoading) return;

    try {
      const saved = localStorage.getItem(SAJU_INPUT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.birthDate) {
          setBirthDate(parsed.birthDate);
          if (parsed.birthHour != null) setBirthHour(String(parsed.birthHour));
          setReady(true);
          return;
        }
      }
    } catch { /* ignore */ }

    // DB 프로필에서 생년월일 가져오기
    if (session?.access_token) {
      fetch('/api/profile', { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(r => r.json())
        .then(d => {
          if (d.profile?.birth_date) {
            setBirthDate(d.profile.birth_date);
            if (d.profile?.birth_hour != null) setBirthHour(String(d.profile.birth_hour));
            localStorage.setItem(SAJU_INPUT_KEY, JSON.stringify({
              birthDate: d.profile.birth_date,
              birthHour: d.profile.birth_hour ?? 12,
            }));
            return;
          }
          // DB에 없으면 운세탭 연도로 프리필 (자동 제출 안 함)
          const fortuneYear = localStorage.getItem('mystic_birth_year');
          if (fortuneYear) {
            setBirthDate(`${fortuneYear}-01-01`);
            autoSubmitted.current = true;
          }
        })
        .catch(() => {})
        .finally(() => setReady(true));
      return;
    }

    // 비로그인: 운세탭 연도로 프리필
    const fortuneYear = localStorage.getItem('mystic_birth_year');
    if (fortuneYear) {
      setBirthDate(`${fortuneYear}-01-01`);
      autoSubmitted.current = true;
    }
    setReady(true);
  }, [authLoading, session?.access_token]);

  const hourOptions = useMemo(() =>
    [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(value => ({
      value,
      label: t(`hour.${value}`),
    })),
  [t]);

  const saveBirthToProfile = useCallback((date: string, hour: number) => {
    if (!session?.access_token) return;
    fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ birth_date: date, birth_hour: hour }),
    }).catch(() => {});
  }, [session?.access_token]);

  // 데이터 준비되면 자동 제출
  useEffect(() => {
    if (ready && birthDate && !autoSubmitted.current) {
      autoSubmitted.current = true;
      const date = new Date(birthDate);
      if (date > new Date()) return;
      const hour = parseInt(birthHour, 10);
      setResult(interpretSaju(calculateSaju(date, hour)));
      saveBirthToProfile(birthDate, hour);
    }
  }, [ready, birthDate, birthHour]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!birthDate) return;

    const date = new Date(birthDate);
    if (date > new Date()) return;
    const hour = parseInt(birthHour, 10);

    setResult(interpretSaju(calculateSaju(date, hour)));
    localStorage.setItem(SAJU_INPUT_KEY, JSON.stringify({ birthDate, birthHour: hour }));
    saveBirthToProfile(birthDate, hour);
  }, [birthDate, birthHour, saveBirthToProfile]);

  const handleReset = useCallback(() => {
    setResult(null);
    setBirthDate('');
    setBirthHour('12');
    localStorage.removeItem(SAJU_INPUT_KEY);
    autoSubmitted.current = false;
  }, []);

  if (!result) {
    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-gal-xl">
          <div
            className="flex min-h-[40vh] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-end pb-12 px-6 text-center"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(255,255,255,0.95) 10%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 100%), url("https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=800&q=80")`,
            }}
          >
            <div className="flex flex-col gap-3 max-w-2xl">
              <h1 className="text-gal-black text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
                {tc('saju.heroTitle1')} <br />
                <span className="text-gal-accent italic font-light">{tc('saju.heroTitle2')}</span>
              </h1>
              <p className="text-gal-body text-sm font-light leading-relaxed max-w-xs mx-auto">
                {tc('saju.heroDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Input Form */}
        <section className="px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-gal-black text-xl font-bold tracking-tight pb-1">{tc('saju.birthInfo')}</h3>
              <div className="h-1 w-12 bg-gal-accent mx-auto rounded-full"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-gal-xl border border-gal-border p-6 space-y-6 shadow-gal-card">
                <label className="block">
                  <p className="text-gal-body text-xs font-bold uppercase tracking-widest pl-1 mb-2">{tc('saju.birthDate')}</p>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-gal-lg text-gal-black focus:outline-none focus:ring-1 focus:ring-gal-accent border border-gal-border bg-gal-bg h-14 placeholder:text-gal-muted px-4 text-lg font-medium transition-all focus:bg-white"
                    required
                  />
                </label>

                <label className="block">
                  <p className="text-gal-body text-xs font-bold uppercase tracking-widest pl-1 mb-2">{tc('saju.birthHour')}</p>
                  <select
                    value={birthHour}
                    onChange={(e) => setBirthHour(e.target.value)}
                    className="w-full rounded-gal-lg text-gal-black focus:outline-none focus:ring-1 focus:ring-gal-accent border border-gal-border bg-gal-bg h-14 px-4 text-base font-medium transition-all focus:bg-white appearance-none cursor-pointer"
                  >
                    {hourOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center rounded-gal-xl h-14 px-8 bg-gal-accent text-white text-base font-bold tracking-widest uppercase transition-all shadow-gal-button border border-gal-accent hover:bg-gal-accent-dark hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent focus-visible:ring-offset-2"
              >
                {tc('saju.revealDestiny')}
              </button>
            </form>
          </div>
        </section>
      </div>
    );
  }

  const { mainMessage, dayMaster, elementAnalysis, elementMessage, zodiac, zodiacMessage, pillars, saju } = result;
  const todayFortune = getTodayFortune(saju);

  const FORTUNE_STYLES: Record<string, { className: string; label: string }> = {
    '대길': { className: 'bg-amber-50 text-amber-600 border border-amber-200', label: t('fortune.great') },
    '길': { className: 'bg-green-50 text-green-600 border border-green-200', label: t('fortune.good') },
    '평': { className: 'bg-gray-100 text-gray-600 border border-gray-200', label: t('fortune.neutral') },
    '소흉': { className: 'bg-orange-50 text-orange-600 border border-orange-200', label: t('fortune.minor') },
    '흉': { className: 'bg-red-50 text-red-600 border border-red-200', label: t('fortune.poor') },
  };
  const fortuneStyle = FORTUNE_STYLES[todayFortune.level] ?? FORTUNE_STYLES['흉'];

  return (
    <div className="space-y-8 pb-8">
      {/* Header Card */}
      <section className="px-4 pt-4">
        <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-gal-accent text-[10px] font-bold uppercase tracking-[0.3em]">{tc('saju.fourPillars')}</span>
              <h3 className="text-gal-black text-xl font-bold tracking-tight">{t('title')}</h3>
            </div>
            <div className="h-12 w-12 rounded-full border border-gal-accent/30 flex items-center justify-center shadow-gal-soft">
              <span className="text-xl">✨</span>
            </div>
          </div>

          <p className="text-gal-body text-lg italic leading-relaxed text-center mb-6">
            "{mainMessage}"
          </p>

          {/* 일간 정보 */}
          <div className="bg-gal-bg rounded-gal-lg p-4 border border-gal-border">
            <p className="text-gal-accent text-xs uppercase tracking-widest mb-2">{t('dayMaster')}</p>
            <p className="text-gal-black text-2xl font-bold">{dayMaster.name}</p>
            <p className="text-gal-muted text-sm mt-1">
              {tc('saju.dayMasterEnergy', { nature: dayMaster.nature, trait: dayMaster.trait })}
            </p>
          </div>
        </div>
      </section>

      {/* 띠 정보 */}
      <section className="px-4">
        <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{{ '쥐': '🐀', '소': '🐂', '호랑이': '🐅', '토끼': '🐇', '용': '🐉', '뱀': '🐍', '말': '🐎', '양': '🐏', '원숭이': '🐒', '닭': '🐓', '개': '🐕', '돼지': '🐖' }[zodiac] || '🐉'}</span>
            <div>
              <p className="text-gal-accent text-xs uppercase tracking-widest">{t('zodiac')}</p>
              <p className="text-gal-black font-bold text-lg">{tc('saju.zodiacSuffix', { zodiac })}</p>
            </div>
          </div>
          <p className="text-gal-body text-sm leading-relaxed">
            {zodiacMessage}
          </p>
        </div>
      </section>

      {/* 사주팔자 표 */}
      <section className="px-4">
        <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card">
          <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent mb-4">{t('chart')}</h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            {pillars.map((p, i) => (
              <div key={i} className="bg-gal-bg rounded-gal-lg p-3 border border-gal-border">
                <div className="text-gal-muted text-[10px] uppercase tracking-widest mb-2">{p.name}</div>
                <div className={`text-2xl font-bold mb-1 ${ELEMENT_COLORS[FIVE_ELEMENTS[p.pillar.stem]]}`}>
                  {p.pillar.stem}
                </div>
                <div className="text-gal-black text-lg mb-1">
                  {p.pillar.branch}
                </div>
                <div className="text-gal-muted text-[10px]">{p.meaning}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 오행 분석 */}
      <section className="px-4">
        <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-border p-6 shadow-gal-card">
          <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent mb-4">{t('fiveElements')}</h4>
          <div className="flex justify-center gap-2 mb-4">
            {Object.entries(elementAnalysis.distribution).map(([element, count]) => (
              <div
                key={element}
                className={`${ELEMENT_BG[element]} px-4 py-3 rounded-gal-lg text-center border`}
              >
                <div className={`text-lg font-bold ${ELEMENT_COLORS[element]}`}>
                  {element}
                </div>
                <div className="text-gal-muted text-sm">{count}</div>
              </div>
            ))}
          </div>
          <p className="text-gal-body text-sm text-center leading-relaxed">
            {elementMessage}
          </p>
        </div>
      </section>

      {/* 오늘의 운세 */}
      <section className="px-4">
        <div className="max-w-md mx-auto bg-white rounded-gal-xl border border-gal-accent/20 p-6 shadow-gal-card">
          <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent mb-4">{t('todayFortune')}</h4>
          <div className="text-center">
            <span className={`inline-block px-4 py-2 rounded-gal-xl text-sm font-bold mb-4 ${fortuneStyle.className}`}>
              {fortuneStyle.label}
            </span>
            <p className="text-gal-body text-sm leading-relaxed">
              {todayFortune.message}
            </p>
          </div>
        </div>
      </section>

      {/* Reset Button */}
      <div className="px-4 pt-4">
        <button
          onClick={handleReset}
          className="w-full max-w-md mx-auto flex items-center justify-center bg-gal-black text-white h-12 rounded-gal-lg font-bold text-sm uppercase tracking-widest hover:bg-gal-accent hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gal-accent focus-visible:ring-offset-2"
        >
          {tc('saju.newReading')}
        </button>
      </div>
    </div>
  );
}
