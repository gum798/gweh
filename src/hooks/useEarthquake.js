import { useState, useEffect } from 'react';
import { fetchEarthquakes } from '../utils/api';

export function useEarthquake() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchEarthquakes()
      .then((result) => {
        if (!cancelled) {
          const earthquakes = result.features.map((f) => ({
            magnitude: f.properties.mag,
            place: f.properties.place,
            time: new Date(f.properties.time),
            depth: f.geometry.coordinates[2],
            coordinates: {
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0],
            },
          }));

          const totalCount = earthquakes.length;
          const avgMagnitude = totalCount > 0
            ? earthquakes.reduce((sum, eq) => sum + eq.magnitude, 0) / totalCount
            : 0;
          const maxMagnitude = totalCount > 0
            ? Math.max(...earthquakes.map((eq) => eq.magnitude))
            : 0;
          const strongest = earthquakes.find((eq) => eq.magnitude === maxMagnitude);

          setData({
            count: totalCount,
            avgMagnitude: Math.round(avgMagnitude * 10) / 10,
            maxMagnitude,
            strongest,
            recentQuakes: earthquakes.slice(0, 5),
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
