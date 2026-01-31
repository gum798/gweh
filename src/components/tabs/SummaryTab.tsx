import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { calculateSaju, FIVE_ELEMENTS } from '../../utils/saju';
import { interpretSaju, getTodayFortune } from '../../utils/sajuInterpret';
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

const ELEMENT_COLORS: Record<string, string> = {
  목: 'text-green-400',
  화: 'text-red-400',
  토: 'text-yellow-500',
  금: 'text-gray-300',
  수: 'text-blue-400',
};

interface SummaryTabProps {
  onLoginRequired: () => void;
}

export default function SummaryTab({ onLoginRequired }: SummaryTabProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { isSubscribed, subscribe } = useSubscription();

  const [fortune, setFortune] = useState<FortuneResult | null>(null);
  const [sajuResult, setSajuResult] = useState<any>(null);
  const [sajuFortune, setSajuFortune] = useState<any>(null);
  const [personalOmen, setPersonalOmen] = useState<any>(null);
  const [energyLabel, setEnergyLabel] = useState<{ label: string; color: string } | null>(null);

  useEffect(() => {
    // 운세 캐시
    try {
      const raw = localStorage.getItem('mystic_fortune_cache');
      if (raw) {
        const cached = JSON.parse(raw);
        const today = new Date().toISOString().split('T')[0];
        if (cached.date === today && cached.fortune) {
          setFortune(cached.fortune);
        }
      }
    } catch {}

    // 사주 계산
    try {
      const raw = localStorage.getItem('mystic_saju_input');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.birthDate) {
          const date = new Date(parsed.birthDate);
          const hour = parsed.birthHour ?? 12;
          const saju = calculateSaju(date, hour);
          const interpretation = interpretSaju(saju);
          setSajuResult(interpretation);
          setSajuFortune(getTodayFortune(saju));
        }
      }
    } catch {}

    // 개인 맞춤 괘 캐시
    try {
      const raw = localStorage.getItem('personal_omen_cache');
      if (raw) {
        const cached = JSON.parse(raw);
        const today = new Date().toISOString().split('T')[0];
        if (cached.date === today && cached.data) {
          setPersonalOmen(cached.data);
          if (cached.energy_label) {
            setEnergyLabel(getEnergyLabel(0)); // placeholder
            // energy_label from cache is text like "대길", map it
            const labelMap: Record<string, number> = { '대길': 90, '길': 70, '평': 50, '소흉': 30, '흉': 10 };
            const enLabelMap: Record<string, number> = { 'Excellent': 90, 'Good': 70, 'Neutral': 50, 'Caution': 30, 'Be Careful': 10 };
            const score = labelMap[cached.energy_label] ?? enLabelMap[cached.energy_label] ?? 50;
            setEnergyLabel(getEnergyLabel(score));
          }
        }
      }
    } catch {}
  }, []);

  const today = new Date();
  const locale = t('nav.omen') === '괘' ? 'ko-KR' : 'en-US';
  const dateStr = today.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const hasAnyData = fortune || sajuResult || personalOmen;

  const getLevelStyle = (level: string) => {
    if (level === '대길') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (level === '길') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (level === '평') return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    if (level === '소흉') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
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
              {/* Blurred fake content */}
              <div className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl p-5 blur-sm select-none pointer-events-none space-y-4">
                <div className="text-center">
                  <span className="text-4xl">📊</span>
                  <p className="text-white font-bold mt-2">{t('summary.title')}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">오늘의 에너지가 길(吉)로 흐르고 있습니다. 금(金) 기운이 안정적이며, 보름달의 양(陽) 기운이 충만합니다.</p>
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
              {/* Lock overlay */}
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
                  className="mt-2 px-6 py-2 bg-[#5b13ec] hover:bg-[#4a0fd0] rounded-full text-white text-xs font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(91,19,236,0.4)]"
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

  // 구독자: 데이터 없으면 안내
  if (!hasAnyData) {
    return (
      <div className="space-y-6 pb-8">
        <div className="text-center pt-4">
          <p className="text-white/40 text-sm">{dateStr}</p>
        </div>
        <section className="px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <span className="text-5xl mb-4 block">📊</span>
              <h3 className="text-white text-lg font-bold mb-2">{t('summary.title')}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{t('summary.noData')}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // 구독자: 종합 분석
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

      {/* 에너지 + 괘 */}
      {energyLabel && (
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-[#5b13ec]/30 p-6 shadow-[0_0_15px_rgba(91,19,236,0.2)]">
            <h4 className="text-[#5b13ec] text-xs font-bold uppercase tracking-widest mb-4">{t('summary.todayEnergy')}</h4>
            <div className="text-center">
              <span className={`text-3xl font-bold ${energyLabel.color}`}>{energyLabel.label}</span>
            </div>
            {personalOmen?.saju_reading && (
              <p className="text-white/60 text-sm leading-relaxed mt-4 text-center italic">
                "{personalOmen.saju_reading}"
              </p>
            )}
          </div>
        </section>
      )}

      {/* 운세 요약 */}
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

      {/* 사주 하이라이트 */}
      {sajuResult && (
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h4 className="text-[#5b13ec] text-xs font-bold uppercase tracking-widest mb-4">{t('summary.sajuHighlight')}</h4>

            {/* 일간 */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{t('summary.dayMaster')}</p>
              <p className="text-white text-xl font-bold">{sajuResult.dayMaster.name}</p>
              <p className="text-white/50 text-xs mt-1">
                {t('saju.dayMasterEnergy', { nature: sajuResult.dayMaster.nature, trait: sajuResult.dayMaster.trait })}
              </p>
            </div>

            {/* 오행 분포 */}
            <div className="flex justify-center gap-2 mb-4">
              {Object.entries(sajuResult.elementAnalysis.distribution).map(([element, count]) => (
                <div key={element} className="text-center">
                  <span className={`text-lg font-bold ${ELEMENT_COLORS[element]}`}>{element}</span>
                  <span className="text-white/40 text-xs block">{count as number}</span>
                </div>
              ))}
            </div>

            {/* 오늘의 사주 운세 */}
            {sajuFortune && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-xs uppercase tracking-widest">{t('summary.sajuFortune')}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getLevelStyle(sajuFortune.level)}`}>
                    {sajuFortune.level}
                  </span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed">{sajuFortune.message}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 맞춤 조언 */}
      {personalOmen && (
        <section className="px-4">
          <div className="max-w-md mx-auto bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h4 className="text-[#5b13ec] text-xs font-bold uppercase tracking-widest mb-4">{t('summary.personalAdvice')}</h4>
            <div className="space-y-3">
              {personalOmen.feng_shui_tip && (
                <div className="bg-white/5 rounded-xl p-3">
                  <span className="text-white text-xs font-bold">{t('omenTab.fengShuiTip')}</span>
                  <p className="text-white/50 text-xs mt-1 leading-relaxed">{personalOmen.feng_shui_tip}</p>
                </div>
              )}
              {personalOmen.health_advice && (
                <div className="bg-white/5 rounded-xl p-3">
                  <span className="text-white text-xs font-bold">{t('omenTab.healthAdvice')}</span>
                  <p className="text-white/50 text-xs mt-1 leading-relaxed">{personalOmen.health_advice}</p>
                </div>
              )}
              {personalOmen.lucky_item && (
                <div className="bg-white/5 rounded-xl p-3">
                  <span className="text-white text-xs font-bold">{t('omenTab.luckyItem')}</span>
                  <p className="text-white/50 text-xs mt-1 leading-relaxed">{personalOmen.lucky_item}</p>
                </div>
              )}
              {personalOmen.caution && (
                <div className="bg-white/5 rounded-xl p-3">
                  <span className="text-white text-xs font-bold">{t('omenTab.caution')}</span>
                  <p className="text-white/50 text-xs mt-1 leading-relaxed">{personalOmen.caution}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 조언 + 행운 정보 */}
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
