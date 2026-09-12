"""
WeatherGPT — RAG (Retrieval-Augmented Generation) Knowledge Pipeline
────────────────────────────────────────────────────────────────────
Implements vector/semantic similarity search across indexed meteorological
guidelines, NDMA disaster manuals, and weather preparedness standards.
"""

import math
import re
from typing import List, Dict, Any, Optional
from datetime import datetime


# ── Curated Meteorological & Disaster Knowledge Base ──────────────────────────

KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "id": "rag-01",
        "title": "Lightning Safety & 30-30 Rule (NDMA / IMD)",
        "category": "lightning",
        "source": "NDMA Lightning Safety Manual",
        "content": (
            "Lightning is an instantaneous electrical discharge. Follow the 30-30 Rule: If the time between "
            "seeing lightning and hearing thunder is less than 30 seconds, the storm is within 10 km and you "
            "are in immediate danger. Seek enclosed shelter immediately. Wait at least 30 minutes after the "
            "last clap of thunder before leaving shelter. Avoid open fields, hilltops, isolated tall trees, "
            "fences, metal pipelines, and open water bodies. Do not lie flat on the ground; assume a low crouch "
            "with feet together if trapped outdoors."
        ),
        "keywords": ["lightning", "thunder", "thunderstorm", "strike", "30-30", "crouch", "tree", "ndma"]
    },
    {
        "id": "rag-02",
        "title": "Urban Flooding & Flash Flood Mitigation",
        "category": "flood",
        "source": "IMD Hydrological Advisory / SDRF",
        "content": (
            "Flash floods develop rapidly following intense precipitation (>65 mm/hr) or upstream dam discharge. "
            "Crucial safety measures: Never drive or walk through moving water ('Turn Around, Don't Drown'). "
            "Just 15 cm (6 inches) of rapid water can knock a person down; 30 cm can carry away small cars; "
            "60 cm will float trucks and SUVs. Stay away from storm drains, bridge culverts, and riverbanks. "
            "If water enters buildings, disconnect main power breakers and move to the highest accessible level, "
            "ensuring an exit route exists to the roof. Store emergency drinking water and medicines in waterproof bags."
        ),
        "keywords": ["flood", "flash flood", "waterlogging", "inundation", "dam discharge", "cusecs", "underpass", "drown"]
    },
    {
        "id": "rag-03",
        "title": "Extreme Heatwave & Wet-Bulb Temperature Thresholds",
        "category": "heatwave",
        "source": "Ministry of Earth Sciences / WHO Heat Health",
        "content": (
            "A heatwave is declared in plains when ambient temperature exceeds 40°C with departure of >= 4.5°C above normal. "
            "Wet-Bulb Globe Temperature (WBGT) above 32°C impairs natural human sweating. Precautionary protocols: "
            "Avoid direct sun between 11:00 AM and 04:00 PM. Drink continuous fluids (ORS, buttermilk, lemon water, aam panna). "
            "Recognize Heat Stroke symptoms: body temperature > 40°C (104°F), rapid pulse, lack of sweating, confusion, "
            "or unconsciousness. This is a medical emergency requiring immediate cooling with wet cloths, ice packs in armpits/groin, "
            "and immediate emergency transport."
        ),
        "keywords": ["heatwave", "loo", "hot", "sunstroke", "heat stroke", "wet bulb", "wbgt", "dehydration", "ors", "extreme heat"]
    },
    {
        "id": "rag-04",
        "title": "Tropical Cyclone Preparedness & Wind Categorization",
        "category": "cyclone",
        "source": "IMD Cyclone Warning Division",
        "content": (
            "Cyclones are classified by sustained wind speed: Deep Depression (52-61 km/h), Cyclonic Storm (62-87 km/h), "
            "Severe Cyclonic Storm (88-117 km/h), Very Severe (118-165 km/h), and Super Cyclone (>222 km/h). "
            "Precautions during red alert: Board or tape windows, anchor loose roof sheets and satellite dishes, "
            "evacuate coastal zones to elevated cyclone shelters within 24 hours of landfall warning. Disconnect gas "
            "and electrical mains. Prepare an emergency bag with dry rations, torches, battery banks, and first aid. "
            "Beware of the 'Eye of the Cyclone': a temporary calm does not mean the storm has ended; reverse gale winds follow rapidly."
        ),
        "keywords": ["cyclone", "storm", "gale", "landfall", "hurricane", "typhoon", "eye of cyclone", "wind speed", "storm surge"]
    },
    {
        "id": "rag-05",
        "title": "UV Index Scale & Dermatological Protection",
        "category": "meteorology",
        "source": "World Meteorological Organization (WMO) / WHO",
        "content": (
            "The Global Solar UV Index ranges from 1 to 11+. Scale: Low (0-2), Moderate (3-5), High (6-7), "
            "Very High (8-10), and Extreme (11+). At UV Index >= 6, unprotected skin can burn in under 20 minutes. "
            "At UV Index >= 8 (Very High / Extreme, common in Indian tropical summers), wear broad-spectrum SPF 50+ "
            "sunscreen, UV400 protective sunglasses, wide-brimmed hats, and UV-filtering cotton clothing. Minimize "
            "sun exposure between 10:00 AM and 03:00 PM when solar elevation is highest."
        ),
        "keywords": ["uv", "uv index", "sunscreen", "ultraviolet", "sunburn", "solar", "radiation"]
    },
    {
        "id": "rag-06",
        "title": "Air Quality Index (AQI) Categories & Health Safeguards",
        "category": "meteorology",
        "source": "Central Pollution Control Board (CPCB)",
        "content": (
            "National Air Quality Index (NAQI) classifies air quality into six grades: Good (0-50), Satisfactory (51-100), "
            "Moderate (101-200), Poor (201-300), Very Poor (301-400), and Severe (401-500). Dominant pollutants are PM2.5 "
            "and PM10. At Poor or above (AQI > 200), sensitive groups (asthma, heart disease, elderly, children) should "
            "avoid outdoor exertion. At Very Poor or Severe (AQI > 300), all individuals must wear N95/FFP2 respirators "
            "outdoors, keep air purifiers active indoors, and avoid morning jogging during temperature inversion hours."
        ),
        "keywords": ["aqi", "air quality", "pollution", "pm2.5", "pm10", "smog", "n95", "respirator", "inversion"]
    },
    {
        "id": "rag-07",
        "title": "Convective Instability (CAPE) & Severe Cloudburst Dynamics",
        "category": "meteorology",
        "source": "IMD NWP Division / WMO WIS 2.0",
        "content": (
            "Convective Available Potential Energy (CAPE) measures atmospheric buoyancy and potential updraft velocity. "
            "CAPE values: <1000 J/kg (Weak instability), 1000-2500 J/kg (Moderate), >2500 J/kg (Extremely unstable). "
            "When high CAPE coincides with deep tropospheric moisture and orographic lifting (such as Western Ghats or Himalayas), "
            "it triggers cloudbursts (>100 mm rain in 1 hour) with localized flash floods, microbursts, and destructive hail. "
            "Early radar detection and NOWCAST bulletins provide 1 to 3 hours lead time for mountain pass evacuations."
        ),
        "keywords": ["cape", "instability", "cloudburst", "microburst", "hail", "orographic", "ghat", "nowcast", "radar"]
    },
    {
        "id": "rag-08",
        "title": "Agricultural Weather Advisory Standards (Kisan Mitra)",
        "category": "agriculture",
        "source": "ICAR - Agro-Meteorology Advisory Division",
        "content": (
            "Agricultural weather advisories govern three critical field operations: 1) Spraying window: requires wind "
            "<15 km/h, temperature 18-30°C, and rain probability <30% for 24 hours to prevent pesticide wash-off. "
            "2) Irrigation: hold irrigation when forecast indicates >25 mm rainfall within 48 hours to conserve water "
            "and prevent fungal root rot. 3) Harvest and threshing: ensure grains reach safe moisture content (<12%) "
            "and secure harvested yields in elevated, polythene-covered shelters during unseasonal western disturbances or hail."
        ),
        "keywords": ["farmer", "kisan", "irrigation", "spraying", "pesticide", "harvest", "crop", "agri", "icar", "fungal"]
    }
]


