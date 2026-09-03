import json
import requests
import time
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.config.settings import settings
from app.models.models import WeatherCache, OfficialAlert

# Reusable HTTP connection pool for high-throughput, low-latency requests
_HTTP_SESSION = requests.Session()
_HTTP_ADAPTER = requests.adapters.HTTPAdapter(pool_connections=20, pool_maxsize=50, max_retries=1)
_HTTP_SESSION.mount("https://", _HTTP_ADAPTER)
_HTTP_SESSION.mount("http://", _HTTP_ADAPTER)

# Sub-millisecond in-memory cache for weather data (TTL 3 minutes)
_FAST_WEATHER_CACHE: Dict[str, Dict[str, Any]] = {}
_GEO_COORDS_CACHE: Dict[str, tuple] = {}

# Coordinates registry for instant lookup
DEMO_COORDINATES = {
    "pune": {"lat": 18.5204, "lon": 73.8567, "name": "Pune", "state": "Maharashtra"},
    "mumbai": {"lat": 19.0760, "lon": 72.8777, "name": "Mumbai", "state": "Maharashtra"},
    "delhi": {"lat": 28.7041, "lon": 77.1025, "name": "Delhi", "state": "Delhi"},
    "nashik": {"lat": 19.9975, "lon": 73.7898, "name": "Nashik", "state": "Maharashtra"},
    "bengaluru": {"lat": 12.9716, "lon": 77.5946, "name": "Bengaluru", "state": "Karnataka"},
    "bangalore": {"lat": 12.9716, "lon": 77.5946, "name": "Bengaluru", "state": "Karnataka"},
    "chennai": {"lat": 13.0827, "lon": 80.2707, "name": "Chennai", "state": "Tamil Nadu"},
    "hyderabad": {"lat": 17.3850, "lon": 78.4867, "name": "Hyderabad", "state": "Telangana"},
    "jaipur": {"lat": 26.9124, "lon": 75.7873, "name": "Jaipur", "state": "Rajasthan"},
    "lonavala": {"lat": 18.7557, "lon": 73.4091, "name": "Lonavala", "state": "Maharashtra"},
    "shimla": {"lat": 31.1048, "lon": 77.1734, "name": "Shimla", "state": "Himachal Pradesh"},
    "kolkata": {"lat": 22.5726, "lon": 88.3639, "name": "Kolkata", "state": "West Bengal"},
    "goa": {"lat": 15.2993, "lon": 74.1240, "name": "Goa", "state": "Goa"},
    "panaji": {"lat": 15.4909, "lon": 73.8278, "name": "Panaji", "state": "Goa"},
    "varanasi": {"lat": 25.3176, "lon": 82.9739, "name": "Varanasi", "state": "Uttar Pradesh"},
    "ahmedabad": {"lat": 23.0225, "lon": 72.5714, "name": "Ahmedabad", "state": "Gujarat"},
    "surat": {"lat": 21.1702, "lon": 72.8311, "name": "Surat", "state": "Gujarat"},
    "nagpur": {"lat": 21.1458, "lon": 79.0882, "name": "Nagpur", "state": "Maharashtra"},
    "lucknow": {"lat": 26.8467, "lon": 80.9462, "name": "Lucknow", "state": "Uttar Pradesh"},
    "indore": {"lat": 22.7196, "lon": 75.8577, "name": "Indore", "state": "Madhya Pradesh"},
    "bhopal": {"lat": 23.2599, "lon": 77.4126, "name": "Bhopal", "state": "Madhya Pradesh"},
    "patna": {"lat": 25.5941, "lon": 85.1376, "name": "Patna", "state": "Bihar"},
    "srinagar": {"lat": 34.0837, "lon": 74.7973, "name": "Srinagar", "state": "Jammu & Kashmir"},
    "kochi": {"lat": 9.9312, "lon": 76.2673, "name": "Kochi", "state": "Kerala"},
    "thiruvananthapuram": {"lat": 8.5241, "lon": 76.9366, "name": "Thiruvananthapuram", "state": "Kerala"},
    "amritsar": {"lat": 31.6340, "lon": 74.8723, "name": "Amritsar", "state": "Punjab"},
    "chandigarh": {"lat": 30.7333, "lon": 76.7794, "name": "Chandigarh", "state": "Punjab & Haryana"},
    "dehradun": {"lat": 30.3165, "lon": 78.0322, "name": "Dehradun", "state": "Uttarakhand"},
    "visakhapatnam": {"lat": 17.6868, "lon": 83.2185, "name": "Visakhapatnam", "state": "Andhra Pradesh"},
    "guwahati": {"lat": 26.1445, "lon": 91.7362, "name": "Guwahati", "state": "Assam"},
    "bhubaneswar": {"lat": 20.2961, "lon": 85.8245, "name": "Bhubaneswar", "state": "Odisha"},
    "mahabaleshwar": {"lat": 17.9237, "lon": 73.6586, "name": "Mahabaleshwar", "state": "Maharashtra"},
    "khopoli": {"lat": 18.7904, "lon": 73.3424, "name": "Khopoli", "state": "Maharashtra"},
    "panvel": {"lat": 18.9894, "lon": 73.1175, "name": "Panvel", "state": "Maharashtra"},
    "alibaug": {"lat": 18.6414, "lon": 72.8722, "name": "Alibaug", "state": "Maharashtra"},
    "wagholi": {"lat": 18.5793, "lon": 73.9822, "name": "Wagholi", "state": "Maharashtra"},
    "hinjawadi": {"lat": 18.5913, "lon": 73.7389, "name": "Hinjawadi", "state": "Maharashtra"}
}

