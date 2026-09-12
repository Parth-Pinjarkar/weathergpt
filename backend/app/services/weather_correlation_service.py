"""
WeatherGPT — Weather Correlation Engine
────────────────────────────────────────
Compares visual observations from photos against live meteorological data
from weather providers to detect consistency, partial matches, or discrepancies.
"""

from typing import Dict, Any, List, Optional
from app.services.vision_providers import PhotoObservation


class WeatherConsistencyReport:
    def __init__(
        self,
        status: str,
        summary: str,
        agreements: List[str],
        discrepancies: List[str],
        confidence: int
    ):
        self.status = status # 'CONSISTENT', 'PARTIALLY_CONSISTENT', 'INCONSISTENT', 'INSUFFICIENT_DATA'
        self.summary = summary
        self.agreements = agreements
        self.discrepancies = discrepancies
        self.confidence = confidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "summary": self.summary,
            "agreements": self.agreements,
            "discrepancies": self.discrepancies,
            "confidence": self.confidence
        }


def correlate_photo_with_weather(
    photo: PhotoObservation,
    live_weather: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates agreement between visual photo observation and live API telemetry.
    """
    if not live_weather or "current" not in live_weather:
        return WeatherConsistencyReport(
            status="INSUFFICIENT_DATA",
            summary="Live weather correlation is unavailable without location data or weather sensors.",
            agreements=[],
            discrepancies=[],
            confidence=photo.confidence
        ).to_dict()

    curr = live_weather["current"]
    live_cond = curr.get("condition", "").lower()
    live_rain_prob = int(curr.get("rain_probability", 0))
    live_humidity = int(curr.get("humidity", 50))
    live_vis_km = float(curr.get("visibility", 10.0))

    agreements = []
    discrepancies = []

    # 1. Precipitation Correlation
    live_is_rain = (live_rain_prob > 40 or "rain" in live_cond or "drizzle" in live_cond or "storm" in live_cond)
    photo_is_rain = (photo.precipitation_visible or photo.weather_condition in ["rainy", "stormy"] or photo.road_condition in ["wet_puddles", "standing_water", "flooded"])

    if photo_is_rain and live_is_rain:
        agreements.append("Precipitation detected in both visual photo and live meteorological radar/NWP models.")
    elif not photo_is_rain and not live_is_rain:
        agreements.append("Dry atmospheric conditions confirmed in both photo imagery and weather telemetry.")
    elif photo_is_rain and not live_is_rain:
        discrepancies.append(
            f"Photo exhibits wet road/rain cues, whereas live API currently reports '{curr.get('condition')}' with {live_rain_prob}% rain probability. The photo may reflect a recent shower or localized micro-cell."
        )
    else:
        discrepancies.append(
            f"Live weather API reports active rain/precipitation, but uploaded photo appears dry or clear. The storm cell may be developing or localized elsewhere in the city."
        )

    # 2. Visibility / Fog Correlation
    photo_is_fog = (photo.fog_visible or photo.visibility_condition in ["reduced_fog", "severely_restricted"])
    live_is_fog = (live_vis_km < 3.0 or "fog" in live_cond or "mist" in live_cond or "haze" in live_cond)

    if photo_is_fog and live_is_fog:
        agreements.append(f"Reduced visibility and boundary layer obscurity corroborated (Live API: {live_vis_km} km).")
    elif photo_is_fog and not live_is_fog:
        discrepancies.append(f"Photo shows hazy/foggy obscurity, but regional station reports {live_vis_km} km visibility.")

    # 3. Cloud Cover Correlation
    if photo.cloud_condition in ["overcast", "dark_cumulonimbus"] and ("cloud" in live_cond or "overcast" in live_cond or live_humidity > 75):
        agreements.append("Extensive cloud cover matches elevated atmospheric relative humidity and synoptic observations.")
    elif photo.cloud_condition == "clear_sky" and ("clear" in live_cond or "sun" in live_cond):
        agreements.append("Clear sky illumination aligns with nominal satellite insolation.")

    # Determine Consolidated Status
    if len(discrepancies) == 0:
        status = "CONSISTENT"
        summary = "Photo observations are strongly consistent with live meteorological telemetry."
        conf = min(96, max(75, photo.confidence + 5))
    elif len(agreements) > 0 and len(discrepancies) == 1:
        status = "PARTIALLY_CONSISTENT"
        summary = "Visual evidence partially aligns with live data, with minor micro-climate or temporal latency differences."
        conf = max(70, photo.confidence - 5)
    else:
        status = "INCONSISTENT"
        summary = "Visual conditions diverge noticeably from live station telemetry. The photo may have been taken earlier or outside the sensor coverage radius."
        conf = max(60, photo.confidence - 10)

    return WeatherConsistencyReport(
        status=status,
        summary=summary,
        agreements=agreements,
        discrepancies=discrepancies,
        confidence=conf
    ).to_dict()
