from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.weather_service import get_weather
from app.services.risk_service import calculate_weather_risk

router = APIRouter(prefix="/weather", tags=["weather"])

@router.get("/current")
def get_current_weather_endpoint(
    location: str = Query(..., description="City or coordinates"),
    nwp_model: str = Query("best_match", description="NWP Forecasting Model: best_match, gfs, ecmwf, icon"),
    refresh: bool = Query(False, description="Force fresh fetch from weather provider bypassing cache"),
    db: Session = Depends(get_db)
):
    try:
        data = get_weather(db, location, nwp_model=nwp_model, force_refresh=refresh)
        risk = calculate_weather_risk(data)
        return {
            "weather": data,
            "risk": risk
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/forecast")
def get_forecast_endpoint(
    location: str = Query(..., description="City or coordinates"),
    db: Session = Depends(get_db)
):
    try:
        data = get_weather(db, location)
        return {
            "location": data["location"],
            "forecast": data.get("forecast", []),
            "source": data["current"]["source"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/climate")
def get_climate_endpoint(
    location: str = Query(..., description="City or coordinates"),
    db: Session = Depends(get_db)
):
    try:
        data = get_weather(db, location)
        return {
            "location": data["location"],
            "climate": data.get("climate", {}),
            "source": data["current"]["source"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from concurrent.futures import ThreadPoolExecutor
from app.database import SessionLocal

class BatchWeatherRequest(BaseModel):
    locations: List[str]

@router.post("/batch")
def get_batch_weather_endpoint(req: BatchWeatherRequest):
    """
    Fetches weather & risk scores for multiple locations concurrently in parallel.
    Massively accelerates map rendering and dashboard marker initialization.
    """
    def fetch_single(loc: str) -> Dict[str, Any]:
        thread_db = SessionLocal()
        try:
            w_data = get_weather(thread_db, loc)
            r_data = calculate_weather_risk(w_data)
            return {
                "location": loc,
                "weather": w_data,
                "risk": r_data,
                "success": True
            }
        except Exception as err:
            return {
                "location": loc,
                "error": str(err),
                "success": False
            }
        finally:
            thread_db.close()

    max_workers = min(len(req.locations), 8) if req.locations else 1
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(fetch_single, req.locations))

    return {"results": results, "count": len(results)}


@router.get("/activity-advisor")
def get_activity_advisor_endpoint(
    location: str = Query(..., description="City or coordinates"),
    activity: Optional[str] = Query(None, description="Optional specific activity (e.g. running, cycling, farming, driving)"),
    db: Session = Depends(get_db)
):
    """Returns weather suitability and optimal hourly windows for 9 daily activities."""
    from app.services.activity_advisor import evaluate_activity, evaluate_all_activities
    data = get_weather(db, location)
    if activity:
        result = evaluate_activity(activity, data)
        return {"location": data.get("location", location), "activity_evaluation": result}
    
    all_acts = evaluate_all_activities(data)
    return {
        "location": data.get("location", location),
        "activities": all_acts
    }


@router.get("/complete")
def get_complete_weather_endpoint(
    location: str = Query(..., description="City or coordinates"),
    nwp_model: str = Query("best_match", description="NWP Forecasting Model"),
    db: Session = Depends(get_db)
):
    """Single-call consolidated endpoint returning weather, risk, hazards, confidence, and activity scores."""
    from app.services.risk_service import risk_engine
    from app.services.activity_advisor import evaluate_all_activities
    data = get_weather(db, location, nwp_model=nwp_model)
    risk = risk_engine.calculate_risk(data)
    confidence = risk_engine.calculate_confidence(data)
    hazards = risk_engine.detect_weather_hazards(data)
    activities = evaluate_all_activities(data)
    explanation = risk_engine.generate_risk_explanation(
        risk["score"], risk["category"], risk["breakdown"], data.get("location", location)
    )

    return {
        "weather": data,
        "risk": risk,
        "confidence_score": confidence,
        "hazards": hazards,
        "risk_explanation": explanation,
        "activities": activities
    }


@router.get("/providers")
def get_providers_endpoint():
    """Lists available weather providers and currently active provider."""
    from app.config.settings import settings
    return {
        "active_provider": settings.WEATHER_PROVIDER,
        "available_providers": [
            {"id": "openmeteo", "name": "Open-Meteo NWP Consensus (Zero-Key)", "status": "active"},
            {"id": "openweather", "name": "OpenWeatherMap OneCall 3.0", "status": "available" if settings.OPENWEATHER_API_KEY else "key_required"},
            {"id": "weatherapi", "name": "WeatherAPI.com Telemetry", "status": "available" if settings.WEATHERAPI_API_KEY else "key_required"},
            {"id": "mock", "name": "Deterministic Mock Provider (SIH Offline)", "status": "active"}
        ]
    }

