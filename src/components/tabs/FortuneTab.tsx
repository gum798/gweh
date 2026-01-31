import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

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

export default function FortuneTab() {
  const { t } = useTranslation();
  const { t: ts } = useTranslation('saju');
  const { session } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [birthHour, setBirthHour] = useState('12');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // 로그인 사용자: 이전 정보 불러오기
  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/profile', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.profile?.birth_date) {
          setBirthDate(d.profile.birth_date);
          setProfileLoaded(true);
        }
        if (d.profile?.birth_hour != null) {
          setBirthHour(String(d.profile.birth_hour));
        }
      })
      .catch(() => {});
  }, [session?.access_token]);

  const hourOptions = useMemo(() => {
    const hourValues = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    return hourValues.map(v => ({ value: v, label: ts(`hour.${v}`) }));
  }, [ts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) return;
    const date = new Date(birthDate);
    if (date > new Date()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birth_date: birthDate, birth_hour: parseInt(birthHour, 10) }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.fortune);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    // Save birth data
    if (session?.access_token) {
      fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ birth_date: birthDate, birth_hour: parseInt(birthHour, 10) }),
      }).catch(() => {});
    }
  };

  const getLevelStyle = (level: string) => {
    if (level === '대길') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (level === '길') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (level === '평') return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    if (level === '소흉') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border border-[#5b13ec]/30 shadow-[0_0_30px_rgba(91,19,236,0.5)] animate-ping" />
          <div className="h-24 w-24 rounded-full border border-[#5b13ec]/50 flex items-center justify-center shadow-[0_0_15px_rgba(91,19,236,0.3)]">
            <span className="text-4xl animate-pulse">🔮</span>
          </div>
        </div>
        <h3 className="text-white text-xl font-bold mt-8 mb-2">{t('fortune.analyzing')}</h3>
        <div className="mt-4 flex gap-1">
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[#5b13ec] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // 결과 화면
  if (result) {
    return (
      <div className="space-y-6 pb-8">
        {/* 헤더 */}
        <section className="px-4 pt-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-[#5b13ec]/30 p-6 shadow-[0_0_15px_rgba(91,19,236,0.2)]">
            <div className="text-center mb-4">
              <span className="text-4xl mb-3 block">🔮</span>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getLevelStyle(result.level)}`}>
                {result.level}
              </span>
            </div>
            <p className="text-white/70 text-base leading-relaxed text-center italic">
              "{result.overall}"
            </p>
          </div>
        </section>

        {/* 세부 운세 */}
        <section className="px-4">
          <div className="max-w-md mx-auto space-y-3">
            {[
              { icon: '💕', label: t('fortune.love'), text: result.love },
              { icon: '💼', label: t('fortune.career'), text: result.career },
              { icon: '💰', label: t('fortune.wealth'), text: result.wealth },
              { icon: '🏥', label: t('fortune.health'), text: result.health },
            ].map((item) => (
              <div key={item.label} className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-white font-bold text-sm">{item.label}</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 조언 + 행운 */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-[#5b13ec]/30 p-6">
            <h4 className="text-[#5b13ec] text-xs font-bold uppercase tracking-widest mb-4">{t('fortune.advice')}</h4>
            <p className="text-white/80 text-sm leading-relaxed mb-5">"{result.advice}"</p>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyColor')}</span>
                <span className="text-white text-sm font-medium">{result.luckyColor}</span>
              </div>
              <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyNumber')}</span>
                <span className="text-white text-sm font-medium">{result.luckyNumber}</span>
              </div>
              <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyDirection')}</span>
                <span className="text-white text-sm font-medium">{result.luckyDirection}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 다시 보기 */}
        <div className="px-4 pt-2">
          <button
            onClick={() => setResult(null)}
            className="w-full max-w-md mx-auto flex items-center justify-center bg-white text-black h-12 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#5b13ec] hover:text-white transition-colors"
          >
            {t('fortune.newReading')}
          </button>
        </div>
      </div>
    );
  }

  // 입력 화면
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl">
        <div
          className="flex min-h-[40vh] flex-col gap-6 bg-cover bg-center bg-no-repeat items-center justify-end pb-12 px-6 text-center"
          style={{
            backgroundImage: `linear-gradient(to top, #161022 10%, rgba(22, 16, 34, 0.6) 50%, rgba(0, 0, 0, 0.2) 100%), url("https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80")`,
          }}
        >
          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
              {t('fortune.heroTitle1')} <br />
              <span className="text-[#5b13ec] italic font-light">{t('fortune.heroTitle2')}</span>
            </h1>
            <p className="text-white/70 text-sm font-light leading-relaxed max-w-xs mx-auto">
              {t('fortune.heroDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* 입력 폼 */}
      <section className="px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-white text-xl font-bold tracking-tight pb-1">{t('fortune.todayFortune')}</h3>
            <div className="h-1 w-12 bg-[#5b13ec] mx-auto rounded-full" />
          </div>

          {profileLoaded && (
            <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-center">
              <span className="text-green-400 text-xs">{t('fortune.loadedPrevious')}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
              <label className="block">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1 mb-2">{t('saju.birthDate')}</p>
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
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1 mb-2">{t('saju.birthHour')}</p>
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
              disabled={!birthDate}
              className={`w-full flex items-center justify-center rounded-full h-14 px-8 text-base font-bold tracking-widest uppercase transition-all ${
                birthDate
                  ? 'bg-[#5b13ec] text-white shadow-[0_0_15px_rgba(91,19,236,0.3)] border border-[#5b13ec]/50 hover:scale-105 active:scale-95'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {t('fortune.viewFortune')}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
