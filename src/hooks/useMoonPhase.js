import { useState, useEffect } from 'react';
import { calculateMoonPhase } from '../utils/api';

export function useMoonPhase() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const moonData = calculateMoonPhase(new Date());
    setData(moonData);
  }, []);

  return { data, loading: false, error: null };
}
