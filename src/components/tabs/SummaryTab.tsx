import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getEnergyLabel } from '../../utils/omenGenerator';

function generateDestinyCard(
  dateStr: string,
  energyLabel: string | undefined,
  omenMessage: string | undefined,
  fortuneLevel: string | undefined,
  fortuneOverall: string | undefined,
  advice: string | undefined,
): Promise<Blob> {
  return new Promise((resolve) => {
    const W = 600, H = 800;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a0a1a');
    bg.addColorStop(0.5, '#12102a');
    bg.addColorStop(1, '#06060f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle radial glow
    const glow = ctx.createRadialGradient(W / 2, H / 3, 0, W / 2, H / 3, 300);
    glow.addColorStop(0, 'rgba(212,175,55,0.08)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Decorative border
    ctx.strokeStyle = 'rgba(212,175,55,0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    // Inner border
    ctx.strokeStyle = 'rgba(212,175,55,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, W - 64, H - 64);

    // Corner ornaments
    const ornSize = 16;
    ctx.fillStyle = 'rgba(212,175,55,0.5)';
    [[32, 32], [W - 32, 32], [32, H - 32], [W - 32, H - 32]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, ornSize / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 28px "Gowun Batang", serif';
    ctx.fillText('MYSTIC AI', W / 2, 80);

    // Subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('U N V E I L   Y O U R   D E S T I N Y', W / 2, 105);

    // Divider
    const divGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, 'rgba(212,175,55,0.4)');
    divGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = divGrad;
    ctx.fillRect(100, 120, W - 200, 1);

    // Date
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px sans-serif';
    ctx.fillText(dateStr, W / 2, 152);

    let y = 190;

    // Energy label
    if (energyLabel) {
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('TODAY\'S ENERGY', W / 2, y);
      y += 30;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Gowun Batang", serif';
      ctx.fillText(energyLabel, W / 2, y);
      y += 20;
    }

    // Omen message
    if (omenMessage) {
      y += 15;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = 'italic 14px "Gowun Batang", serif';
      const lines = wrapText(ctx, `"${omenMessage}"`, W - 120);
      lines.forEach((line) => {
        ctx.fillText(line, W / 2, y);
        y += 22;
      });
    }

    // Divider 2
    y += 10;
    ctx.fillStyle = divGrad;
    ctx.fillRect(100, y, W - 200, 1);
    y += 25;

    // Fortune level
    if (fortuneLevel) {
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('FORTUNE', W / 2, y);
      y += 28;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Gowun Batang", serif';
      ctx.fillText(fortuneLevel, W / 2, y);
      y += 15;
    }

    // Fortune overall
    if (fortuneOverall) {
      y += 10;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '13px "Gowun Batang", serif';
      const lines = wrapText(ctx, fortuneOverall, W - 120);
      lines.forEach((line) => {
        ctx.fillText(line, W / 2, y);
        y += 20;
      });
    }

    // Advice
    if (advice) {
      y += 15;
      ctx.fillStyle = divGrad;
      ctx.fillRect(100, y, W - 200, 1);
      y += 25;
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('ADVICE', W / 2, y);
      y += 22;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = 'italic 13px "Gowun Batang", serif';
      const lines = wrapText(ctx, `"${advice}"`, W - 120);
      lines.forEach((line) => {
        ctx.fillText(line, W / 2, y);
        y += 20;
      });
    }

    // Footer
    const footerY = H - 45;
    ctx.fillStyle = divGrad;
    ctx.fillRect(100, footerY - 10, W - 200, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '9px sans-serif';
    ctx.fillText('mystic-ai.com', W / 2, footerY + 10);

    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = '';
  for (const char of text) {
    const testLine = currentLine + char;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

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
  const [shareStatus, setShareStatus] = useState<'idle' | 'generating' | 'shared' | 'copied'>('idle');

  // 모든 데이터를 한 번에 가져오기
  useEffect(() => {
    if (!session?.access_token) return;

    const fetchAllData = async () => {
      setLoading(true);
      setFortuneLoading(true);

      let fortuneLoaded = false;
      let dailyStyleLoaded = false;
      let omenMsg = '';
      let energyLbl = '';

      // 1. daily-reading에서 캐시된 모든 데이터 가져오기 (구독자)
      if (isSubscribed) {
        try {
          const res = await fetch('/api/daily-reading', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const { reading } = await res.json();
            if (reading) {
              setDailyReading(reading);
              if (reading.omen_message) omenMsg = reading.omen_message;
              if (reading.style_data) {
                const sd = Array.isArray(reading.style_data) ? reading.style_data[0] : reading.style_data;
                if (sd?.headline) { setDailyStyle(sd); dailyStyleLoaded = true; }
              }
              if (reading.energy_score != null) {
                const el = getEnergyLabel(reading.energy_score);
                setEnergyLabel(el);
                energyLbl = el.label;
              }
              if (reading.fortune_data) {
                const fd = Array.isArray(reading.fortune_data) ? reading.fortune_data[0] : reading.fortune_data;
                if (fd?.overall) { setFortune(fd); fortuneLoaded = true; }
              }
            }
          }
        } catch {}
      }

      // 1-1. style_data가 없고 omen_message가 있으면 직접 daily-style 호출
      if (isSubscribed && !dailyStyleLoaded && omenMsg) {
        try {
          const styleRes = await fetch('/api/daily-style', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              omenMessage: omenMsg,
              energy: energyLbl || '',
              lang: i18n.language,
            }),
          });
          if (styleRes.ok) {
            const styleData = await styleRes.json();
            if (styleData.success) setDailyStyle(styleData.data);
          }
        } catch {}
      }

      setLoading(false);

      // 2. 운세가 아직 없으면 프로필에서 생년 가져와 fortune API 호출
      if (!fortuneLoaded) {
        try {
          const profileRes = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const profileData = await profileRes.json();
          const birthDate = profileData.profile?.birth_date;
          if (birthDate) {
            const year = birthDate.split('-')[0];
            const fortuneRes = await fetch('/api/fortune', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ birth_date: year }),
            });
            const fortuneData = await fortuneRes.json();
            if (fortuneData.success) {
              const fd = Array.isArray(fortuneData.fortune) ? fortuneData.fortune[0] : fortuneData.fortune;
              if (fd?.overall) setFortune(fd);
            }
          }
        } catch {}
      }
      setFortuneLoading(false);
    };

    fetchAllData();
  }, [session?.access_token, isSubscribed]);

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
    if (!level) return 'bg-white/10 text-white/60 border-white/20';
    const l = level.toLowerCase();
    if (level === '대길' || l === 'excellent') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (level === '길' || l === 'good') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (level === '평' || l === 'neutral') return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    if (level === '소흉' || l === 'caution') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const handleShareDestiny = useCallback(async () => {
    setShareStatus('generating');
    try {
      const blob = await generateDestinyCard(
        dateStr,
        energyLabel?.label,
        dailyReading?.omen_message,
        fortune?.level,
        fortune?.overall,
        fortune?.advice,
      );
      const file = new File([blob], 'mystic-destiny.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'MYSTIC AI — My Destiny',
          text: i18n.language === 'ko' ? '오늘의 운명을 확인해보세요' : 'Check out my destiny for today',
          files: [file],
        });
        setShareStatus('shared');
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mystic-destiny.png';
        a.click();
        URL.revokeObjectURL(url);
        setShareStatus('copied');
      }
    } catch {
      setShareStatus('idle');
    }
    setTimeout(() => setShareStatus('idle'), 2500);
  }, [dateStr, energyLabel, dailyReading, fortune, i18n.language]);

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
              <div className="h-1 w-12 bg-[var(--accent)] mx-auto rounded-full" />
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <div className="bg-[var(--bg-panel)] backdrop-blur-xl p-5 blur-sm select-none pointer-events-none space-y-4">
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
                <div className="h-12 w-12 rounded-full border border-[var(--accent-50)] flex items-center justify-center mb-3 shadow-[0_0_15px_var(--accent-30)]">
                  <span className="text-xl">🔒</span>
                </div>
                <p className="text-white/70 text-sm font-medium mb-1">{t('sub.locked')}</p>
                <button
                  onClick={() => {
                    if (!session) { onLoginRequired(); return; }
                    subscribe();
                  }}
                  className="mystic-ripple mt-2 px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-full text-white text-xs font-bold tracking-wide transition-all shadow-[0_0_15px_var(--accent-40)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
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

  // 구독자: 데이터 없으면 신비로운 빈 상태 표시
  if (!hasAnyData && !isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="text-center pt-4">
          <p className="text-white/40 text-sm">{dateStr}</p>
        </div>
        <section className="px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-[var(--accent-30)] p-10 relative overflow-hidden">
              {/* Glowing orb background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 rounded-full bg-[var(--accent)] opacity-[0.04] blur-3xl animate-pulse-slow" />
              </div>
              {/* Animated icon */}
              <div className="relative inline-block mb-5">
                <div className="absolute inset-0 rounded-full border border-[var(--accent-30)] animate-ping opacity-30" style={{ animationDuration: '3s' }} />
                <div className="relative h-16 w-16 mx-auto rounded-full border border-[var(--accent-40)] flex items-center justify-center shadow-[0_0_25px_var(--accent-20)] bg-[var(--accent-10)]">
                  <svg className="w-7 h-7 text-[var(--accent)] animate-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.5" />
                    <circle cx="12" cy="12" r="4" strokeOpacity="0.8" />
                    <line x1="12" y1="2" x2="12" y2="6" strokeOpacity="0.3" />
                    <line x1="12" y1="18" x2="12" y2="22" strokeOpacity="0.3" />
                    <line x1="2" y1="12" x2="6" y2="12" strokeOpacity="0.3" />
                    <line x1="18" y1="12" x2="22" y2="12" strokeOpacity="0.3" />
                  </svg>
                </div>
              </div>
              <h3 className="text-white text-lg font-bold mb-2 relative">{t('summary.title')}</h3>
              <p className="text-[var(--accent)] text-sm font-medium mb-1.5 animate-pulse-slow relative">
                {i18n.language === 'ko' ? '천기를 모으는 중...' : 'Gathering celestial energies...'}
              </p>
              <p className="text-white/40 text-xs leading-relaxed relative">{t('summary.noData')}</p>
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
          <span className="text-[var(--accent)] text-[10px] font-bold uppercase tracking-[0.3em]">{t('sub.badge')}</span>
          <h3 className="text-white text-xl font-bold tracking-tight pb-1">{t('summary.title')}</h3>
          <div className="h-1 w-12 bg-[var(--accent)] mx-auto rounded-full" />
        </div>
      </section>

      {/* 1. 스타일 추천 */}
      {(dailyStyle || loading) && (
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-[var(--accent-30)] p-6 shadow-[0_0_15px_var(--accent-20)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">👔</span>
              <h4 className="text-[var(--accent)] text-xs font-bold uppercase tracking-widest">{t('sub.dailyStyleTitle')}</h4>
            </div>
            {loading && !dailyStyle ? (
              <div className="text-center py-4">
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                    <span key={i} className="text-[var(--accent)] text-xs bg-[var(--accent-10)] px-2 py-0.5 rounded-full">
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
          <div className="max-w-md mx-auto bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-[var(--accent-30)] p-6 shadow-[0_0_15px_var(--accent-20)]">
            <h4 className="text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-4">{t('summary.todayEnergy')}</h4>
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
      {fortune?.overall && (
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h4 className="text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-4">{t('summary.fortuneSummary')}</h4>
            {fortune.level && <div className="text-center mb-4">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border ${getLevelStyle(fortune.level)}`}>
                {fortune.level}
              </span>
            </div>}
            <p className="text-white/70 text-sm leading-relaxed text-center italic mb-4">
              "{fortune.overall}"
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '💕', label: t('fortune.love'), text: fortune.love },
                { icon: '💼', label: t('fortune.career'), text: fortune.career },
                { icon: '💰', label: t('fortune.wealth'), text: fortune.wealth },
                { icon: '🏥', label: t('fortune.health'), text: fortune.health },
              ].filter((item) => item.text).map((item) => (
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
      {fortune?.advice && (
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[var(--bg-panel)] backdrop-blur-xl rounded-2xl border border-[var(--accent-30)] p-6">
            <h4 className="text-[var(--accent)] text-xs font-bold uppercase tracking-widest mb-4">{t('fortune.advice')}</h4>
            <p className="text-white/80 text-sm leading-relaxed mb-5">"{fortune.advice}"</p>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              {fortune.luckyColor && <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyColor')}</span>
                <span className="text-white text-sm font-medium">{fortune.luckyColor}</span>
              </div>}
              {fortune.luckyNumber != null && <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyNumber')}</span>
                <span className="text-white text-sm font-medium">{fortune.luckyNumber}</span>
              </div>}
              {fortune.luckyDirection && <div className="text-center">
                <span className="text-white/40 text-[10px] uppercase tracking-widest block mb-1">{t('fortune.luckyDirection')}</span>
                <span className="text-white text-sm font-medium">{fortune.luckyDirection}</span>
              </div>}
            </div>
          </div>
        </section>
      )}

      {/* Share Destiny */}
      {hasAnyData && (
        <section className="px-4">
          <div className="max-w-md mx-auto text-center">
            <button
              onClick={handleShareDestiny}
              disabled={shareStatus === 'generating'}
              className="mystic-ripple inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] hover:from-[var(--accent-hover)] hover:to-[var(--accent)] rounded-full text-white text-sm font-bold tracking-wide transition-all shadow-[0_0_20px_var(--accent-30)] hover:shadow-[0_0_30px_var(--accent-glow)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
            >
              {shareStatus === 'generating' ? (
                <>
                  <span className="animate-spin text-sm">&#9697;</span>
                  {i18n.language === 'ko' ? '생성 중...' : 'Generating...'}
                </>
              ) : shareStatus === 'shared' ? (
                <>
                  <span>&#10003;</span>
                  {i18n.language === 'ko' ? '공유 완료!' : 'Shared!'}
                </>
              ) : shareStatus === 'copied' ? (
                <>
                  <span>&#10003;</span>
                  {i18n.language === 'ko' ? '이미지 저장됨!' : 'Image Saved!'}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  {i18n.language === 'ko' ? '운명 공유하기' : 'Share Destiny'}
                </>
              )}
            </button>
          </div>
        </section>
      )}

    </div>
  );
}
