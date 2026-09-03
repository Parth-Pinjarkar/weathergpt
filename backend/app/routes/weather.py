from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.weather_service import get_weather
from app.services.risk_service import calculate_weather_risk

router = APIRouter(prefix="/weather", tags=["weather"])

@router.get("/current")
def get_current_weather_endpoint(
    location: str = Query(..., description="City or coordinates"),
    db: Session = Depends(get_db)
):
    try:
        data = get_weather(db, location)
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
