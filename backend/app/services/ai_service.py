import json
import os
import re
import time
import requests
from google import genai
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.config.settings import settings
from app.services.weather_service import get_weather, normalize_city_name
from app.services.risk_service import calculate_weather_risk
from app.services.route_service import analyze_route_weather

# Reusable HTTP session for fast AI API calls
_AI_HTTP_SESSION = requests.Session()
_AI_ADAPTER = requests.adapters.HTTPAdapter(pool_connections=10, pool_maxsize=25, max_retries=0)
_AI_HTTP_SESSION.mount("https://", _AI_ADAPTER)

# Fast in-memory cache for repeated AI chat prompts (TTL: 5 minutes)
_AI_CHAT_CACHE: Dict[str, Dict[str, Any]] = {}

# Try to initialize Gemini / OpenRouter clients
client = None
GEMINI_AVAILABLE = False
OPENROUTER_AVAILABLE = False

gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
openrouter_key = settings.OPENROUTER_API_KEY or os.environ.get("OPENROUTER_API_KEY")
openrouter_backup_key = settings.OPENROUTER_BACKUP_API_KEY or os.environ.get("OPENROUTER_BACKUP_API_KEY")

# If gemini_key was provided as an OpenRouter key (sk-or-...), assign it to openrouter_key
if gemini_key and gemini_key.startswith("sk-or-"):
    if not openrouter_key:
        openrouter_key = gemini_key
    elif not openrouter_backup_key:
        openrouter_backup_key = gemini_key
    gemini_key = None

if openrouter_key or openrouter_backup_key:
    OPENROUTER_AVAILABLE = True

if gemini_key:
    try:
        client = genai.Client(api_key=gemini_key)
        GEMINI_AVAILABLE = True
    except Exception as e:
        print(f"Error configuring Gemini client: {e}")

# Known cities list for fast matching
KNOWN_CITIES = [
    "pune", "mumbai", "delhi", "bengaluru", "bangalore", "chennai", "hyderabad",
    "lonavala", "khopoli", "panvel", "jaipur", "kolkata", "goa", "ahmedabad",
    "surat", "lucknow", "nagpur", "indore", "thane", "bhopal", "visakhapatnam",
    "patna", "vadodara", "ghaziabad", "ludhiana", "agra", "nashik"
]

KEYWORDS_LANG = {
    "mr": {
        "pune": "पुणे",
        "mumbai": "मुंबई",
        "delhi": "दिल्ली",
        "lonavala": "लोणावळा",
        "nashik": "नाशिक"
    },
    "hi": {
        "pune": "पुणे",
        "mumbai": "मुंबई",
        "delhi": "दिल्ली",
        "lonavala": "लोनावला",
        "nashik": "नाशिक"
    }
}


def detect_language(query: str) -> str:
    """Detects if user is querying in Marathi, Hindi, or English (basic heuristic)."""
    q_lower = query.lower()
    
    # Marathi checks
    mr_words = ["पाऊस", "पुण्यात", "उद्या", "का", "तापमान", "पिके", "शेतकरी", "प्रवास", "लोणावळा", "पाणी"]
    if any(w in q_lower for w in mr_words):
        return "mr"
        
    # Hindi checks
    hi_words = ["बारिश", "मौसम", "क्या", "कल", "तापमान", "खेती", "सिंचाई", "यात्रा", "रास्ता", "पानी"]
    if any(w in q_lower for w in hi_words):
        return "hi"
        
    return "en"


def extract_location(query: str, lang: str = "en", default_location: Optional[str] = None) -> str:
    """Dynamically extracts target location from query, geocodes candidates, or uses default_location."""
    q_lower = query.lower()
    
    # 1. Match known cities
    for city in KNOWN_CITIES:
        if city in q_lower:
            return city
            
    # 2. Check localized names (e.g. पुणे, मुंबई)
    for lang_code in KEYWORDS_LANG:
        for eng_name, local_name in KEYWORDS_LANG[lang_code].items():
            if local_name in query:
                return eng_name

    # 3. Regex extraction for pattern "in <city>", "for <city>", "at <city>", "weather in <city>"
    match = re.search(r'\b(?:in|at|for|near|around)\s+([a-zA-Z]{3,20})\b', q_lower)
    if match:
        extracted = match.group(1).strip()
        if extracted not in ["today", "tomorrow", "this", "next", "the", "detail", "details", "forecast"]:
            return extracted

    # 4. Check candidate words in query for Open-Meteo geocoding resolution
    words = [w.strip() for w in re.split(r'[\s,]+', query) if w.strip()]
    stop_words = {
        "will", "shall", "can", "could", "would", "should", "does", "do", "did", "is", "are", "am", "was", "were",
        "it", "what", "how", "why", "when", "where", "weather", "forecast", "rain", "rainy", "monsoon", "shower", "drizzle",
        "today", "tomorrow", "in", "the", "for", "at", "idea", "good", "bad", "temp", "temperature", "hello", "hi", "hey",
        "tell", "me", "give", "show", "please", "thanks", "thank", "you", "city", "place", "state", "now", "current"
    }
    candidate_words = [w for w in words if w.lower() not in stop_words and len(w) >= 3]
    
    for candidate in candidate_words[:1]:
        try:
            geo_res = requests.get(f"https://geocoding-api.open-meteo.com/v1/search?name={candidate}&count=1", timeout=1.0)
            geo_data = geo_res.json()
            if geo_data and "results" in geo_data and geo_data["results"]:
                return candidate
        except Exception:
            pass

    # 5. Fallback to default_location if passed from frontend active city, else 'pune'
    if default_location and default_location.strip():
        return default_location.strip()
        
    return "pune"


