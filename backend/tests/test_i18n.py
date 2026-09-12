"""
WeatherGPT — Multilingual System & Internationalization Test Suite
Tests language detection, RAG retrieval across 10 languages,
user preference language validation, and AI prompt enforcement.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.services.ai_service import detect_language, get_local_nlp_response
from app.services.rag_service import search_knowledge_base

client = TestClient(app)

def test_language_detection():
    print("Testing 10-Language Detection...")
    cases = [
        ("Will it rain tomorrow in Delhi?", "en"),
        ("कल क्या बारिश होगी?", "hi"),
        ("उद्या पुण्यात पाऊस पडेल का?", "mr"),
        ("சென்னையில் நாளை மழை பெய்யுமா?", "ta"),
        ("హైదరాబాద్‌లో రేపు వర్షం పడుతుందా?", "te"),
        ("কলকাতায় আগামীকাল কি বৃষ্টি হবে?", "bn"),
        ("અમદાવાદમાં કાલે વરસાદ પડશે?", "gu"),
        ("ಬೆಂಗಳೂರಿನಲ್ಲಿ ನಾಳೆ ಮಳೆ ಬರುತ್ತಾ?", "kn"),
        ("നാളെ കൊച്ചിയിൽ മഴ പെയ്യുമോ?", "ml"),
        ("ਕੀ ਕੱਲ੍ਹ ਅੰਮ੍ਰਿਤਸਰ ਵਿੱਚ ਮੀਂਹ ਪਵੇਗਾ?", "pa"),
        # Code-mixed / Hinglish
        ("Kal Pune me barish hogi kya?", "hi"),
        ("Udya paus padnar ka?", "mr"),
        ("Chennai la mazhai varuma?", "ta"),
    ]
    for text, expected in cases:
        detected = detect_language(text)
        assert detected == expected, f"Failed for '{text}': expected {expected}, got {detected}"
    print("  [OK] Language detection passed for all 10 languages and code-mixed inputs")


def test_multilingual_rag():
    print("Testing Multilingual RAG Knowledge Retrieval...")
    # Hindi query for lightning
    results_hi = search_knowledge_base("बिजली गिरते समय क्या सुरक्षा नियम अपनाने चाहिए?")
    assert len(results_hi) > 0
    assert "Lightning" in results_hi[0]["title"]

    # Marathi query for flood
    results_mr = search_knowledge_base("शहरात पूर आल्यास पाणी किती धोकादायक असते?")
    assert len(results_mr) > 0
    assert "Flood" in results_mr[0]["title"]

    # Tamil query for heatwave / sunstroke
    results_ta = search_knowledge_base("கடும் வெப்ப அலை வீசும்போது என்ன செய்ய வேண்டும்?")
    assert len(results_ta) > 0
    assert "Heatwave" in results_ta[0]["title"]

    # Bengali query for cyclone / storm
    results_bn = search_knowledge_base("ঘূর্ণিঝড় সতর্কতা জারি হলে কী ব্যবস্থা নিতে হবে?")
    assert len(results_bn) > 0
    assert "Cyclone" in results_bn[0]["title"]

    # Telugu query for flood
    results_te = search_knowledge_base("వరద నీరు ప్రవహిస్తున్నప్పుడు ప్రయాణం సురక్షితమేనా?")
    assert len(results_te) > 0
    assert "Flood" in results_te[0]["title"]

    print("  [OK] Cross-lingual RAG retrieval passed for Indic languages")


def test_user_preference_languages():
    print("Testing User Preference Language Validation...")
    import uuid
    email = f"i18n_user_{uuid.uuid4().hex[:6]}@weathergpt.local"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "name": "i18n User",
        "role": "general"
    })
    assert reg_res.status_code == 201
    token = reg_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Valid languages
    for lang in ["en", "hi", "mr", "ta", "te", "bn", "gu", "kn", "ml", "pa"]:
        put_res = client.put("/api/user/preferences", headers=headers, json={"language": lang})
        assert put_res.status_code == 200, f"Failed saving language {lang}"

    # Invalid language
    invalid_res = client.put("/api/user/preferences", headers=headers, json={"language": "xx_invalid"})
    assert invalid_res.status_code == 400
    assert "Unsupported language" in invalid_res.json()["detail"]

    print("  [OK] User preference language validation passed")


if __name__ == "__main__":
    print("Running WeatherGPT Multilingual System Test Suite...\n" + "="*55)
    test_language_detection()
    test_multilingual_rag()
    test_user_preference_languages()
    print("="*55 + "\nAll Multilingual Backend Tests PASSED Successfully!")
