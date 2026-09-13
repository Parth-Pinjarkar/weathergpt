/**
 * WeatherGPT - Weather Data Service
 * ─────────────────────────────────
 * Handles fetching, normalization, strict validation, and telemetry logging
 * for live weather data. Ensures current temperature is the actual air
 * temperature (Open-Meteo current.temperature_2m) and feels-like is kept separate.
 */

import { api } from '../lib/api';
import { WeatherData, RiskData, NwpModel } from '../lib/types';
import { DEFAULT_LOCATION } from '../constants/location';

export interface CurrentWeatherNormalized {
  temp: number; // Actual current air temperature in °C
  feels_like: number; // Apparent/feels-like temperature in °C
  condition: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  wind_direction?: string;
  pressure: number;
  visibility: number;
  uv_index: number;
  rain_probability: number;
  air_quality: string;
  sunrise: string;
  sunset: string;
  source: string;
  updated_at: string;
}

/**
 * Validates that a temperature value is a valid, finite number.
 * Throws an explicit error if the value is missing or NaN to prevent
 * silent corruption or fallback to 0°C.
 */
export function validateTemperature(temp: unknown, label: string = 'Current temperature'): number {
  if (typeof temp !== 'number' || !Number.isFinite(temp)) {
    throw new Error(`[WeatherService] ${label} is invalid or non-finite: ${String(temp)}`);
  }
  return temp;
}

/**
 * Normalizes and strictly validates the weather payload from the backend.
 */
export function normalizeWeatherResponse(data: WeatherData): WeatherData {
  if (!data || !data.current) {
    throw new Error('[WeatherService] Malformed weather payload: missing current weather');
  }

  // Validate temperatures strictly
  const currentTemp = validateTemperature(data.current.temp, 'Current air temperature');
  const feelsLike = validateTemperature(data.current.feels_like, 'Feels-like temperature');

  // Verify telemetry in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[WeatherService] Telemetry:', {
      location: data.location || DEFAULT_LOCATION.fullName,
      coordinates: data.coordinates || { lat: DEFAULT_LOCATION.lat, lon: DEFAULT_LOCATION.lon },
      provider: data.current.source || 'Open-Meteo NWP',
      timestamp: data.current.updated_at || new Date().toLocaleTimeString(),
      rawCurrentTemperature: currentTemp,
      rawApparentTemperature: feelsLike,
      unit: '°C',
      displayedTemperature: currentTemp,
    });
  }

  return {
    ...data,
    current: {
      ...data.current,
      temp: currentTemp,
      feels_like: feelsLike,
    },
  };
}

/**
 * Fetches current weather and risk analysis with request cancellation support.
 */
export async function fetchCurrentWeather(
  location: string,
  nwpModel: NwpModel = 'ensemble',
  forceRefresh: boolean = false,
  signal?: AbortSignal
): Promise<{ weather: WeatherData; risk: RiskData }> {
  const loc = (location || DEFAULT_LOCATION.fullName).trim();
  const queryParams = new URLSearchParams({
    location: loc,
    nwp_model: nwpModel,
  });

  if (forceRefresh) {
    queryParams.set('refresh', 'true');
  }

  const endpoint = `/api/weather/current?${queryParams.toString()}`;
  const response = await api.get<{ weather: WeatherData; risk: RiskData }>(endpoint, {
    signal,
    timeoutMs: 15000,
  });

  if (!response || !response.weather) {
    throw new Error(`[WeatherService] No weather data returned for location: ${loc}`);
  }

  const normalizedWeather = normalizeWeatherResponse(response.weather);

  return {
    weather: normalizedWeather,
    risk: response.risk,
  };
}