def get_local_nlp_response(query: str, db: Session, role: str, lang: str, default_location: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates dynamic live-data NLP responses based on real-time weather, route analysis, and risk scoring.
    """
    q_lower = query.lower()
    location = extract_location(query, lang, default_location)
    weather_data = get_weather(db, location)
    risk_data = calculate_weather_risk(weather_data)
    
    w_curr = weather_data["current"]
    loc_display = weather_data.get("location", location.title())
    temp = w_curr.get("temp", 26.0)
    cond = w_curr.get("condition", "Clear")
    rain_prob = w_curr.get("rain_probability", 0)
    humidity = w_curr.get("humidity", 60)
    wind_spd = w_curr.get("wind_speed", 10.0)
    source_name = w_curr.get("source", "Live Weather Service")
    risk_lvl = risk_data.get("category", "LOW")
    risk_score = risk_data.get("score", 10)

    # Check active alerts
    alerts_summary = ""
    active_alerts = weather_data.get("alerts", [])
    if active_alerts:
        first_alert = active_alerts[0]
        alerts_summary = f" [ALERT: {first_alert.get('title', 'Weather Alert')}]"

    # 1. Travel / Route Intent
    if any(w in q_lower for w in ["travel", "प्रवास", "यात्रा", "route", "highway", "drive"]) or ("pune" in q_lower and "mumbai" in q_lower):
        from_loc = "Pune"
        to_loc = "Mumbai"
        if "delhi" in q_lower:
            to_loc = "Delhi"
        
        route_data = analyze_route_weather(db, from_loc, to_loc)
        rec = route_data.get("ai_travel_recommendation", "Drive safely.")
        highest_risk = route_data.get("highest_risk_level", "LOW")
        
        if lang == "hi":
            ans_text = f"यात्रा मौसम विश्लेषण ({route_data['from_location']} से {route_data['to_location']}): {rec}"
        elif lang == "mr":
            ans_text = f"प्रवास हवामान विश्लेषण ({route_data['from_location']} ते {route_data['to_location']}): {rec}"
        else:
            ans_text = f"Route Weather Analysis ({route_data['from_location']} to {route_data['to_location']}): {rec}"

        return {
            "answer_text": ans_text,
            "data_sources": f"Live Route Risk Engine ({source_name})",
            "confidence_note": "Dynamic route analyzer using live weather data.",
            "alert_level": highest_risk,
            "metadata": {
                "type": "route",
                "route_details": route_data
            }
        }

    # 2. Crop / Irrigation Advisory Intent
    is_irrigation_query = any(w in q_lower for w in ["irrigate", "irrigation", "water my crop", "सिंचाई", "पिकाला पाणी", "पाणी देणे", "crop", "farm"])
    if is_irrigation_query or role == "farmer":
        is_high_rain = (rain_prob >= 50 or any(c in cond.lower() for c in ["rain", "drizzle", "storm", "shower"]))
        
        if lang == "hi":
            if is_high_rain:
                ans_text = f"{loc_display} में आज बारिश की संभावना {rain_prob}% (मौसम: {cond}) है। जलभराव से बचने के लिए फसलों की सिंचाई टालने की सलाह दी जाती है।"
            else:
                ans_text = f"{loc_display} में बारिश की संभावना कम है ({rain_prob}%, मौसम: {cond}, तापमान: {temp}°C)। आप फसलों की नियमित सिंचाई कर सकते हैं।"
        elif lang == "mr":
            if is_high_rain:
                ans_text = f"{loc_display} मध्ये आज पावसाची शक्यता {rain_prob}% (हवामान: {cond}) आहे. पिकांमध्ये पाणी साचू नये म्हणून सिंचन पुढे ढकलण्याचा सल्ला दिला जातो."
            else:
                ans_text = f"{loc_display} मध्ये पावसाची शक्यता कमी आहे ({rain_prob}%, हवामान: {cond}, तापमान: {temp}°C). तुम्ही पिकांना नियमित वेळापत्रकानुसार पाणी देऊ शकता."
        else:
            if is_high_rain:
                ans_text = f"Rain is forecast for {loc_display} today (Probability: {rain_prob}%, Condition: {cond}). Delaying irrigation is recommended to prevent soil waterlogging."
            else:
                ans_text = f"Rain probability is low in {loc_display} ({rain_prob}%, Condition: {cond}, Temp: {temp}°C). You can proceed with regular crop irrigation."

        ans_text += " (Farmer Advisory Mode)"
        alert_lvl = "HIGH" if is_high_rain else "LOW"
        
        return {
            "answer_text": ans_text + alerts_summary,
            "data_sources": f"Agro-Meteorological Live Unit ({source_name})",
            "confidence_note": "Dynamic agricultural recommendation based on live weather data.",
            "alert_level": alert_lvl,
            "metadata": {
                "type": "weather",
                "weather_details": weather_data,
                "risk_details": risk_data
            }
        }

    # 3. Rain Query Intent
    is_rain_query = any(w in q_lower for w in ["rain", "rainy", "shower", "monsoon", "पाऊस", "बारिश", "वर्षा", "drizzle"])
    if is_rain_query:
        is_raining = (rain_prob > 40 or any(c in cond.lower() for c in ["rain", "drizzle", "storm", "shower"]))
        
        if lang == "hi":
            if is_raining:
                ans_text = f"हाँ, {loc_display} में आज बारिश होने की संभावना है (संभावना: {rain_prob}%, मौसम: {cond})। वर्तमान तापमान {temp}°C और आर्द्रता {humidity}% है।"
            else:
                ans_text = f"नहीं, {loc_display} में आज भारी बारिश की संभावना नहीं है (बारिश की संभावना: {rain_prob}%)। वर्तमान मौसम {cond} और तापमान {temp}°C है।"
        elif lang == "mr":
            if is_raining:
                ans_text = f"होय, {loc_display} मध्ये आज पावसाची शक्यता आहे (शक्यता: {rain_prob}%, हवामान: {cond}). सध्याचे तापमान {temp}°C आणि आद्रता {humidity}% आहे."
            else:
                ans_text = f"नाही, {loc_display} मध्ये आज मुसळधार पावसाची शक्यता नाही (पावसाची शक्यता: {rain_prob}%). सध्याचे हवामान {cond} आणि तापमान {temp}°C आहे."
        else:
            if is_raining:
                ans_text = f"Yes, rain is expected in {loc_display} today (Probability: {rain_prob}%, Condition: {cond}). Current temperature is {temp}°C with {humidity}% humidity."
            else:
                ans_text = f"No major rain is expected in {loc_display} today (Rain probability: {rain_prob}%). Current weather is {cond} with temperature {temp}°C."

        alert_lvl = risk_lvl if is_raining else "LOW"
        return {
            "answer_text": ans_text + alerts_summary,
            "data_sources": source_name,
            "confidence_note": "Dynamic rain query parser with live data.",
            "alert_level": alert_lvl,
            "metadata": {
                "type": "weather",
                "weather_details": weather_data,
                "risk_details": risk_data
            }
        }

    # 4. General Weather Query Fallback
    if lang == "hi":
        ans_text = f"{loc_display} के लिए मौसम की जानकारी: वर्तमान तापमान {temp}°C है, स्थिति '{cond}' है, आर्द्रता {humidity}% है, और हवा की गति {wind_spd} km/h है। जोखिम स्तर: {risk_lvl} ({risk_score}/100)।"
    elif lang == "mr":
        ans_text = f"{loc_display} ची हवामान माहिती: सध्याचे तापमान {temp}°C आहे, हवामान '{cond}' आहे, आद्रता {humidity}% आहे, आणि वाऱ्याचा वेग {wind_spd} km/h आहे. धोका पातळी: {risk_lvl} ({risk_score}/100)."
    else:
        ans_text = f"Weather information for {loc_display}: Current temperature is {temp}°C, condition is {cond}, humidity is {humidity}%, and wind speed is {wind_spd} km/h. Risk Level: {risk_lvl} ({risk_score}/100)."

    if role == "disaster_manager":
        ans_text = f"[DISASTER CENTER ALERT] Risk Level: {risk_lvl}. Monitoring {loc_display}. " + ans_text

    return {
        "answer_text": ans_text + alerts_summary,
        "data_sources": source_name,
        "confidence_note": "Dynamic live weather fallback engine.",
        "alert_level": risk_lvl,
        "metadata": {
            "type": "weather",
            "weather_details": weather_data,
            "risk_details": risk_data
        }
    }


def clean_markdown_response(text: str) -> str:
    if not text:
        return ""
    # Strip asterisks used for bolding/italics (e.g., **text** -> text, *text* -> text)
    text = re.sub(r'\*{1,4}', '', text)
    # Strip pipe symbols used in tables or delimiters (|| or |)
    text = re.sub(r'\|+', ' ', text)
    # Strip hash header marks (### Header -> Header)
    text = re.sub(r'#+\s*', '', text)
    # Strip code backticks (` or ```)
    text = re.sub(r'`+', '', text)
    # Remove table divider lines (e.g. |---|---| or ---)
    text = re.sub(r'^[|\s\-:\=\+]{3,}$', '', text, flags=re.MULTILINE)
    # Normalize markdown bullet markers (- or *) to clean bullet symbol •
    text = re.sub(r'^\s*[\*\-]\s+', '• ', text, flags=re.MULTILINE)
    # Clean up double/multiple spaces created by symbol removals
    text = re.sub(r'[ \t]{2,}', ' ', text)
    # Clean up excessive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def generate_chat_response(
    query: str,
    db: Session,
    role: str = "general",
    lang_override: Optional[str] = None,
    location_override: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Orchestrates the query to OpenRouter or Gemini if available, otherwise falls back to dynamic local NLP.
    Outputs structured chat packet with grounded data details.
    
    Args:
        query: The user's current question
        db: Database session
        role: User role (general, farmer, disaster_manager, etc.)
        lang_override: Override language detection
        location_override: Override location extraction
        conversation_history: List of previous messages [{"role": "user"/"assistant", "content": "..."}]
    """
    lang = lang_override or detect_language(query)
    
    # 1. Fetch live weather & risk data for grounding
    location = extract_location(query, lang, default_location=location_override)
    weather_data = get_weather(db, location)
    risk_data = calculate_weather_risk(weather_data)
    
    # If no online AI provider is configured, immediately return local NLP
    if not OPENROUTER_AVAILABLE and not GEMINI_AVAILABLE:
        resp = get_local_nlp_response(query, db, role, lang, default_location=location_override)
        resp["answer_text"] = clean_markdown_response(resp["answer_text"])
        return resp

    # Build persona and system prompt
    role_instruction = ""
    if role == "farmer":
        role_instruction = (
            "Act as an Agricultural Meteorology Advisory expert. Focus on soil moisture, "
            "irrigation schedules, crop protection, and pesticide application timings."
        )
    elif role == "disaster_manager":
        role_instruction = (
            "Act as a Disaster Management Emergency Director. Focus on active warning severity, "
            "waterlogging hotspots, river markers, road blockage hazard indices, and emergency actions."
        )
    elif role == "traveller":
        role_instruction = (
            "Act as a Travel Safety Advisor. Focus on road conditions, visibility, "
            "wind advisories, and optimal travel windows along routes."
        )
    elif role == "school":
        role_instruction = (
            "Act as a School Safety Coordinator. Focus on outdoor activity safety, "
            "lightning risks, bus route weather, and student health advisories."
        )
    else:
        role_instruction = (
            "Act as an AI Weather Assistant for the general public. Provide a summary of current "
            "conditions, forecasts, travel safety, and simple safety measures."
        )

    # Build system message with weather data
    system_message = f"""System instructions:
- You are WeatherGPT, a conversational AI weather copilot developed for India Meteorological Department (IMD).
- Translate and answer in the language requested: {lang} (mr = Marathi, hi = Hindi, en = English).
- Ground ALL weather assertions strictly in the provided live meteorological data.
- NEVER invent weather metrics or alerts.
- Distinguish between observation and forecast.
- Distinguish between official IMD warnings and AI-generated risk scoring.
- Incorporate this Persona guidance: {role_instruction}
- FORMATTING RULE: Provide clean, plain, human-readable text ONLY. DO NOT use raw markdown formatting symbols such as asterisks (* or **), double pipes (|| or |), hash headers (### or #), backticks, or markdown table borders. Write in clear paragraphs and simple bullet points using bullet symbols (•) or numbers.
- Be conversational, friendly, and helpful. Give practical, actionable advice.
- Vary your response style - sometimes use emojis for friendly tone, sometimes be more formal depending on context.
- If asked about something not weather-related, politely redirect to weather topics.

Weather Data provided:
{json.dumps(weather_data, indent=2)}

Risk Assessment:
{json.dumps(risk_data, indent=2)}"""

    # Build messages array with conversation history
    messages = [{"role": "system", "content": system_message}]
    
    # Add conversation history if provided (last 10 messages for context window)
    if conversation_history:
        for msg in conversation_history[-10:]:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
    
    # Add current query
    messages.append({"role": "user", "content": f'User Question: "{query}"\n\nReturn a clear, well-formatted response with practical insights.'})

    cache_key = f"{query.strip().lower()}_{role}_{lang}_{location_override or ''}"
    now_ts = time.time()
    if cache_key in _AI_CHAT_CACHE:
        entry = _AI_CHAT_CACHE[cache_key]
        if now_ts < entry["expires_at"]:
            return entry["data"]

    # 2. Try OpenRouter first (fastest inference, 0.8s typical response)
    openrouter_keys_to_try = [k for k in [openrouter_key, openrouter_backup_key] if k]
    for key_idx, or_key in enumerate(openrouter_keys_to_try):
        try:
            model_name = settings.OPENROUTER_MODEL or "openrouter/auto"
            headers = {
                "Authorization": f"Bearer {or_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://weathergpt.onrender.com",
                "X-Title": "WeatherGPT"
            }
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.8,  # Higher temperature for varied responses
                "max_tokens": 1024,
                "top_p": 0.95,
                "frequency_penalty": 0.3,  # Reduce repetition
                "presence_penalty": 0.3   # Encourage diverse topics
            }
            print(f"[WeatherGPT] Calling OpenRouter with model={model_name}, messages={len(messages)}")
            res = _AI_HTTP_SESSION.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=10.0)
            if res.status_code == 200:
                res_data = res.json()
                answer_text = clean_markdown_response(res_data["choices"][0]["message"]["content"].strip())
                key_label = "Primary" if key_idx == 0 else "Secondary"
                resp_payload = {
                    "answer_text": answer_text,
                    "data_sources": weather_data["current"]["source"],
                    "confidence_note": f"Grounded via AI Copilot ({model_name} • {key_label} Key).",
                    "alert_level": risk_data["category"],
                    "metadata": {
                        "type": "weather",
                        "weather_details": weather_data,
                        "risk_details": risk_data
                    }
                }
                _AI_CHAT_CACHE[cache_key] = {"data": resp_payload, "expires_at": now_ts + 300}
                return resp_payload
            else:
                print(f"OpenRouter API Key {key_idx+1} error (Status {res.status_code}): {res.text[:200]}")
        except Exception as e:
            print(f"OpenRouter Key {key_idx+1} generation error: {e}")

    # 3. Try Gemini as secondary AI provider
    if GEMINI_AVAILABLE and client:
        try:
            model_name = settings.GEMINI_MODEL or "gemini-3.6-flash"
            # For Gemini, combine all messages into a single prompt
            gemini_prompt = system_message + "\n\n"
            if conversation_history:
                for msg in conversation_history[-10:]:
                    role_label = "User" if msg.get("role") == "user" else "Assistant"
                    gemini_prompt += f"{role_label}: {msg.get('content', '')}\n"
            gemini_prompt += f'User: "{query}"\n\nReturn a clear, well-formatted response with practical insights.'
            
            response = client.models.generate_content(
                model=model_name,
                contents=gemini_prompt,
            )
            answer_text = clean_markdown_response(response.text.strip())
            resp_payload = {
                "answer_text": answer_text,
                "data_sources": weather_data["current"]["source"],
                "confidence_note": f"Grounded via Gemini ({model_name}).",
                "alert_level": risk_data["category"],
                "metadata": {
                    "type": "weather",
                    "weather_details": weather_data,
                    "risk_details": risk_data
                }
            }
            _AI_CHAT_CACHE[cache_key] = {"data": resp_payload, "expires_at": now_ts + 300}
            return resp_payload
        except Exception as e:
            print(f"Gemini generation error: {e}. Falling back to dynamic local NLP.")

    # 4. Fallback to dynamic local NLP
    resp = get_local_nlp_response(query, db, role, lang, default_location=location_override)
    resp["answer_text"] = clean_markdown_response(resp["answer_text"])
    _AI_CHAT_CACHE[cache_key] = {"data": resp, "expires_at": now_ts + 300}
    return resp
