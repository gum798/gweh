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
      window.history.replaceState({}, '', window.location.pathname);
      if (session?.access_token) {
        // Delay to allow webhook processing
        setTimeout(() => checkSubscription(), 2000);
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
