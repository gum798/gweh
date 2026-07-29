import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getEnergyLabel } from '../../utils/omenGenerator';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LevelPill } from '../ui/LevelPill';

// 공유 카드는 <canvas> 에 그리므로 Tailwind 클래스를 쓸 수 없고 hex 를 직접 넣어야 한다.
// 값은 tailwind.config.js 의 팔레트를 그대로 옮긴 것이며, 흩어져 있던 리터럴 13개를
// 여기 5개로 모아 토큰이 바뀔 때 고칠 곳을 한 곳으로 만든다.
// 공유 카드도 다크다 — 앱은 다크인데 내보낸 이미지만 흰색이면 SNS 에서 다른 서비스로 보인다.
// 액센트는 채움(#5b13ec)이 아니라 잉크(#b8a5ff)를 쓴다. 이 값들은 캔버스에서 배경 위
// **글자색**으로 쓰이므로 채움색을 넣으면 카드 배경 위 2.43:1 로 떨어진다.
const CARD_SURFACE = '#161022'; // gal-bg
const CARD_ACCENT = '#b8a5ff';  // gal-accent-ink — 8.72:1
const CARD_INK = '#f6f6f8';     // gal-black     — 17.20:1
const CARD_BODY = '#b8b0c8';    // gal-body      — 8.91:1
const CARD_MUTED = '#9c93ad';   // gal-muted     — 6.36:1

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

    // Background — clean white
    ctx.fillStyle = CARD_SURFACE;
    ctx.fillRect(0, 0, W, H);

    // Subtle radial accent glow
    const glow = ctx.createRadialGradient(W / 2, H / 3, 0, W / 2, H / 3, 300);
    glow.addColorStop(0, 'rgba(46,163,242,0.04)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Decorative border
    ctx.strokeStyle = 'rgba(46,163,242,0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    // Inner border
    ctx.strokeStyle = 'rgba(229,229,229,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, W - 64, H - 64);

    // Corner ornaments
    const ornSize = 16;
    ctx.fillStyle = 'rgba(46,163,242,0.5)';
    [[32, 32], [W - 32, 32], [32, H - 32], [W - 32, H - 32]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, ornSize / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = CARD_ACCENT;
    ctx.font = 'bold 28px "Noto Sans KR", sans-serif';
    ctx.fillText('MYSTIC AI', W / 2, 80);

    // Subtitle
    ctx.fillStyle = CARD_MUTED;
    ctx.font = '10px sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('U N V E I L   Y O U R   D E S T I N Y', W / 2, 105);

    // Divider
    const divGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, 'rgba(46,163,242,0.4)');
    divGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = divGrad;
    ctx.fillRect(100, 120, W - 200, 1);

    // Date
    ctx.fillStyle = CARD_BODY;
    ctx.font = '13px sans-serif';
    ctx.fillText(dateStr, W / 2, 152);

    let y = 190;

    // Energy label
    if (energyLabel) {
      ctx.fillStyle = CARD_ACCENT;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('TODAY\'S ENERGY', W / 2, y);
      y += 30;
      ctx.fillStyle = CARD_INK;
      ctx.font = 'bold 36px "Noto Sans KR", sans-serif';
      ctx.fillText(energyLabel, W / 2, y);
      y += 20;
    }

    // Omen message
    if (omenMessage) {
      y += 15;
      ctx.fillStyle = CARD_BODY;
      ctx.font = 'italic 14px "Noto Sans KR", sans-serif';
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
      ctx.fillStyle = CARD_ACCENT;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('FORTUNE', W / 2, y);
      y += 28;
      ctx.fillStyle = CARD_INK;
      ctx.font = 'bold 24px "Noto Sans KR", sans-serif';
      ctx.fillText(fortuneLevel, W / 2, y);
      y += 15;
    }

    // Fortune overall
    if (fortuneOverall) {
      y += 10;
      ctx.fillStyle = CARD_BODY;
      ctx.font = '13px "Noto Sans KR", sans-serif';
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
      ctx.fillStyle = CARD_ACCENT;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('ADVICE', W / 2, y);
      y += 22;
      ctx.fillStyle = CARD_BODY;
      ctx.font = 'italic 13px "Noto Sans KR", sans-serif';
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
    ctx.fillStyle = CARD_MUTED;
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
          <p className="text-gal-muted text-sm">{dateStr}</p>
        </div>

        <section className="px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-gal-black text-xl font-bold tracking-tight pb-1">{t('summary.title')}</h3>
              <div className="h-1 w-12 bg-gal-accent mx-auto rounded-full" />
            </div>

            <Card padding="sm" className="relative overflow-hidden">
              <div className="blur-sm select-none pointer-events-none space-y-4">
                <div className="text-center">
                  <span className="text-4xl" aria-hidden="true">📊</span>
                  <p className="text-gal-black font-bold mt-2">{t('summary.title')}</p>
                </div>
                <div className="bg-gal-bg rounded-gal-lg p-4">
                  <p className="text-gal-body text-sm">{i18n.language === 'ko' ? '오늘의 에너지가 길(吉)로 흐르고 있습니다. 금(金) 기운이 안정적이며, 보름달의 양(陽) 기운이 충만합니다.' : 'Today\'s energy flows with good fortune. Metal energy is stable, and the full moon\'s yang energy is abundant.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gal-bg rounded-gal-lg p-3 text-center">
                    <span className="text-status-success font-bold">길</span>
                    <p className="text-gal-muted text-xs">운세</p>
                  </div>
                  <div className="bg-gal-bg rounded-gal-lg p-3 text-center">
                    <span className="text-gal-accent-ink font-bold">대길</span>
                    <p className="text-gal-muted text-xs">사주</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gal-bg/80">
                <div className="h-12 w-12 rounded-full border border-gal-accent flex items-center justify-center mb-3 shadow-gal-soft">
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
                  {t('summary.unlock')}
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  // 구독자: 데이터 없으면 빈 상태 표시
  if (!hasAnyData && !isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="text-center pt-4">
          <p className="text-gal-muted text-sm">{dateStr}</p>
        </div>
        <section className="px-4">
          <div className="max-w-md mx-auto text-center">
            <Card variant="accent" padding="lg" className="relative overflow-hidden">
              {/* Animated icon */}
              <div className="relative inline-block mb-5">
                <div className="absolute inset-0 rounded-full border border-gal-accent/30 animate-ping opacity-30" style={{ animationDuration: '3s' }} />
                <div className="relative h-16 w-16 mx-auto rounded-full border border-gal-accent flex items-center justify-center shadow-gal-soft bg-gal-accent-light">
                  <svg className="w-7 h-7 text-gal-accent-ink animate-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.5" />
                    <circle cx="12" cy="12" r="4" strokeOpacity="0.8" />
                    <line x1="12" y1="2" x2="12" y2="6" strokeOpacity="0.3" />
                    <line x1="12" y1="18" x2="12" y2="22" strokeOpacity="0.3" />
                    <line x1="2" y1="12" x2="6" y2="12" strokeOpacity="0.3" />
                    <line x1="18" y1="12" x2="22" y2="12" strokeOpacity="0.3" />
                  </svg>
                </div>
              </div>
              <h3 className="text-gal-black text-lg font-bold mb-2 relative">{t('summary.title')}</h3>
              <p className="text-gal-accent-ink text-sm font-medium mb-1.5 animate-pulse-slow relative">
                {i18n.language === 'ko' ? '천기를 모으는 중...' : 'Gathering celestial energies...'}
              </p>
              <p className="text-gal-muted text-xs leading-relaxed relative">{t('summary.noData')}</p>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  // 구독자: 종합 분석 — 순서: 스타일 → 괘 → 운세
  return (
    <div className="space-y-6 pb-8">
      <div className="text-center pt-4">
        <p className="text-gal-muted text-sm">{dateStr}</p>
      </div>

      {/* 헤더 */}
      <section className="px-4">
        <div className="max-w-md mx-auto text-center">
          <span className="text-gal-accent-ink text-label font-bold uppercase">{t('sub.badge')}</span>
          <h3 className="text-gal-black text-xl font-bold tracking-tight pb-1">{t('summary.title')}</h3>
          <div className="h-1 w-12 bg-gal-accent mx-auto rounded-full" />
        </div>
      </section>

      {/* 1. 스타일 추천 */}
      {(dailyStyle || loading) && (
        <section className="px-4">
          <Card variant="accent" className="max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">👔</span>
              <h4 className="text-gal-accent-ink text-xs font-bold uppercase tracking-widest">{t('sub.dailyStyleTitle')}</h4>
            </div>
            {loading && !dailyStyle ? (
              <div className="text-center py-4">
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gal-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-gal-muted text-sm">{t('sub.loadingStyle')}</p>
              </div>
            ) : dailyStyle ? (
              <div className="space-y-3">
                <p className="text-gal-body text-sm italic">"{dailyStyle.headline}"</p>
                <p className="text-gal-body text-xs leading-relaxed">{dailyStyle.style}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-gal-muted text-xs">{t('sub.styleColors')}:</span>
                  {dailyStyle.colors?.map((color: string, i: number) => (
                    <span key={i} className="text-gal-accent-ink text-xs bg-gal-accent-light px-2 py-0.5 rounded-gal-md">
                      {color}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gal-border">
                  <div>
                    <span className="text-gal-muted text-xs block mb-1">{t('sub.styleItem')}</span>
                    <span className="text-gal-black text-sm">{dailyStyle.item}</span>
                  </div>
                  <div>
                    <span className="text-gal-muted text-xs block mb-1">{t('sub.styleTip')}</span>
                    <span className="text-gal-black text-sm">{dailyStyle.tip}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        </section>
      )}

      {/* 2. 에너지 + 괘 */}
      {(energyLabel || dailyReading?.omen_message) && (
        <section className="px-4">
          <Card variant="accent" className="max-w-md mx-auto">
            <h4 className="text-gal-accent-ink text-xs font-bold uppercase tracking-widest mb-4">{t('summary.todayEnergy')}</h4>
            {/*
              energyLabel.color 는 읽지 않는다. getEnergyLabel()(utils/omenGenerator.ts)이
              CSS 클래스명을 값으로 돌려주는데, 그게 원시 팔레트의 400 단계라 흰 바탕에서
              1.4~1.7:1 밖에 안 나온다. 클래스명이 다른 모듈에서 조립되므로 이 파일을
              훑는 감사에는 잡히지도 않는다. 같은 라벨을 OmenTab 이 LevelPill 로
              렌더하므로 여기도 같은 프리미티브를 쓴다 — 한 값이 탭마다 다른 색으로
              보이는 것이 이 태스크가 없애려는 갈라짐이다.
              utils 가 클래스명을 내보내는 문제 자체는 별건이라 손대지 않는다.
              (주석에 그 클래스명을 적지 않는 이유: Tailwind content 스캐너가 주석 속
               클래스명까지 실제 CSS 로 내보낸다.)
            */}
            {energyLabel && (
              <div className="text-center">
                <LevelPill level={energyLabel.label} />
              </div>
            )}
            {dailyReading?.omen_message && (
              <p className="text-gal-body text-sm leading-relaxed mt-4 text-center italic">
                "{dailyReading.omen_message}"
              </p>
            )}
          </Card>
        </section>
      )}

      {/* 3. 운세 요약 */}
      {fortune?.overall && (
        <section className="px-4">
          <Card variant="accent" className="max-w-md mx-auto">
            <h4 className="text-gal-accent-ink text-xs font-bold uppercase tracking-widest mb-4">{t('summary.fortuneSummary')}</h4>
            {fortune.level && <div className="text-center mb-4">
              <LevelPill level={fortune.level} />
            </div>}
            <p className="text-gal-body text-sm leading-relaxed text-center italic mb-4">
              "{fortune.overall}"
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '💕', label: t('fortune.love'), text: fortune.love },
                { icon: '💼', label: t('fortune.career'), text: fortune.career },
                { icon: '💰', label: t('fortune.wealth'), text: fortune.wealth },
                { icon: '🏥', label: t('fortune.health'), text: fortune.health },
              ].filter((item) => item.text).map((item) => (
                <div key={item.label} className="bg-gal-bg rounded-gal-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-gal-black text-xs font-bold">{item.label}</span>
                  </div>
                  <p className="text-gal-muted text-xs leading-relaxed line-clamp-3">{item.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* 3-1. 조언 + 행운 정보 */}
      {fortune?.advice && (
        <section className="px-4">
          <Card variant="accent" className="max-w-md mx-auto">
            <h4 className="text-gal-accent-ink text-xs font-bold uppercase tracking-widest mb-4">{t('fortune.advice')}</h4>
            <p className="text-gal-body text-sm leading-relaxed mb-5">"{fortune.advice}"</p>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gal-border">
              {fortune.luckyColor && <div className="text-center">
                <span className="text-gal-muted text-label uppercase block mb-1">{t('fortune.luckyColor')}</span>
                <span className="text-gal-black text-sm font-medium">{fortune.luckyColor}</span>
              </div>}
              {fortune.luckyNumber != null && <div className="text-center">
                <span className="text-gal-muted text-label uppercase block mb-1">{t('fortune.luckyNumber')}</span>
                <span className="text-gal-black text-sm font-medium">{fortune.luckyNumber}</span>
              </div>}
              {fortune.luckyDirection && <div className="text-center">
                <span className="text-gal-muted text-label uppercase block mb-1">{t('fortune.luckyDirection')}</span>
                <span className="text-gal-black text-sm font-medium">{fortune.luckyDirection}</span>
              </div>}
            </div>
          </Card>
        </section>
      )}

      {/* Share Destiny */}
      {hasAnyData && (
        <section className="px-4">
          <div className="max-w-md mx-auto text-center">
            <Button
              variant="primary"
              onClick={handleShareDestiny}
              loading={shareStatus === 'generating'}
            >
              {shareStatus === 'generating' ? (
                <>
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
            </Button>
          </div>
        </section>
      )}

    </div>
  );
}
