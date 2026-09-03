"""
WeatherGPT — Auth Routes
────────────────────────
Security upgrades (Tier 1):
  • Passwords hashed with bcrypt via passlib (was SHA-256 + hardcoded salt)
  • Real HS256 JWT access + refresh tokens via python-jose (was fake wgpt_<id>_<hex>)
  • /auth/refresh endpoint for silent token renewal
  • get_current_user() FastAPI dependency for protected routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import secrets

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.database import get_db
from app.models.models import User
from app.config.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])

import bcrypt

# ── Password hashing ──────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except Exception:
        return False


# ── JWT helpers ───────────────────────────────────────────────────────────────
def _create_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: int, role: str) -> str:
    return _create_token(
        {"sub": str(user_id), "role": role, "type": "access"},
        timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int) -> str:
    return _create_token(
        {"sub": str(user_id), "type": "refresh"},
        timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
    )


def _create_guest_token(role: str) -> str:
    """Guest tokens are short-lived JWTs with sub='guest'."""
    return _create_token(
        {"sub": "guest", "role": role, "type": "guest"},
        timedelta(hours=12),
    )


# ── FastAPI dependency: get current user from Bearer token ────────────────────
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> dict:
    """Validates JWT and returns a dict with user info.  Raises 401 on failure."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exc
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise credentials_exc

    token_type = payload.get("type")
    sub = payload.get("sub")

    if token_type == "guest":
        return {"id": None, "email": "guest@weathergpt.local", "role": payload.get("role", "general"), "is_guest": True}

    if token_type != "access" or not sub:
        raise credentials_exc

    user = db.query(User).filter(User.id == int(sub)).first()
    if not user:
        raise credentials_exc

    return {"id": user.id, "email": user.email, "name": user.name, "role": user.role, "is_guest": False}


# ── Pydantic schemas ──────────────────────────────────────────────────────────
class UserRegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: Optional[str] = "general"


class UserLoginRequest(BaseModel):
    email: str
    password: str


class GuestLoginRequest(BaseModel):
    role: Optional[str] = "general"
    name: Optional[str] = "Guest Explorer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: Optional[int] = None
    email: str
    name: str
    role: str
    is_guest: bool = False
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: UserOut
    token: str
    refresh_token: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────────────────────
VALID_ROLES = {"general", "traveller", "farmer", "disaster", "school"}


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    if not req.email or not req.password or not req.name:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")

    clean_email = req.email.strip().lower()
    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    user_role = req.role if req.role in VALID_ROLES else "general"
    new_user = User(
        email=clean_email,
        hashed_password=hash_password(req.password),
        name=req.name.strip(),
        role=user_role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access = create_access_token(new_user.id, new_user.role)
    refresh = create_refresh_token(new_user.id)

    return AuthResponse(
        success=True,
        message="Account created successfully!",
        user=UserOut(
            id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            role=new_user.role,
            is_guest=False,
            created_at=new_user.created_at.isoformat() if new_user.created_at else None,
        ),
        token=access,
        refresh_token=refresh,
    )


@router.post("/login", response_model=AuthResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    access = create_access_token(user.id, user.role)
    refresh = create_refresh_token(user.id)

    return AuthResponse(
        success=True,
        message="Signed in successfully!",
        user=UserOut(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            is_guest=False,
            created_at=user.created_at.isoformat() if user.created_at else None,
        ),
        token=access,
        refresh_token=refresh,
    )


@router.post("/guest", response_model=AuthResponse)
def guest_login(req: GuestLoginRequest = GuestLoginRequest()):
    role = req.role if req.role in VALID_ROLES else "general"
    display_name = req.name or "Guest Explorer"

    return AuthResponse(
        success=True,
        message="Guest session initialized.",
        user=UserOut(
            id=None,
            email="guest@weathergpt.local",
            name=display_name,
            role=role,
            is_guest=True,
            created_at=datetime.utcnow().isoformat(),
        ),
        token=_create_guest_token(role),
        refresh_token=None,
    )


@router.post("/refresh", response_model=AuthResponse)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    """Issue a new access token using a valid refresh token."""
    credentials_exc = HTTPException(status_code=401, detail="Invalid or expired refresh token.")
    try:
        payload = jwt.decode(req.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise credentials_exc

    if payload.get("type") != "refresh":
        raise credentials_exc

    sub = payload.get("sub")
    if not sub:
        raise credentials_exc

    user = db.query(User).filter(User.id == int(sub)).first()
    if not user:
        raise credentials_exc

    access = create_access_token(user.id, user.role)
    new_refresh = create_refresh_token(user.id)

    return AuthResponse(
        success=True,
        message="Token refreshed.",
        user=UserOut(id=user.id, email=user.email, name=user.name, role=user.role, is_guest=False),
        token=access,
        refresh_token=new_refresh,
    )


@router.get("/me")
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Return profile of the currently authenticated user."""
    return {"authenticated": True, "user": current_user}
