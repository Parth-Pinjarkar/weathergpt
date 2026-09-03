from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.services.weather_service import get_weather
from app.services.risk_service import calculate_weather_risk

# Standard route definitions
PREDEFINED_ROUTES = {
    ("pune", "mumbai"): ["Pune", "Lonavala", "Khopoli", "Panvel", "Mumbai"],
    ("mumbai", "pune"): ["Mumbai", "Panvel", "Khopoli", "Lonavala", "Pune"],
    ("pune", "nashik"): ["Pune", "Narayangaon", "Sangamner", "Sinnar", "Nashik"],
    ("nashik", "pune"): ["Nashik", "Sinnar", "Sangamner", "Narayangaon", "Pune"],
    ("mumbai", "nashik"): ["Mumbai", "Thane", "Kalyan", "Igatpuri", "Nashik"],
    ("nashik", "mumbai"): ["Nashik", "Igatpuri", "Kalyan", "Thane", "Mumbai"]
}

def analyze_route_weather(db: Session, from_location: str, to_location: str) -> Dict[str, Any]:
    """
    Analyzes weather along a route from a source to a destination.
    Splits the route into waypoints, fetches weather, and calculates risk scores.
    """
    norm_from = from_location.strip().lower()
    norm_to = to_location.strip().lower()
    
    # Check if we have a predefined high-fidelity route
    route_key = (norm_from, norm_to)
    if route_key in PREDEFINED_ROUTES:
        waypoints = PREDEFINED_ROUTES[route_key]
    else:
        # Generate a general fallback route with source, midpoint, and destination
        waypoints = [from_location.title(), f"Midway to {to_location.title()}", to_location.title()]

    timeline = []
    highest_risk = "LOW"
    risk_level_values = {"LOW": 1, "WATCH": 2, "MODERATE": 2, "HIGH": 3, "SEVERE": 4}
    highest_risk_num = 1
    severe_points = []
    
    for i, point in enumerate(waypoints):
        # Fetch weather for the waypoint
        w_data = get_weather(db, point)
        risk_data = calculate_weather_risk(w_data)
        
        risk_lvl = risk_data["category"]
        risk_num = risk_level_values.get(risk_lvl, 1)
        if risk_num > highest_risk_num:
            highest_risk_num = risk_num
            highest_risk = risk_lvl
            
        if risk_lvl in ["HIGH", "SEVERE"]:
            severe_points.append(f"{point} ({w_data['current']['condition']})")
            
        timeline.append({
            "name": point,
            "condition": w_data["current"]["condition"],
            "temp": w_data["current"]["temp"],
            "rain_probability": w_data["current"]["rain_probability"],
            "risk_score": risk_data["score"],
            "risk_level": risk_lvl,
            "color": risk_data["color"],
            "recommendation": w_data["forecast"][0]["recommendation"] if w_data.get("forecast") else "Safe to proceed."
        })

    # Generate AI Travel Recommendation summary
    if highest_risk == "SEVERE":
        ai_recommendation = (
            f"Severe weather risk detected along the route at {', '.join(severe_points)}. "
            "Heavy rainfall, landslide risks, or extremely low visibility may cause major closures. "
            "It is highly recommended to delay travel or seek alternative routes."
        )
    elif highest_risk == "HIGH":
        ai_recommendation = (
            f"High weather risk detected at {', '.join(severe_points)}. "
            "Waterlogging or heavy winds are likely. Consider travelling earlier or later to bypass peak storm intensity."
        )
    elif highest_risk == "MODERATE" or highest_risk == "WATCH":
        ai_recommendation = (
            "Moderate risk conditions along parts of the route. Wet roads and traffic slowing should be expected. "
            "Proceed with caution, keep headlights on, and maintain safe braking distances."
        )
    else:
        ai_recommendation = "Clear or low-risk conditions observed across the entire route. Safe to travel."

    return {
        "from_location": from_location.title(),
        "to_location": to_location.title(),
        "route_path": " ➔ ".join(waypoints),
        "highest_risk_level": highest_risk,
        "highest_risk_color": "red" if highest_risk == "SEVERE" else ("orange" if highest_risk == "HIGH" else ("amber" if highest_risk == "MODERATE" else "emerald")),
        "timeline": timeline,
        "ai_travel_recommendation": ai_recommendation,
        "source": "WeatherGPT Route Risk Analyzer"
    }
