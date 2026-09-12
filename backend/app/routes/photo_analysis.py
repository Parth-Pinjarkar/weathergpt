"""
WeatherGPT — Photo Weather Intelligence API Routes
───────────────────────────────────────────────────
Endpoints for uploading/capturing weather photos, performing multimodal AI analysis,
retrieving history, and answering contextual follow-up questions.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from typing import Optional, List
import json
import uuid

from app.database import get_db
from app.models.models import PhotoWeatherAnalysis
from app.routes.auth import get_current_user
from app.services.photo_weather_service import (
    analyze_weather_photo,
    answer_photo_context_question
)

router = APIRouter(prefix="/photo-analysis", tags=["Photo Weather Intelligence"])


def resolve_optional_user(authorization: Optional[str], db: Session) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return get_current_user(authorization, db)
    except Exception:
        return None


@router.post("/analyze")
async def analyze_photo_endpoint(
    file: UploadFile = File(..., description="Weather or environment photograph (JPG, PNG, WEBP, max 10MB)"),
    location: Optional[str] = Form(None, description="Optional city name or coordinates for live weather correlation"),
    mode: Optional[str] = Form("live", description="Analysis mode: 'live' or 'demo'"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Analyzes an uploaded or camera-captured photo using multimodal AI,
    correlates with live weather telemetry, and generates photo-enhanced risk scores.
    """
    try:
        image_bytes = await file.read()
        content_type = file.content_type or "image/jpeg"
        filename = file.filename or "photo.jpg"

        result = analyze_weather_photo(
            db=db,
            image_bytes=image_bytes,
            content_type=content_type,
            filename=filename,
            location=location,
            mode=mode or "live"
        )

        # Persist record in database
        user = resolve_optional_user(authorization, db)
        user_id = user["id"] if user and user.get("id") else None

        record_id = str(uuid.uuid4())
        db_record = PhotoWeatherAnalysis(
            id=record_id,
            user_id=user_id,
            location_name=location or "Image Only",
            image_metadata_json=json.dumps(result["image_metadata"]),
            photo_observation_json=json.dumps(result["photo_observation"]),
            weather_consistency_json=json.dumps(result["weather_consistency"]),
            risk_assessment_json=json.dumps(result["risk_assessment"]),
            recommendations_json=json.dumps(result["recommendations"]),
            confidence=result["confidence"],
            mode=result["mode"]
        )
        db.add(db_record)
        db.commit()

        result["analysis_id"] = record_id
        return result

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision analysis error: {str(e)}")


@router.get("/history")
def get_photo_analysis_history(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Retrieves authenticated user's photo analysis history."""
    user = resolve_optional_user(authorization, db)
    if not user or not user.get("id"):
        return {"history": []}

    records = db.query(PhotoWeatherAnalysis).filter(
        PhotoWeatherAnalysis.user_id == user["id"]
    ).order_by(PhotoWeatherAnalysis.created_at.desc()).limit(20).all()

    items = []
    for r in records:
        obs = json.loads(r.photo_observation_json) if r.photo_observation_json else {}
        risk = json.loads(r.risk_assessment_json) if r.risk_assessment_json else {}
        consistency = json.loads(r.weather_consistency_json) if r.weather_consistency_json else {}
        items.append({
            "id": r.id,
            "location": r.location_name,
            "condition": obs.get("weather_condition", "unknown"),
            "risk_score": risk.get("score", 0),
            "risk_category": risk.get("category", "LOW"),
            "consistency_status": consistency.get("status", "EVALUATED"),
            "confidence": r.confidence,
            "mode": r.mode,
            "created_at": r.created_at
        })

    return {"history": items}


@router.get("/{analysis_id}")
def get_analysis_by_id(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """Fetches a specific photo weather analysis by ID."""
    r = db.query(PhotoWeatherAnalysis).filter(PhotoWeatherAnalysis.id == analysis_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    return {
        "analysis_id": r.id,
        "location": r.location_name,
        "image_metadata": json.loads(r.image_metadata_json) if r.image_metadata_json else {},
        "photo_observation": json.loads(r.photo_observation_json) if r.photo_observation_json else {},
        "weather_consistency": json.loads(r.weather_consistency_json) if r.weather_consistency_json else {},
        "risk_assessment": json.loads(r.risk_assessment_json) if r.risk_assessment_json else {},
        "recommendations": json.loads(r.recommendations_json) if r.recommendations_json else [],
        "confidence": r.confidence,
        "mode": r.mode,
        "created_at": r.created_at
    }


@router.delete("/{analysis_id}")
def delete_photo_analysis(
    analysis_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Deletes an analysis record (user isolated)."""
    user = resolve_optional_user(authorization, db)
    query = db.query(PhotoWeatherAnalysis).filter(PhotoWeatherAnalysis.id == analysis_id)
    if user and user.get("id"):
        query = query.filter(PhotoWeatherAnalysis.user_id == user["id"])

    record = query.first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found or unauthorized.")

    db.delete(record)
    db.commit()
    return {"success": True, "message": "Analysis deleted."}


from pydantic import BaseModel

class PhotoQuestionRequest(BaseModel):
    analysis_id: str
    question: str
    lang: Optional[str] = "en"


@router.post("/ask")
def ask_photo_context_question(
    req: PhotoQuestionRequest,
    db: Session = Depends(get_db)
):
    """Answers contextual questions regarding an analyzed photograph."""
    r = db.query(PhotoWeatherAnalysis).filter(PhotoWeatherAnalysis.id == req.analysis_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    analysis_data = {
        "photo_observation": json.loads(r.photo_observation_json) if r.photo_observation_json else {},
        "risk_assessment": json.loads(r.risk_assessment_json) if r.risk_assessment_json else {},
        "weather_consistency": json.loads(r.weather_consistency_json) if r.weather_consistency_json else {},
        "hazards": json.loads(r.photo_observation_json).get("environmental_hazards", []) if r.photo_observation_json else [],
        "confidence": r.confidence
    }

    ans = answer_photo_context_question(analysis_data, req.question, lang=req.lang or "en")
    return ans


@router.get("/demo/scenarios")
def get_demo_scenarios():
    """Lists deterministic SIH demonstration scenarios for zero-dependency evaluations."""
    return {
        "scenarios": [
            {
                "id": "PHOTO_HEAVY_RAIN",
                "title": "Severe Rain & Roadway Ponding",
                "sample_filename": "urban_heavy_rain.jpg",
                "description": "Continuous precipitation with specular road reflections and drainage stress."
            },
            {
                "id": "PHOTO_THUNDERSTORM",
                "title": "Convective Thunderstorm & Lightning",
                "sample_filename": "thunderstorm_lightning.jpg",
                "description": "Dark cumulonimbus cloud shelf with visible electrical activity and tree deflections."
            },
            {
                "id": "PHOTO_FOG",
                "title": "Dense Ghat Fog & Optical Obscurity",
                "sample_filename": "dense_ghat_fog.jpg",
                "description": "Sub-500m horizontal sightline restriction on mountain highway corridor."
            },
            {
                "id": "PHOTO_FLOODED_ROAD",
                "title": "Urban Inundation & Curb Submergence",
                "sample_filename": "flooded_arterial_road.jpg",
                "description": "Standing brown runoff water submerging pavements with vehicular entrapment risk."
            },
            {
                "id": "PHOTO_CLEAR_SKY",
                "title": "Clear Sky & Nominal Insolation",
                "sample_filename": "clear_sky_afternoon.jpg",
                "description": "High solar illumination, dry pavement, and zero adverse atmospheric threats."
            }
        ]
    }