# High-fidelity mock weather data for DEMO MODE or fallback
MOCK_WEATHER_DATA = {
    "nashik": {
        "location": "Nashik, Maharashtra",
        "coordinates": {"lat": 19.9975, "lon": 73.7898},
        "current": {
            "temp": 26.0,
            "feels_like": 28.0,
            "condition": "Moderate Rain",
            "icon": "cloud-rain",
            "humidity": 82,
            "wind_speed": 16.0,
            "wind_direction": "SW",
            "pressure": 1008,
            "visibility": 7.0,
            "uv_index": 4,
            "rain_probability": 65,
            "air_quality": "Good (AQI 42)",
            "sunrise": "06:12 AM",
            "sunset": "06:55 PM",
            "source": "India Meteorological Department (IMD) - Demo Mode",
            "updated_at": ""
        },
        "forecast": [
            {
                "day": "Today",
                "temp": 26,
                "condition": "Moderate Rain",
                "icon": "cloud-rain",
                "rain_probability": 65,
                "wind": 16,
                "humidity": 82,
                "risk_level": "MODERATE",
                "recommendation": "Intermittent rainfall expected across Nashik. Good conditions for grape agriculture."
            },
            {
                "day": "Tomorrow",
                "temp": 25,
                "condition": "Light Drizzle",
                "icon": "cloud-drizzle",
                "rain_probability": 45,
                "wind": 14,
                "humidity": 78,
                "risk_level": "LOW",
                "recommendation": "Mild drizzle forecast in the afternoon. Safe for commute."
            },
            {
                "day": "Day 3",
                "temp": 27,
                "condition": "Partly Cloudy",
                "icon": "sun",
                "rain_probability": 20,
                "wind": 12,
                "humidity": 70,
                "risk_level": "LOW",
                "recommendation": "Clearing skies. Excellent weather for agricultural spraying and travel."
            },
            {
                "day": "Day 4",
                "temp": 28,
                "condition": "Partly Cloudy",
                "icon": "sun",
                "rain_probability": 15,
                "wind": 10,
                "humidity": 68,
                "risk_level": "LOW",
                "recommendation": "Pleasant conditions across Godavari river basin."
            },
            {
                "day": "Day 5",
                "temp": 29,
                "condition": "Sunny",
                "icon": "sun",
                "rain_probability": 10,
                "wind": 11,
                "humidity": 65,
                "risk_level": "LOW",
                "recommendation": "Warm sunny intervals. Ensure adequate hydration."
            },
            {
                "day": "Day 6",
                "temp": 27,
                "condition": "Light Rain",
                "icon": "cloud-rain",
                "rain_probability": 50,
                "wind": 15,
                "humidity": 80,
                "risk_level": "LOW",
                "recommendation": "Passing rain showers forecast along Nashik valley."
            },
            {
                "day": "Day 7",
                "temp": 26,
                "condition": "Moderate Rain",
                "icon": "cloud-rain",
                "rain_probability": 60,
                "wind": 17,
                "humidity": 84,
                "risk_level": "MODERATE",
                "recommendation": "Overcast weather with continuous light to moderate rain showers."
            }
        ],
        "alerts": [
            {
                "title": "Yellow Advisory: Intermittent Spells in Nashik District",
                "expected_period": "Next 24 Hours",
                "impacts": ["Moderate rain causing water pooling near Panchavati ghats", "Slight visibility reduction on NH-60"],
                "actions": ["Drive cautious on Kasara ghat section", "Farmers advised to inspect vineyard drainage"]
            }
        ]
    },
    "pune": {
        "location": "Pune, Maharashtra",
        "coordinates": {"lat": 18.5204, "lon": 73.8567},
        "current": {
            "temp": 27.0,
            "feels_like": 29.5,
            "condition": "Heavy Rain",
            "icon": "cloud-lightning",
            "humidity": 88,
            "wind_speed": 18.0,
            "wind_direction": "WSW",
            "pressure": 1005,
            "visibility": 4.0,
            "uv_index": 2,
            "rain_probability": 92,
            "air_quality": "Good (AQI 38)",
            "sunrise": "06:14 AM",
            "sunset": "06:58 PM",
            "source": "India Meteorological Department (IMD) - Demo Mode",
            "updated_at": ""  # Set dynamically
        },
        "forecast": [
            {
                "day": "Today",
                "temp": 27,
                "condition": "Heavy Rain",
                "icon": "cloud-rain",
                "rain_probability": 92,
                "wind": 18,
                "humidity": 88,
                "risk_level": "SEVERE",
                "recommendation": "Severe rain expected. Minimize outdoor travel, avoid low-lying underpasses."
            },
            {
                "day": "Tomorrow",
                "temp": 26,
                "condition": "Thunderstorms",
                "icon": "cloud-lightning",
                "rain_probability": 85,
                "wind": 20,
                "humidity": 90,
                "risk_level": "HIGH",
                "recommendation": "Thunderstorms and lightning predicted. Unplug sensitive electrical appliances."
            },
            {
                "day": "Wednesday",
                "temp": 28,
                "condition": "Moderate Rain",
                "icon": "cloud-drizzle",
                "rain_probability": 75,
                "wind": 14,
                "humidity": 82,
                "risk_level": "MODERATE",
                "recommendation": "Light rain gear recommended. Commutes may be slower than usual."
            },
            {
                "day": "Thursday",
                "temp": 29,
                "condition": "Light Rain",
                "icon": "cloud-drizzle",
                "rain_probability": 60,
                "wind": 12,
                "humidity": 78,
                "risk_level": "MODERATE",
                "recommendation": "Expect brief scattered showers. Good for farming if soil requires moisture."
            },
            {
                "day": "Friday",
                "temp": 30,
                "condition": "Partly Cloudy",
                "icon": "cloud",
                "rain_probability": 30,
                "wind": 10,
                "humidity": 70,
                "risk_level": "LOW",
                "recommendation": "Pleasant conditions. Outdoor activities are safe to resume."
            },
            {
                "day": "Saturday",
                "temp": 31,
                "condition": "Sunny",
                "icon": "sun",
                "rain_probability": 15,
                "wind": 8,
                "humidity": 65,
                "risk_level": "LOW",
                "recommendation": "Ideal sunny weather. Perfect time for outdoor harvesting or laundry."
            },
            {
                "day": "Sunday",
                "temp": 32,
                "condition": "Sunny",
                "icon": "sun",
                "rain_probability": 10,
                "wind": 8,
                "humidity": 60,
                "risk_level": "LOW",
                "recommendation": "Warm weather. Keep hydrated when working outdoors."
            }
        ],
        "alerts": [
            {
                "severity": "SEVERE",
                "title": "Red Warning: Extreme Heavy Rainfall",
                "description": "Active monsoon depression over western Maharashtra causing very heavy to extremely heavy rainfall over Pune district.",
                "expected_period": "3 PM - 11 PM Today",
                "impacts": ["Severe waterlogging on streets", "Localized flash floods", "Major traffic congestion on roads and highways", "Reduced visibility down to 500m"],
                "actions": ["Avoid all non-essential travel", "Stay away from rivers, canals, and water channels", "Move to higher ground if living in vulnerable low-lying regions", "Keep emergency contacts active"]
            }
        ],
        "climate": {
            "historical_averages": [
                {"month": "Jan", "temp": 20.5, "rainfall": 1.0},
                {"month": "Feb", "temp": 22.8, "rainfall": 0.5},
                {"month": "Mar", "temp": 26.9, "rainfall": 3.2},
                {"month": "Apr", "temp": 30.1, "rainfall": 12.0},
                {"month": "May", "temp": 31.5, "rainfall": 24.3},
                {"month": "Jun", "temp": 28.2, "rainfall": 120.4},
                {"month": "Jul", "temp": 25.8, "rainfall": 185.6},
                {"month": "Aug", "temp": 25.1, "rainfall": 140.2},
                {"month": "Sep", "temp": 26.0, "rainfall": 130.8},
                {"month": "Oct", "temp": 25.9, "rainfall": 75.1},
                {"month": "Nov", "temp": 22.4, "rainfall": 22.0},
                {"month": "Dec", "temp": 20.1, "rainfall": 4.5}
            ],
            "insight": "Monsoon rainfall has shown a 12% increase over the past decade in Pune, with shorter but more intense precipitation spells."
        }
    },
    "mumbai": {
        "location": "Mumbai, Maharashtra",
        "coordinates": {"lat": 19.0760, "lon": 72.8777},
        "current": {
            "temp": 29.0,
            "feels_like": 34.0,
            "condition": "Moderate Rain",
            "icon": "cloud-rain",
            "humidity": 82,
            "wind_speed": 22.0,
            "wind_direction": "SW",
            "pressure": 1004,
            "visibility": 6.0,
            "uv_index": 4,
            "rain_probability": 80,
            "air_quality": "Good (AQI 29)",
            "sunrise": "06:16 AM",
            "sunset": "07:01 PM",
            "source": "India Meteorological Department (IMD) - Demo Mode",
            "updated_at": ""
        },
        "forecast": [
            {"day": "Today", "temp": 29, "condition": "Moderate Rain", "icon": "cloud-rain", "rain_probability": 80, "wind": 22, "humidity": 82, "risk_level": "HIGH", "recommendation": "High tide at 4:30 PM. Stay away from beachfronts due to strong winds and high waves."},
            {"day": "Tomorrow", "temp": 28, "condition": "Heavy Rain", "icon": "cloud-rain", "rain_probability": 90, "wind": 26, "humidity": 86, "risk_level": "SEVERE", "recommendation": "Extremely heavy rain predicted. High risk of local waterlogging in Sion, Kurla, and Hindmata."},
            {"day": "Wednesday", "temp": 29, "condition": "Light Rain", "icon": "cloud-drizzle", "rain_probability": 65, "wind": 18, "humidity": 80, "risk_level": "MODERATE", "recommendation": "Light rain will persist. Local train services are expected to run normally."},
            {"day": "Thursday", "temp": 30, "condition": "Partly Cloudy", "icon": "cloud", "rain_probability": 40, "wind": 15, "humidity": 75, "risk_level": "LOW", "recommendation": "Skies clearing up. Normal activities can be resumed."},
            {"day": "Friday", "temp": 31, "condition": "Partly Cloudy", "icon": "cloud", "rain_probability": 30, "wind": 12, "humidity": 72, "risk_level": "LOW", "recommendation": "Pleasant and humid. Good weather for drying laundry outdoors."},
            {"day": "Saturday", "temp": 31, "condition": "Sunny", "icon": "sun", "rain_probability": 20, "wind": 10, "humidity": 70, "risk_level": "LOW", "recommendation": "Sunny day. Use sunscreen and light cotton clothing."},
            {"day": "Sunday", "temp": 32, "condition": "Sunny", "icon": "sun", "rain_probability": 10, "wind": 8, "humidity": 68, "risk_level": "LOW", "recommendation": "Hot day. Take hydration breaks regularly."}
        ],
        "alerts": [
            {
                "severity": "WARNING",
                "title": "Orange Warning: High Tide & Moderate Rainfall",
                "description": "High tide warning combined with forecast of moderate to heavy rainfall over Mumbai city and suburbs.",
                "expected_period": "2 PM - 6 PM Today",
                "impacts": ["Seawater ingress in low-lying coastal roads", "Slow traffic flow across major junctions", "Beach operations suspended"],
                "actions": ["Do not venture near beaches or coastal promenades during high tide", "Plan commutes ahead to avoid flooded roads", "Follow official municipal warnings"]
            }
        ],
        "climate": {
            "historical_averages": [
                {"month": "Jan", "temp": 24.5, "rainfall": 0.6},
                {"month": "Feb", "temp": 25.8, "rainfall": 1.5},
                {"month": "Mar", "temp": 28.2, "rainfall": 0.1},
                {"month": "Apr", "temp": 30.5, "rainfall": 0.5},
                {"month": "May", "temp": 32.2, "rainfall": 12.0},
                {"month": "Jun", "temp": 29.5, "rainfall": 520.2},
                {"month": "Jul", "temp": 27.5, "rainfall": 810.6},
                {"month": "Aug", "temp": 27.0, "rainfall": 530.4},
                {"month": "Sep", "temp": 27.8, "rainfall": 310.2},
                {"month": "Oct", "temp": 29.2, "rainfall": 85.9},
                {"month": "Nov", "temp": 27.9, "rainfall": 10.4},
                {"month": "Dec", "temp": 25.6, "rainfall": 1.8}
            ],
            "insight": "Mumbai has observed a significant shift in monsoon peaks, with July rainfall increasing by 15% and extreme precipitation events becoming more frequent."
        }
    },
    "lonavala": {
        "location": "Lonavala, Maharashtra",
        "coordinates": {"lat": 18.7557, "lon": 73.4091},
        "current": {
            "temp": 21.0,
            "feels_like": 21.0,
            "condition": "Extremely Heavy Rain",
            "icon": "cloud-lightning",
            "humidity": 98,
            "wind_speed": 28.0,
            "wind_direction": "SW",
            "pressure": 1002,
            "visibility": 1.5,
            "uv_index": 1,
            "rain_probability": 98,
            "air_quality": "Good (AQI 15)",
            "sunrise": "06:14 AM",
            "sunset": "06:58 PM",
            "source": "India Meteorological Department (IMD) - Demo Mode",
            "updated_at": ""
        },
        "forecast": [
            {"day": "Today", "temp": 21, "condition": "Extremely Heavy Rain", "icon": "cloud-lightning", "rain_probability": 98, "wind": 28, "humidity": 98, "risk_level": "SEVERE", "recommendation": "Landslide warnings active. Avoid ghat roads. Heavy fog reduces visibility below 1km."},
            {"day": "Tomorrow", "temp": 20, "condition": "Heavy Rain", "icon": "cloud-rain", "rain_probability": 95, "wind": 25, "humidity": 96, "risk_level": "SEVERE", "recommendation": "Continuous precipitation will persist. Keep emergency lighting equipment ready."}
        ],
        "alerts": [
            {
                "severity": "SEVERE",
                "title": "Red Alert: Landslide Risk & Cloudburst Danger",
                "description": "Extremely heavy precipitation over the Western Ghats (Lonavala/Khandala). Severe risk of landslides and mudflows on the Pune-Mumbai Expressway.",
                "expected_period": "Active all day",
                "impacts": ["Landslips blocking roads", "Thick dense fog blocking visibility on ghats", "Waterfall zones extremely dangerous"],
                "actions": ["Avoid travelling via ghat routes entirely", "Stay indoors away from hilly slopes", "Cooperates with local highway police instructions"]
            }
        ],
        "climate": {
            "historical_averages": [{"month": "Jul", "temp": 21.0, "rainfall": 1500.0}],
            "insight": "High landslide vulnerability due to heavy saturation of soil during monsoon."
        }
    },
    "khopoli": {
        "location": "Khopoli, Maharashtra",
        "coordinates": {"lat": 18.7904, "lon": 73.3424},
        "current": {
            "temp": 25.0,
            "feels_like": 27.0,
            "condition": "Heavy Rainfall",
            "icon": "cloud-rain",
            "humidity": 92,
            "wind_speed": 22.0,
            "wind_direction": "SW",
            "pressure": 1004,
            "visibility": 3.0,
            "uv_index": 2,
            "rain_probability": 90,
            "air_quality": "Good (AQI 25)",
            "sunrise": "06:15 AM",
            "sunset": "06:59 PM",
            "source": "India Meteorological Department (IMD) - Demo Mode",
            "updated_at": ""
        },
        "forecast": [
            {"day": "Today", "temp": 25, "condition": "Heavy Rainfall", "icon": "cloud-rain", "rain_probability": 90, "wind": 22, "humidity": 92, "risk_level": "HIGH", "recommendation": "Waterlogging reported in low lying industrial sectors. Drive cautiously."},
            {"day": "Tomorrow", "temp": 24, "condition": "Moderate Rain", "icon": "cloud-drizzle", "rain_probability": 80, "wind": 18, "humidity": 90, "risk_level": "HIGH", "recommendation": "Moderate rain. Ensure drainage systems are clear."}
        ],
        "alerts": [
            {
                "severity": "WARNING",
                "title": "Orange Alert: Excessive Runoff & River Rise",
                "description": "Significant rain accumulation causing increased flow in local streams and rivers near Khopoli.",
                "expected_period": "Ongoing",
                "impacts": ["River water levels near danger marks", "Water logging in low lying bypass roads"],
                "actions": ["Do not attempt to cross submerged bridges", "Keep assets in elevated positions"]
            }
        ],
        "climate": {
            "historical_averages": [{"month": "Jul", "temp": 24.5, "rainfall": 800.0}],
            "insight": "Prone to rapid runoff from nearby hills during heavy downpours."
        }
    },
    "panvel": {
        "location": "Panvel, Maharashtra",
        "coordinates": {"lat": 18.9894, "lon": 73.1175},
        "current": {
            "temp": 27.0,
            "feels_like": 30.0,
            "condition": "Moderate Rain",
            "icon": "cloud-drizzle",
            "humidity": 85,
            "wind_speed": 16.0,
            "wind_direction": "SW",
            "pressure": 1006,
            "visibility": 5.0,
            "uv_index": 3,
            "rain_probability": 75,
            "air_quality": "Good (AQI 32)",
            "sunrise": "06:16 AM",
            "sunset": "07:00 PM",
            "source": "India Meteorological Department (IMD) - Demo Mode",
            "updated_at": ""
        },
        "forecast": [
            {"day": "Today", "temp": 27, "condition": "Moderate Rain", "icon": "cloud-drizzle", "rain_probability": 75, "wind": 16, "humidity": 85, "risk_level": "WATCH", "recommendation": "Isolated heavy showers possible. Traffic congestion on highway merge points."}
        ],
        "alerts": [
            {
                "severity": "WATCH",
                "title": "Yellow Alert: Active Rain Watch",
                "description": "Monsoon activity active over Panvel region with light to moderate rainfall expected.",
                "expected_period": "Next 24 hours",
                "impacts": ["Minor waterlogging in low roads", "Occasional traffic slowdowns"],
                "actions": ["Drive safely and avoid speeding on wet surfaces"]
            }
        ],
        "climate": {
            "historical_averages": [{"month": "Jul", "temp": 26.5, "rainfall": 600.0}],
            "insight": "Rapidly growing urban area with potential storm-water drainage pressure."
        }
    }
}

