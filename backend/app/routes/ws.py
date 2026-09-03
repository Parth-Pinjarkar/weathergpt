"""
WeatherGPT — WebSocket Routes
───────────────────────────────
Provides two real-time WebSocket endpoints:

  • /api/ws/alerts          — broadcasts live disaster alerts to ALL connected clients
  • /api/ws/weather/{city}  — pushes weather refresh every PUSH_INTERVAL_SECONDS

Connection Manager:
  • Tracks all active connections
  • Allows targeted (city) or global (broadcast) messages
  • Auto-cleans disconnected sockets

Authentication (optional):
  • Clients may pass ?token=<jwt> query param; invalid tokens still connect
    as guests (weather data is public; alerts are too)
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])

PUSH_INTERVAL_SECONDS = 300  # 5 minutes between weather refreshes


# ── Connection Manager ────────────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        # city_key → list of WebSocket connections
        self._city_connections: Dict[str, List[WebSocket]] = {}
        # All connections (for global broadcasts)
        self._all: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, city: str = "global"):
        await websocket.accept()
        self._all.append(websocket)
        self._city_connections.setdefault(city, []).append(websocket)
        logger.info("WS connected: city=%s  total=%d", city, len(self._all))

    def disconnect(self, websocket: WebSocket, city: str = "global"):
        self._all = [ws for ws in self._all if ws is not websocket]
        if city in self._city_connections:
            self._city_connections[city] = [
                ws for ws in self._city_connections[city] if ws is not websocket
            ]
        logger.info("WS disconnected: city=%s  total=%d", city, len(self._all))

    async def broadcast(self, message: dict):
        """Send a message to ALL connected clients."""
        dead = []
        for ws in list(self._all):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._all = [x for x in self._all if x is not ws]

    async def send_to_city(self, city: str, message: dict):
        """Send a message to clients subscribed to a specific city."""
        conns = self._city_connections.get(city, [])
        dead = []
        for ws in list(conns):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        if dead:
            self._city_connections[city] = [c for c in conns if c not in dead]

    @property
    def active_connections_count(self) -> int:
        return len(self._all)

    @property
    def active_cities(self) -> List[str]:
        return [city for city, conns in self._city_connections.items() if conns]


manager = ConnectionManager()


def _build_weather_push(city: str, data: dict) -> dict:
    return {
        "type": "weather_update",
        "city": city,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }


def _build_alert_broadcast(alert: dict) -> dict:
    return {
        "type": "alert",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "alert": alert,
    }


# ── WebSocket: Global Alerts ──────────────────────────────────────────────────

@router.websocket("/alerts")
async def alerts_websocket(websocket: WebSocket, token: str = Query(default=None)):
    """
    Connect to receive real-time disaster alert broadcasts.
    Send JSON ping: {"type": "ping"} → server replies with {"type": "pong"}
    """
    await manager.connect(websocket, city="global")
    try:
        # Send welcome frame
        await websocket.send_json({
            "type": "connected",
            "message": "WeatherGPT real-time alerts active.",
            "active_connections": manager.active_connections_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Keep alive — process incoming pings
        while True:
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
                msg = json.loads(raw)
                if msg.get("type") == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
            except asyncio.TimeoutError:
                # Send heartbeat to detect stale connections
                await websocket.send_json({"type": "heartbeat"})
            except (json.JSONDecodeError, KeyError):
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket, city="global")


# ── WebSocket: Per-City Weather Push ─────────────────────────────────────────

@router.websocket("/weather/{city}")
async def weather_websocket(websocket: WebSocket, city: str, token: str = Query(default=None)):
    """
    Subscribe to real-time weather updates for a specific city.
    Weather data is pushed every PUSH_INTERVAL_SECONDS (5 min).
    Send: {"type": "ping"} → {"type": "pong"}
    Send: {"type": "refresh"} → immediate weather data push
    """
    city_key = city.lower().strip()
    await manager.connect(websocket, city=city_key)

    try:
        # Lazy import to avoid circular deps
        from app.services.weather_service import get_weather, normalize_city_name
        from app.database import SessionLocal

        # Send immediate weather data on connect
        db = SessionLocal()
        try:
            normalized = normalize_city_name(city_key)
            weather_data = get_weather(db, normalized)
            await websocket.send_json(_build_weather_push(city_key, weather_data))
        except Exception as exc:
            logger.warning("Initial weather push failed for %s: %s", city_key, exc)
            await websocket.send_json({
                "type": "error",
                "message": f"Could not load weather for {city}",
            })
        finally:
            db.close()

        # Periodic push loop
        while True:
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=float(PUSH_INTERVAL_SECONDS))
                msg = json.loads(raw)

                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})

                elif msg.get("type") == "refresh":
                    db = SessionLocal()
                    try:
                        normalized = normalize_city_name(city_key)
                        weather_data = get_weather(db, normalized)
                        await websocket.send_json(_build_weather_push(city_key, weather_data))
                    finally:
                        db.close()

            except asyncio.TimeoutError:
                # Push interval elapsed — send updated weather
                db = SessionLocal()
                try:
                    normalized = normalize_city_name(city_key)
                    weather_data = get_weather(db, normalized)
                    await websocket.send_json(_build_weather_push(city_key, weather_data))
                except Exception as exc:
                    logger.warning("Periodic weather push failed for %s: %s", city_key, exc)
                    await websocket.send_json({"type": "heartbeat"})
                finally:
                    db.close()

            except (json.JSONDecodeError, KeyError):
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket, city=city_key)


# ── Internal helper — push an alert to all clients ────────────────────────────

async def broadcast_alert(alert: dict):
    """Call this from background tasks or route handlers to push an alert globally."""
    await manager.broadcast(_build_alert_broadcast(alert))


# ── Stats endpoint (REST) ─────────────────────────────────────────────────────

@router.get("/stats")
def websocket_stats():
    return {
        "active_connections": manager.active_connections_count,
        "subscribed_cities": manager.active_cities,
    }
