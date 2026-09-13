/**
 * WeatherGPT - useWeatherData Hook
 * ────────────────────────────────
 * Manages weather state, caching, model switching, and race-condition-free updates.
 * Directly integrates with weatherService for strict validation and telemetry.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData, RiskData, NwpModel } from '../lib/types';
import { DEFAULT_LOCATION } from '../constants/location';
import { fetchCurrentWeather } from '../services/weatherService';

export function useWeatherData(initialLocation: string = DEFAULT_LOCATION.fullName) {
  const [location, setLocation] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedLoc = localStorage.getItem('weathergpt_location');
      if (savedLoc) return savedLoc;
    }
    return initialLocation;
  });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [activeModel, setActiveModel] = useState<NwpModel>('ensemble');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchWeather = useCallback(
    async (locToFetch?: string, modelOverride?: NwpModel, bypassCache = false) => {
      const loc = (locToFetch || location || DEFAULT_LOCATION.fullName).trim();
      const nwpToUse = modelOverride || activeModel;

      // Increment request ID to ignore stale responses
      const currentRequestId = ++requestIdRef.current;

      // Abort any ongoing in-flight request
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      activeAbortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      // Check short client-side cache (1 minute TTL) if not bypassing
      if (!bypassCache && typeof window !== 'undefined') {
        try {
          const cacheKey = `weather_cache_${loc.toLowerCase()}_${nwpToUse}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 60 * 1000) {
              if (isMountedRef.current && currentRequestId === requestIdRef.current) {
                setWeather(data.weather);
                setRisk(data.risk);
                setLoading(false);
                return;
              }
            }
          }
        } catch (e) {
          console.warn('Weather cache read failed:', e);
        }
      }

      try {
        const data = await fetchCurrentWeather(loc, nwpToUse, bypassCache, controller.signal);

        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
          return;
        }

        if (data && data.weather) {
          setWeather(data.weather);
          if (data.risk) {
            setRisk(data.risk);
          }

          // Cache successful fetch
          if (typeof window !== 'undefined') {
            try {
              const cacheKey = `weather_cache_${loc.toLowerCase()}_${nwpToUse}`;
              localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  data,
                  timestamp: Date.now(),
                })
              );
            } catch (e) {
              console.warn('Weather cache write failed:', e);
            }
          }
        } else {
          setError('Weather data unavailable for this location.');
        }
      } catch (err: unknown) {
        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
          return;
        }
        if ((err as Error)?.name === 'AbortError') {
          return; // Intentionally aborted for newer request
        }
        const errorMsg = (err as Error)?.message || 'Weather network timeout or offline error';
        setError(errorMsg);
      } finally {
        if (isMountedRef.current && currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [location, activeModel]
  );

  const changeLocation = useCallback(
    (newLocation: string) => {
      const loc = newLocation.trim();
      if (!loc) return;
      setLocation(loc);
      if (typeof window !== 'undefined') {
        localStorage.setItem('weathergpt_location', loc);
      }
      fetchWeather(loc, activeModel, true);
    },
    [activeModel, fetchWeather]
  );

  const changeModel = useCallback(
    (model: NwpModel) => {
      setActiveModel(model);
      fetchWeather(location, model, true);
    },
    [location, fetchWeather]
  );

  const refresh = useCallback(() => {
    return fetchWeather(location, activeModel, true);
  }, [location, activeModel, fetchWeather]);

  useEffect(() => {
    let ignore = false;
    const loadInitialData = async () => {
      if (!ignore) {
        await fetchWeather(location, activeModel, false);
      }
    };
    loadInitialData();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    location,
    weather,
    risk,
    activeModel,
    loading,
    error,
    changeLocation,
    changeModel,
    refresh,
    fetchWeather,
    setWeather,
    setRisk,
  };
}
