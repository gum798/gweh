import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateSaju, FIVE_ELEMENTS } from '../../utils/saju';
import { interpretSaju, getTodayFortune } from '../../utils/sajuInterpret';
import { useAuth } from '../../contexts/AuthContext';
import { lunarToSolar, getLunarMonthDays } from '../../utils/lunarCalendar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { LevelPill } from '../ui/LevelPill';

type CalendarType = 'solar' | 'lunar';

// 오행 5색을 상태 토큰의 잉크/틴트 쌍에 맞춘다. 원시 팔레트(emerald/red/amber/blue-NNN)는
// scripts/check-contrast.mjs 가 검사하지 않는 값이라 AA 를 보장할 수 없었다.
// 금(金)만 대응하는 상태색이 없어 중립 gal 토큰을 쓴다 — LevelPill 의 '평' 과 같은 처리다.
const ELEMENT_COLORS = {
  목: 'text-status-success',
  화: 'text-status-danger',
  토: 'text-status-warning',
  금: 'text-gal-body',
  수: 'text-status-info',
};

const SAJU_INPUT_KEY = 'mystic_saju_input';

const ELEMENT_BG = {
  목: 'bg-status-success-light border-status-success/30',
  화: 'bg-status-danger-light border-status-danger/30',
  토: 'bg-status-warning-light border-status-warning/30',
  금: 'bg-gal-bg border-gal-border',
  수: 'bg-status-info-light border-status-info/30',
};

