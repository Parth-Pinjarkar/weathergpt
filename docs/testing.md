# WeatherGPT — Verification & Test Strategy

WeatherGPT employs a multi-tiered test suite ensuring 100% endpoint availability, mathematical correctness of risk algorithms, and resilient fallback handling.

## 1. Test Suite Architecture (`backend/tests/test_backend.py`)

The automated test harness validates 20 critical operational subsystems:

1. **Root Endpoint (`/`)**: Service metadata, versioning, and environment declarations.
2. **Healthcheck (`/healthz`)**: Fast liveness probe for Docker and Render load balancers.
3. **Comprehensive Health (`/api/health`)**: Multi-subsystem diagnostics (DB latency, cache, AI, RAG).
4. **Authentication & Token Lifecycle (`/api/auth`)**:
   - User registration with BCrypt hashing.
   - User login and JWT access/refresh token generation.
   - Profile verification (`/api/auth/me`).
   - Guest login evaluation session.
5. **User Preferences & Saved Locations (`/api/user`)**: Unit settings and bookmark storage.
6. **Current Weather & Risk Engine (`/api/weather/current`)**: Real-time retrieval and risk scoring.
7. **Weather Provider Abstraction (`/api/weather/providers`, `/complete`)**: Provider catalog and normalized payloads.
8. **7-Day Forecast Retrieval (`/api/weather/forecast`)**: Daily and hourly intervals.
9. **Activity Advisor (`/api/weather/activity-advisor`)**: 9 operational suitability profiles.
10. **RAG Knowledge Base (`/api/rag/search`, `/documents`)**: Semantic similarity retrieval.
11. **Conversational AI Copilot (`/api/chat`)**: Multi-turn history and persona switching.
12. **Weather Route Intelligence (`/api/route/analyze`)**: Corridor checkpoint hazard synthesis.
13. **Official Alerts Engine (`/api/alerts`)**: IMD warning bulletins.
14. **Disaster Command Center (`/api/disaster/dashboard`)**: Dam discharge and flood vulnerability.
15. **Emergency Safe Locations (`/api/emergency/locations`, `/checklist`)**: Shelter locator and checklists.
16. **Disaster & What-If Simulation (`/api/simulation`)**: Dam surge and intensity delta models.
17. **Climate Insights (`/api/climate/insights`)**: Historical trends and anomaly detection.
18. **Natural Language Location Search (`/api/location/search`)**: Fuzzy city resolution.
19. **Report Generator (`/api/report/generate`)**: Executive daily/weekly weather intelligence briefs.
20. **Real-Time WebSockets (`/api/ws/alerts`, `/api/ws/weather`)**: WebSocket push and ping-pong.

## 2. Running Backend Tests

```bash
cd backend
..\.venv\Scripts\python tests/test_backend.py
```

## 3. Running Frontend Production Build & Typecheck

```bash
cd frontend
npm run build
```
Turbopack and TypeScript strictly typecheck all TSX components and generate optimized static pages.