# ── TF-IDF / Cosine Vector Similarity Search Engine ──────────────────────────

def _tokenize(text: str) -> List[str]:
    """Tokenizes string into lowercased alphanumeric words."""
    return re.findall(r"\b[a-z0-9-]{3,}\b", text.lower())


def _build_tfidf_vectors():
    """Computes document frequency and terms for the knowledge base."""
    docs = []
    doc_freq: Dict[str, int] = {}
    num_docs = len(KNOWLEDGE_BASE)

    for item in KNOWLEDGE_BASE:
        full_text = f"{item['title']} {item['category']} {item.get('source', '')} {item['content']} {' '.join(item.get('keywords', []))}"
        tokens = _tokenize(full_text)
        term_counts: Dict[str, int] = {}
        for t in tokens:
            term_counts[t] = term_counts.get(t, 0) + 1
        
        for t in term_counts:
            doc_freq[t] = doc_freq.get(t, 0) + 1

        docs.append({"id": item["id"], "term_counts": term_counts, "num_tokens": len(tokens)})

    return docs, doc_freq, num_docs


_DOCS, _DOC_FREQ, _NUM_DOCS = _build_tfidf_vectors()


# ── Multilingual Concept Normalization for Indic Languages ────────────────────

CONCEPT_MAPPINGS = {
    "lightning": [
        "बिजली", "वीज", "मின்னல்", "మెరుపు", "বাজ", "વીજળી", "ಮಿಂಚು", "മിന്നൽ", "ਬਿਜਲੀ", "गरज", "तडित",
        "thunder", "strike", "lightning", "lightening"
    ],
    "flood": [
        "बाढ़", "पूर", "വെള്ളപ്പൊക്കം", "వరద", "বন্যা", "પૂર", "ಪ್ರವಾಹ", "ਹੜ੍ਹ", "जलभराव", "जलप्रलय",
        "flood", "flooding", "waterlogging", "inundation", "overflow"
    ],
    "heatwave": [
        "लू", "उष्णतेची लाट", "வெப்ப அலை", "వడగాల్పులు", "তাপপ্রবাহ", "હીટવેવ", "ಶಾಖದ ಅಲೆ", "ഉഷ്ണതരംഗം", "ਲੂ", "गर्मी",
        "heatwave", "heat wave", "sunstroke", "heatstroke"
    ],
    "cyclone": [
        "चक्रवात", "चक्रीवादळ", "புயல்", "తుఫాను", "ঘূর্ণিঝড়", "વાવાઝોડું", "ಚಂಡಮಾರುತ", "ചുഴലിക്കാറ്റ്", "ਚੱਕਰਵਾਤ", "तूफान", "वादळ",
        "cyclone", "hurricane", "typhoon", "storm"
    ],
    "aqi": [
        "प्रदूषण", "हवा प्रदूषण", "वायु प्रदूषण", "காற்றின் தரம்", "గాలి కాలుష్యం", "বায়ু দূষণ", "હવા પ્રદૂષણ", "ವಾಯು ಮಾಲಿನ್ಯ", "വായു മലിനീകരണം", "ਹਵਾ ਪ੍ਰਦੂਸ਼ਣ",
        "aqi", "pollution", "smog", "air quality"
    ],
    "agriculture": [
        "खेती", "फसल", "पिके", "शेतकरी", "विவசாயம்", "వ్యవసాయం", "কৃষি", "ખેતી", "ಕೃಷಿ", "കൃഷി", "ਖੇਤੀਬਾੜੀ", "सिंचाई",
        "farmer", "crop", "spraying", "irrigation", "kisan"
    ]
}

