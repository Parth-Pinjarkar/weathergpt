# WeatherGPT — REST & WebSocket API Reference

All REST endpoints are rooted at `/api` and documented interactively via OpenAPI at `/api/docs`.

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Create account with persona & BCrypt hash | No |
| `POST` | `/api/auth/login` | Authenticate with email/password; returns JWT access + refresh | No |
| `POST` | `/api/auth/guest` | Instant guest session for hackathon evaluation | No |
| `POST` | `/api/auth/refresh` | Renew access token using refresh token | No |
| `GET`  | `/api/auth/me` | Fetch authenticated profile and permissions | Bearer JWT |
| `POST` | `/api/auth/logout` | Revoke token and blacklist JTI | Bearer JWT |

---

## 2. Weather & Meteorology (`/api/weather`)

| Method | Endpoint | Query / Body Params | Description |
|--------|----------|---------------------|-------------|
| `GET`  | `/api/weather/current` | `location`, `nwp_model` | Current weather, risk score, breakdown |
| `GET`  | `/api/weather/forecast` | `location` | 7-day daily forecast and hourly intervals |
| `GET`  | `/api/weather/complete` | `location`, `nwp_model` | Weather + Risk + Confidence + Hazards + Activities |
| `GET`  | `/api/weather/activity-advisor` | `location`, `activity` | Operational suitability (0–100) for 9 activities |
| `GET`  | `/api/weather/providers` | None | Lists active & available weather providers |
| `POST` | `/api/weather/batch` | `{"locations": [...]}` | Concurrent multi-city weather fetch |

---

## 3. RAG Knowledge Pipeline (`/api/rag`)

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| `GET`  | `/api/rag/search` | `q` | Cosine similarity search across NDMA & IMD guidelines |
| `GET`  | `/api/rag/documents` | None | Lists all indexed knowledge documents |

---

## 4. Route Intelligence (`/api/route`)

| Method | Endpoint | Payload | Description |
|--------|----------|---------|-------------|
| `POST` | `/api/route/analyze` | `{"from_location": "Pune", "to_location": "Mumbai", "departure_time": "05:00 PM"}` | Multi-checkpoint corridor analysis, hazard segments, departure recommendation |

---

## 5. Conversational AI Copilot (`/api/chat`)

| Method | Endpoint | Payload | Description |
|--------|----------|---------|-------------|
| `POST` | `/api/chat` | `{"query": "...", "role": "farmer", "lang": "mr"}` | Grounded meteorological assistant with tool calling & RAG |
| `GET`  | `/api/chat/history/{session_id}` | None | Retrieve conversational session history |

---

## 6. Real-Time WebSockets (`/api/ws`)

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| `WS` | `/api/ws/alerts` | Real-time weather alerts push broadcast |
| `WS` | `/api/ws/weather/{city}` | Live telemetry push for specific city with heartbeat |

---

## 7. System Health & Observability

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health`, `/healthz` | Lightweight load-balancer healthcheck |
| `GET`  | `/api/health` | Multi-point diagnostics: DB, cache, AI, RAG, and memory |
| `GET`  | `/api/system/metrics` | Observability telemetry: uptime, threads, cache metrics |
