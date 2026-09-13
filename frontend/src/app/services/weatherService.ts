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

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  updatedAt: string;
  source: string;
}

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
    const coords = data.coordinates || { lat: DEFAULT_LOCATION.lat, lon: DEFAULT_LOCATION.lon };
    console.debug('[WeatherDebug] location', {
      city: data.location || DEFAULT_LOCATION.fullName,
      latitude: coords.lat,
      longitude: coords.lon,
    });
    console.debug('[WeatherDebug] temperature fields', {
      temperature_2m: currentTemp,
      apparent_temperature: feelsLike,
      relative_humidity_2m: data.current.humidity,
      wind_speed_10m: data.current.wind_speed,
      precipitation_probability: data.current.rain_probability,
      condition: data.current.condition,
      time: data.current.updated_at,
    });
    console.debug('[WeatherDebug] normalized', {
      temperature: currentTemp,
      feelsLike: feelsLike,
      updatedAt: data.current.updated_at || new Date().toISOString(),
      source: data.current.source || 'Open-Meteo Live Service',
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
  const startTime = Date.now();
  const response = await api.get<{ weather: WeatherData; risk: RiskData }>(endpoint, {
    signal,
    timeoutMs: 15000,
  });

  if (!response || !response.weather) {
    throw new Error(`[WeatherService] No weather data returned for location: ${loc}`);
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[WeatherDebug] RAW API', {
      provider: response.weather.current?.source || 'Open-Meteo NWP',
      requestUrl: endpoint,
      city: response.weather.location || loc,
      latitude: response.weather.coordinates?.lat ?? DEFAULT_LOCATION.lat,
      longitude: response.weather.coordinates?.lon ?? DEFAULT_LOCATION.lon,
      responseTimeMs: Date.now() - startTime,
      current: response.weather.current,
    });
  }

  const normalizedWeather = normalizeWeatherResponse(response.weather);

  return {
    weather: normalizedWeather,
    risk: response.risk,
  };
}
