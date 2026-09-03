"""
WeatherGPT — FastAPI Application Entry Point
─────────────────────────────────────────────
Production-grade improvements (Tier 1):
  • CORS locked to ALLOWED_ORIGINS env list (not wildcard *)
  • SlowAPI rate limiter: 120 req/min default, tighter on chat/AI routes
  • GZipMiddleware for bandwidth savings
  • Lifespan context manager for clean startup/shutdown
  • /healthz endpoint for load-balancer health checks
"""

import os
import sys

# Ensure backend root directory is in sys.path so python app/main.py works directly
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.database import Base, engine
from app.routes import weather, chat, route, alerts, disaster, emergency, simulation, climate, location, report, auth
from app.config.settings import settings

# ── Rate limiter (shared across all routes) ───────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    print(f"[OK] WeatherGPT API started | DB: {settings.DATABASE_URL.split(':///')[0]} | Port: {settings.PORT}")
    yield
    # Shutdown
    engine.dispose()
    print("[INFO] WeatherGPT API shut down cleanly.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="WeatherGPT Backend API",
    description="Conversational Weather, Alerts and Disaster Copilot API",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Rate-limit state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware stack ───────────────────────────────────────────────────────────
# 1. Gzip responses >= 1 KB for bandwidth efficiency
app.add_middleware(GZipMiddleware, minimum_size=1024)

# 2. CORS — Allow configured origins, plus dynamic Render & Vercel HTTPS preview/production URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_origin_regex=r"^https://.*\.onrender\.com$|^https://.*\.vercel\.app$|^http://localhost(:\d+)?$|^http://127\.0\.0\.1(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(weather.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(route.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(disaster.router, prefix="/api")
app.include_router(emergency.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")
app.include_router(climate.router, prefix="/api")
app.include_router(location.router, prefix="/api")
app.include_router(report.router, prefix="/api")

# Real-time WebSocket endpoints (alerts broadcast + city weather push)
from app.routes import ws
app.include_router(ws.router, prefix="/api")

# Analytics / product insights endpoints
from app.routes import analytics
app.include_router(analytics.router, prefix="/api")


# ── Core endpoints ────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "WeatherGPT API",
        "version": "2.0.0",
        "demo_mode": settings.DEMO_MODE,
        "database": settings.DATABASE_URL.split(":///")[0],
        "docs": "/api/docs",
    }


@app.get("/health", tags=["health"])
@app.get("/healthz", tags=["health"])
def health_check():
    """Load-balancer / Docker / Render health check endpoint."""
    return {"status": "healthy", "service": "weathergpt-api"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True,
        workers=1,  # Use 1 for reload=True dev mode; set workers=4 in production
    )