def normalize_multilingual_query(query: str) -> str:
    """Normalizes cross-lingual queries by expanding detected Indic disaster concepts with canonical tokens."""
    expanded = [query]
    q_lower = query.lower()
    for concept, keywords in CONCEPT_MAPPINGS.items():
        for kw in keywords:
            if kw.lower() in q_lower:
                expanded.append(concept)
                expanded.extend(keywords[-4:]) # add canonical English tokens
                break
    return " ".join(expanded)


def search_knowledge_base(query: str, top_k: int = 3, threshold: float = 0.05) -> List[Dict[str, Any]]:
    """
    Performs cosine similarity search against indexed weather & disaster knowledge.
    Applies multilingual concept normalization so Indic language questions find relevant guidelines.
    Returns matched documents with confidence scores.
    """
    normalized = normalize_multilingual_query(query)
    q_tokens = _tokenize(normalized)
    if not q_tokens:
        return []

    q_counts: Dict[str, int] = {}
    for t in q_tokens:
        q_counts[t] = q_counts.get(t, 0) + 1

    # Query TF-IDF vector
    q_vec: Dict[str, float] = {}
    for t, count in q_counts.items():
        idf = math.log(1 + (_NUM_DOCS / (_DOC_FREQ.get(t, 0) + 1)))
        q_vec[t] = (count / len(q_tokens)) * idf

    q_norm = math.sqrt(sum(v ** 2 for v in q_vec.values())) or 1.0

    scores = []
    for idx, doc in enumerate(_DOCS):
        # Doc TF-IDF vector
        d_vec: Dict[str, float] = {}
        for t, count in doc["term_counts"].items():
            idf = math.log(1 + (_NUM_DOCS / (_DOC_FREQ.get(t, 0) + 1)))
            d_vec[t] = (count / doc["num_tokens"]) * idf

        d_norm = math.sqrt(sum(v ** 2 for v in d_vec.values())) or 1.0

        # Cosine similarity dot product
        dot = sum(q_vec[t] * d_vec[t] for t in q_vec if t in d_vec)
        sim = dot / (q_norm * d_norm)

        # Keyword boost if explicit keyword exists
        kb_item = KNOWLEDGE_BASE[idx]
        for kw in kb_item.get("keywords", []):
            if kw in query.lower():
                sim += 0.25

        if sim > threshold:
            scores.append((sim, kb_item))

    # Sort descending
    scores.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, item in scores[:top_k]:
        results.append({
            "id": item["id"],
            "title": item["title"],
            "category": item["category"],
            "source": item["source"],
            "content": item["content"],
            "similarity_score": round(min(score, 1.0), 3),
            "confidence_percent": min(100, int(score * 100) + 40)
        })

    return results


def get_all_knowledge_documents() -> List[Dict[str, Any]]:
    """Returns the full knowledge catalog for inspection and admin dashboard."""
    return KNOWLEDGE_BASE
