"""
WeatherGPT — Weather Provider Abstraction & Normalization
──────────────────────────────────────────────────────────
Implements modular provider architecture:
  • BaseWeatherProvider (Abstract Base)
  • OpenMeteoProvider (Default, Zero-Key, High-Resolution NWP)
  • OpenWeatherProvider (OpenWeatherMap API)
  • WeatherAPIProvider (WeatherAPI.com)
  • MockWeatherProvider (SIH Offline & Hackathon Demo)
  • get_weather_provider() Factory
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import requests
from app.config.settings import settings


# ── Normalized Data Models ───────────────────────────────────────────────────

class WeatherLocation(BaseModel):
    name: str
    state: Optional[str] = None
    country: str = "India"
    lat: float
    lon: float
    timezone: str = "Asia/Kolkata"


class HourlyForecast(BaseModel):
    time: str
    temp: float
    condition: str
    icon: str
    rain_probability: int = 0
    wind: float = 0.0


class DailyForecast(BaseModel):
    date: str
    date_iso: str
    day: str
    temp: float
    temp_min: float
    temp_max: float
    condition: str
    icon: str
    humidity: int
    wind: float
    rain_probability: int
    risk_level: str
    recommendation: str
    hourly: List[Dict[str, Any]] = Field(default_factory=list)


# ── Base Weather Provider ─────────────────────────────────────────────────────

class BaseWeatherProvider(ABC):
    """Abstract base class for all weather data providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def get_weather(self, location: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
        """Fetch current weather and 7-day forecast normalized to WeatherGPT schema."""
        pass


# ── Open-Meteo Provider (Default, Zero API Key Required) ──────────────────────

class OpenMeteoProvider(BaseWeatherProvider):
    @property
    def provider_name(self) -> str:
        return "Open-Meteo NWP Consensus"

    def get_weather(self, location: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
        from app.services.weather_service import fetch_live_open_meteo, DEMO_COORDINATES
        
        target_lat = lat
        target_lon = lon
        loc_clean = location.lower().split(",")[0].strip()

        if target_lat is None or target_lon is None:
            if loc_clean in DEMO_COORDINATES:
                target_lat = DEMO_COORDINATES[loc_clean]["lat"]
                target_lon = DEMO_COORDINATES[loc_clean]["lon"]
            else:
                target_lat, target_lon = 20.0059, 73.7797  # Default to Nashik

        data = fetch_live_open_meteo(target_lat, target_lon, location)
        if data:
            data["provider"] = self.provider_name
            return data

        # Fallback to mock if network issue
        return MockWeatherProvider().get_weather(location, lat, lon)


# ── OpenWeatherMap Provider ───────────────────────────────────────────────────

class OpenWeatherProvider(BaseWeatherProvider):
    @property
    def provider_name(self) -> str:
        return "OpenWeatherMap"

    def get_weather(self, location: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
        api_key = settings.OPENWEATHER_API_KEY
        if not api_key:
            return OpenMeteoProvider().get_weather(location, lat, lon)

        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}&units=metric"
            resp = requests.get(url, timeout=4)
            if resp.status_code == 200:
                raw = resp.json()
                weather_data = {
                    "location": f"{raw.get('name', location)}, India",
                    "coordinates": {"lat": raw['coord']['lat'], "lon": raw['coord']['lon']},
                    "current": {
                        "temp": round(raw['main']['temp'], 1),
                        "feels_like": round(raw['main']['feels_like'], 1),
                        "condition": raw['weather'][0]['main'],
                        "icon": "cloud-rain" if "rain" in raw['weather'][0]['main'].lower() else "sun",
                        "humidity": raw['main']['humidity'],
                        "wind_speed": round(raw['wind']['speed'] * 3.6, 1),
                        "wind_direction": "W",
                        "pressure": raw['main']['pressure'],
                        "visibility": round(raw.get('visibility', 10000) / 1000, 1),
                        "uv_index": 5.0,
                        "rain_probability": 20,
                        "air_quality": "Satisfactory (AQI 55)",
                        "sunrise": "06:15 AM",
                        "sunset": "06:45 PM",
                        "source": "OpenWeatherMap API",
                        "provider": self.provider_name
                    },
                    "forecast": OpenMeteoProvider().get_weather(location, raw['coord']['lat'], raw['coord']['lon']).get("forecast", [])
                }
                return weather_data
        except Exception:
            pass

        return OpenMeteoProvider().get_weather(location, lat, lon)


# ── WeatherAPI Provider ───────────────────────────────────────────────────────

class WeatherAPIProvider(BaseWeatherProvider):
    @property
    def provider_name(self) -> str:
        return "WeatherAPI.com"

    def get_weather(self, location: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
        api_key = settings.WEATHERAPI_API_KEY
        if not api_key:
            return OpenMeteoProvider().get_weather(location, lat, lon)

        try:
            url = f"https://api.weatherapi.com/v1/forecast.json?key={api_key}&q={location}&days=7&aqi=yes"
            resp = requests.get(url, timeout=4)
            if resp.status_code == 200:
                raw = resp.json()
                curr = raw["current"]
                loc = raw["location"]
                return {
                    "location": f"{loc['name']}, {loc['region']}",
                    "coordinates": {"lat": loc['lat'], "lon": loc['lon']},
                    "current": {
                        "temp": round(curr['temp_c'], 1),
                        "feels_like": round(curr['feelslike_c'], 1),
                        "condition": curr['condition']['text'],
                        "icon": "cloud-rain" if "rain" in curr['condition']['text'].lower() else "sun",
                        "humidity": curr['humidity'],
                        "wind_speed": round(curr['wind_kph'], 1),
                        "wind_direction": curr['wind_dir'],
                        "pressure": curr['pressure_mb'],
                        "visibility": curr['vis_km'],
                        "uv_index": curr['uv'],
                        "rain_probability": 35,
                        "air_quality": "Moderate (AQI 65)",
                        "sunrise": "06:15 AM",
                        "sunset": "06:45 PM",
                        "source": "WeatherAPI.com Live Telemetry",
                        "provider": self.provider_name
                    },
                    "forecast": OpenMeteoProvider().get_weather(location, loc['lat'], loc['lon']).get("forecast", [])
                }
        except Exception:
            pass

        return OpenMeteoProvider().get_weather(location, lat, lon)


# ── Mock Weather Provider (SIH Offline & Hackathon Demo) ──────────────────────

class MockWeatherProvider(BaseWeatherProvider):
    @property
    def provider_name(self) -> str:
        return "Deterministic Mock Provider (SIH Demo Mode)"

    def get_weather(self, location: str, lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
        from app.services.weather_service import get_mock_weather_for_city
        loc_clean = location.lower().split(",")[0].strip()
        data = get_mock_weather_for_city(loc_clean)
        data["provider"] = self.provider_name
        return data


# ── Factory ───────────────────────────────────────────────────────────────────

_PROVIDERS: Dict[str, BaseWeatherProvider] = {
    "openmeteo": OpenMeteoProvider(),
    "openweather": OpenWeatherProvider(),
    "weatherapi": WeatherAPIProvider(),
    "mock": MockWeatherProvider(),
}


def get_weather_provider(provider_name: Optional[str] = None) -> BaseWeatherProvider:
    """Returns configured or specified weather provider instance."""
    name = (provider_name or settings.WEATHER_PROVIDER or "openmeteo").lower().strip()
    return _PROVIDERS.get(name, _PROVIDERS["openmeteo"])
