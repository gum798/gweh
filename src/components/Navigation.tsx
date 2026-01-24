const tabs = [
  { id: 'omen', label: '괘', icon: '☯️' },
  { id: 'face', label: '관상', icon: '👁️' },
  { id: 'palm', label: '손금', icon: '🖐️' },
  { id: 'saju', label: '사주', icon: '📅' },
];

export default function Navigation({ activeTab, onTabChange }) {
  return (
    <nav className="glass-panel p-2 mb-6">
      <div className="flex justify-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl
              transition-all duration-300 font-mystic
              ${activeTab === tab.id
                ? 'bg-cosmic-gold/20 text-cosmic-gold border border-cosmic-gold/40'
                : 'text-gray-400 hover:text-cosmic-gold hover:bg-mystic-700/50'
              }
            `}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
