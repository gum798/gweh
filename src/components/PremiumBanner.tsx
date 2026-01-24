import { useState } from 'react';
import { usePremium } from '../contexts/PremiumContext';

export default function PremiumBanner() {
  const { isPremium } = usePremium();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 선택적: 고객 이메일, 메타데이터 추가 가능
          // customerEmail: 'user@example.com',
          // metadata: { userId: '123' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      const { url } = await response.json();

      // Polar Checkout 페이지로 리다이렉트
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsLoading(false);
    }
  };

  if (isPremium) {
    return (
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="bg-gradient-to-r from-[#5b13ec]/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-[#5b13ec]/30 p-4 flex items-center justify-center gap-3">
          <span className="text-xl">✨</span>
          <span className="text-white font-medium">Premium Member</span>
          <span className="px-2 py-0.5 bg-[#5b13ec] rounded-full text-white text-xs font-bold">LIFETIME</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mb-6">
      <div className="bg-[rgba(34,25,51,0.6)] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-2xl">🔮</span>
              <h3 className="text-white font-bold text-lg">Unlock MYSTIC AI Premium</h3>
            </div>
            <p className="text-white/50 text-sm">
              Unlimited readings, AI Fashion Consulting, and all future updates
            </p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-[#5b13ec] text-white rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(91,19,236,0.3)] border border-[#5b13ec]/50 hover:scale-105 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>$1.99</span>
                <span className="text-white/70">•</span>
                <span>Lifetime Access</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 text-center text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1">✓ Unlimited Readings</span>
            <span className="flex items-center gap-1">✓ AI Fashion Stylist</span>
            <span className="flex items-center gap-1">✓ Detailed Analysis</span>
            <span className="flex items-center gap-1">✓ Future Updates</span>
          </div>
        </div>
      </div>
    </div>
  );
}
