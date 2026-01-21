import { useState, useEffect } from 'react';
import { fetchNasaApod } from '../utils/api';

export function useNasaApod() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchNasaApod()
      .then((result) => {
        if (!cancelled) {
          setData({
            title: result.title,
            explanation: result.explanation,
            url: result.url,
            hdUrl: result.hdurl,
            mediaType: result.media_type,
            date: result.date,
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
