# WeatherGPT — Dedicated Weather Risk Engine

The **Weather Risk Engine** (`app/services/risk_service.py`) calculates an objective, transparent meteorological risk index from 0 to 100.

## 1. Risk Formulation & Weight Matrix

```mermaid
graph TD
    Precip["Precipitation Intensity (+10 to +50)"] --> Score["Consolidated Risk Score (0-100)"]
    RainProb["Rain Probability (+10 to +15)"] --> Score
    Wind["Wind Velocity & Gusts (+8 to +25)"] --> Score
    Temp["Thermal Extremes (+15 to +30)"] --> Score
    Vis["Visibility Drops (+10 to +20)"] --> Score
    Topo["Topography & Soil (+10 to +15)"] --> Score
    Govt["Official IMD Alerts (+15 per alert)"] --> Score

    Score --> Cat{"Category Classifier"}
    Cat -->|0 - 25| Low["LOW (Emerald)"]
    Cat -->|26 - 50| Mod["MODERATE (Amber)"]
    Cat -->|51 - 75| High["HIGH (Orange)"]
    Cat -->|76 - 100| Sev["SEVERE (Red)"]
```

## 2. Parameter Weights

| Factor | Threshold | Weight | Operational Impact |
|--------|-----------|--------|-------------------|
| Cloudburst / Intense Rain | Rain condition / >65 mm/hr | +50 | Flash flood & drainage collapse |
| Thunderstorm / Lightning | Thunder condition | +35 | Structural hazard & power disruption |
| Gale Winds | >40 km/h | +25 | Flying debris & vehicle rollover |
| Extreme Heatwave | $\ge 40^\circ\text{C}$ | +30 | Heat stroke & electrical grid overload |
| Heavy Fog / Low Visibility | $<2.0\text{ km}$ | +20 | Highway multi-vehicle collision risk |
| Ghat Topography | Hilly / Ghat pass | +15 | Landslide & boulder fall vulnerability |
| Active Government Warning | Per active alert | +15 | Regulatory and civic disruption |

## 3. Explanations & Transparency
Unlike opaque black-box models, the Risk Engine returns an explicit breakdown of all active factors:
```json
{
  "score": 68,
  "category": "HIGH",
  "color": "orange",
  "breakdown": [
    {"factor": "Heavy Rainfall / Thunderstorm", "weight": 35, "icon": "cloud-rain"},
    {"factor": "Ghat Topography - Landslide Vulnerability", "weight": 15, "icon": "mountain"},
    {"factor": "Very High Precipitation Probability (>80%)", "weight": 15, "icon": "droplet"}
  ]
}
```
