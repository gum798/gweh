import { useEffect } from 'react';
import { usePremium } from '../contexts/PremiumContext';

// Polar Configuration
const IS_SANDBOX = import.meta.env.VITE_POLAR_SANDBOX === 'true';
// Sandbox: sandbox.polar.sh / Production: polar.sh
const POLAR_BASE_URL = IS_SANDBOX ? 'https://sandbox.polar.sh' : 'https://polar.sh';
// Use sandbox product ID in sandbox mode, production ID otherwise
const POLAR_PRODUCT_ID = IS_SANDBOX
  ? import.meta.env.VITE_POLAR_SANDBOX_PRODUCT_ID
  : import.meta.env.VITE_POLAR_PRODUCT_ID;

export default function PremiumBanner() {
  const { isPremium } = usePremium();

  useEffect(() => {
    // Load Polar Embed Checkout script (official CDN)
    if (!document.getElementById('polar-embed-script')) {
      const script = document.createElement('script');
      script.id = 'polar-embed-script';
      script.src = 'https://cdn.jsdelivr.net/npm/@polar-sh/checkout@latest/dist/embed.global.js';
      script.defer = true;
      script.dataset.autoInit = 'true';
      document.body.appendChild(script);
    }
  }, []);

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

  const successUrl = `${window.location.origin}?checkout_success=true&order_id={CHECKOUT_ID}`;

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

          <a
            href={`${POLAR_BASE_URL}/checkout?productId=${POLAR_PRODUCT_ID}&successUrl=${encodeURIComponent(successUrl)}`}
            data-polar-checkout
            data-polar-checkout-theme="dark"
            className="flex items-center justify-center gap-2 px-8 py-3 bg-[#5b13ec] text-white rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(91,19,236,0.3)] border border-[#5b13ec]/50 hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <span>$1.99</span>
            <span className="text-white/70">•</span>
            <span>Lifetime Access</span>
          </a>
        </div>

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
