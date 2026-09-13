"""
WeatherGPT — Database Setup
────────────────────────────
• SQLite for local development (default)
• PostgreSQL for production (set DATABASE_URL=postgresql://... in .env)
• Connection pooling enabled for PostgreSQL to handle concurrent users
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config.settings import settings

# ── Engine configuration ───────────────────────────────────────────────────────

def _build_engine():
    url = settings.DATABASE_URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    if url.startswith("sqlite"):
        # SQLite: single-writer, allow multi-threaded reads
        engine = create_engine(
            url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
        # Enable WAL mode for better concurrent read performance on SQLite
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_conn, _):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=-64000")  # 64 MB page cache
            cursor.close()

        return engine

    elif url.startswith("postgresql"):
        # PostgreSQL: full connection pooling for concurrent users
        return create_engine(
            url,
            pool_size=10,           # Keep 10 connections open
            max_overflow=20,        # Allow up to 20 overflow under load
            pool_timeout=30,        # Wait up to 30s for a free connection
            pool_recycle=1800,      # Recycle connections after 30 min
            pool_pre_ping=True,     # Verify connection health before use
        )

    else:
        # Generic fallback
        return create_engine(url, pool_pre_ping=True)


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and ensures it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and perform non-destructive schema migrations."""
    Base.metadata.create_all(bind=engine)
    if settings.DATABASE_URL.startswith("sqlite"):
        try:
            with engine.begin() as conn:
                # users
                user_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()]
                if user_cols:
                    if "is_active" not in user_cols:
                        conn.exec_driver_sql("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
                    if "last_login" not in user_cols:
                        conn.exec_driver_sql("ALTER TABLE users ADD COLUMN last_login DATETIME")

                # official_alerts
                alert_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(official_alerts)").fetchall()]
                if alert_cols:
                    if "expires_at" not in alert_cols:
                        conn.exec_driver_sql("ALTER TABLE official_alerts ADD COLUMN expires_at DATETIME")
                    if "is_active" not in alert_cols:
                        conn.exec_driver_sql("ALTER TABLE official_alerts ADD COLUMN is_active BOOLEAN DEFAULT 1")

                # weather_cache
                cache_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(weather_cache)").fetchall()]
                if cache_cols and "ttl_expires_at" not in cache_cols:
                    conn.exec_driver_sql("ALTER TABLE weather_cache ADD COLUMN ttl_expires_at DATETIME")

                # chat_sessions
                session_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(chat_sessions)").fetchall()]
                if session_cols and "user_id" not in session_cols:
                    conn.exec_driver_sql("ALTER TABLE chat_sessions ADD COLUMN user_id INTEGER")

                # chat_messages
                chat_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(chat_messages)").fetchall()]
                if chat_cols and "metadata_json" not in chat_cols:
                    conn.exec_driver_sql("ALTER TABLE chat_messages ADD COLUMN metadata_json TEXT")

                # emergency_locations
                loc_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(emergency_locations)").fetchall()]
                if loc_cols:
                    if "is_active" not in loc_cols:
                        conn.exec_driver_sql("ALTER TABLE emergency_locations ADD COLUMN is_active BOOLEAN DEFAULT 1")
                    if "available_capacity" not in loc_cols:
                        conn.exec_driver_sql("ALTER TABLE emergency_locations ADD COLUMN available_capacity INTEGER")
                    if "is_accepting" not in loc_cols:
                        conn.exec_driver_sql("ALTER TABLE emergency_locations ADD COLUMN is_accepting BOOLEAN DEFAULT 1")
                    if "updated_at" not in loc_cols:
                        conn.exec_driver_sql("ALTER TABLE emergency_locations ADD COLUMN updated_at DATETIME")
        except Exception as e:
            print(f"[DB] SQLite migration note: {e}")


# Initialize schema on startup / test import
init_db()


