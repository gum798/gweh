import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PremiumContextType {
  isPremium: boolean;
  setPremium: (value: boolean) => void;
  checkPremiumStatus: () => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const PREMIUM_KEY = 'mystic_ai_premium';

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);

  const checkPremiumStatus = () => {
    // Check localStorage for premium status
    const stored = localStorage.getItem(PREMIUM_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Verify the purchase is valid
        if (data.purchased && (data.checkoutId || data.orderId)) {
          setIsPremium(true);
        }
      } catch {
        // Invalid data, ignore
      }
    }

    // Also check URL for successful purchase callback
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutSuccess = urlParams.get('checkout_success');
    const checkoutId = urlParams.get('checkout_id');

    if (checkoutSuccess === 'true' && checkoutId) {
      // Store premium status
      localStorage.setItem(PREMIUM_KEY, JSON.stringify({
        purchased: true,
        checkoutId: checkoutId,
        purchasedAt: new Date().toISOString(),
      }));
      setIsPremium(true);

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const setPremium = (value: boolean) => {
    setIsPremium(value);
    if (value) {
      localStorage.setItem(PREMIUM_KEY, JSON.stringify({
        purchased: true,
        purchasedAt: new Date().toISOString(),
      }));
    } else {
      localStorage.removeItem(PREMIUM_KEY);
    }
  };

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, setPremium, checkPremiumStatus }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