# Add default profiles for other major cities
MOCK_WEATHER_DATA["delhi"] = {
    "location": "Delhi, NCR",
    "coordinates": {"lat": 28.7041, "lon": 77.1025},
    "current": {
        "temp": 38.0,
        "feels_like": 44.0,
        "condition": "Severe Heatwave",
        "icon": "sun",
        "humidity": 30,
        "wind_speed": 12.0,
        "wind_direction": "WNW",
        "pressure": 1000,
        "visibility": 5.0,
        "uv_index": 9,
        "rain_probability": 5,
        "air_quality": "Poor (AQI 280)",
        "sunrise": "05:54 AM",
        "sunset": "07:08 PM",
        "source": "IMD Forecast System - Demo Mode",
        "updated_at": ""
    },
    "forecast": [
        {"day": "Today", "temp": 38, "condition": "Severe Heatwave", "icon": "sun", "rain_probability": 5, "wind": 12, "humidity": 30, "risk_level": "SEVERE", "recommendation": "Extreme temperatures. Stay indoors between 11 AM and 4 PM. Drink ORS/water constantly."},
        {"day": "Tomorrow", "temp": 39, "condition": "Sunny and Dusty", "icon": "sun", "rain_probability": 10, "wind": 15, "humidity": 28, "risk_level": "SEVERE", "recommendation": "Dust storm risk. Wear protective masks to avoid respiratory discomfort."},
        {"day": "Wednesday", "temp": 37, "condition": "Sunny", "icon": "sun", "rain_probability": 10, "wind": 10, "humidity": 32, "risk_level": "HIGH", "recommendation": "Prolonged exposure risk. Keep pets and children indoors."},
        {"day": "Thursday", "temp": 36, "condition": "Partly Cloudy", "icon": "cloud", "rain_probability": 25, "wind": 14, "humidity": 45, "risk_level": "MODERATE", "recommendation": "Slight relief in heat, but humidity will rise. Avoid heavy outdoor physical workouts."}
    ],
    "alerts": [
        {
            "severity": "SEVERE",
            "title": "Red Alert: Severe Heatwave Conditions",
            "description": "Loo winds from Rajasthan bringing dry scorching air over Delhi-NCR. Temperatures hovering around 44-46°C in multiple pockets.",
            "expected_period": "Next 48 Hours",
            "impacts": ["High risk of heat stroke/exhaustion", "Power grid stress due to cooling demands", "Enhanced dust suspension in air"],
            "actions": ["Avoid direct sunlight exposure", "Stay hydrated with water, buttermilk, or lemon water", "Wear loose, light-colored cotton clothes", "Ensure outdoor workers have regular shading and rest breaks"]
        }
    ],
    "climate": {
        "historical_averages": [{"month": "May", "temp": 39.5, "rainfall": 15.0}],
        "insight": "Average summer peak temperatures have risen by 1.8°C over the last 15 years, with heatwaves starting earlier in the spring."
    }
}

