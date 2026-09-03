from typing import Dict, Any, List

def calculate_weather_risk(weather_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculates a transparent weather risk score (0-100).
    Categorizes it:
      0-25: LOW (Green)
      26-50: MODERATE (Yellow)
      51-75: HIGH (Orange)
      76-100: SEVERE (Red)
    """
    current = weather_data.get("current", {})
    condition = current.get("condition", "").lower()
    temp = current.get("temp", 25.0)
    wind_speed = current.get("wind_speed", 0.0)
    humidity = current.get("humidity", 50)
    rain_probability = current.get("rain_probability", 0)
    visibility = current.get("visibility", 10.0)
    location = weather_data.get("location", "").lower()
    alerts = weather_data.get("alerts", [])

    score = 0
    breakdown = []

    # 1. Rainfall intensity & condition
    if "extremely heavy" in condition or "cloudburst" in condition:
        score += 50
        breakdown.append({"factor": "Extremely Heavy Rainfall / Cloudburst", "weight": +50, "icon": "cloud-lightning"})
    elif "heavy rain" in condition or "thunderstorm" in condition:
        score += 35
        breakdown.append({"factor": "Heavy Rainfall / Thunderstorm", "weight": +35, "icon": "cloud-rain"})
    elif "moderate rain" in condition or "rain" in condition:
        score += 20
        breakdown.append({"factor": "Moderate Rain", "weight": +20, "icon": "cloud-drizzle"})
    elif "light rain" in condition or "drizzle" in condition:
        score += 10
        breakdown.append({"factor": "Light Rain / Drizzle", "weight": +10, "icon": "cloud-drizzle"})

    # 2. Rain Probability
    if rain_probability > 80:
        score += 15
        breakdown.append({"factor": "Very High Precipitation Probability (>80%)", "weight": +15, "icon": "droplet"})
    elif rain_probability > 50:
        score += 10
        breakdown.append({"factor": "Moderate Precipitation Probability (>50%)", "weight": +10, "icon": "droplet"})

    # 3. Wind speed
    if wind_speed > 40:
        score += 25
        breakdown.append({"factor": "Gale Force Wind (>40 km/h)", "weight": +25, "icon": "wind"})
    elif wind_speed > 25:
        score += 15
        breakdown.append({"factor": "Strong Wind (>25 km/h)", "weight": +15, "icon": "wind"})
    elif wind_speed > 15:
        score += 8
        breakdown.append({"factor": "Moderate Wind (>15 km/h)", "weight": +8, "icon": "wind"})

    # 4. Temperature Extremes (Heatwaves or Extreme Cold)
    if temp >= 40.0:
        score += 30
        breakdown.append({"factor": "Extreme Heatwave (>=40°C)", "weight": +30, "icon": "thermometer"})
    elif temp >= 35.0:
        score += 15
        breakdown.append({"factor": "High Temperature Heatwave (>=35°C)", "weight": +15, "icon": "thermometer"})
    elif temp < 10.0:
        score += 15
        breakdown.append({"factor": "Cold Wave (<10°C)", "weight": +15, "icon": "snowflake"})

    # 5. Lightning Risk (associated with thunderstorms)
    if "lightning" in condition or "thunderstorm" in condition:
        score += 20
        breakdown.append({"factor": "Lightning Hazard Active", "weight": +20, "icon": "zap"})

    # 6. Visibility Reduction
    if visibility < 2.0:
        score += 20
        breakdown.append({"factor": "Severely Restricted Visibility (<2km)", "weight": +20, "icon": "eye-off"})
    elif visibility < 5.0:
        score += 10
        breakdown.append({"factor": "Reduced Visibility (<5km)", "weight": +10, "icon": "eye-off"})

    # 7. Location Vulnerability (e.g., Lonavala is landslide-prone, Mumbai is high-tide/flood prone)
    if "lonavala" in location:
        score += 15
        breakdown.append({"factor": "Ghat Topography - Landslide Vulnerability", "weight": +15, "icon": "mountain"})
    elif "mumbai" in location and humidity > 80:
        score += 10
        breakdown.append({"factor": "Coastal Area - Urban Drainage Flood Vulnerability", "weight": +10, "icon": "waves"})

    # 8. Official Government Warnings active
    if alerts:
        active_warnings = len(alerts)
        weight = 15 * active_warnings
        score += weight
        breakdown.append({"factor": f"Official Alert Active ({active_warnings})", "weight": weight, "icon": "alert-triangle"})

    # Cap score at 100
    final_score = min(max(score, 0), 100)

    # Determine risk category
    if final_score <= 25:
        category = "LOW"
        color = "emerald"  # emerald accent
    elif final_score <= 50:
        category = "MODERATE"
        color = "amber"  # amber/yellow accent
    elif final_score <= 75:
        category = "HIGH"
        color = "orange"
    else:
        category = "SEVERE"
        color = "red"

    return {
        "score": final_score,
        "category": category,
        "color": color,
        "breakdown": breakdown,
        "disclaimer": "This score is an AI-assisted meteorological risk model. For legal alerts and orders, refer to IMD/Government bulletins."
    }
