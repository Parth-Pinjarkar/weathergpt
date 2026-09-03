from pydantic_settings import BaseSettings
from typing import Optional, List
import os
import secrets


class Settings(BaseSettings):
    PORT: int = 8000
    DEMO_MODE: bool = False
    DATABASE_URL: str = "sqlite:///./weathergpt.db"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.6-flash"
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BACKUP_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "openrouter/auto"
    OPENWEATHER_API_KEY: Optional[str] = None

    # ── Security / JWT ────────────────────────────────────────────────────────
    # In production, set JWT_SECRET_KEY in your .env (never commit the real key)
    JWT_SECRET_KEY: str = secrets.token_hex(32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60          # access token lifetime
    JWT_REFRESH_EXPIRE_DAYS: int = 7      # refresh token lifetime

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed frontend origins.
    # Defaults to localhost dev origins; override in production .env.
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000"

    # ── Caching / Redis ───────────────────────────────────────────────────────
    # Optional Redis URL. If not set, falls back to in-memory TTL cache.
    REDIS_URL: Optional[str] = None
    WEATHER_CACHE_TTL_SECONDS: int = 600   # 10 minutes
    AI_CACHE_TTL_SECONDS: int = 1800       # 30 minutes

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            ".env"
        )
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
