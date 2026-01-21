import { useState, useEffect } from 'react';
import { fetchWeather } from '../utils/api';

export function useWeather(lat, lon) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchWeather(lat, lon)
      .then((result) => {
        if (!cancelled) {
          setData({
            temperature: Math.round(result.main.temp),
            feelsLike: Math.round(result.main.feels_like),
            humidity: result.main.humidity,
            pressure: result.main.pressure,
            description: result.weather[0].description,
            icon: result.weather[0].icon,
            windSpeed: result.wind.speed,
            windDeg: result.wind.deg,
            clouds: result.clouds.all,
            visibility: result.visibility,
            cityName: result.name,
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
  }, [lat, lon]);

  return { data, loading, error };
}
