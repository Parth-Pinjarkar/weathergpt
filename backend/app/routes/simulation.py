from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/simulation", tags=["simulation"])

class DisasterSimRequest(BaseModel):
    scenario: str # HEAVY_RAIN, FLOOD, CYCLONE, HEATWAVE, THUNDERSTORM
    intensity: Optional[float] = 1.0 # Multiplier (0.5 to 2.0)

class WhatIfRequest(BaseModel):
    location: str = "Pune"
    rainfall_delta_percent: float = 0.0 # e.g. +30%
    temp_delta_celsius: float = 0.0 # e.g. +5 C
    wind_delta_kmh: float = 0.0 # e.g. +20 km/h

SCENARIO_PRESETS = {
    "HEAVY_RAIN": {
        "title": "Severe Heavy Rain Simulation",
        "simulated_hazard": "Cloudburst & Torrential Rainfall",
        "baseline_risk": 45,
        "simulated_risk": 87,
        "risk_level": "SEVERE",
        "affected_zones": [
            {"name": "Lonavala Ghats", "risk": 98, "status": "Red Alert - Landslide Watch"},
            {"name": "Pune Mula-Mutha River Basin", "risk": 89, "status": "Red Alert - Inundation Warning"},
            {"name": "Khopoli Valley", "risk": 84, "status": "Orange Warning - Flash Flood"}
        ],
        "key_factors": [
            {"factor": "Simulated Rainfall Intensity (+65 mm/hr)", "score": 38},
            {"factor": "River Level Water Rise (+2.4m above danger)", "score": 25},
            {"factor": "Saturated Soil Moisture Index", "score": 24}
        ],
        "ai_recommendation": "Activate local disaster cells immediately. Issue mandatory travel warnings on Mumbai-Pune Expressway."
    },
    "FLOOD": {
        "title": "Urban & Riverine Flood Simulation",
        "simulated_hazard": "River Overflow & Inundation",
        "baseline_risk": 30,
        "simulated_risk": 94,
        "risk_level": "SEVERE",
        "affected_zones": [
            {"name": "Khadakwasla Spillway Corridor", "risk": 96, "status": "Evacuation Recommended"},
            {"name": "Sangamwadi & Deccan Gymkhana Low Areas", "risk": 91, "status": "Submerged Roads"},
            {"name": "Panvel Creek Ingress Zone", "risk": 86, "status": "High Tide Ingress"}
        ],
        "key_factors": [
            {"factor": "Khadakwasla Dam Discharge (35,000 cusecs)", "score": 45},
            {"factor": "High Surge Water Backup", "score": 28},
            {"factor": "Low Elevation Drainage Lock", "score": 21}
        ],
        "ai_recommendation": "Deploy NDRF rubber boats to Khadakwasla downstream. Evacuate basement parking structures and ground floor settlements."
    },
    "HEATWAVE": {
        "title": "Extreme Heatwave Simulation",
        "simulated_hazard": "Severe Thermal Stress",
        "baseline_risk": 20,
        "simulated_risk": 78,
        "risk_level": "HIGH",
        "affected_zones": [
            {"name": "Vidarbha / Nagpur Belt", "risk": 92, "status": "46°C Extreme Heat"},
            {"name": "Pune North Industrial Zone", "risk": 78, "status": "41°C Thermal Stress"},
            {"name": "Marathwada Agricultural Zone", "risk": 85, "status": "Severe Crop Dehydration"}
        ],
        "key_factors": [
            {"factor": "Peak Ambient Temp (+44.5°C)", "score": 35},
            {"factor": "Wet Bulb Globe Temp Index (High Risk)", "score": 25},
            {"factor": "Humidity Deficit & Solar Insolation", "score": 18}
        ],
        "ai_recommendation": "Declare mandatory outdoor work suspension between 12 PM and 4 PM. Open municipal cooling centers and ORS distribution booths."
    },
    "CYCLONE": {
        "title": "Severe Cyclonic Storm Simulation",
        "simulated_hazard": "High Velocity Winds & Storm Surge",
        "baseline_risk": 25,
        "simulated_risk": 91,
        "risk_level": "SEVERE",
        "affected_zones": [
            {"name": "Konkan Coastal Belt (Alibaug/Ratnagiri)", "risk": 95, "status": "Landfall Zone (110 km/h gusts)"},
            {"name": "Mumbai Offshore & Harbor", "risk": 90, "status": "Harbor Operations Suspended"},
            {"name": "Thane / Panvel Interior", "risk": 82, "status": "Tree & Tower Fall Hazard"}
        ],
        "key_factors": [
            {"factor": "Sustained Wind Speed (95 km/h)", "score": 40},
            {"factor": "Astronomical High Tide Coincidence", "score": 30},
            {"factor": "Heavy Precip Banding (+120 mm)", "score": 21}
        ],
        "ai_recommendation": "Suspend all maritime activity. Issue red alert notice to coastal fishermen and secure power transmission towers."
    },
    "THUNDERSTORM": {
        "title": "Severe Convective Thunderstorm Simulation",
        "simulated_hazard": "Cloud-to-Ground Lightning & Microburst",
        "baseline_risk": 15,
        "simulated_risk": 72,
        "risk_level": "HIGH",
        "affected_zones": [
            {"name": "Pune East / Hadapsar Airport Corridor", "risk": 78, "status": "High Lightning Activity"},
            {"name": "Pimpri-Chinchwad Tech Hub", "risk": 71, "status": "Microburst Squall (55 km/h)"}
        ],
        "key_factors": [
            {"factor": "CAPE Cloud Instability Index (High)", "score": 32},
            {"factor": "Lightning Discharge Density", "score": 25},
            {"factor": "Sudden Temp Drop & Squall", "score": 15}
        ],
        "ai_recommendation": "Advise public to remain inside non-metallic structures. Suspend airport tarmac operations during cell passage."
    }
}

