export default function LocationPrompt({ onRequestLocation, error }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-mystic-900 p-4">
      <div className="glass-panel p-8 max-w-md text-center animate-float">
        {/* 아이콘 */}
        <div className="text-6xl mb-6">🔮</div>

        {/* 제목 */}
        <h1 className="text-3xl font-mystic mystic-text mb-4 text-shadow-glow">
          오늘의 괘
        </h1>

        {/* 설명 */}
        <p className="text-gray-300 mb-6 leading-relaxed">
          당신의 위치에서 관측되는<br />
          우주와 대지의 기운을 읽어드립니다.
        </p>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-6 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* 버튼 */}
        <button
          onClick={onRequestLocation}
          className="px-8 py-3 bg-gradient-to-r from-cosmic-gold to-yellow-600
                     text-mystic-900 font-bold rounded-full
                     hover:from-yellow-500 hover:to-cosmic-gold
                     transition-all duration-300
                     shadow-lg hover:shadow-cosmic-gold/50
                     animate-glow"
        >
          위치 감지 시작
        </button>

        {/* 부연 설명 */}
        <p className="text-gray-500 text-sm mt-4">
          브라우저에서 위치 권한을 요청합니다
        </p>
      </div>
    </div>
  );
}
