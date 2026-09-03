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
