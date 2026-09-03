"""
WeatherGPT — TTL Cache Layer
────────────────────────────
Provides a simple get/set/delete cache with TTL expiry.
• If REDIS_URL is configured → uses Redis (shared across workers)
• Otherwise → uses cachetools TTLCache (single-process, in-memory)

Usage:
    from app.cache.ttl_cache import cache
    cache.set("weather:pune", data, ttl=600)
    data = cache.get("weather:pune")
"""

import json
import logging
from typing import Any, Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)


class InMemoryTTLCache:
    """Lightweight in-memory cache backed by cachetools.TTLCache."""

    def __init__(self, max_size: int = 512, default_ttl: int = 600):
        from cachetools import TTLCache
        self._store: dict[str, Any] = {}
        self._cache = TTLCache(maxsize=max_size, ttl=default_ttl)
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        try:
            return self._cache.get(key)
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        try:
            # TTLCache doesn't support per-item TTL natively;
            # store with default TTL (acceptable for most use cases)
            self._cache[key] = value
        except Exception as exc:
            logger.warning("Cache set failed for key=%s: %s", key, exc)

    def delete(self, key: str) -> None:
        try:
            del self._cache[key]
        except KeyError:
            pass

    def clear(self) -> None:
        self._cache.clear()


class RedisCache:
    """Redis-backed cache (requires REDIS_URL in settings)."""

    def __init__(self, redis_url: str):
        import redis as _redis
        self._client = _redis.from_url(redis_url, decode_responses=True)

    def get(self, key: str) -> Optional[Any]:
        try:
            raw = self._client.get(key)
            return json.loads(raw) if raw is not None else None
        except Exception as exc:
            logger.warning("Redis get failed for key=%s: %s", key, exc)
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        try:
            raw = json.dumps(value, default=str)
            if ttl:
                self._client.setex(key, ttl, raw)
            else:
                self._client.set(key, raw)
        except Exception as exc:
            logger.warning("Redis set failed for key=%s: %s", key, exc)

    def delete(self, key: str) -> None:
        try:
            self._client.delete(key)
        except Exception:
            pass

    def clear(self) -> None:
        try:
            self._client.flushdb()
        except Exception:
            pass


def _build_cache():
    if settings.REDIS_URL:
        try:
            c = RedisCache(settings.REDIS_URL)
            # Quick connectivity check
            c._client.ping()
            logger.info("WeatherGPT cache: Redis connected at %s", settings.REDIS_URL)
            return c
        except Exception as exc:
            logger.warning("Redis unavailable (%s); falling back to in-memory cache.", exc)
    logger.info("WeatherGPT cache: using in-memory TTLCache (max 512 entries, TTL %ds)",
                settings.WEATHER_CACHE_TTL_SECONDS)
    return InMemoryTTLCache(default_ttl=settings.WEATHER_CACHE_TTL_SECONDS)


# Singleton cache instance — import this everywhere
cache = _build_cache()
