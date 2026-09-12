# WeatherGPT — Repository Audit & Architectural Assessment

## 1. System Inventory

| Subsystem | Technology | Location | Status |
|-----------|------------|----------|--------|
| Frontend | Next.js 16.3.3 (Turbopack, React 19, TypeScript, Tailwind CSS, Lucide, PWA Service Worker) | `frontend/` | Fully functional, production build passes with 0 errors |
| Backend | FastAPI (Python 3.12, Uvicorn, SlowAPI rate limiting, Gzip middleware) | `backend/app/` | Fully functional, 20 test suites passing |
| Database | SQLite (`weathergpt.db`) with SQLAlchemy ORM (compatible with PostgreSQL) | `backend/weathergpt.db` | Fully migrated, indexes active |
| Cache | Dual-tier: Sub-millisecond Memory TTL Cache (180s) & Database TTL Cache (5m) | `backend/app/cache/` | Functional |
| AI Engine | Gemini API / OpenRouter / Deterministic Rule & Heuristic Fallback Engine | `backend/app/services/ai_service.py` | Grounded with anti-hallucination guardrails |
| RAG | Vector / TF-IDF Cosine Similarity Search over NDMA/IMD standards | `backend/app/services/rag_service.py` | Operational with citations |
| Auth | BCrypt password hashing + HS256 JWT Access & Refresh tokens | `backend/app/routes/auth.py` | Isolated, blacklisting enabled |

## 2. Identified APIs & Routes

- `/api/auth`: `register`, `login`, `guest`, `me`, `refresh`, `logout`
- `/api/weather`: `current`, `forecast`, `complete`, `activity-advisor`, `providers`, `batch`, `climate`
- `/api/route`: `analyze` (corridor checkpoint intelligence)
- `/api/chat`: `POST /api/chat`, `GET /api/chat/history/{id}`
- `/api/alerts`: official warnings broadcast
- `/api/disaster`: dam discharge and flood command center
- `/api/emergency`: shelters, hospital triage, and checklist
- `/api/simulation`: what-if dam surge and cloudburst simulations
- `/api/rag`: semantic search and document inspection
- `/api/user`: preferences and saved locations
- `/api/analytics`: usage statistics and popular cities
- `/api/ws`: real-time WebSocket alert and city weather streams
- `/health`, `/healthz`, `/api/health`, `/api/system/metrics`: diagnostic observability

## 3. Security & Code Quality Audit

1. **Passwords**: BCrypt salted hashing implemented (no plaintext passwords).
2. **Secrets**: Centralized in `app/config/settings.py` via Pydantic `BaseSettings` reading `.env`.
3. **CORS**: Locked to allowed origins and dynamic staging regexes.
4. **Rate Limiting**: SlowAPI applied across API endpoints (default 120/min, tighter on AI routes).
5. **Data Grounding**: AI answers strictly grounded in sensor/NWP observations, citing sources and declaring confidence.
