"""
WeatherGPT — Analytics Routes
───────────────────────────────
Lightweight analytics endpoints for product insights:

  GET /api/analytics/summary        — overview stats
  GET /api/analytics/popular-cities — top queried cities (last 7 days)
  GET /api/analytics/active-users   — registered vs guest session counts
  GET /api/analytics/alert-history  — recent official alerts
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from app.database import get_db
from app.models.models import WeatherCache, OfficialAlert, User, QueryLog

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def analytics_summary(db: Session = Depends(get_db)):
    """High-level product metrics: users, caches, alerts."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_cache_entries = db.query(func.count(WeatherCache.id)).scalar() or 0
    total_alerts = db.query(func.count(OfficialAlert.id)).scalar() or 0

    # Alerts in the last 24 hours
    since_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_alerts = (
        db.query(func.count(OfficialAlert.id))
        .filter(OfficialAlert.created_at >= since_24h)
        .scalar() or 0
    )

    # Query log stats (if table exists)
    total_queries = 0
    try:
        total_queries = db.query(func.count(QueryLog.id)).scalar() or 0
    except Exception:
        pass

    return {
        "total_registered_users": total_users,
        "total_weather_cache_entries": total_cache_entries,
        "total_official_alerts": total_alerts,
        "alerts_last_24h": recent_alerts,
        "total_ai_queries_logged": total_queries,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/popular-cities")
def popular_cities(limit: int = 10, db: Session = Depends(get_db)):
    """Return the most queried cities based on QueryLog (with fallback to WeatherCache)."""
    try:
        results = (
            db.query(QueryLog.city, func.count(QueryLog.id).label("query_count"))
            .group_by(QueryLog.city)
            .order_by(desc("query_count"))
            .limit(limit)
            .all()
        )
        return {
            "popular_cities": [{"city": r.city, "query_count": r.query_count} for r in results],
            "source": "query_log",
        }
    except Exception:
        # Fallback: use WeatherCache update times as a proxy for interest
        cached = (
            db.query(WeatherCache.location, WeatherCache.updated_at)
            .order_by(desc(WeatherCache.updated_at))
            .limit(limit)
            .all()
        )
        return {
            "popular_cities": [
                {"city": r.location, "last_queried": r.updated_at.isoformat() if r.updated_at else None}
                for r in cached
            ],
            "source": "weather_cache_fallback",
        }


@router.get("/active-users")
def active_users(db: Session = Depends(get_db)):
    """Return registered user count and recently active users (last 30 min)."""
    total = db.query(func.count(User.id)).scalar() or 0
    since_30m = datetime.now(timezone.utc) - timedelta(minutes=30)

    # Recent queries as a proxy for active sessions
    active_count = 0
    try:
        active_count = (
            db.query(func.count(func.distinct(QueryLog.user_identifier)))
            .filter(QueryLog.created_at >= since_30m)
            .scalar() or 0
        )
    except Exception:
        pass

    return {
        "total_registered_users": total,
        "active_sessions_last_30min": active_count,
        "as_of": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/alert-history")
def alert_history(days: int = 7, limit: int = 50, db: Session = Depends(get_db)):
    """Return recent official alerts within the given number of days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    alerts = (
        db.query(OfficialAlert)
        .filter(OfficialAlert.created_at >= since)
        .order_by(desc(OfficialAlert.created_at))
        .limit(limit)
        .all()
    )

    return {
        "period_days": days,
        "total_alerts": len(alerts),
        "alerts": [
            {
                "id": a.id,
                "location": a.location,
                "severity": a.severity,
                "title": a.title,
                "description": a.description,
                "expected_period": a.expected_period,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ],
    }
