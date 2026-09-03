import requests
from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/location", tags=["location"])

# Ultra-fast in-memory cache for location searches
_GEO_SEARCH_CACHE: Dict[str, Dict[str, Any]] = {}

LOCATION_REGISTRY: List[Dict[str, Any]] = [
    {"name": "Pune", "state": "Maharashtra", "country": "India", "lat": 18.5204, "lon": 73.8567, "type": "IT & Education Hub"},
    {"name": "Mumbai", "state": "Maharashtra", "country": "India", "lat": 19.0760, "lon": 72.8777, "type": "Financial Capital"},
    {"name": "Nashik", "state": "Maharashtra", "country": "India", "lat": 19.9975, "lon": 73.7898, "type": "Wine & Agri Center"},
    {"name": "Lonavala", "state": "Maharashtra", "country": "India", "lat": 18.7557, "lon": 73.4091, "type": "Western Ghats"},
    {"name": "Khopoli", "state": "Maharashtra", "country": "India", "lat": 18.7904, "lon": 73.3424, "type": "Industrial Corridor"},
    {"name": "Panvel", "state": "Maharashtra", "country": "India", "lat": 18.9894, "lon": 73.1175, "type": "Navi Mumbai Hub"},
    {"name": "Delhi", "state": "Delhi", "country": "India", "lat": 28.7041, "lon": 77.1025, "type": "National Capital"},
    {"name": "Bengaluru", "state": "Karnataka", "country": "India", "lat": 12.9716, "lon": 77.5946, "type": "Silicon Valley"},
    {"name": "Chennai", "state": "Tamil Nadu", "country": "India", "lat": 13.0827, "lon": 80.2707, "type": "Coastal Metropolis"},
    {"name": "Hyderabad", "state": "Telangana", "country": "India", "lat": 17.3850, "lon": 78.4867, "type": "Tech Hub"},
    {"name": "Jaipur", "state": "Rajasthan", "country": "India", "lat": 26.9124, "lon": 75.7873, "type": "Heritage City"},
    {"name": "Kolkata", "state": "West Bengal", "country": "India", "lat": 22.5726, "lon": 88.3639, "type": "Cultural Capital"},
    {"name": "Ahmedabad", "state": "Gujarat", "country": "India", "lat": 23.0225, "lon": 72.5714, "type": "Commercial City"},
    {"name": "Surat", "state": "Gujarat", "country": "India", "lat": 21.1702, "lon": 72.8311, "type": "Textile Hub"},
    {"name": "Nagpur", "state": "Maharashtra", "country": "India", "lat": 21.1458, "lon": 79.0882, "type": "Central India"},
    {"name": "Lucknow", "state": "Uttar Pradesh", "country": "India", "lat": 26.8467, "lon": 80.9462, "type": "Heritage Capital"},
    {"name": "Indore", "state": "Madhya Pradesh", "country": "India", "lat": 22.7196, "lon": 75.8577, "type": "Clean City"},
    {"name": "Bhopal", "state": "Madhya Pradesh", "country": "India", "lat": 23.2599, "lon": 77.4126, "type": "City of Lakes"},
    {"name": "Patna", "state": "Bihar", "country": "India", "lat": 25.5941, "lon": 85.1376, "type": "Historic City"},
    {"name": "Shimla", "state": "Himachal Pradesh", "country": "India", "lat": 31.1048, "lon": 77.1734, "type": "Himalayan Hill Station"},
    {"name": "Srinagar", "state": "Jammu & Kashmir", "country": "India", "lat": 34.0837, "lon": 74.7973, "type": "Valley City"},
    {"name": "Goa", "state": "Goa", "country": "India", "lat": 15.2993, "lon": 74.1240, "type": "Coastal Destination"},
    {"name": "Kochi", "state": "Kerala", "country": "India", "lat": 9.9312, "lon": 76.2673, "type": "Port City"},
    {"name": "Thiruvananthapuram", "state": "Kerala", "country": "India", "lat": 8.5241, "lon": 76.9366, "type": "Capital City"},
    {"name": "Varanasi", "state": "Uttar Pradesh", "country": "India", "lat": 25.3176, "lon": 82.9739, "type": "Sacred City"},
    {"name": "Amritsar", "state": "Punjab", "country": "India", "lat": 31.6340, "lon": 74.8723, "type": "Border City"},
    {"name": "Chandigarh", "state": "Punjab & Haryana", "country": "India", "lat": 30.7333, "lon": 76.7794, "type": "Union Territory"},
    {"name": "Dehradun", "state": "Uttarakhand", "country": "India", "lat": 30.3165, "lon": 78.0322, "type": "Doon Valley"},
    {"name": "Visakhapatnam", "state": "Andhra Pradesh", "country": "India", "lat": 17.6868, "lon": 83.2185, "type": "Port City"},
    {"name": "Guwahati", "state": "Assam", "country": "India", "lat": 26.1445, "lon": 91.7362, "type": "Gateway to Northeast"},
    {"name": "Bhubaneswar", "state": "Odisha", "country": "India", "lat": 20.2961, "lon": 85.8245, "type": "Temple City"},
    {"name": "Mahabaleshwar", "state": "Maharashtra", "country": "India", "lat": 17.9237, "lon": 73.6586, "type": "Western Ghats Station"},
    {"name": "Alibaug", "state": "Maharashtra", "country": "India", "lat": 18.6414, "lon": 72.8722, "type": "Coastal Town"},
    {"name": "Wagholi", "state": "Maharashtra", "country": "India", "lat": 18.5793, "lon": 73.9822, "type": "Pune East Suburb"},
    {"name": "Hinjawadi", "state": "Maharashtra", "country": "India", "lat": 18.5913, "lon": 73.7389, "type": "Pune Tech Zone"}
]


