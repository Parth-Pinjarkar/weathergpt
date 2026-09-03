from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.weather_service import get_weather, normalize_city_name, MOCK_WEATHER_DATA

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("")
def get_alerts_endpoint(
    location: str = Query(None, description="Filter alerts by location"),
    db: Session = Depends(get_db)
):
    if location:
        w_data = get_weather(db, location)
        return {
            "location": w_data["location"],
            "alerts": w_data.get("alerts", [])
        }
    
    # Return all active demo alerts
    all_alerts = []
    for city, w_data in MOCK_WEATHER_DATA.items():
        if w_data.get("alerts"):
            for alert in w_data["alerts"]:
                all_alerts.append({
                    "location": w_data["location"],
                    **alert
                })
    return {"alerts": all_alerts}
