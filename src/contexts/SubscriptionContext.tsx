import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isTrialing: boolean;
  trialEndsAt: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  subscribe: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { session, user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setIsSubscribed(false);
      setIsTrialing(false);
      setTrialEndsAt(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscription-status', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setIsSubscribed(data.subscribed === true);
      setIsTrialing(data.trialing === true);
      setTrialEndsAt(data.trialEndsAt || null);
    } catch {
      setIsSubscribed(false);
      setIsTrialing(false);
      setTrialEndsAt(null);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Check on login/session change
  useEffect(() => {
    if (session?.access_token) {
      checkSubscription();
    } else {
      setIsSubscribed(false);
    }
  }, [session?.access_token]);

  // Check on subscription_success URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription_success') === 'true') {
      if (session?.access_token) {
        // Retry with increasing delay for webhook processing
        const tryCheck = async (attempt = 0) => {
          await checkSubscription();
          // If not subscribed yet and attempts remain, retry
          if (attempt < 3) {
            setTimeout(() => tryCheck(attempt + 1), 2000 * (attempt + 1));
          }
        };
        tryCheck();
      }
    }
  }, [session?.access_token]);

  const subscribe = useCallback(async () => {
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: user?.email }),
      });
      if (!res.ok) throw new Error('Failed to create subscription');
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Subscribe error:', error);
    }
  }, [user?.email]);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, isTrialing, trialEndsAt, loading, checkSubscription, subscribe }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
}
