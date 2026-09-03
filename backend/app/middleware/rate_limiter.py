"""
WeatherGPT — Rate Limiting Middleware
──────────────────────────────────────
Uses slowapi (Starlette-compatible limiter backed by limits library).

Tiers (applied per client IP):
  • Default (unauthenticated / guest) : 30 requests / minute
  • Authenticated registered users    : 60 requests / minute
  • Admin / internal                  : 200 requests / minute

Integration in main.py:
    from app.middleware.rate_limiter import limiter, rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

Usage on a route:
    from app.middleware.rate_limiter import limiter
    from fastapi import Request

    @router.get("/weather/{city}")
    @limiter.limit("60/minute")
    async def get_weather(request: Request, city: str):
        ...
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse


def _key_func(request: Request) -> str:
    """Rate-limit key: prefer X-Forwarded-For (behind proxy), fall back to direct IP."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return get_remote_address(request)


# Global limiter instance
limiter = Limiter(
    key_func=_key_func,
    default_limits=["30/minute"],
    storage_uri="memory://",  # Swap to "redis://..." if REDIS_URL is set
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Return a user-friendly 429 response when rate limit is hit."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": f"Too many requests. {exc.detail}. Please slow down.",
            "retry_after_seconds": 60,
        },
        headers={"Retry-After": "60"},
    )
