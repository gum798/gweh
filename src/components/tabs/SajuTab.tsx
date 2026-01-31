import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateSaju, FIVE_ELEMENTS } from '../../utils/saju';
import { interpretSaju, getTodayFortune } from '../../utils/sajuInterpret';
import { useAuth } from '../../contexts/AuthContext';

const ELEMENT_COLORS = {
  목: 'text-green-400',
  화: 'text-red-400',
  토: 'text-yellow-500',
  금: 'text-gray-300',
  수: 'text-blue-400',
};

const SAJU_INPUT_KEY = 'mystic_saju_input';

const ELEMENT_BG = {
  목: 'bg-green-400/20 border-green-400/30',
  화: 'bg-red-400/20 border-red-400/30',
  토: 'bg-yellow-500/20 border-yellow-500/30',
  금: 'bg-gray-300/20 border-gray-300/30',
  수: 'bg-blue-400/20 border-blue-400/30',
};

export default function SajuTab() {
  const { t } = useTranslation('saju');
  const { t: tc } = useTranslation();
  const { session } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [birthHour, setBirthHour] = useState('12');
  const [result, setResult] = useState(null);
  const [ready, setReady] = useState(false);
  const autoSubmitted = useRef(false);

  // 우선순위: 1) localStorage → 2) DB 프로필 → 3) 사용자 입력
  useEffect(() => {
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

    // 운세탭에서 저장한 생년이 있으면 날짜만 프리필 (자동 제출 안 함)
    const fortuneYear = localStorage.getItem('mystic_birth_year');
    if (fortuneYear) {
      setBirthDate(`${fortuneYear}-01-01`);
      autoSubmitted.current = true; // 자동 제출 방지
      setReady(true);
      return;
    }

    if (!session?.access_token) {
      setReady(true);
      return;
    }

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
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [session?.access_token]);

  const hourOptions = useMemo(() => {
    const options = [];
    const hourValues = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    for (let i = 0; i < hourValues.length; i++) {
      options.push({ value: hourValues[i], label: t(`hour.${hourValues[i]}`) });
    }
    return options;
  }, [t]);

  // 데이터 준비되면 자동 제출
  useEffect(() => {
    if (ready && birthDate && !autoSubmitted.current) {
      autoSubmitted.current = true;
      const date = new Date(birthDate);
      if (date > new Date()) return;
      const hour = parseInt(birthHour, 10);
      const saju = calculateSaju(date, hour);
      const interpretation = interpretSaju(saju);
      setResult(interpretation);

      if (session?.access_token) {
        fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ birth_date: birthDate, birth_hour: hour }),
        }).catch(() => {});
      }
    }
  }, [ready, birthDate, birthHour]);

  // rerender-functional-setstate: Wrap handlers in useCallback for stable references
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!birthDate) return;

    const date = new Date(birthDate);
    if (date > new Date()) return;
    const hour = parseInt(birthHour, 10);
    const saju = calculateSaju(date, hour);
    const interpretation = interpretSaju(saju);

    setResult(interpretation);
    localStorage.setItem(SAJU_INPUT_KEY, JSON.stringify({ birthDate, birthHour: hour }));

    // Save birth data to profile
    if (session?.access_token) {
      fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ birth_date: birthDate, birth_hour: hour }),
      }).catch(() => {});
    }
  }, [birthDate, birthHour, session?.access_token]);

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
        <section className="relative overflow-hidden rounded-2xl">
          <div
            className="flex min-h-[40vh] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-end pb-12 px-6 text-center"
            style={{
              backgroundImage: `linear-gradient(to top, #161022 10%, rgba(22, 16, 34, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url("https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=800&q=80")`,
            }}
          >
            <div className="flex flex-col gap-3 max-w-2xl">
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
                {tc('saju.heroTitle1')} <br />
                <span className="text-[#5b13ec] italic font-light">{tc('saju.heroTitle2')}</span>
              </h1>
              <p className="text-white/70 text-sm font-light leading-relaxed max-w-xs mx-auto">
                {tc('saju.heroDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Input Form */}
        <section className="px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-white text-xl font-bold tracking-tight pb-1">{tc('saju.birthInfo')}</h3>
              <div className="h-1 w-12 bg-[#5b13ec] mx-auto rounded-full"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
                <label className="block">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1 mb-2">{tc('saju.birthDate')}</p>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#5b13ec] border border-white/10 bg-white/5 h-14 placeholder:text-white/20 px-4 text-lg font-medium transition-all focus:bg-white/10"
                    required
                  />
                </label>

                <label className="block">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1 mb-2">{tc('saju.birthHour')}</p>
                  <select
                    value={birthHour}
                    onChange={(e) => setBirthHour(e.target.value)}
                    className="w-full rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#5b13ec] border border-white/10 bg-white/5 h-14 px-4 text-base font-medium transition-all focus:bg-white/10 appearance-none cursor-pointer"
                  >
                    {hourOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#161022]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center rounded-full h-14 px-8 bg-[#5b13ec] text-white text-base font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(91,19,236,0.3)] border border-[#5b13ec]/50 hover:scale-105 active:scale-95"
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

  return (
    <div className="space-y-8 pb-8">
      {/* Header Card */}
      <section className="px-4 pt-4">
        <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[#5b13ec] text-[10px] font-bold uppercase tracking-[0.3em]">{tc('saju.fourPillars')}</span>
              <h3 className="text-white text-xl font-bold tracking-tight">{t('title')}</h3>
            </div>
            <div className="h-12 w-12 rounded-full border border-[#5b13ec]/50 flex items-center justify-center shadow-[0_0_15px_rgba(91,19,236,0.3)]">
              <span className="text-xl">✨</span>
            </div>
          </div>

          <p className="text-white/70 text-lg italic leading-relaxed text-center mb-6">
            "{mainMessage}"
          </p>

          {/* 일간 정보 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-[#5b13ec] text-xs uppercase tracking-widest mb-2">{t('dayMaster')}</p>
            <p className="text-white text-2xl font-bold">{dayMaster.name}</p>
            <p className="text-white/50 text-sm mt-1">
              {tc('saju.dayMasterEnergy', { nature: dayMaster.nature, trait: dayMaster.trait })}
            </p>
          </div>
        </div>
      </section>

      {/* 띠 정보 */}
      <section className="px-4">
        <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🐉</span>
            <div>
              <p className="text-[#5b13ec] text-xs uppercase tracking-widest">{t('zodiac')}</p>
              <p className="text-white font-bold text-lg">{tc('saju.zodiacSuffix', { zodiac })}</p>
            </div>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            {zodiacMessage}
          </p>
        </div>
      </section>

      {/* 사주팔자 표 */}
      <section className="px-4">
        <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] mb-4">{t('chart')}</h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            {pillars.map((p, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-2">{p.name}</div>
                <div className={`text-2xl font-bold mb-1 ${ELEMENT_COLORS[FIVE_ELEMENTS[p.pillar.stem]]}`}>
                  {p.pillar.stem}
                </div>
                <div className="text-white text-lg mb-1">
                  {p.pillar.branch}
                </div>
                <div className="text-white/30 text-[10px]">{p.meaning}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 오행 분석 */}
      <section className="px-4">
        <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] mb-4">{t('fiveElements')}</h4>
          <div className="flex justify-center gap-2 mb-4">
            {Object.entries(elementAnalysis.distribution).map(([element, count]) => (
              <div
                key={element}
                className={`${ELEMENT_BG[element]} px-4 py-3 rounded-xl text-center border`}
              >
                <div className={`text-lg font-bold ${ELEMENT_COLORS[element]}`}>
                  {element}
                </div>
                <div className="text-white/50 text-sm">{count}</div>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-sm text-center leading-relaxed">
            {elementMessage}
          </p>
        </div>
      </section>

      {/* 오늘의 운세 */}
      <section className="px-4">
        <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-[#5b13ec]/30 p-6 shadow-[0_0_15px_rgba(91,19,236,0.2)]">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs text-[#5b13ec] mb-4">{t('todayFortune')}</h4>
          <div className="text-center">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${
              todayFortune.level === '대길' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              todayFortune.level === '길' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              todayFortune.level === '평' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
              todayFortune.level === '소흉' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
              'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {todayFortune.level === '대길' ? t('fortune.great') :
               todayFortune.level === '길' ? t('fortune.good') :
               todayFortune.level === '평' ? t('fortune.neutral') :
               todayFortune.level === '소흉' ? t('fortune.minor') :
               t('fortune.poor')}
            </span>
            <p className="text-white/60 text-sm leading-relaxed">
              {todayFortune.message}
            </p>
          </div>
        </div>
      </section>

      {/* Reset Button */}
      <div className="px-4 pt-4">
        <button
          onClick={handleReset}
          className="w-full max-w-md mx-auto flex items-center justify-center bg-white text-black h-12 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#5b13ec] hover:text-white transition-colors"
        >
          {tc('saju.newReading')}
        </button>
      </div>
    </div>
  );
}
