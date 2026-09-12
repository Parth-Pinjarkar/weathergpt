# WeatherGPT — Production Deployment & DevOps Guide

WeatherGPT is cloud-agnostic and ready for deployment on Vercel, Render, Railway, AWS, or Docker containers.

## 1. Quick Local Execution

Use the automated launcher:
```bash
# Windows
run_demo.bat
```
Or start manually in two terminal tabs:
```bash
# Terminal 1 (Backend)
cd backend
..\.venv\Scripts\python app/main.py

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

---

## 2. Docker & Containerization

A complete multi-container orchestration is defined in [`docker-compose.yml`](file:///d:/vivek%20idea/docker-compose.yml):
```bash
docker-compose up --build
```
Services spun up:
- **`web`**: Next.js 16 frontend container (:3000)
- **`api`**: FastAPI high-performance Python container (:8000)
- **`postgres`**: Relational database storage (:5432)
- **`redis`**: High-speed memory cache (:6379)

---

## 3. Cloud Deployment (Render & Vercel)

### Backend (Render / Railway / Cloud Run)
- Defined in [`render.yaml`](file:///d:/vivek%20idea/render.yaml):
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4`
  - Health Check Path: `/healthz`

### Frontend (Vercel)
- Framework Preset: Next.js
- Root Directory: `frontend`
- Environment Variables:
  - `NEXT_PUBLIC_API_URL`: URL of deployed backend (e.g. `https://weathergpt-backend.onrender.com`)

---

## 4. Environment Configuration (`.env.example`)

```env
PORT=8000
DEMO_MODE=false
DATABASE_URL=sqlite:///./weathergpt.db
WEATHER_PROVIDER=openmeteo

# Optional External API Keys (Defaults to Open-Meteo & Rule AI if omitted)
OPENWEATHER_API_KEY=
WEATHERAPI_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=

# Security
JWT_SECRET_KEY=your_production_random_secret_hex_key_32_bytes
ALLOWED_ORIGINS=http://localhost:3000,https://weathergpt.vercel.app
```
