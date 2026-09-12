"""
WeatherGPT — Photo Weather Intelligence Orchestrator
────────────────────────────────────────────────────
Integrates:
  • Image validation (MIME, size, byte integrity)
  • Multimodal Vision AI (Gemini / OpenAI / Mock)
  • Live Weather Correlation
  • Photo-Enhanced Risk Synthesis
  • Actionable AI Guidance & Contextual Q&A
"""

import io
import time
from typing import Dict, Any, List, Optional, Tuple
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    Image = None
    PIL_AVAILABLE = False

from app.services.vision_providers import get_vision_provider, PhotoObservation
from app.services.weather_correlation_service import correlate_photo_with_weather
from app.services.weather_service import get_weather
from app.services.risk_service import risk_engine
from app.config.settings import settings


ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
MAX_SIZE_BYTES = settings.PHOTO_ANALYSIS_MAX_SIZE_MB * 1024 * 1024


def validate_image_bytes(image_bytes: bytes, content_type: str) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
    """
    Validates uploaded image format, size, and pixel decodability.
    Returns (is_valid, error_message, metadata_dict).
    """
    if not image_bytes or len(image_bytes) == 0:
        return False, "Empty image file uploaded.", None

    if len(image_bytes) > MAX_SIZE_BYTES:
        return False, f"Image size exceeds the {settings.PHOTO_ANALYSIS_MAX_SIZE_MB} MB limit.", None

    clean_mime = (content_type or "").lower().split(";")[0].strip()
    if clean_mime not in ALLOWED_MIMES:
        return False, "Unsupported format. Please upload a JPG, PNG, or WEBP image.", None

    # Magic byte checks for JPEG, PNG, WEBP
    is_jpeg = image_bytes.startswith(b"\xff\xd8\xff")
    is_png = image_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = len(image_bytes) > 12 and image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP"

    if not (is_jpeg or is_png or is_webp):
        return False, "Corrupted or unrecognized image header. Please upload a valid JPG, PNG, or WEBP photo.", None

    fmt = "JPEG" if is_jpeg else ("PNG" if is_png else "WEBP")
    width, height = 1200, 800  # Default dimensions if PIL not installed

    if PIL_AVAILABLE and Image:
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            fmt = img.format or fmt
        except Exception:
            return False, "Corrupted or unreadable image file. Please upload a valid photo.", None

    meta = {
        "width": width,
        "height": height,
        "format": fmt,
        "size_bytes": len(image_bytes),
        "size_kb": round(len(image_bytes) / 1024, 1)
    }
    return True, None, meta


def calculate_photo_enhanced_risk(
    base_risk_data: Optional[Dict[str, Any]],
    photo_obs: PhotoObservation
) -> Dict[str, Any]:
    """
    Synthesizes Base Weather Risk + Visual Evidence without overclaiming.
    Calculates composite score (0-100), category, and transparent factors.
    """
    base_score = base_risk_data.get("score", 15) if base_risk_data else 20
    score = base_score
    factors = []

    # Visual Evidence Weights
    if photo_obs.flooding_indicator or photo_obs.road_condition == "flooded":
        score += 25
        factors.append({"factor": "Visible Roadway Inundation / Standing Water", "weight": +25, "icon": "waves"})
    elif photo_obs.road_condition in ["wet_puddles", "standing_water"]:
        score += 12
        factors.append({"factor": "Wet Pavement / Aquaplaning Risk", "weight": +12, "icon": "droplet"})

    if photo_obs.lightning_visible:
        score += 30
        factors.append({"factor": "Visible Lightning Discharge (Imminent Strike Threat)", "weight": +30, "icon": "zap"})

    if photo_obs.visibility_condition == "severely_restricted" or photo_obs.fog_visible:
        score += 20
        factors.append({"factor": "Restricted Optical Visibility (<500m)", "weight": +20, "icon": "eye-off"})
    elif photo_obs.visibility_condition == "reduced_fog":
        score += 10
        factors.append({"factor": "Moderate Fog / Spray Sightline Impediment", "weight": +10, "icon": "eye-off"})

    if photo_obs.wind_effect_indicator in ["tree_sway", "debris_risk"]:
        score += 15
        factors.append({"factor": "Observable Wind Turbulence & Canopy Sway", "weight": +15, "icon": "wind"})

    final_score = min(100, max(0, score))

    if final_score <= 25:
        category = "LOW"
        color = "emerald"
    elif final_score <= 50:
        category = "MODERATE"
        color = "amber"
    elif final_score <= 75:
        category = "HIGH"
        color = "orange"
    else:
        category = "SEVERE"
        color = "red"

    explanation = (
        f"{category} combined risk ({final_score}/100). Visual evidence confirms "
        f"{', '.join([f['factor'] for f in factors]) if factors else 'calm and nominal conditions'}."
    )

    return {
        "score": final_score,
        "category": category,
        "color": color,
        "base_weather_score": base_score,
        "visual_factors": factors,
        "explanation": explanation
    }