@router.get("/search")
def search_locations(q: str = Query(..., description="Query location text or coordinates")):
    query = q.strip()
    if not query:
        return {
            "query": q,
            "resolved": LOCATION_REGISTRY[0],
            "suggestions": LOCATION_REGISTRY[:6]
        }

    q_lower = query.lower()

    # 1. Handle "near me" / "current location"
    if q_lower in ["near me", "current location", "my location", "here", "gps"]:
        return {
            "query": q,
            "resolved": LOCATION_REGISTRY[0],
            "suggestions": LOCATION_REGISTRY[:6]
        }

    # 2. Handle GPS coordinates: "18.5204, 73.8567"
    if "," in query and any(c.isdigit() for c in query):
        try:
            parts = query.split(",")
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            resolved_loc = {
                "name": f"📍 GPS ({lat:.2f}°, {lon:.2f}°)",
                "state": "Live Coordinates",
                "country": "India",
                "lat": lat,
                "lon": lon,
                "type": "GPS Location"
            }
            return {
                "query": q,
                "resolved": resolved_loc,
                "suggestions": [resolved_loc] + LOCATION_REGISTRY[:5]
            }
        except Exception:
            pass

    # 3. Match against local LOCATION_REGISTRY first
    local_matches: List[Dict[str, Any]] = []
    for loc in LOCATION_REGISTRY:
        loc_name = loc["name"].lower()
        loc_state = loc.get("state", "").lower()
        if q_lower == loc_name or loc_name.startswith(q_lower):
            local_matches.insert(0, loc)
        elif q_lower in loc_name or q_lower in loc_state:
            local_matches.append(loc)

    # 4. Live Geocoding via Open-Meteo Geocoding API for global places
    live_results: List[Dict[str, Any]] = []
    try:
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={requests.utils.quote(query)}&count=8&language=en&format=json"
        geo_res = requests.get(geo_url, timeout=3.0)
        if geo_res.ok:
            data = geo_res.json()
            if data and "results" in data and data["results"]:
                for item in data["results"]:
                    place_name = item.get("name", query.title())
                    admin1 = item.get("admin1", "")
                    country = item.get("country", "")
                    item_lat = item.get("latitude", 18.5204)
                    item_lon = item.get("longitude", 73.8567)
                    feature_code = item.get("feature_code", "")
                    
                    place_type = "City"
                    if "PPLA" in feature_code or "PPLC" in feature_code:
                        place_type = "Capital / Major City"
                    elif "HLL" in feature_code or "MT" in feature_code:
                        place_type = "Hill / Mountain"
                    elif "PPL" in feature_code:
                        place_type = "Locality / Town"

                    live_results.append({
                        "name": place_name,
                        "state": admin1 or country,
                        "country": country,
                        "lat": round(item_lat, 4),
                        "lon": round(item_lon, 4),
                        "type": place_type,
                        "timezone": item.get("timezone", "Asia/Kolkata")
                    })
    except Exception as exc:
        print(f"Geocoding API error for '{query}': {exc}")

    if q_lower in _GEO_SEARCH_CACHE:
        return _GEO_SEARCH_CACHE[q_lower]

    # Combine local matches + live results (avoid duplicates by lowercase name & state)
    combined: List[Dict[str, Any]] = []
    seen = set()

    for item in local_matches + live_results:
        key = f"{item['name'].lower()}_{item.get('state', '').lower()}"
        if key not in seen:
            seen.add(key)
            combined.append(item)

    if combined:
        res_payload = {
            "query": q,
            "resolved": combined[0],
            "suggestions": combined[:8]
        }
        _GEO_SEARCH_CACHE[q_lower] = res_payload
        return res_payload

    # Fallback to Title-cased query with default Pune coordinates if completely unrecognized
    fallback_res = {
        "name": query.title(),
        "state": "India",
        "country": "India",
        "lat": 18.5204,
        "lon": 73.8567,
        "type": "Custom Search Location"
    }
    res_payload = {
        "query": q,
        "resolved": fallback_res,
        "suggestions": [fallback_res] + LOCATION_REGISTRY[:5]
    }
    _GEO_SEARCH_CACHE[q_lower] = res_payload
    return res_payload
