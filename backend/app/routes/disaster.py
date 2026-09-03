from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/disaster", tags=["disaster"])

@router.get("/dashboard")
def get_disaster_dashboard():
    return {
        "metrics": {
            "active_alerts": 17,
            "high_risk_areas": 6,
            "flood_risk_count": 4,
            "heavy_rainfall_count": 8,
            "severe_weather_count": 3
        },
        "critical_zones": [
            {"location": "Lonavala, Maharashtra", "severity": "SEVERE", "hazard": "Landslides & Cloudburst", "risk_score": 98},
            {"location": "Pune, Maharashtra", "severity": "SEVERE", "hazard": "Extreme Rainfall", "risk_score": 92},
            {"location": "Mumbai, Maharashtra", "severity": "WARNING", "hazard": "High Tide Ingress", "risk_score": 78},
            {"location": "Khopoli, Maharashtra", "severity": "WARNING", "hazard": "Excessive Runoff", "risk_score": 72},
            {"location": "Delhi, NCR", "severity": "SEVERE", "hazard": "Heatwave Conditions", "risk_score": 88}
        ],
        "ai_situation_summary": (
            "Six districts are currently classified as high-risk based on available meteorological data. "
            "Extremely heavy rainfall is concentrated in the Western Ghats region (Lonavala/Pune), "
            "leading to high landslide probability. Mumbai is experiencing elevated tidal surges. "
            "Three specific transport and utility locations (specifically the Pune-Mumbai Expressway corridor) "
            "require immediate traffic diversions and monitoring by disaster management cells."
        ),
        "source": "IMD Disaster Warning Cell - Live Demo Integration"
    }
