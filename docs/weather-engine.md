# WeatherGPT — Weather Engine & Data Normalization

## 1. Provider Abstraction
Implemented in `app/services/weather_providers.py`:
- `BaseWeatherProvider` (Abstract Base Class)
- `OpenMeteoProvider` (Zero-Key NWP Consensus with GFS/ECMWF assimilation)
- `OpenWeatherProvider` (OpenWeatherMap OneCall 3.0 API)
- `WeatherAPIProvider` (WeatherAPI.com Telemetry)
- `MockWeatherProvider` (Deterministic offline SIH demo provider)

## 2. Normalization Schema
- `WeatherData`: Complete multi-model meteorological object.
- `DailyForecast`: 7-day projection with day-wise metrics and daytime/nighttime boundaries.
- `HourlyForecast`: 3-hour interval slices (12 AM to 9 PM) with temperature, rain probability, condition icon, and wind speed.
- `WeatherAlert`: Official severe weather bulletins.

## 3. Caching & Fallback Pipeline
- Layer 1: Sub-millisecond In-Memory TTL Cache (180 seconds).
- Layer 2: Persistent Relational Cache (`weather_cache` table, 5 minutes).
- Layer 3: Live NWP Providers via resilient connection pooling (`requests.Session` with retries).
- Layer 4: Deterministic Mock Data Fallback (prevents total outage if network fails).