export default function SajuTab() {
  const { t } = useTranslation('saju');
  const { t: tc } = useTranslation();
  const { session, loading: authLoading } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [birthHour, setBirthHour] = useState('12');
  const [calendarType, setCalendarType] = useState<CalendarType>('solar');
  const [lunarYear, setLunarYear] = useState('');
  const [lunarMonth, setLunarMonth] = useState('');
  const [lunarDay, setLunarDay] = useState('');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [lunarError, setLunarError] = useState('');
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
          if (parsed.calendarType) setCalendarType(parsed.calendarType);
          if (parsed.lunarYear) setLunarYear(String(parsed.lunarYear));
          if (parsed.lunarMonth) setLunarMonth(String(parsed.lunarMonth));
          if (parsed.lunarDay) setLunarDay(String(parsed.lunarDay));
          if (parsed.isLeapMonth) setIsLeapMonth(parsed.isLeapMonth);
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
            if (d.profile?.calendar_type) setCalendarType(d.profile.calendar_type);
            localStorage.setItem(SAJU_INPUT_KEY, JSON.stringify({
              birthDate: d.profile.birth_date,
              birthHour: d.profile.birth_hour ?? 12,
              calendarType: d.profile.calendar_type || 'solar',
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

  // 음력 연도 옵션 (1920~현재)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= 1920; y--) years.push(y);
    return years;
  }, [currentYear]);

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const dayOptions = useMemo(() => {
    if (lunarYear && lunarMonth) {
      const maxDays = getLunarMonthDays(parseInt(lunarYear, 10), parseInt(lunarMonth, 10), isLeapMonth);
      return Array.from({ length: maxDays }, (_, i) => i + 1);
    }
    return Array.from({ length: 30 }, (_, i) => i + 1);
  }, [lunarYear, lunarMonth, isLeapMonth]);

  // 선택된 일이 최대 일수를 초과하면 보정
  useEffect(() => {
    if (lunarDay && dayOptions.length > 0 && parseInt(lunarDay, 10) > dayOptions.length) {
      setLunarDay(String(dayOptions.length));
    }
  }, [dayOptions, lunarDay]);

  const saveBirthToProfile = useCallback((date: string, hour: number, calType: CalendarType) => {
    if (!session?.access_token) return;
    fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ birth_date: date, birth_hour: hour, calendar_type: calType }),
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
      saveBirthToProfile(birthDate, hour, calendarType);
    }
  }, [ready, birthDate, birthHour, calendarType, saveBirthToProfile]);

  // 음력 날짜를 양력으로 변환하여 birthDate에 설정
  const resolveBirthDate = useCallback((): string | null => {
    if (calendarType === 'solar') return birthDate || null;

    if (!lunarYear || !lunarMonth || !lunarDay) return null;

    const solarDate = lunarToSolar(
      parseInt(lunarYear, 10),
      parseInt(lunarMonth, 10),
      parseInt(lunarDay, 10),
      isLeapMonth
    );

    if (!solarDate) {
      setLunarError(tc('saju.lunarError'));
      return null;
    }

    setLunarError('');
    return solarDate;
  }, [calendarType, birthDate, lunarYear, lunarMonth, lunarDay, isLeapMonth, tc]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    const resolvedDate = resolveBirthDate();
    if (!resolvedDate) return;

    const date = new Date(resolvedDate);
    if (date > new Date()) return;
    const hour = parseInt(birthHour, 10);

    setResult(interpretSaju(calculateSaju(date, hour)));

    const saveData: any = {
      birthDate: resolvedDate,
      birthHour: hour,
      calendarType,
    };
    if (calendarType === 'lunar') {
      saveData.lunarYear = parseInt(lunarYear, 10);
      saveData.lunarMonth = parseInt(lunarMonth, 10);
      saveData.lunarDay = parseInt(lunarDay, 10);
      saveData.isLeapMonth = isLeapMonth;
    }

    localStorage.setItem(SAJU_INPUT_KEY, JSON.stringify(saveData));
    saveBirthToProfile(resolvedDate, hour, calendarType);
  }, [birthDate, birthHour, calendarType, lunarYear, lunarMonth, lunarDay, isLeapMonth, resolveBirthDate, saveBirthToProfile]);

  const handleReset = useCallback(() => {
    setResult(null);
    setBirthDate('');
    setBirthHour('12');
    setCalendarType('solar');
    setLunarYear('');
    setLunarMonth('');
    setLunarDay('');
    setIsLeapMonth(false);
    setLunarError('');
    localStorage.removeItem(SAJU_INPUT_KEY);
    autoSubmitted.current = false;
  }, []);

  if (!result) {
    return (
      <div className="space-y-8">
        {/* heroTitle1·2 는 한 문장의 두 조각이다 — PalmTab 의 같은 위치 주석 참고.
            eyebrow 후보 saju.fourPillars 는 en 에서 "FOUR PILLARS" 가 되어
            title "Four Pillars of Destiny" 와 겹치므로 쓰지 않는다. */}
        <PageHeader
          title={`${tc('saju.heroTitle1')} ${tc('saju.heroTitle2')}`}
          subtitle={tc('saju.heroDesc')}
        />

        {/* Input Form */}
        <section className="px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-gal-black text-xl font-bold tracking-tight pb-1">{tc('saju.birthInfo')}</h3>
              <div className="h-1 w-12 bg-gal-accent mx-auto rounded-full"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="space-y-6">

                {/* Calendar Type Toggle */}
                {/* 선택 표시는 슬라이딩 썸이다. 채움색만으로는 트랙 대비 2.43:1 이라
                    어느 쪽이 선택됐는지가 1.4.11 의 3:1 을 못 넘는다. 채움은 브랜드
                    보라 그대로 두고(그 위 흰 글씨 7.64:1) **잉크 테두리**를 둘러
                    경계로 8.72:1 을 만든다. 썸을 통째로 밝은 색으로 바꾸는 쪽은
                    글자를 어둡게 뒤집어야 하는데, 썸이 300ms 동안 미끄러지는 사이
                    글자만 먼저 어두워져 트랙 위에서 1:1 이 되는 구간이 생긴다. */}
                <div>
                  <p className="text-gal-body text-xs font-bold uppercase tracking-widest pl-1 mb-3">{tc('saju.calendarType')}</p>
                  <div className="relative flex bg-gal-bg rounded-gal-lg p-1 border border-gal-border">
                    <div
                      className="absolute top-1 bottom-1 rounded-gal-md bg-gal-accent border border-gal-accent-ink shadow-gal-button transition-all duration-300 ease-out"
                      style={{
                        left: calendarType === 'solar' ? '4px' : '50%',
                        width: 'calc(50% - 4px)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setCalendarType('solar')}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-gal-md text-sm font-semibold transition-colors duration-200 ${
                        calendarType === 'solar' ? 'text-white' : 'text-gal-muted hover:text-gal-body'
                      }`}
                    >
                      <span className="text-base">&#9788;</span>
                      {tc('saju.solar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarType('lunar')}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 rounded-gal-md text-sm font-semibold transition-colors duration-200 ${
                        calendarType === 'lunar' ? 'text-white' : 'text-gal-muted hover:text-gal-body'
                      }`}
                    >
                      <span className="text-base">&#9790;</span>
                      {tc('saju.lunar')}
                    </button>
                  </div>
                </div>

                {/* Birth Date Input */}
                <label className="block">
                  <p className="text-gal-body text-xs font-bold uppercase tracking-widest pl-1 mb-2">{tc('saju.birthDate')}</p>

                  {calendarType === 'solar' ? (
                    /* 입력이 카드 오른쪽 경계를 넘어가던 문제.
                       계획서는 "플렉스/그리드 자식의 기본 min-width:auto" 를
                       원인으로 지목했지만, 여기서는 그 기전이 성립하지 않는다 —
                       이 입력을 감싼 label 이 block 이라 자동 최소 크기 규칙의
                       대상이 아니고, 실제로 계산된 min-width 는 이 변경 전에도
                       0px 이었다(측정으로 확인). 넘치게 만드는 것은 WebKit 이
                       값을 그리는 내부 pseudo 요소이며, 그쪽이 고유 너비를
                       주장한다. 실제 처방은 index.css 에 있다.

                       min-w-0 은 그래서 처방이 아니라 잠금장치다: 이 label 이
                       나중에 플렉스나 그리드 자식이 되면 그때는 진짜로 필요해진다.

                       text-left 도 같은 짝이다. 두 컨트롤의 안쪽 여백이 같은데도
                       iOS 에서는 날짜만 가운데로 보이는데, 값을 그리는 주체가
                       입력 자신이 아니라서 바깥 정렬만으로는 닿지 않는다. */
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full min-w-0 rounded-gal-lg text-gal-black text-left focus:outline-none focus:ring-1 focus:ring-gal-accent-ink border border-gal-border bg-gal-bg h-14 placeholder:text-gal-muted px-4 text-lg font-medium transition-all focus:bg-gal-light"
                      required
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {/* 음력 연도 */}
                        <div className="relative">
                          <select
                            value={lunarYear}
                            onChange={(e) => setLunarYear(e.target.value)}
                            className="w-full rounded-gal-lg text-gal-black focus:outline-none focus:ring-1 focus:ring-gal-accent-ink border border-gal-border bg-gal-bg h-14 px-3 text-sm font-medium transition-all focus:bg-gal-light appearance-none cursor-pointer"
                            required
                          >
                            <option value="" disabled>{tc('saju.year')}</option>
                            {yearOptions.map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gal-muted text-xs pointer-events-none">{tc('saju.yearUnit')}</span>
                        </div>
                        {/* 음력 월 */}
                        <div className="relative">
                          <select
                            value={lunarMonth}
                            onChange={(e) => setLunarMonth(e.target.value)}
                            className="w-full rounded-gal-lg text-gal-black focus:outline-none focus:ring-1 focus:ring-gal-accent-ink border border-gal-border bg-gal-bg h-14 px-3 text-sm font-medium transition-all focus:bg-gal-light appearance-none cursor-pointer"
                            required
                          >
                            <option value="" disabled>{tc('saju.month')}</option>
                            {monthOptions.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gal-muted text-xs pointer-events-none">{tc('saju.monthUnit')}</span>
                        </div>
                        {/* 음력 일 */}
                        <div className="relative">
                          <select
                            value={lunarDay}
                            onChange={(e) => setLunarDay(e.target.value)}
                            className="w-full rounded-gal-lg text-gal-black focus:outline-none focus:ring-1 focus:ring-gal-accent-ink border border-gal-border bg-gal-bg h-14 px-3 text-sm font-medium transition-all focus:bg-gal-light appearance-none cursor-pointer"
                            required
                          >
                            <option value="" disabled>{tc('saju.day')}</option>
                            {dayOptions.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gal-muted text-xs pointer-events-none">{tc('saju.dayUnit')}</span>
                        </div>
                      </div>

                      {/* 윤달 토글 */}
                      <button
                        type="button"
                        onClick={() => setIsLeapMonth(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-gal-md text-xs font-medium transition-all ${
                          isLeapMonth
                            ? 'bg-gal-accent/10 text-gal-accent-ink border border-gal-accent-ink'
                            : 'bg-gal-bg text-gal-muted border border-gal-border hover:text-gal-body'
                        }`}
                      >
                        {/* 트랙 색은 켜짐이 꺼짐보다 **밝아야** 한다. 값 교체 직후에는
                            켜짐 #5b13ec(L=0.087) < 꺼짐 #8175a4(L=0.201) 로 꺼진 쪽이
                            2.3배 밝았다 — 흰 바탕에서는 맞고 #161022 위에서는 거꾸로다.
                            켜짐을 잉크로 올리고 손잡이를 페이지색으로 뒤집는다:
                            손잡이 대비 켜짐 8.72:1 / 꺼짐 4.43:1, 트랙 대비 배경 둘 다 3:1 이상. */}
                        <div className={`w-8 h-[18px] rounded-full relative transition-colors ${
                          isLeapMonth ? 'bg-gal-accent-ink' : 'bg-gal-border'
                        }`}>
                          <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-gal-bg shadow-sm transition-transform ${
                            isLeapMonth ? 'translate-x-[16px]' : 'translate-x-[2px]'
                          }`} />
                        </div>
                        {tc('saju.leapMonth')}
                      </button>

                      {lunarError && (
                        <p className="text-status-danger text-xs pl-1">{lunarError}</p>
                      )}
                    </div>
                  )}
                </label>

                <label className="block">
                  <p className="text-gal-body text-xs font-bold uppercase tracking-widest pl-1 mb-2">{tc('saju.birthHour')}</p>
                  {/* 위 날짜 입력과 짝이다 — 시작점(px-4)과 정렬(text-left)을
                      명시적으로 같게 둔다. 값 길이가 서로 많이 달라서, 둘 중
                      하나라도 가운데로 그려지면 세로로 어긋나 보인다. */}
                  <select
                    value={birthHour}
                    onChange={(e) => setBirthHour(e.target.value)}
                    className="w-full min-w-0 rounded-gal-lg text-gal-black text-left focus:outline-none focus:ring-1 focus:ring-gal-accent-ink border border-gal-border bg-gal-bg h-14 px-4 text-base font-medium transition-all focus:bg-gal-light appearance-none cursor-pointer"
                  >
                    {hourOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-gal-light">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </Card>

              <Button type="submit" variant="primary" size="lg" fullWidth>
                {tc('saju.revealDestiny')}
              </Button>
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
        <Card className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-gal-accent-ink text-label font-bold uppercase">{tc('saju.fourPillars')}</span>
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
            <p className="text-gal-accent-ink text-xs uppercase tracking-widest mb-2">{t('dayMaster')}</p>
            <p className="text-gal-black text-2xl font-bold">{dayMaster.name}</p>
            <p className="text-gal-muted text-sm mt-1">
              {tc('saju.dayMasterEnergy', { nature: dayMaster.nature, trait: dayMaster.trait })}
            </p>
          </div>
        </Card>
      </section>

      {/* 띠 정보 */}
      <section className="px-4">
        <Card className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{{ '쥐': '🐀', '소': '🐂', '호랑이': '🐅', '토끼': '🐇', '용': '🐉', '뱀': '🐍', '말': '🐎', '양': '🐏', '원숭이': '🐒', '닭': '🐓', '개': '🐕', '돼지': '🐖' }[zodiac] || '🐉'}</span>
            <div>
              <p className="text-gal-accent-ink text-xs uppercase tracking-widest">{t('zodiac')}</p>
              <p className="text-gal-black font-bold text-lg">{tc('saju.zodiacSuffix', { zodiac })}</p>
            </div>
          </div>
          <p className="text-gal-body text-sm leading-relaxed">
            {zodiacMessage}
          </p>
        </Card>
      </section>

      {/* 사주팔자 표 */}
      <section className="px-4">
        <Card className="max-w-md mx-auto">
          <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent-ink mb-4">{t('chart')}</h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            {pillars.map((p, i) => (
              <div key={i} className="bg-gal-bg rounded-gal-lg p-3 border border-gal-border">
                <div className="text-gal-muted text-xs uppercase tracking-widest mb-2">{p.name}</div>
                <div className={`text-2xl font-bold mb-1 ${ELEMENT_COLORS[FIVE_ELEMENTS[p.pillar.stem]]}`}>
                  {p.pillar.stem}
                </div>
                <div className="text-gal-black text-lg mb-1">
                  {p.pillar.branch}
                </div>
                <div className="text-gal-muted text-xs">{p.meaning}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 오행 분석 */}
      <section className="px-4">
        <Card className="max-w-md mx-auto">
          <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent-ink mb-4">{t('fiveElements')}</h4>
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
        </Card>
      </section>

      {/* 오늘의 운세 */}
      <section className="px-4">
        <Card variant="accent" className="max-w-md mx-auto">
          <h4 className="font-bold uppercase tracking-widest text-xs text-gal-accent-ink mb-4">{t('todayFortune')}</h4>
          <div className="text-center">
            <div className="mb-4">
              <LevelPill level={todayFortune.level} />
            </div>
            <p className="text-gal-body text-sm leading-relaxed">
              {todayFortune.message}
            </p>
          </div>
        </Card>
      </section>

      {/* Reset Button */}
      <div className="px-4 pt-4">
        <div className="max-w-md mx-auto">
          <Button variant="secondary" fullWidth onClick={handleReset}>
            {tc('saju.newReading')}
          </Button>
        </div>
      </div>
    </div>
  );
}