# Fallback datasets for others
MOCK_WEATHER_DATA["bengaluru"] = {
    "location": "Bengaluru, Karnataka",
    "coordinates": {"lat": 12.9716, "lon": 77.5946},
    "current": {
        "temp": 24.0,
        "feels_like": 24.0,
        "condition": "Pleasant/Drizzle",
        "icon": "cloud-drizzle",
        "humidity": 72,
        "wind_speed": 10.0,
        "wind_direction": "E",
        "pressure": 1012,
        "visibility": 8.0,
        "uv_index": 4,
        "rain_probability": 30,
        "air_quality": "Satisfactory (AQI 55)",
        "sunrise": "06:05 AM",
        "sunset": "06:42 PM",
        "source": "IMD Bengaluru - Demo Mode",
        "updated_at": ""
    },
    "forecast": [
        {"day": "Today", "temp": 24, "condition": "Pleasant/Drizzle", "icon": "cloud-drizzle", "rain_probability": 30, "wind": 10, "humidity": 72, "risk_level": "LOW", "recommendation": "Great weather. Carry a light jacket or umbrella for sudden evening drizzles."}
    ],
    "alerts": [],
    "climate": {
        "historical_averages": [{"month": "Aug", "temp": 24.0, "rainfall": 120.0}],
        "insight": "Bengaluru enjoys a highly stable moderate climate, though micro-climate variations are appearing due to rapid urbanization."
    }
}