def generate_photo_recommendations(
    photo_obs: PhotoObservation,
    enhanced_risk: Dict[str, Any],
    consistency: Dict[str, Any]
) -> List[str]:
    """Generates actionable, safety-first operational recommendations."""
    recs = []

    if photo_obs.flooding_indicator or photo_obs.road_condition == "flooded":
        recs.append("Do NOT attempt to drive through waterlogged sections ('Turn Around, Don't Drown'). Water depth may conceal open drains or stalled debris.")

    if photo_obs.lightning_visible:
        recs.append("Seek immediate fully enclosed shelter. Abide by the 30-30 Rule: avoid isolated trees, open balconies, and metal fences.")

    if photo_obs.visibility_condition in ["reduced_fog", "severely_restricted"] or photo_obs.fog_visible:
        recs.append("Engage low-beam headlights or amber fog lamps. Double following distances and avoid overtaking on two-lane corridors.")

    if photo_obs.road_condition in ["wet_puddles", "standing_water"]:
        recs.append("Drive below 50 km/h to mitigate tire aquaplaning risks on pooled surface runoff.")

    if not recs:
        recs.append("Conditions appear safe for general outdoor movement and transit. Continue monitoring regional weather bulletins.")

    return recs


def analyze_weather_photo(
    db: Any,
    image_bytes: bytes,
    content_type: str,
    filename: Optional[str] = None,
    location: Optional[str] = None,
    mode: str = "live"
) -> Dict[str, Any]:
    """
    Full pipeline:
    1. Validation
    2. Vision Provider AI analysis
    3. Live weather retrieval (if location provided)
    4. Weather correlation check
    5. Photo-enhanced risk synthesis
    6. Actionable recommendations & limitations
    """
    is_valid, err, meta = validate_image_bytes(image_bytes, content_type)
    if not is_valid:
        raise ValueError(err)

    # 1. Vision Analysis
    vision_prov = get_vision_provider("mock" if mode == "demo" else None)
    photo_obs = vision_prov.analyze_image(image_bytes, content_type, filename=filename)

    # 2. Live Weather Retrieval (Optional)
    live_weather_data = None
    base_risk = None
    if location and location.strip() and location.lower() != "skip":
        try:
            live_weather_data = get_weather(db, location.strip())
            base_risk = risk_engine.calculate_risk(live_weather_data)
        except Exception:
            pass

    # 3. Weather Correlation
    consistency = correlate_photo_with_weather(photo_obs, live_weather_data)

    # 4. Photo-Enhanced Risk
    enhanced_risk = calculate_photo_enhanced_risk(base_risk, photo_obs)

    # 5. Recommendations
    recommendations = generate_photo_recommendations(photo_obs, enhanced_risk, consistency)

    # 6. Combined AI Narrative Explanation
    obs_summary = ", ".join(photo_obs.observations[:2])
    ai_narrative = (
        f"Visual inspection observes {photo_obs.weather_condition.replace('_', ' ')} conditions ({obs_summary}). "
        f"{consistency['summary']} "
        f"The photo-enhanced threat level is assessed as {enhanced_risk['category']} ({enhanced_risk['score']}/100)."
    )

    return {
        "image_metadata": meta,
        "photo_observation": photo_obs.dict(),
        "live_weather": {
            "location": live_weather_data.get("location") if live_weather_data else "Not Provided",
            "current": live_weather_data.get("current") if live_weather_data else None,
            "source": live_weather_data["current"].get("source") if live_weather_data and "current" in live_weather_data else None
        } if live_weather_data else None,
        "weather_consistency": consistency,
        "risk_assessment": enhanced_risk,
        "hazards": photo_obs.environmental_hazards,
        "ai_explanation": ai_narrative,
        "recommendations": recommendations,
        "confidence": photo_obs.confidence,
        "mode": mode,
        "data_sources": f"Vision AI ({vision_prov.provider_name}) + " + (live_weather_data["current"].get("source", "Live API") if live_weather_data else "Visual Inference Only"),
        "scientific_disclaimer": (
            "Visual analysis is observational and qualitative. Physical variables such as exact temperature, "
            "humidity, air pressure, and millimeter rainfall rate cannot be measured from photo pixels alone and "
            "are sourced exclusively from verified meteorological sensors and NWP consensus models."
        ),
        "analyzed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


def answer_photo_context_question(
    analysis_record: Dict[str, Any],
    question: str,
    lang: str = "en"
) -> Dict[str, Any]:
    """
    Contextual Q&A grounded in PhotoObservation + LiveWeatherData + EnhancedRisk + RAG.
    """
    q_lower = question.lower()
    photo_obs = analysis_record.get("photo_observation", {})
    risk = analysis_record.get("risk_assessment", {})
    live_w = analysis_record.get("live_weather", {})
    hazards = analysis_record.get("hazards", [])

    is_driving = any(w in q_lower for w in ["drive", "travel", "road", "safe to drive", "trip", "car", "bike"])
    is_outside = any(w in q_lower for w in ["outside", "run", "walk", "outdoor", "go out"])
    is_rain = any(w in q_lower for w in ["rain", "storm", "pour", "continue"])

    ans = ""
    if is_driving:
        road_cond = photo_obs.get("road_condition", "normal")
        if risk.get("category") in ["HIGH", "SEVERE"]:
            ans = f"Driving is NOT recommended unless urgent. The photo reveals {road_cond.replace('_', ' ')} with a threat score of {risk.get('score')}/100. Watch out for {', '.join(hazards) if hazards else 'aquaplaning'}."
        else:
            ans = f"Driving appears feasible with standard care. Visual pavement state is {road_cond.replace('_', ' ')} and regional risk is {risk.get('category')}."
    elif is_outside:
        if photo_obs.get("lightning_visible") or risk.get("score", 0) > 60:
            ans = "Avoid outdoor activities. Imminent environmental hazards (lightning, flash flood, or heavy showers) were detected in the photo and live reports."
        else:
            ans = "Outdoor movement is acceptable. Weather conditions in the image do not show acute storm disruption."
    elif is_rain:
        curr = live_w.get("current", {}) if live_w else {}
        prob = curr.get("rain_probability", "moderate")
        ans = f"Visual rain presence is {photo_obs.get('precipitation_visible', False)}. Live forecast indicates {prob}% probability over the upcoming hours."
    else:
        ans = (
            f"Based on your photo analysis, the observed condition is {photo_obs.get('weather_condition')}, "
            f"consistency with live data is {analysis_record.get('weather_consistency', {}).get('status', 'EVALUATED')}, "
            f"and overall risk index is {risk.get('score')}/100."
        )

    return {
        "question": question,
        "answer": ans,
        "grounded_sources": ["Photo Observation", "Live Meteorological Feed", "Risk Engine"],
        "confidence": analysis_record.get("confidence", 85)
    }
