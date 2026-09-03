from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.weather_service import get_weather
from app.services.risk_service import calculate_weather_risk

router = APIRouter(prefix="/report", tags=["report"])

class ReportRequest(BaseModel):
    location: str = "Pune"
    report_type: str = "daily" # daily, travel, farmer, disaster
    format: str = "json" # json, summary_text

@router.post("/generate")
def generate_weather_report(req: ReportRequest, db: Session = Depends(get_db)):
    try:
        w_data = get_weather(db, req.location)
        risk = calculate_weather_risk(w_data)
        
        curr = w_data.get("current", {})
        loc_name = w_data.get("location", req.location)
        
        report_title = f"WeatherGPT {req.report_type.capitalize()} Intelligence Report"
        
        executive_summary = (
            f"Location: {loc_name}. Current status is {curr.get('temp')}°C, {curr.get('condition')}. "
            f"Rain probability stands at {curr.get('rain_probability')}%. "
            f"Overall Weather Risk Score: {risk.get('score')}/100 ({risk.get('category')})."
        )
        
        advice_map = {
            "daily": "General public is advised to monitor peak rainfall hours and keep umbrella handy.",
            "travel": "Travellers on Western Ghats highways should expect reduced visibility during afternoon rain cells.",
            "farmer": "Farmers should postpone chemical spraying due to anticipated precipitation and check soil drainage.",
            "disaster": "Command center alert active. Prioritize low-lying river areas for emergency observation."
        }
        
        return {
            "title": report_title,
            "location": loc_name,
            "generated_at": curr.get("updated_at", "2026-08-28 12:00:00"),
            "report_type": req.report_type,
            "executive_summary": executive_summary,
            "current_metrics": curr,
            "risk_assessment": risk,
            "actionable_recommendations": advice_map.get(req.report_type, advice_map["daily"]),
            "forecast_overview": w_data.get("forecast", [])[:3],
            "disclaimer": "WeatherGPT AI-Generated Intelligence Report — For official emergency orders, follow state authorities."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
