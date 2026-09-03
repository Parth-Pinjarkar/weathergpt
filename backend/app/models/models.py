"""
WeatherGPT — SQLAlchemy ORM Models
────────────────────────────────────
Tier 1 additions:
  • User.last_login, User.is_active for account lifecycle management
  • WeatherCache.ttl_expires_at for explicit TTL-based cache invalidation
  • EmergencyLocation model — replaces hardcoded list in emergency.py
  • RevokedToken model — supports JWT token blacklisting on sign-out
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


# ── Weather Cache ─────────────────────────────────────────────────────────────
class WeatherCache(Base):
    __tablename__ = "weather_cache"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(100), unique=True, index=True, nullable=False)
    data = Column(Text, nullable=False)          # JSON-serialised weather data
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ttl_expires_at = Column(DateTime, nullable=True)  # Explicit expiry for cache invalidation


# ── Chat ──────────────────────────────────────────────────────────────────────
class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)   # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(Text, nullable=True)  # Optional JSON details (weather/risk cards, sources)

    session = relationship("ChatSession", back_populates="messages")


# ── Official Alerts ───────────────────────────────────────────────────────────
class OfficialAlert(Base):
    __tablename__ = "official_alerts"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(100), index=True, nullable=False)
    severity = Column(String(20), nullable=False)   # 'SEVERE', 'WARNING', 'WATCH', 'INFORMATION'
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    expected_period = Column(String(100), nullable=True)
    impacts = Column(Text, nullable=True)           # JSON list
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)    # When alert auto-expires
    is_active = Column(Boolean, default=True)


# ── Users ─────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    name = Column(String(100), nullable=False)
    # Roles: 'general', 'traveller', 'farmer', 'disaster', 'school'
    role = Column(String(50), default="general", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── JWT Token Blacklist (for sign-out) ────────────────────────────────────────
class RevokedToken(Base):
    """Stores JWT JTI values that have been explicitly revoked (sign-out)."""
    __tablename__ = "revoked_tokens"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String(64), unique=True, index=True, nullable=False)
    revoked_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)   # Allows periodic cleanup


# ── Emergency Locations (DB-backed, replaces hardcoded list) ──────────────────
class EmergencyLocation(Base):
    """Emergency shelters, hospitals, and disaster bases — editable via API."""
    __tablename__ = "emergency_locations"

    id = Column(String(20), primary_key=True)       # e.g. 'loc-1'
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)   # 'Hospital', 'Shelter', 'Disaster Base'
    city = Column(String(100), nullable=False, index=True)
    address = Column(String(300), nullable=True)
    phone = Column(String(100), nullable=True)
    capacity = Column(String(150), nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    is_open_24x7 = Column(Boolean, default=True)
    distance_km = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    available_capacity = Column(Integer, nullable=True)  # Real-time available slots
    is_accepting = Column(Boolean, default=True)          # Currently accepting evacuees
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ── Analytics models ──────────────────────────────────────────────────────────

class QueryLog(Base):
    """Anonymized log of weather/chat queries — powers the popular-cities analytics."""
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String(100), nullable=False, index=True)
    city = Column(String(100), nullable=True, index=True)
    query_type = Column(String(50), nullable=False)  # 'weather', 'chat', 'route', 'simulation'
    persona = Column(String(50), nullable=True)
    language = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class UserSession(Base):
    """Tracks user login events for activity analytics."""
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    user_identifier = Column(String(100), nullable=False, index=True)
    role = Column(String(50), default="general")
    is_guest = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    last_active = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ip_address = Column(String(50), nullable=True)


class AlertHistory(Base):
    """Persists all triggered/simulated alerts for reporting."""
    __tablename__ = "alert_history"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(100), index=True, nullable=False)
    alert_type = Column(String(50), nullable=False)   # 'official', 'simulation', 'whatif'
    scenario = Column(String(100), nullable=True)
    severity = Column(String(20), nullable=False)
    risk_score = Column(Integer, nullable=True)
    triggered_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    metadata_json = Column(Text, nullable=True)

