export default function LocationPrompt({ onRequestLocation, onSkip, error }) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-md text-center animate-float">
        {/* 아이콘 */}
        <div className="text-6xl mb-6">🔮</div>

        {/* 제목 */}
        <h1 className="text-3xl font-mystic mystic-text mb-4 text-shadow-glow">
          오늘의 괘
        </h1>

        {/* 설명 */}
        <p className="text-gray-300 mb-6 leading-relaxed font-mystic">
          당신이 머무는 곳의 기운이<br />
          오늘의 괘를 달리하리니
        </p>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={onRequestLocation}
            className="w-full px-8 py-3 bg-gradient-to-r from-cosmic-gold to-yellow-600
                       text-mystic-900 font-bold rounded-full
                       hover:from-yellow-500 hover:to-cosmic-gold
                       transition-all duration-300
                       shadow-lg hover:shadow-cosmic-gold/50
                       animate-glow"
          >
            기운 감응 시작
          </button>

          <button
            onClick={onSkip}
            className="w-full px-8 py-3 bg-transparent border border-gray-600
                       text-gray-400 font-medium rounded-full
                       hover:border-cosmic-gold/50 hover:text-cosmic-gold/70
                       transition-all duration-300"
          >
            위치 없이 진행
          </button>
        </div>

        {/* 부연 설명 */}
        <p className="text-gray-500 text-sm mt-4">
          위치 없이 진행하면 서울 기준으로 괘를 내립니다
        </p>
      </div>
    </div>
  );
}
