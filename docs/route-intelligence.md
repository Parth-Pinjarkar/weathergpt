# WeatherGPT — Route Weather Intelligence

Weather Route Intelligence (`app/services/route_service.py`) analyzes meteorological threat vectors along transportation corridors to recommend safe departure windows.

## 1. Corridor Sampling Architecture

```mermaid
sequenceDiagram
    participant User as Driver / Logistics Planner
    participant API as /api/route/analyze
    participant Engine as Route Intelligence Engine
    participant Weather as Weather Provider

    User->>API: Submit Route (Pune -> Mumbai, 05:00 PM)
    API->>Engine: Resolve Checkpoints (Pune, Lonavala, Khopoli, Panvel, Mumbai)
    par Checkpoint Weather Fetch
        Engine->>Weather: Checkpoint 1 (Pune)
        Engine->>Weather: Checkpoint 2 (Lonavala - Ghat Corridor)
        Engine->>Weather: Checkpoint 3 (Khopoli - Base of Ghat)
        Engine->>Weather: Checkpoint 4 (Panvel - Coastal Plains)
        Engine->>Weather: Checkpoint 5 (Mumbai - Urban Center)
    end
    Engine->>Engine: Evaluate Individual Checkpoint Risks
    Engine->>Engine: Detect Critical Chokepoint (e.g. Lonavala Fog / Rain)
    Engine->>Engine: Compute Recommended Departure Time Window
    Engine-->>User: Route Timeline + Hazard Advisory + Risk Index
```

## 2. Dynamic Corridor Output
Each transit waypoint provides localized metrics:
- **Temperature & Feels Like**
- **Precipitation Probability & Intensity**
- **Wind Speed & Crosswind Shears**
- **Horizontal Visibility & Fog Risk**
- **Checkpoint-Specific Risk Level** (`LOW`, `MODERATE`, `HIGH`, `SEVERE`)

## 3. Intelligent Departure Recommendation
The engine inspects hourly projections along the route corridor to identify safer departure windows:
> *"Heavy rain and dense fog detected at Lonavala Ghat between 05:00 PM and 07:30 PM. Recommended departure: Leave before 03:30 PM or after 08:00 PM for optimal road friction and visibility."*
