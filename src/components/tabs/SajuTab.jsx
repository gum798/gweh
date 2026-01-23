import { useState, useMemo } from 'react';
import { calculateSaju, FIVE_ELEMENTS } from '../../utils/saju';
import { interpretSaju, getTodayFortune } from '../../utils/sajuInterpret';

const ELEMENT_COLORS = {
  목: 'text-green-400',
  화: 'text-red-400',
  토: 'text-yellow-600',
  금: 'text-gray-300',
  수: 'text-blue-400',
};

const ELEMENT_BG = {
  목: 'bg-green-400/20',
  화: 'bg-red-400/20',
  토: 'bg-yellow-600/20',
  금: 'bg-gray-300/20',
  수: 'bg-blue-400/20',
};

export default function SajuTab() {
  const [birthDate, setBirthDate] = useState('');
  const [birthHour, setBirthHour] = useState('12');
  const [result, setResult] = useState(null);

  const hourOptions = useMemo(() => {
    const options = [];
    const hourLabels = [
      '자시 (23:00-01:00)', '축시 (01:00-03:00)', '인시 (03:00-05:00)',
      '묘시 (05:00-07:00)', '진시 (07:00-09:00)', '사시 (09:00-11:00)',
      '오시 (11:00-13:00)', '미시 (13:00-15:00)', '신시 (15:00-17:00)',
      '유시 (17:00-19:00)', '술시 (19:00-21:00)', '해시 (21:00-23:00)',
    ];
    const hourValues = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    for (let i = 0; i < 12; i++) {
      options.push({ value: hourValues[i], label: hourLabels[i] });
    }
    return options;
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!birthDate) return;

    const date = new Date(birthDate);
    const hour = parseInt(birthHour, 10);
    const saju = calculateSaju(date, hour);
    const interpretation = interpretSaju(saju);

    setResult(interpretation);
  };

  const handleReset = () => {
    setResult(null);
    setBirthDate('');
    setBirthHour('12');
  };

  if (!result) {
    return (
      <div className="glass-panel p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📅</div>
          <h2 className="text-2xl mystic-text text-shadow-glow mb-2 font-mystic">
            사주팔자
          </h2>
          <p className="text-gray-400">
            태어난 날과 시를 알려주시면, 천명을 살펴드리리라
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
          <div>
            <label className="data-label block mb-2">생년월일</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 bg-mystic-700/50 border border-cosmic-gold/20
                         rounded-xl text-white focus:outline-none focus:border-cosmic-gold/50
                         transition-colors"
              required
            />
          </div>

          <div>
            <label className="data-label block mb-2">태어난 시</label>
            <select
              value={birthHour}
              onChange={(e) => setBirthHour(e.target.value)}
              className="w-full px-4 py-3 bg-mystic-700/50 border border-cosmic-gold/20
                         rounded-xl text-white focus:outline-none focus:border-cosmic-gold/50
                         transition-colors appearance-none cursor-pointer"
            >
              {hourOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-mystic-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cosmic-gold to-yellow-500
                       text-mystic-900 rounded-xl font-medium font-mystic
                       hover:from-yellow-500 hover:to-cosmic-gold transition-all
                       shadow-lg shadow-cosmic-gold/20"
          >
            사주 풀이 보기
          </button>
        </form>
      </div>
    );
  }

  const { mainMessage, dayMaster, elementAnalysis, elementMessage, zodiac, zodiacMessage, pillars, saju } = result;
  const todayFortune = getTodayFortune(saju);

  return (
    <div className="space-y-6">
      {/* 메인 해석 카드 */}
      <div className="glass-panel p-6 md:p-8 animate-float">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-xl md:text-2xl mystic-text leading-relaxed text-shadow-glow font-mystic">
            "{mainMessage}"
          </p>
        </div>

        {/* 일간 정보 */}
        <div className="bg-mystic-700/50 rounded-xl p-4 mb-6 border border-cosmic-gold/10">
          <div className="text-center">
            <span className="data-label">일간 (본명)</span>
            <p className="text-2xl mystic-text mt-2">{dayMaster.name}</p>
            <p className="text-gray-400 mt-1">
              {dayMaster.nature}의 기운 · {dayMaster.trait} 성정
            </p>
          </div>
        </div>

        {/* 띠 정보 */}
        <div className="text-center mb-4">
          <span className="data-label">{zodiac}띠</span>
          <p className="text-gray-200 mt-2 text-sm leading-relaxed">
            {zodiacMessage}
          </p>
        </div>
      </div>

      {/* 사주팔자 표 */}
      <div className="glass-panel p-6">
        <h3 className="mystic-text text-lg mb-4 text-center font-mystic">사주팔자</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          {pillars.map((p, i) => (
            <div key={i} className="space-y-2">
              <div className="data-label text-xs">{p.name}</div>
              <div className={`text-2xl font-mystic ${ELEMENT_COLORS[FIVE_ELEMENTS[p.pillar.stem]]}`}>
                {p.pillar.stem}
              </div>
              <div className="text-xl text-gray-300">
                {p.pillar.branch}
              </div>
              <div className="text-xs text-gray-500">{p.meaning}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 오행 분석 */}
      <div className="glass-panel p-6">
        <h3 className="mystic-text text-lg mb-4 text-center font-mystic">오행 분포</h3>
        <div className="flex justify-center gap-3 mb-4">
          {Object.entries(elementAnalysis.distribution).map(([element, count]) => (
            <div
              key={element}
              className={`${ELEMENT_BG[element]} px-4 py-2 rounded-lg text-center`}
            >
              <div className={`text-lg font-medium ${ELEMENT_COLORS[element]}`}>
                {element}
              </div>
              <div className="text-gray-400 text-sm">{count}</div>
            </div>
          ))}
        </div>
        <p className="text-gray-300 text-sm text-center leading-relaxed">
          {elementMessage}
        </p>
      </div>

      {/* 오늘의 운세 */}
      <div className="glass-panel p-6">
        <h3 className="mystic-text text-lg mb-4 text-center font-mystic">오늘의 기운</h3>
        <div className="text-center">
          <span className={`inline-block px-4 py-1 rounded-full text-sm mb-3 ${
            todayFortune.level === '대길' ? 'bg-yellow-500/20 text-yellow-400' :
            todayFortune.level === '길' ? 'bg-green-500/20 text-green-400' :
            todayFortune.level === '평' ? 'bg-gray-500/20 text-gray-400' :
            todayFortune.level === '소흉' ? 'bg-orange-500/20 text-orange-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {todayFortune.level}
          </span>
          <p className="text-gray-300 text-sm leading-relaxed">
            {todayFortune.message}
          </p>
        </div>
      </div>

      {/* 다시하기 버튼 */}
      <div className="text-center">
        <button
          onClick={handleReset}
          className="text-cosmic-gold/70 hover:text-cosmic-gold transition-colors text-sm"
        >
          다른 사주 풀이 보기
        </button>
      </div>
    </div>
  );
}