@router.post("/disaster")
def run_disaster_simulation(req: DisasterSimRequest):
    key = req.scenario.upper()
    if key not in SCENARIO_PRESETS:
        key = "HEAVY_RAIN"
    
    preset = SCENARIO_PRESETS[key].copy()
    intensity = max(0.5, min(req.intensity or 1.0, 2.0))
    preset["simulated_risk"] = min(100, int(preset["simulated_risk"] * intensity))
    
    return {
        "scenario": key,
        "disclaimer": "SIMULATION MODE — NOT OFFICIAL EMERGENCY WARNING DATA",
        "intensity_multiplier": intensity,
        "result": preset
    }

@router.post("/whatif")
def run_whatif_analysis(req: WhatIfRequest):
    base_risk = 35 # Baseline Pune normal risk
    rain_impact = req.rainfall_delta_percent * 0.45
    temp_impact = req.temp_delta_celsius * 3.5
    wind_impact = req.wind_delta_kmh * 0.8
    
    simulated_score = min(100, max(0, int(base_risk + rain_impact + temp_impact + wind_impact)))
    
    category = "LOW"
    color = "green"
    if simulated_score > 75:
        category = "SEVERE"
        color = "red"
    elif simulated_score > 50:
        category = "HIGH"
        color = "orange"
    elif simulated_score > 25:
        category = "MODERATE"
        color = "amber"
        
    return {
        "location": req.location,
        "inputs": {
            "rainfall_delta_percent": req.rainfall_delta_percent,
            "temp_delta_celsius": req.temp_delta_celsius,
            "wind_delta_kmh": req.wind_delta_kmh
        },
        "baseline_score": base_risk,
        "simulated_score": simulated_score,
        "delta": simulated_score - base_risk,
        "category": category,
        "color": color,
        "breakdown": [
            {"factor": "Baseline Risk", "impact": base_risk},
            {"factor": f"Rainfall Change ({req.rainfall_delta_percent:+}% )", "impact": round(rain_impact, 1)},
            {"factor": f"Temperature Shift ({req.temp_delta_celsius:+}°C)", "impact": round(temp_impact, 1)},
            {"factor": f"Wind Velocity Shift ({req.wind_delta_kmh:+} km/h)", "impact": round(wind_impact, 1)}
        ],
        "explanation": f"If rainfall increases by {req.rainfall_delta_percent}% and temp shifts by {req.temp_delta_celsius}°C, risk level shifts from baseline ({base_risk}) to {simulated_score}/100 ({category}).",
        "disclaimer": "AI What-If Simulation — Hypothesized Risk Calculation"
    }
