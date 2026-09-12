# WeatherGPT — Authentication & Security Architecture

## 1. Credentials & Token Lifecycle
- **Password Security**: Passwords hashed using salted BCrypt (`bcrypt.hashpw` with salt rounds). Plaintext passwords are never logged or stored.
- **JWT Architecture**:
  - Access Token: HS256 algorithm, 60-minute expiration (`settings.JWT_EXPIRE_MINUTES`).
  - Refresh Token: 7-day expiration (`settings.JWT_REFRESH_EXPIRE_DAYS`).
  - Guest Token: 12-hour expiration for Smart India Hackathon jury evaluations without mandatory registration.
- **Token Blacklisting**: JTI values of logged-out tokens stored in `revoked_tokens` table to prevent replay attacks.

## 2. Protected Routes & Authorization
- FastAPI dependency `get_current_user` enforces `Authorization: Bearer <token>` on `/api/auth/me`, `/api/auth/logout`, and `/api/user/preferences`.
- Cross-user data isolation: Saved locations and preferences are filtered strictly by `user_id`.
