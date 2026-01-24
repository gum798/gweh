import { useState, useEffect, useRef } from 'react';
import { fetchNasaApod, fetchEarthquakes } from '../utils/api';

// 캐시 키 상수
const CACHE_KEYS = {
  NASA: 'gweh_nasa_cache',
  EARTHQUAKE: 'gweh_earthquake_cache',
};

// 캐시 유효 시간 (밀리초)
const CACHE_DURATION = {
  NASA: 24 * 60 * 60 * 1000, // 24시간 (하루에 한 번 변경)
  EARTHQUAKE: 10 * 60 * 1000, // 10분
};

function getFromCache(key, duration) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > duration;

    return isExpired ? null : data;
  } catch {
    return null;
  }
}

function setToCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage 용량 초과 등 무시
  }
}

function transformNasaData(result) {
  return {
    title: result.title,
    explanation: result.explanation,
    url: result.url,
    hdUrl: result.hdurl,
    mediaType: result.media_type,
    date: result.date,
  };
}

function transformEarthquakeData(result) {
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

  return {
    count: totalCount,
    avgMagnitude: Math.round(avgMagnitude * 10) / 10,
    maxMagnitude,
    strongest,
    recentQuakes: earthquakes.slice(0, 5),
  };
}

/**
 * NASA APOD와 지진 데이터를 병렬로 가져오는 훅
 * localStorage 캐싱 적용 (async-parallel, js-cache-storage)
 */
export function useParallelData() {
  const [nasa, setNasa] = useState(() => getFromCache(CACHE_KEYS.NASA, CACHE_DURATION.NASA));
  const [earthquake, setEarthquake] = useState(() => getFromCache(CACHE_KEYS.EARTHQUAKE, CACHE_DURATION.EARTHQUAKE));
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({ nasa: null, earthquake: null });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      const cachedNasa = getFromCache(CACHE_KEYS.NASA, CACHE_DURATION.NASA);
      const cachedEarthquake = getFromCache(CACHE_KEYS.EARTHQUAKE, CACHE_DURATION.EARTHQUAKE);

      // 캐시된 데이터가 있으면 먼저 설정
      if (cachedNasa) setNasa(cachedNasa);
      if (cachedEarthquake) setEarthquake(cachedEarthquake);

      // 둘 다 캐시되어 있으면 로딩 완료
      if (cachedNasa && cachedEarthquake) {
        setLoading(false);
        return;
      }

      // 캐시 없는 데이터만 병렬 fetch (async-parallel)
      const promises = [];
      const fetchTypes = [];

      if (!cachedNasa) {
        promises.push(fetchNasaApod());
        fetchTypes.push('nasa');
      }
      if (!cachedEarthquake) {
        promises.push(fetchEarthquakes());
        fetchTypes.push('earthquake');
      }

      try {
        const results = await Promise.allSettled(promises);

        if (!mountedRef.current) return;

        const newErrors = { nasa: null, earthquake: null };

        results.forEach((result, index) => {
          const type = fetchTypes[index];

          if (result.status === 'fulfilled') {
            if (type === 'nasa') {
              const transformed = transformNasaData(result.value);
              setNasa(transformed);
              setToCache(CACHE_KEYS.NASA, transformed);
              newErrors.nasa = null;
            } else if (type === 'earthquake') {
              const transformed = transformEarthquakeData(result.value);
              setEarthquake(transformed);
              setToCache(CACHE_KEYS.EARTHQUAKE, transformed);
              newErrors.earthquake = null;
            }
          } else {
            if (type === 'nasa') {
              newErrors.nasa = result.reason?.message || 'NASA 데이터를 가져올 수 없습니다';
            } else if (type === 'earthquake') {
              newErrors.earthquake = result.reason?.message || '지진 데이터를 가져올 수 없습니다';
            }
          }
        });

        setErrors(newErrors);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { nasa, earthquake, loading, errors };
}
