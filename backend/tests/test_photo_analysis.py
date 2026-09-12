"""
WeatherGPT — Photo Weather Intelligence Test Suite
──────────────────────────────────────────────────
Tests multimodal image validation, mock vision providers, live correlation,
photo-enhanced risk calculations, demo scenarios, and contextual Q&A.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from app.main import app
from app.services.photo_weather_service import validate_image_bytes, calculate_photo_enhanced_risk
from app.services.vision_providers import MockVisionProvider, PhotoObservation
from app.services.weather_correlation_service import correlate_photo_with_weather

client = TestClient(app)

FAKE_JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 200
FAKE_PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 200
FAKE_WEBP = b"RIFF" + b"\x00\x00\x00\x20" + b"WEBP" + b"\x00" * 100


def test_image_validation():
    # 1. Valid JPEG
    ok, err, meta = validate_image_bytes(FAKE_JPEG, "image/jpeg")
    assert ok is True
    assert err is None
    assert meta["format"] in ["JPEG", "MPO"]

    # 2. Valid PNG
    ok_png, _, _ = validate_image_bytes(FAKE_PNG, "image/png")
    assert ok_png is True

    # 3. Valid WEBP
    ok_webp, _, _ = validate_image_bytes(FAKE_WEBP, "image/webp")
    assert ok_webp is True

    # 4. Invalid text file
    bad_ok, bad_err, _ = validate_image_bytes(b"hello text", "text/plain")
    assert bad_ok is False
    assert "Unsupported format" in bad_err

    # 5. Corrupted bytes
    corrupt_ok, corrupt_err, _ = validate_image_bytes(b"\x00\x01\x02\x03\x04", "image/jpeg")
    assert corrupt_ok is False
    assert "Corrupted or unrecognized" in corrupt_err


def test_mock_vision_scenarios():
    mock = MockVisionProvider()

    # Heavy rain
    rain_obs = mock.analyze_image(FAKE_JPEG, "image/jpeg", filename="monsoon_rain.jpg")
    assert rain_obs.weather_condition == "rainy"
    assert rain_obs.precipitation_visible is True
    assert rain_obs.road_condition == "wet_puddles"

    # Thunderstorm
    storm_obs = mock.analyze_image(FAKE_JPEG, "image/jpeg", filename="lightning_storm.jpg")
    assert storm_obs.weather_condition == "stormy"
    assert storm_obs.lightning_visible is True

    # Fog
    fog_obs = mock.analyze_image(FAKE_JPEG, "image/jpeg", filename="ghat_fog.jpg")
    assert fog_obs.weather_condition == "foggy"
    assert fog_obs.fog_visible is True

    # Flooded
    flood_obs = mock.analyze_image(FAKE_JPEG, "image/jpeg", filename="flooded_street.jpg")
    assert flood_obs.flooding_indicator is True
    assert flood_obs.road_condition == "flooded"

    # Clear
    clear_obs = mock.analyze_image(FAKE_JPEG, "image/jpeg", filename="sunny_pune.jpg")
    assert clear_obs.weather_condition == "clear"
    assert clear_obs.road_condition == "dry"


def test_weather_correlation():
    mock = MockVisionProvider()
    rain_obs = mock.analyze_image(FAKE_JPEG, "image/jpeg", filename="rain.jpg")

    # Consistent scenario
    live_rain = {"current": {"condition": "Moderate Rain", "rain_probability": 80, "humidity": 90, "visibility": 6.0}}
    corr_consistent = correlate_photo_with_weather(rain_obs, live_rain)
    assert corr_consistent["status"] in ["CONSISTENT", "PARTIALLY_CONSISTENT"]
    assert len(corr_consistent["agreements"]) > 0

    # Inconsistent scenario
    live_clear = {"current": {"condition": "Clear Sky", "rain_probability": 0, "humidity": 30, "visibility": 10.0}}
    corr_inconsistent = correlate_photo_with_weather(rain_obs, live_clear)
    assert corr_inconsistent["status"] in ["INCONSISTENT", "PARTIALLY_CONSISTENT"]
    assert len(corr_inconsistent["discrepancies"]) > 0


def test_photo_enhanced_risk():
    mock = MockVisionProvider()
    flood_obs = mock.analyze_image(FAKE_JPEG, "image/jpeg", filename="flood.jpg")

    base_risk = {"score": 20, "category": "LOW"}
    enhanced = calculate_photo_enhanced_risk(base_risk, flood_obs)
    assert enhanced["score"] > base_risk["score"]
    assert any(f["factor"] == "Visible Roadway Inundation / Standing Water" for f in enhanced["visual_factors"])


def test_api_photo_analyze_flow():
    # 1. Scenarios endpoint
    scenarios_res = client.get("/api/photo-analysis/demo/scenarios")
    assert scenarios_res.status_code == 200
    assert len(scenarios_res.json()["scenarios"]) >= 5

    # 2. Upload & Analyze
    files = {"file": ("cloudburst_rain.jpg", FAKE_JPEG, "image/jpeg")}
    res = client.post("/api/photo-analysis/analyze", files=files, data={"location": "Pune", "mode": "demo"})
    assert res.status_code == 200
    data = res.json()
    assert "analysis_id" in data
    assert "photo_observation" in data
    assert "risk_assessment" in data
    assert "recommendations" in data
    assert "scientific_disclaimer" in data
    analysis_id = data["analysis_id"]

    # 3. Retrieve by ID
    get_res = client.get(f"/api/photo-analysis/{analysis_id}")
    assert get_res.status_code == 200
    assert get_res.json()["analysis_id"] == analysis_id

    # 4. Contextual Q&A
    ask_res = client.post("/api/photo-analysis/ask", json={
        "analysis_id": analysis_id,
        "question": "Is it safe to drive right now?"
    })
    assert ask_res.status_code == 200
    assert "answer" in ask_res.json()
    assert len(ask_res.json()["answer"]) > 10

    # 5. Delete analysis
    del_res = client.delete(f"/api/photo-analysis/{analysis_id}")
    assert del_res.status_code == 200


if __name__ == "__main__":
    print("Running Photo Weather Intelligence Unit & Integration Tests...")
    test_image_validation()
    print("[OK] Image validation & MIME magic byte checks passed")
    test_mock_vision_scenarios()
    print("[OK] Multimodal vision scenarios (Rain, Storm, Fog, Flood, Clear) passed")
    test_weather_correlation()
    print("[OK] Weather correlation consistency engine passed")
    test_photo_enhanced_risk()
    print("[OK] Photo-enhanced risk model passed")
    test_api_photo_analyze_flow()
    print("[OK] End-to-end API upload, analyze, ask Q&A, and delete flow passed")
    print("\nAll Photo Weather Intelligence tests PASSED successfully!")
