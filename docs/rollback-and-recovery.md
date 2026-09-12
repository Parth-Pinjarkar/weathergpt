# WeatherGPT — Rollback, Disaster Recovery & Dependency Safety Guide

This document establishes the official operational rollback, disaster recovery, and change-safety procedures for **WeatherGPT** across both development and production environments.

---

## 1. Latest Stable Checkpoint & Version Baseline

- **Current Stable Checkpoint Tag**: `v2.0.0-production-ready`
- **Application Services**:
  - **Backend**: FastAPI 2.0.0 (`backend/app/main.py`) running on Python 3.12 (`.venv`), port 8000.
  - **Frontend**: Next.js 16.3.3 (`frontend/`), Turbopack, React 19, TypeScript, port 3000.
  - **Database**: SQLite (`backend/weathergpt.db`) with forward compatibility for PostgreSQL.
  - **Integration Test Status**: 20/20 Test Suites Passing (`tests/test_backend.py`).
  - **Frontend Build Status**: 0 TypeScript errors, 100% static routes prerendered.

---

## 2. Hard Phase-Gate & Change-Safety Principles

1. **Non-Destructive Evolution**: Always follow `ADD -> MIGRATE -> BACKFILL -> VERIFY -> DEPRECATE` rather than immediate drop/rewrite.
2. **Preserve Working MVP**: Advanced features (e.g. simulated dam discharge, WMO WIS 2.0 telemetry) must never compromise core MVP capabilities (Current Weather, Forecast, Risk Engine, AI Chat, Route Intelligence, Alerts).
3. **No Phantom Integrations**: If external API credentials (e.g. OpenWeatherMap OneCall, Gemini API) are absent, the system falls back to `OpenMeteoProvider` (zero-key NWP consensus) and deterministic local heuristic grounding with explicit source labeling.

---

## 3. Step-by-Step Rollback Procedures

### 3.1 Backend Code Rollback
If a newly added backend feature or route introduces a critical regression:

1. **Isolate Problematic Service**:
   ```bash
   git status
   git diff backend/
   ```
2. **Revert Problematic Files** (Partial Rollback preferred over full wipe):
   ```bash
   # Revert specific degraded route or service
   git checkout HEAD -- backend/app/routes/<degraded_route>.py
   ```
3. **Re-Run Integration Test Suite**:
   ```bash
   cd backend
   ..\.venv\Scripts\python tests/test_backend.py
   ```
4. **Verify Liveness**:
   ```bash
   curl -I http://localhost:8000/healthz
   ```

### 3.2 Database Rollback & Schema Protection
- **Rule**: Never run `DROP TABLE` or destructive column drops automatically in production.
- **SQLite Database Recovery**:
  Before applying major schema shifts, SQLite database snapshots are preserved:
  ```bash
  # Create snapshot before experimental migration
  copy backend\weathergpt.db backend\weathergpt.db.bak
  ```
  To restore:
  ```bash
  copy backend\weathergpt.db.bak backend\weathergpt.db
  ```
- **PostgreSQL / Relational Rollback**:
  Use explicit migration down-steps or restore from point-in-time backup (PITR).

### 3.3 Frontend Build & Turbopack Rollback
If Next.js encounters compilation regressions or UI freezing:

1. **Clear Turbopack / Next.js Build Artifacts**:
   ```bash
   cd frontend
   rmdir /s /q .next
   ```
2. **Run TypeScript Check & Rebuild**:
   ```bash
   npm run build
   ```
3. **PWA Service Worker Cache Clear**:
   In DevTools -> Application -> Service Workers -> "Unregister" and "Clear site data" to purge stale client-side caches.

---

## 4. Configuration & Secrets Rollback

- **Environment Baseline**: Never overwrite `.env` with unversioned defaults.
- Always compare against [`backend/.env.example`](file:///d:/vivek%20idea/backend/.env.example):
  ```bash
  # Check missing variables
  fc backend\.env backend\.env.example
  ```
- If JWT secrets or signing keys expire, update `JWT_SECRET_KEY` in `.env` and restart backend process.

---

## 5. External Dependency Failure Playbook

| Failing Service | Impact | Automatic Fallback Protocol |
|-----------------|--------|-----------------------------|
| **Gemini / OpenRouter AI** | Chatbot API timeout / quota exhaustion | System seamlessly triggers local grounded heuristics with verified meteorological templates and RAG citations. |
| **OpenWeatherMap / WeatherAPI** | 401 Unauthorized or Rate Limited | `get_weather_provider()` automatically cascades to `OpenMeteoProvider` or `MockWeatherProvider`. |
| **External Internet / Offline** | Network disconnection | Frontend Service Worker activates, rendering cached weather snapshots and prominent "Offline Mode" notice. |
| **Redis Cache** | Cache connection refused | System automatically uses sub-millisecond in-memory TTL dictionary cache (`_FAST_WEATHER_CACHE`). |

---

## 6. Post-Rollback Verification Checklist

Following any rollback or recovery action, verify:
- [ ] Backend starts cleanly on `:8000` (`python app/main.py`).
- [ ] `/healthz` returns `{"status": "healthy"}`.
- [ ] `/api/health` reports all subsystems (database, weather engine, AI, RAG) operational.
- [ ] `tests/test_backend.py` passes all 20 test suites.
- [ ] `frontend` compiles cleanly with `npm run build`.
- [ ] Dashboard displays weather, 7-day forecast, risk score, and AI assistant without console errors.