# Add default fallbacks for missing cities so we never crash
DEFAULT_FALLBACK = {
    "location": "Generic City",
    "coordinates": {"lat": 20.0, "lon": 75.0},
    "current": {
        "temp": 26.0,
        "feels_like": 28.0,
        "condition": "Partly Cloudy",
        "icon": "cloud",
        "humidity": 65,
        "wind_speed": 12.0,
        "wind_direction": "N",
        "pressure": 1010,
        "visibility": 10.0,
        "uv_index": 6,
        "rain_probability": 20,
        "air_quality": "Good (AQI 45)",
        "sunrise": "06:00 AM",
        "sunset": "06:30 PM",
        "source": "Global Met Service - Fallback Data",
        "updated_at": ""
    },
    "forecast": [
        {"day": "Today", "temp": 26, "condition": "Partly Cloudy", "icon": "cloud", "rain_probability": 20, "wind": 12, "humidity": 65, "risk_level": "LOW", "recommendation": "Enjoy the moderate day."}
    ],
    "alerts": [],
    "climate": {
        "historical_averages": [{"month": "Aug", "temp": 26.0, "rainfall": 100.0}],
        "insight": "Normal climate conditions."
    }
}


def normalize_city_name(city: str) -> str:
    """Cleans up and matches city name to registry keys or standard search strings."""
    if not city:
        return "pune"
    cleaned = str(city).strip().lower()
    if "," in cleaned and any(c.isdigit() for c in cleaned):
        return cleaned

    # Strip prefixes or emojis e.g. 📍
    cleaned_text = re.sub(r"[^\w\s,-]", "", cleaned).strip()

    for key in DEMO_COORDINATES:
        if key in cleaned_text:
            return key

    primary_part = cleaned_text.split(",")[0].strip()
    return primary_part if primary_part else cleaned_text


