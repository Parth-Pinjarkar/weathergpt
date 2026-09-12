"""
WeatherGPT — Activity Advisor Service
──────────────────────────────────────
Evaluates weather suitability (0-100) and optimal hourly windows for:
  • Running, Cycling, Walking, Outdoor Events, Travel, Driving,
    Photography, Farming, Commuting.
"""

from typing import Dict, Any, List


ACTIVITIES_REGISTRY = [
    "running", "cycling", "walking", "outdoor_events", "travel",
    "driving", "photography", "farming", "commuting"
]


def evaluate_activity(activity: str, weather_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes suitability score (0-100), risk status, reasons, and optimal time windows.
    """
    act = activity.lower().replace("-", "_").replace(" ", "_")
    current = weather_data.get("current", {})
    temp = float(current.get("temp", 26.0))
    rain_prob = int(current.get("rain_probability", 20))
    wind_spd = float(current.get("wind_speed", 10.0))
    humidity = int(current.get("humidity", 60))
    uv = float(current.get("uv_index", 5.0))
    cond = current.get("condition", "Partly Cloudy")
    is_rain = "rain" in cond.lower() or "drizzle" in cond.lower() or "storm" in cond.lower()

    score = 100
    penalties = []
    recommendation = "Optimal meteorological conditions."
    optimal_window = "06:00 AM – 09:00 AM"

    if act == "running":
        optimal_window = "05:30 AM – 07:30 AM"
        if temp > 30:
            p = min(40, int((temp - 30) * 4))
            score -= p
            penalties.append(f"Elevated temperature ({temp}°C) causes early heat exhaustion")
        elif temp < 10:
            score -= 15
            penalties.append("Chilly temperature requires thermal compression layers")
        if rain_prob > 40 or is_rain:
            score -= 35
            penalties.append("Wet road surfaces increase slip hazard and friction reduction")
        if humidity > 80 and temp > 28:
            score -= 20
            penalties.append("High humidity restricts evaporative cooling (sweat efficiency)")
        if uv > 7:
            score -= 15
            penalties.append("High UV Index requires sun protection")

    elif act == "cycling":
        optimal_window = "06:00 AM – 08:30 AM"
        if wind_spd > 25:
            score -= 35
            penalties.append(f"Strong crosswinds ({wind_spd} km/h) destabilize bicycle handling")
        elif wind_spd > 15:
            score -= 15
            penalties.append("Moderate headwind increases pedaling resistance")
        if rain_prob > 40 or is_rain:
            score -= 40
            penalties.append("Reduced tyre traction and rim brake braking distance on wet tarmac")
        if temp > 32:
            score -= 30
            penalties.append("Dehydration risk on asphalt radiated heat")

    elif act == "walking":
        optimal_window = "06:30 AM – 09:00 AM or 06:00 PM – 08:00 PM"
        if rain_prob > 60:
            score -= 30
            penalties.append("Heavy rain requires waterproof umbrella or raincoat")
        if temp > 35:
            score -= 35
            penalties.append("Direct sun exposure risk")
        if uv > 8:
            score -= 15
            penalties.append("Wear UV400 sunglasses and broad-brimmed hat")

    elif act == "outdoor_events":
        optimal_window = "10:00 AM – 04:00 PM (Subject to canopy shading)"
        if rain_prob > 45 or is_rain:
            score -= 50
            penalties.append("Precipitation necessitates waterproof canopies and electrical grounding")
        if wind_spd > 30:
            score -= 40
            penalties.append("Gale gusts can dislodge tents, marquees, and stage lighting")
        if temp > 36:
            score -= 30
            penalties.append("Require misting fans, shaded seating, and potable hydration stations")

    elif act in ["travel", "commuting"]:
        optimal_window = "Before 08:00 AM or Midday (11:00 AM – 02:00 PM)"
        if rain_prob > 60 or is_rain:
            score -= 35
            penalties.append("Traffic congestion expected near waterlogged junctions")
        if wind_spd > 35:
            score -= 20
            penalties.append("Reduced vehicle aerodynamic stability on flyovers and bridges")
        if float(current.get("visibility", 10.0)) < 4.0:
            score -= 35
            penalties.append("Reduced horizontal visibility; use low-beam fog headlights")

    elif act == "driving":
        optimal_window = "07:00 AM – 04:00 PM"
        vis = float(current.get("visibility", 10.0))
        if vis < 3.0:
            score -= 45
            penalties.append(f"Fog/downpour visibility drop ({vis} km)")
        if rain_prob > 50 or is_rain:
            score -= 30
            penalties.append("Aquaplaning risk above 60 km/h on standing water")
        if wind_spd > 30:
            score -= 20
            penalties.append("Crosswind buffeting when overtaking heavy lorries")

    elif act == "photography":
        optimal_window = "Golden Hour: 06:00 AM – 07:00 AM / 05:45 PM – 06:45 PM"
        if is_rain:
            score -= 40
            penalties.append("Requires weather-sealed camera body and rain sleeve")
        if "cloud" in cond.lower() or "overcast" in cond.lower():
            score += 5  # Soft, diffused light is great for portraits
            penalties.append("Diffused cloud canopy provides natural softbox illumination")
        if float(current.get("visibility", 10.0)) > 8.0:
            score += 5
            penalties.append("High atmospheric clarity for landscape dynamic range")

    elif act == "farming":
        optimal_window = "06:30 AM – 10:30 AM"
        if wind_spd > 15:
            score -= 30
            penalties.append(f"Wind speed ({wind_spd} km/h) causes pesticide droplet drift")
        if rain_prob > 40:
            score -= 35
            penalties.append("Rain will wash away foliar fertilizers; postpone spraying")
        if temp > 38:
            score -= 25
            penalties.append("Heat stress to standing seedlings and manual field laborers")
        else:
            score += 10
            penalties.append("Favorable conditions for routine weeding, tilling, or harvest")

    final_score = max(5, min(100, score))
    
    if final_score >= 80:
        level = "EXCELLENT"
        color = "emerald"
    elif final_score >= 60:
        level = "GOOD"
        color = "cyan"
    elif final_score >= 40:
        level = "MODERATE"
        color = "amber"
    else:
        level = "POOR"
        color = "red"

    return {
        "activity": act,
        "display_name": act.replace("_", " ").title(),
        "suitability_score": final_score,
        "suitability_level": level,
        "badge_color": color,
        "optimal_window": optimal_window,
        "factors": penalties if penalties else ["All meteorological factors nominal for this activity"],
        "recommendation": f"{level} conditions for {act.replace('_', ' ')}. Best execution window: {optimal_window}."
    }


def evaluate_all_activities(weather_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Evaluates all 9 operational activities for a given weather snapshot."""
    return [evaluate_activity(act, weather_data) for act in ACTIVITIES_REGISTRY]
