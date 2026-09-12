"""
WeatherGPT — User Preferences, Saved Locations & History
────────────────────────────────────────────────────────
Endpoints for managing user units, alerts settings, bookmarked
locations, and trip search history.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.database import get_db
from app.models.models import User, UserPreference, SavedLocation, RouteHistory
from app.routes.auth import get_current_user

router = APIRouter(prefix="/user", tags=["User Preferences & Locations"])


def resolve_user(authorization: Optional[str], db: Session) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return get_current_user(authorization, db)
    except Exception:
        return None


class PreferenceUpdateSchema(BaseModel):
    temp_unit: Optional[str] = "celsius"        # 'celsius', 'fahrenheit'
    wind_unit: Optional[str] = "kmh"           # 'kmh', 'mph', 'ms'
    notifications_enabled: Optional[bool] = True
    preferred_location: Optional[str] = "Pune"
    language: Optional[str] = "en"              # 'en', 'hi', 'mr'
    risk_sensitivity: Optional[str] = "standard" # 'standard', 'high', 'low'


class SavedLocationCreateSchema(BaseModel):
    name: str
    city: str
    lat: Optional[float] = None
    lon: Optional[float] = None


@router.get("/preferences")
def get_user_preferences(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Fetches user preferences or returns system defaults."""
    user = resolve_user(authorization, db)
    if not user or not user.get("id"):
        return {
            "temp_unit": "celsius",
            "wind_unit": "kmh",
            "notifications_enabled": True,
            "preferred_location": "Pune",
            "language": "en",
            "risk_sensitivity": "standard"
        }

    pref = db.query(UserPreference).filter(UserPreference.user_id == user["id"]).first()
    if not pref:
        pref = UserPreference(user_id=user["id"])
        db.add(pref)
        db.commit()
        db.refresh(pref)

    return {
        "temp_unit": pref.temp_unit,
        "wind_unit": pref.wind_unit,
        "notifications_enabled": pref.notifications_enabled,
        "preferred_location": pref.preferred_location,
        "language": pref.language,
        "risk_sensitivity": pref.risk_sensitivity
    }


@router.put("/preferences")
def update_user_preferences(
    data: PreferenceUpdateSchema,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Updates user configuration settings."""
    user = resolve_user(authorization, db)
    if not user or not user.get("id"):
        raise HTTPException(status_code=401, detail="Authentication required to save preferences.")

    pref = db.query(UserPreference).filter(UserPreference.user_id == user["id"]).first()
    if not pref:
        pref = UserPreference(user_id=user["id"])
        db.add(pref)

    SUPPORTED_LANGS = {"en", "hi", "mr", "ta", "te", "bn", "gu", "kn", "ml", "pa"}
    if data.temp_unit is not None: pref.temp_unit = data.temp_unit
    if data.wind_unit is not None: pref.wind_unit = data.wind_unit
    if data.notifications_enabled is not None: pref.notifications_enabled = data.notifications_enabled
    if data.preferred_location is not None: pref.preferred_location = data.preferred_location
    if data.language is not None:
        if data.language.lower() not in SUPPORTED_LANGS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported language '{data.language}'. Supported languages: {sorted(list(SUPPORTED_LANGS))}"
            )
        pref.language = data.language.lower()
    if data.risk_sensitivity is not None: pref.risk_sensitivity = data.risk_sensitivity

    db.commit()
    return {"success": True, "message": "Preferences updated successfully."}


@router.get("/locations")
def get_saved_locations(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Lists saved / bookmarked cities for the authenticated user."""
    user = resolve_user(authorization, db)
    if not user or not user.get("id"):
        return {"locations": []}

    locations = db.query(SavedLocation).filter(SavedLocation.user_id == user["id"]).all()
    return {
        "locations": [
            {"id": loc.id, "name": loc.name, "city": loc.city, "lat": loc.lat, "lon": loc.lon, "created_at": loc.created_at}
            for loc in locations
        ]
    }


@router.post("/locations")
def add_saved_location(
    data: SavedLocationCreateSchema,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Adds a location to user's saved list."""
    user = resolve_user(authorization, db)
    if not user or not user.get("id"):
        raise HTTPException(status_code=401, detail="Authentication required to save location.")

    loc = SavedLocation(
        user_id=user["id"],
        name=data.name,
        city=data.city,
        lat=data.lat,
        lon=data.lon
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return {"success": True, "location_id": loc.id, "city": loc.city}


@router.delete("/locations/{location_id}")
def delete_saved_location(
    location_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Deletes a saved location."""
    user = resolve_user(authorization, db)
    if not user or not user.get("id"):
        raise HTTPException(status_code=401, detail="Authentication required.")

    loc = db.query(SavedLocation).filter(SavedLocation.id == location_id, SavedLocation.user_id == user["id"]).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found.")

    db.delete(loc)
    db.commit()
    return {"success": True, "message": "Location removed."}


@router.get("/history")
def get_route_history(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Fetches user recent route risk query history."""
    user = resolve_user(authorization, db)
    if not user or not user.get("id"):
        return {"history": []}

    records = db.query(RouteHistory).filter(RouteHistory.user_id == user["id"]).order_by(RouteHistory.created_at.desc()).limit(10).all()
    return {
        "history": [
            {
                "id": r.id,
                "from_location": r.from_location,
                "to_location": r.to_location,
                "departure_time": r.departure_time,
                "overall_risk_level": r.overall_risk_level,
                "risk_score": r.risk_score,
                "created_at": r.created_at
            }
            for r in records
        ]
    }
