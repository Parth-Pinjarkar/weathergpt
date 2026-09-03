import sys
import os

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

Base.metadata.create_all(bind=engine)
client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "demo_mode" in data

def test_current_weather():
    response = client.get("/api/weather/current?location=Pune")
    assert response.status_code == 200
    data = response.json()
    assert "weather" in data
    assert "risk" in data
    assert "Pune" in data["weather"]["location"]
    assert data["risk"]["score"] > 0
    assert "breakdown" in data["risk"]

def test_forecast():
    response = client.get("/api/weather/forecast?location=Mumbai")
    assert response.status_code == 200
    data = response.json()
    assert "forecast" in data
    assert len(data["forecast"]) > 0

def test_chat():
    # Test English General query
    response = client.post("/api/chat", json={
        "query": "Will it rain in Pune tomorrow?",
        "role": "general"
    })
    assert response.status_code == 200
    data = response.json()
    assert "answer_text" in data
    assert "session_id" in data
    assert data["alert_level"] in ["LOW", "MODERATE", "HIGH", "SEVERE"]

    # Test Farmer Mode Marathi query
    session_id = data["session_id"]
    response2 = client.post("/api/chat", json={
        "query": "उद्या पुण्यात पाऊस पडणार आहे का?",
        "session_id": session_id,
        "role": "farmer",
        "lang": "mr"
    })
    assert response2.status_code == 200
    data2 = response2.json()
    assert "answer_text" in data2

def test_route_analyze():
    response = client.post("/api/route/analyze", json={
        "from_location": "Pune",
        "to_location": "Mumbai"
    })
    assert response.status_code == 200
    data = response.json()
    assert "timeline" in data
    assert len(data["timeline"]) == 5  # Pune, Lonavala, Khopoli, Panvel, Mumbai
    assert "ai_travel_recommendation" in data

def test_alerts():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert len(data["alerts"]) > 0

def test_disaster():
    response = client.get("/api/disaster/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "critical_zones" in data
    assert "ai_situation_summary" in data

def test_emergency():
    response = client.get("/api/emergency/locations?city=Pune")
    assert response.status_code == 200
    data = response.json()
    assert "locations" in data
    assert len(data["locations"]) > 0

    chk = client.get("/api/emergency/checklist?hazard=flood")
    assert chk.status_code == 200
    assert "before" in chk.json()

def test_simulation():
    res = client.post("/api/simulation/disaster", json={"scenario": "HEAVY_RAIN", "intensity": 1.2})
    assert res.status_code == 200
    assert "result" in res.json()

    whatif = client.post("/api/simulation/whatif", json={"location": "Pune", "rainfall_delta_percent": 30})
    assert whatif.status_code == 200
    assert "simulated_score" in whatif.json()

def test_climate():
    res = client.get("/api/climate/insights?location=Pune")
    assert res.status_code == 200
    assert "monthly_averages" in res.json()

def test_location():
    res = client.get("/api/location/search?q=Pune")
    assert res.status_code == 200
    assert "resolved" in res.json()

def test_report():
    res = client.post("/api/report/generate", json={"location": "Pune", "report_type": "daily"})
    assert res.status_code == 200
    assert "executive_summary" in res.json()

def test_auth():
    import time
    test_email = f"test_{int(time.time())}@weathergpt.local"
    
    # 1. Test Register
    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "Password123!",
        "name": "Kisan Demo",
        "role": "farmer"
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["success"] is True
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["role"] == "farmer"
    assert "token" in reg_data

    # 2. Test Login
    login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    token = login_data["token"]

    # 3. Test Me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == test_email

    # 4. Test Guest Login
    guest_res = client.post("/api/auth/guest", json={"role": "traveller"})
    assert guest_res.status_code == 200
    assert guest_res.json()["user"]["is_guest"] is True

def test_healthz():
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_analytics():
    res_summary = client.get("/api/analytics/summary")
    assert res_summary.status_code == 200
    assert "total_registered_users" in res_summary.json()

    res_popular = client.get("/api/analytics/popular-cities")
    assert res_popular.status_code == 200
    assert "popular_cities" in res_popular.json()

    res_active = client.get("/api/analytics/active-users")
    assert res_active.status_code == 200
    assert "active_sessions_last_30min" in res_active.json()

    res_history = client.get("/api/analytics/alert-history")
    assert res_history.status_code == 200
    assert "alerts" in res_history.json()

def test_websockets():
    # Test WebSocket alerts connection and ping-pong
    with client.websocket_connect("/api/ws/alerts") as ws:
        data = ws.receive_json()
        assert data["type"] == "connected"
        ws.send_json({"type": "ping"})
        pong = ws.receive_json()
        assert pong["type"] == "pong"

    # Test WebSocket city weather push and refresh
    with client.websocket_connect("/api/ws/weather/pune") as ws:
        data = ws.receive_json()
        assert data["type"] == "weather_update"
        assert data["city"] == "pune"
        ws.send_json({"type": "ping"})
        pong = ws.receive_json()
        assert pong["type"] == "pong"

if __name__ == "__main__":
    print("Running WeatherGPT Backend Integration Tests...")
    try:
        test_root()
        print("[OK] Root endpoint working")
        test_healthz()
        print("[OK] Healthcheck (/healthz) endpoint working")
        test_auth()
        print("[OK] User Authentication (Register, Login, Guest, Me) working")
        test_current_weather()
        print("[OK] Current weather & risk engine working")
        test_forecast()
        print("[OK] 7-day forecast retrieval working")
        test_chat()
        print("[OK] AI Multilingual Chatbot & Personas working")
        test_route_analyze()
        print("[OK] Weather Route Intelligence working")
        test_alerts()
        print("[OK] Official alerts working")
        test_disaster()
        print("[OK] Disaster Command Center metrics working")
        test_emergency()
        print("[OK] Emergency Safe Location Finder working")
        test_simulation()
        print("[OK] Disaster & What-If Simulation working")
        test_climate()
        print("[OK] Climate Insights & Trends working")
        test_location()
        print("[OK] Natural Language Location Search working")
        test_report()
        print("[OK] Weather Intelligence Report Generator working")
        test_analytics()
        print("[OK] Analytics & Product Insights endpoints working")
        test_websockets()
        print("[OK] Real-time WebSockets (/ws/alerts, /ws/weather) working")
        print("\nAll backend integration tests PASSED successfully!")
    except AssertionError as e:
        print(f"Assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error during tests: {e}")
        sys.exit(1)
