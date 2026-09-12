"""
WeatherGPT — Activity Advisor Prompting
"""

from typing import Dict, Any


def get_activity_advisor_prompt(activity: str, suitability_score: int, weather_summary: Dict[str, Any]) -> str:
    return f"""Activity: {activity.title()}
Calculated Suitability Index: {suitability_score}/100
Current Meteorological Conditions:
- Temperature: {weather_summary.get('temp')}°C (Feels like: {weather_summary.get('feels_like')}°C)
- Rain Probability: {weather_summary.get('rain_probability')}%
- Wind Speed: {weather_summary.get('wind_speed')} km/h
- Humidity: {weather_summary.get('humidity')}%
- UV Index: {weather_summary.get('uv_index')}

Provide a 2-sentence actionable assessment:
1. Feasibility & optimal time window.
2. Recommended gear or critical warning (e.g. hydration, waterproof gear, lightning avoidance).
"""
