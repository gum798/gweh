import { useState, useEffect, useRef } from 'react';
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

const CACHE_KEY = 'mystic_fortune_cache';
const BIRTH_YEAR_KEY = 'mystic_birth_year';

function getCachedFortune(birthDate: string): FortuneResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    if (cached.date === today && cached.birthDate === birthDate && cached.fortune) {
      const f = Array.isArray(cached.fortune) ? cached.fortune[0] : cached.fortune;
      if (f?.overall) return f;
    }
  } catch { /* ignore */ }
  return null;
}

function setCachedFortune(birthDate: string, fortune: FortuneResult) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, birthDate, fortune }));
}

export default function FortuneTab() {
  const { t, i18n } = useTranslation();
  const { session, loading: authLoading } = useAuth();
  const [birthYear, setBirthYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [ready, setReady] = useState(false);
  const [existingProfileDate, setExistingProfileDate] = useState<string | null>(null);
  const autoSubmitted = useRef(false);

  // 우선순위: 1) localStorage → 2) DB 프로필 → 3) 사용자 입력
  useEffect(() => {
    // 인증 로딩 중이면 대기 (세션 확인 후 DB 조회를 위해)
    if (authLoading) return;

    const saved = localStorage.getItem(BIRTH_YEAR_KEY);
    if (saved) {
      setBirthYear(saved);
      setReady(true);
      return;
    }

    // 사주탭에서 저장한 생년월일의 연도 참고
    try {
      const sajuRaw = localStorage.getItem('mystic_saju_input');
      if (sajuRaw) {
        const sajuData = JSON.parse(sajuRaw);
        if (sajuData.birthDate) {
          const year = sajuData.birthDate.split('-')[0];
          setBirthYear(year);
          localStorage.setItem(BIRTH_YEAR_KEY, year);
          setReady(true);
          return;
        }
      }
    } catch { /* ignore */ }

    if (!session?.access_token) {
      setReady(true);
      return;
    }

    fetch('/api/profile', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.profile?.birth_date) {
          const year = d.profile.birth_date.split('-')[0];
          setBirthYear(year);
          setExistingProfileDate(d.profile.birth_date);
          localStorage.setItem(BIRTH_YEAR_KEY, year);
        }
      })
      .catch(() => { })
      .finally(() => setReady(true));
  }, [authLoading, session?.access_token]);

  // 데이터 준비되면 자동 제출
  useEffect(() => {
    if (ready && birthYear && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submitFortune(birthYear);
    }
  }, [ready, birthYear]);

  const submitFortune = async (year: string) => {
    // 캐시 확인
    const cached = getCachedFortune(year);
    if (cached) {
      setResult(cached);
    } else {
      setLoading(true);
      setError('');
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        const res = await fetch('/api/fortune', {
          method: 'POST',
          headers,
          body: JSON.stringify({ birth_date: year }),
        });
        const data = await res.json();
        if (data.success) {
          const fortune = Array.isArray(data.fortune) ? data.fortune[0] : data.fortune;
          setResult(fortune);
          setCachedFortune(year, fortune);
        } else {
          setError(data.error || t('fortune.error'));
        }
      } catch {
        setError(t('fortune.error'));
      } finally {
        setLoading(false);
      }
    }

    // Smart Persistence:
    // Only update profile if the year has changed from the existing profile date.
    // If it matches, we assume the existing full date (from SajuTab) is better and keep it.
    if (session?.access_token) {
      const existingYear = existingProfileDate ? existingProfileDate.split('-')[0] : null;

      if (year !== existingYear) {
        // Year changed or no existing date -> Save as Year-01-01
        fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ birth_date: `${year}-01-01` }),
        })
          .then(() => setExistingProfileDate(`${year}-01-01`))
          .catch(() => { });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthYear) return;
    submitFortune(birthYear);
  };

  const handleNewReading = () => {
    // 캐시 삭제 후 다시 요청
    localStorage.removeItem(CACHE_KEY);
    setResult(null);
    if (birthYear) {
      autoSubmitted.current = false;
    }
  };

  const getLevelStyle = (level: string) => {
    if (level === '대길') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (level === '길') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (level === '평') return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    if (level === '소흉') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getLevelEmoji = (level: string) => {
    if (level === '대길') return '✨';
    if (level === '길') return '🌟';
    if (level === '평') return '☁️';
    if (level === '소흉') return '🌧️';
    return '⚡';
  };

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full border border-[var(--accent-30)] shadow-[0_0_30px_var(--accent-glow)] animate-ping" />
          <div className="h-24 w-24 rounded-full border border-[var(--accent-50)] flex items-center justify-center shadow-[0_0_15px_var(--accent-30)]">
            <span className="text-4xl animate-pulse">🔮</span>
          </div>
        </div>
        <h3 className="text-white text-xl font-bold mt-8 mb-2">{t('fortune.analyzing')}</h3>
        <div className="mt-4 flex gap-1">
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // 결과 화면
  if (result) {
    const today = new Date();
    const locale = i18n.language === 'en' ? 'en-US' : 'ko-KR';
    const dateStr = today.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    return (
      <div className="space-y-6 pb-8">
        {/* 오늘 날짜 */}
        <div className="text-center pt-4">
          <p className="text-white/40 text-sm">{dateStr}</p>
        </div>

        {/* 헤더 */}
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-[var(--accent-30)] p-6 shadow-[0_0_15px_var(--accent-20)]">
            <div className="text-center mb-4">
              <span className="text-5xl mb-3 block">{getLevelEmoji(result.level)}</span>
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
            ].filter((item) => item.text).map((item) => (
              <div key={item.label} className="bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-white/10 p-4">
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
          <div className="max-w-md mx-auto bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-[var(--accent-30)] p-6">
            <h4 className="text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-4">{t('fortune.advice')}</h4>
            {result.advice && <p className="text-white/80 text-sm leading-relaxed mb-5">"{result.advice}"</p>}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              {result.luckyColor && <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyColor')}</span>
                <span className="text-white text-sm font-medium">{result.luckyColor}</span>
              </div>}
              {result.luckyNumber != null && <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyNumber')}</span>
                <span className="text-white text-sm font-medium">{result.luckyNumber}</span>
              </div>}
              {result.luckyDirection && <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyDirection')}</span>
                <span className="text-white text-sm font-medium">{result.luckyDirection}</span>
              </div>}
            </div>
          </div>
        </section>

        {/* 다시 보기 */}
        <div className="px-4 pt-2">
          <button
            onClick={handleNewReading}
            className="w-full max-w-md mx-auto flex items-center justify-center bg-white text-black h-12 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[var(--accent)] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
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
            backgroundImage: `linear-gradient(to top, var(--bg-hero-bottom) 10%, var(--bg-hero-mid) 50%, rgba(0, 0, 0, 0.2) 100%), url("https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80")`,
          }}
        >
          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
              {t('fortune.heroTitle1')} <br />
              <span className="text-[var(--accent)] italic font-light">{t('fortune.heroTitle2')}</span>
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
            <div className="h-1 w-12 bg-[var(--accent)] mx-auto rounded-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
              <label className="block">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1 mb-2">{t('fortune.birthYear')}</p>
                <select
                  value={birthYear}
                  onChange={(e) => {
                    setBirthYear(e.target.value);
                    if (e.target.value) localStorage.setItem(BIRTH_YEAR_KEY, e.target.value);
                  }}
                  className="w-full rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)] border border-white/10 bg-white/5 h-14 px-4 text-lg font-medium transition-all focus:bg-white/10 appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled className="bg-[var(--bg-primary)]">Select Year</option>
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year} className="bg-[var(--bg-primary)]">{year}</option>
                  ))}
                </select>
              </label>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={!birthYear}
              className={`w-full flex items-center justify-center rounded-full h-14 px-8 text-base font-bold tracking-widest uppercase transition-all ${birthYear
                ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-30)] border border-[var(--accent-50)] hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]'
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