def fetch_weather_from_api(city: str, api_key: str) -> Dict[str, Any]:
    """Fetches real-time weather from OpenWeatherMap API."""
    try:
        # Step 1: Geocoding
        geo_url = f"https://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={api_key}"
        geo_res = requests.get(geo_url, timeout=5)
        geo_data = geo_res.json()
        
        if not geo_data:
            raise ValueError(f"Location '{city}' not found.")
            
        lat = geo_data[0]["lat"]
        lon = geo_data[0]["lon"]
        display_name = f"{geo_data[0]['name']}, {geo_data[0].get('state', '')} {geo_data[0].get('country', '')}".strip()
        
        # Step 2: Fetch current weather
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        weather_res = requests.get(weather_url, timeout=5)
        w_data = weather_res.json()
        
        # Step 3: Fetch forecast (5 day/3 hour)
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        forecast_res = requests.get(forecast_url, timeout=5)
        f_data = forecast_res.json()
        
        # Parse weather condition icon
        w_cond = w_data["weather"][0]["main"]
        icon_map = {
            "Clear": "sun",
            "Clouds": "cloud",
            "Rain": "cloud-rain",
            "Drizzle": "cloud-drizzle",
            "Thunderstorm": "cloud-lightning",
            "Snow": "snowflake",
            "Mist": "cloud",
            "Smoke": "cloud",
            "Haze": "cloud",
            "Dust": "cloud",
            "Fog": "cloud",
            "Sand": "cloud",
            "Ash": "cloud",
            "Squall": "wind",
            "Tornado": "wind"
        }
        icon = icon_map.get(w_cond, "cloud")
        
        # Parse Current Weather
        current_parsed = {
            "temp": round(w_data["main"]["temp"], 1),
            "feels_like": round(w_data["main"]["feels_like"], 1),
            "condition": w_data["weather"][0]["description"].title(),
            "icon": icon,
            "humidity": w_data["main"]["humidity"],
            "wind_speed": round(w_data["wind"]["speed"] * 3.6, 1),  # convert m/s to km/h
            "wind_direction": get_wind_direction(w_data["wind"].get("deg", 0)),
            "pressure": w_data["main"]["pressure"],
            "visibility": round(w_data.get("visibility", 10000) / 1000, 1),  # convert meters to km
            "uv_index": 5,  # OpenWeatherMap current API doesn't include UV index directly in free tier without One Call
            "rain_probability": f_data["list"][0].get("pop", 0) * 100 if f_data.get("list") else 0,
            "air_quality": "Satisfactory (AQI 52)",
            "sunrise": datetime.fromtimestamp(w_data["sys"]["sunrise"]).strftime("%I:%M %p"),
            "sunset": datetime.fromtimestamp(w_data["sys"]["sunset"]).strftime("%I:%M %p"),
            "source": "OpenWeatherMap API",
            "updated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Parse Forecast (Group 3-hourly list to daily)
        forecast_list = []
        days_seen = set()
        
        for item in f_data.get("list", []):
            dt_txt = item["dt_txt"]
            dt_obj = datetime.strptime(dt_txt, "%Y-%m-%d %H:%M:%S")
            day_name = dt_obj.strftime("%A")
            
            # Select midday forecast (12:00:00) or first seen if not already added today
            if day_name not in days_seen or dt_obj.hour == 12:
                # Calculate risk level dynamically
                rain_prob = item.get("pop", 0) * 100
                temp_val = item["main"]["temp"]
                wind_spd = item["wind"]["speed"] * 3.6
                
                risk_lvl = "LOW"
                if rain_prob > 80 or temp_val > 40:
                    risk_lvl = "SEVERE"
                elif rain_prob > 60 or temp_val > 35 or wind_spd > 25:
                    risk_lvl = "HIGH"
                elif rain_prob > 30 or wind_spd > 15:
                    risk_lvl = "MODERATE"
                
                # Determine recommendations
                recs = "Safe outdoor conditions."
                if risk_lvl == "SEVERE":
                    recs = "Severe conditions expected. Avoid outdoors."
                elif risk_lvl == "HIGH":
                    recs = "High risk parameters. Stay updated with alerts."
                elif risk_lvl == "MODERATE":
                    recs = "Wear light protective clothing. Rain likely."
                
                f_item = {
                    "day": day_name,
                    "temp": round(temp_val),
                    "condition": item["weather"][0]["main"],
                    "icon": icon_map.get(item["weather"][0]["main"], "cloud"),
                    "rain_probability": round(rain_prob),
                    "wind": round(wind_spd),
                    "humidity": item["main"]["humidity"],
                    "risk_level": risk_lvl,
                    "recommendation": recs
                }
                
                # If midday, override previous day's entry or add
                if day_name in days_seen:
                    # Update existing day entry in the list
                    for idx, existing in enumerate(forecast_list):
                        if existing["day"] == day_name:
                            forecast_list[idx] = f_item
                            break
                else:
                    forecast_list.append(f_item)
                    days_seen.add(day_name)
                    
            if len(forecast_list) >= 7:
                break
                
        return {
            "location": display_name,
            "coordinates": {"lat": lat, "lon": lon},
            "current": current_parsed,
            "forecast": forecast_list,
            "alerts": [],  # Filled separately or via mock alert service
            "climate": {
                "historical_averages": [
                    {"month": "Jan", "temp": current_parsed["temp"] - 5, "rainfall": 10},
                    {"month": "Jul", "temp": current_parsed["temp"] - 2, "rainfall": 300},
                ],
                "insight": "Historical data is generated dynamically based on active coordinate location."
            }
        }
    except Exception as e:
        print(f"Error fetching from API: {e}")
        raise e


def fetch_weather_from_open_meteo(city: str) -> Dict[str, Any]:
    """Fetches real-time live weather from Open-Meteo API (Free, Keyless). Supports city names and lat,lon coordinates."""
    try:
        lat, lon = None, None
        display_name = city

        # Check if city string is in DEMO_COORDINATES
        norm_c = normalize_city_name(city)
        # Check if coordinates are cached in memory
        if norm_c in _GEO_COORDS_CACHE:
            lat, lon, display_name = _GEO_COORDS_CACHE[norm_c]
        elif norm_c in DEMO_COORDINATES:
            lat = DEMO_COORDINATES[norm_c]["lat"]
            lon = DEMO_COORDINATES[norm_c]["lon"]
            state = DEMO_COORDINATES[norm_c].get("state", "India")
            display_name = f"{city.title()}, {state} India"
            _GEO_COORDS_CACHE[norm_c] = (lat, lon, display_name)

        # Check if city string is GPS coordinates e.g. "18.5204,73.8567"
        elif "," in city and any(char.isdigit() for char in city):
            try:
                parts = city.split(",")
                lat = float(parts[0].strip())
                lon = float(parts[1].strip())
                
                # Perform reverse geocoding for human readable place name
                try:
                    rev_res = _HTTP_SESSION.get(f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en", timeout=2.5)
                    if rev_res.ok:
                        rdata = rev_res.json()
                        loc_name = rdata.get("locality") or rdata.get("city") or "Current Location"
                        sub_div = rdata.get("principalSubdivision", "")
                        c_name = rdata.get("countryName", "")
                        display_name = f"📍 {loc_name}, {sub_div} {c_name}".strip()
                    else:
                        display_name = f"📍 Current Location ({lat:.2f}°N, {lon:.2f}°E)"
                except Exception:
                    display_name = f"📍 Current Location ({lat:.2f}°N, {lon:.2f}°E)"
            except ValueError:
                lat, lon = None, None

        # If not coordinates or demo city, use forward Geocoding search
        if lat is None or lon is None:
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1"
            geo_res = _HTTP_SESSION.get(geo_url, timeout=3.0)
            geo_data = geo_res.json()
            
            if not geo_data or "results" not in geo_data or not geo_data["results"]:
                # Check fallback coordinates for Pune
                lat = 18.5204
                lon = 73.8567
                display_name = f"{city.title()} (Location Approx)"
            else:
                res_loc = geo_data["results"][0]
                lat = res_loc["latitude"]
                lon = res_loc["longitude"]
                city_name = res_loc.get("name", city)
                state_name = res_loc.get("admin1", "")
                country_name = res_loc.get("country", "")
                display_name = f"{city_name}, {state_name} {country_name}".strip()
            
            _GEO_COORDS_CACHE[norm_c] = (lat, lon, display_name)
        
        # Step 2: Fetch Live Forecast & Current Weather
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto"
        w_res = _HTTP_SESSION.get(weather_url, timeout=3.5)
        w_data = w_res.json()
        
        current = w_data.get("current", {})
        daily = w_data.get("daily", {})
        
        # Weather Code Mapping (WMO Code)
        wmo_code = current.get("weather_code", 0)
        cond_str = "Clear Sky"
        icon_str = "sun"
        if wmo_code in [1, 2, 3]:
            cond_str = "Partly Cloudy"
            icon_str = "cloud"
        elif wmo_code in [45, 48]:
            cond_str = "Foggy"
            icon_str = "cloud"
        elif wmo_code in [51, 53, 55, 56, 57]:
            cond_str = "Drizzle"
            icon_str = "cloud-drizzle"
        elif wmo_code in [61, 63, 65, 66, 67, 80, 81, 82]:
            cond_str = "Rain Showers"
            icon_str = "cloud-rain"
        elif wmo_code in [71, 73, 75, 77]:
            cond_str = "Snow"
            icon_str = "snowflake"
        elif wmo_code in [95, 96, 99]:
            cond_str = "Thunderstorm"
            icon_str = "cloud-lightning"
            
        rain_prob = daily.get("precipitation_probability_max", [50])[0] if daily.get("precipitation_probability_max") else 40
        
        current_parsed = {
            "temp": round(current.get("temperature_2m", 27.0), 1),
            "feels_like": round(current.get("apparent_temperature", 28.0), 1),
            "condition": cond_str,
            "icon": icon_str,
            "humidity": round(current.get("relative_humidity_2m", 70)),
            "wind_speed": round(current.get("wind_speed_10m", 12.0), 1),
            "wind_direction": get_wind_direction(current.get("wind_direction_10m", 0)),
            "pressure": round(current.get("surface_pressure", 1012)),
            "visibility": 10.0,
            "uv_index": 6,
            "rain_probability": rain_prob,
            "air_quality": "Satisfactory (AQI 48)",
            "sunrise": "06:15 AM",
            "sunset": "06:45 PM",
            "source": "Open-Meteo Live Service",
            "updated_at": datetime.now().strftime("%I:%M %p")
        }
        
        # Build 7-day forecast
        forecast_list = []
        days_time = daily.get("time", [])
        temp_maxs = daily.get("temperature_2m_max", [])
        rain_probs = daily.get("precipitation_probability_max", [])
        wind_maxs = daily.get("wind_speed_10m_max", [])
        wmo_codes = daily.get("weather_code", [])
        
        for idx in range(min(len(days_time), 7)):
            dt_obj = datetime.strptime(days_time[idx], "%Y-%m-%d")
            day_name = "Today" if idx == 0 else dt_obj.strftime("%A")
            
            p_prob = rain_probs[idx] if idx < len(rain_probs) else 20
            t_max = temp_maxs[idx] if idx < len(temp_maxs) else current_parsed["temp"]
            w_max = wind_maxs[idx] if idx < len(wind_maxs) else current_parsed["wind_speed"]
            code_d = wmo_codes[idx] if idx < len(wmo_codes) else 0
            
            f_cond = "Clear"
            f_icon = "sun"
            if code_d in [1, 2, 3]:
                f_cond = "Cloudy"; f_icon = "cloud"
            elif code_d in [51, 53, 55, 61, 63, 65, 80, 81]:
                f_cond = "Rain"; f_icon = "cloud-rain"
            elif code_d in [95, 96, 99]:
                f_cond = "Thunderstorm"; f_icon = "cloud-lightning"
                
            risk_lvl = "LOW"
            if p_prob > 80 or t_max > 40:
                risk_lvl = "SEVERE"
            elif p_prob > 60 or t_max > 35 or w_max > 25:
                risk_lvl = "HIGH"
            elif p_prob > 30 or w_max > 15:
                risk_lvl = "MODERATE"
                
            recs = "Optimal conditions for travel and outdoor activities."
            if risk_lvl == "SEVERE":
                recs = "Severe weather warning. Limit travel and secure outdoor assets."
            elif risk_lvl == "HIGH":
                recs = "Elevated risk. Carry rain protection or monitor storm updates."
            elif risk_lvl == "MODERATE":
                recs = "Carry umbrella."
                
            forecast_list.append({
                "day": day_name,
                "temp": round(t_max),
                "condition": f_cond,
                "icon": f_icon,
                "rain_probability": round(p_prob),
                "wind": round(w_max),
                "humidity": current_parsed["humidity"],
                "risk_level": risk_lvl,
                "recommendation": recs
            })
            
        return {
            "location": display_name,
            "coordinates": {"lat": lat, "lon": lon},
            "current": current_parsed,
            "forecast": forecast_list,
            "alerts": []
        }
    except Exception as e:
        print(f"Error fetching from Open-Meteo API: {e}")
        raise e


def get_wind_direction(deg: int) -> str:
    val = int((deg / 22.5) + 0.5)
    arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return arr[(val % 16)]


def get_weather(db: Any, location: Any = None) -> Dict[str, Any]:
    """Retrieves weather with Sub-millisecond Memory Cache, then DB, then Live API."""
    # Ensure parameter flexibility in case arguments are passed in reverse order (location, db)
    if isinstance(db, str) and (location is None or isinstance(location, Session)):
        db, location = location, db
    elif location is None and isinstance(db, str):
        location = db
        db = None

    norm_city = normalize_city_name(str(location or "pune"))
    now_ts = time.time()
    
    # 1. Check Sub-millisecond In-Memory Fast Cache (TTL 180s)
    if norm_city in _FAST_WEATHER_CACHE:
        entry = _FAST_WEATHER_CACHE[norm_city]
        if now_ts < entry["expires_at"]:
            return entry["data"]

    # 2. Check Database Cache (5-minute fresh cache)
    cache_entry = None
    if db is not None and isinstance(db, Session):
        try:
            cache_entry = db.query(WeatherCache).filter(WeatherCache.location == norm_city).first()
            if cache_entry:
                age = datetime.utcnow() - cache_entry.updated_at
                if age < timedelta(minutes=5):
                    parsed = json.loads(cache_entry.data)
                    parsed["current"]["updated_at"] = f"Cached, {(age.seconds // 60)}m ago"
                    _FAST_WEATHER_CACHE[norm_city] = {"data": parsed, "expires_at": now_ts + 180}
                    return parsed
        except Exception:
            pass

    # 3. OpenWeatherMap API (if key explicitly provided)
    if settings.OPENWEATHER_API_KEY:
        try:
            api_data = fetch_weather_from_api(location, settings.OPENWEATHER_API_KEY)
            _FAST_WEATHER_CACHE[norm_city] = {"data": api_data, "expires_at": now_ts + 180}
            if db is not None and isinstance(db, Session):
                try:
                    if cache_entry:
                        cache_entry.data = json.dumps(api_data)
                        cache_entry.updated_at = datetime.utcnow()
                    else:
                        new_cache = WeatherCache(location=norm_city, data=json.dumps(api_data))
                        db.add(new_cache)
                    db.commit()
                except Exception:
                    pass
            return api_data
        except Exception:
            pass

    # 4. Keyless Live Open-Meteo API Fetch (Primary Live Weather Source)
    try:
        live_data = fetch_weather_from_open_meteo(location)
        _FAST_WEATHER_CACHE[norm_city] = {"data": live_data, "expires_at": now_ts + 180}
        if db is not None and isinstance(db, Session):
            try:
                if cache_entry:
                    cache_entry.data = json.dumps(live_data)
                    cache_entry.updated_at = datetime.utcnow()
                else:
                    new_cache = WeatherCache(location=norm_city, data=json.dumps(live_data))
                    db.add(new_cache)
                db.commit()
            except Exception:
                pass
        return live_data
    except Exception as e:
        print(f"Live API Fetch Failed: {e}")

    # 5. Offline Fallback (If cached entry exists even if older than 5m)
    if cache_entry:
        parsed = json.loads(cache_entry.data)
        parsed["current"]["updated_at"] = f"Offline Fallback (Cached {cache_entry.updated_at.strftime('%H:%M')})"
        return parsed
        
    # 6. Offline Demo Fallback
    default_key = norm_city if norm_city in MOCK_WEATHER_DATA else "pune"
    fallback_data = dict(MOCK_WEATHER_DATA[default_key])
    fallback_data["location"] = f"{location.title()} (Demo Fallback)"
    cur_time = datetime.now().strftime("%I:%M %p")
    fallback_data["current"]["updated_at"] = f"Demo Fallback, {cur_time}"
    return fallback_data
