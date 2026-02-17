"""
Authentication routes for the ADM Platform.
Simple JWT-based auth with admin vs ADM roles.
"""

from datetime import datetime, timedelta
from typing import Optional

import hashlib

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import get_db
from models import User, ADM
from config import settings
from schemas import LoginRequest, LoginResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

security = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using simple SHA-256 hash (demo only)."""
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password


def get_password_hash(password: str) -> str:
    """Hash password using simple SHA-256 (demo only)."""
    return hashlib.sha256(password.encode()).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    # jose requires 'sub' to be a string
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Get current user from JWT token. Returns None if no token or invalid token."""
    if credentials is None:
        return None
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        user = db.query(User).filter(User.id == int(user_id_str)).first()
        return user
    except (JWTError, ValueError):
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get current user from JWT token. Raises 401 if not authenticated."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = db.query(User).filter(User.id == int(user_id_str)).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = create_access_token(
        data={"sub": user.id, "role": user.role, "adm_id": user.adm_id}
    )

    return LoginResponse(
        token=token,
        user={
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "role": user.role,
            "adm_id": user.adm_id,
        },
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user


@router.post("/seed-users")
def seed_users(db: Session = Depends(get_db)):
    """Create demo users (for setup). Idempotent."""
    demo_users = [
        {"username": "admin", "password": "admin123", "role": "admin", "name": "Platform Admin", "adm_id": None},
        {"username": "rakesh", "password": "demo123", "role": "adm", "name": "Rajiv Malhotra", "adm_id": 1},
        {"username": "priyanka", "password": "demo123", "role": "adm", "name": "Priyanka Kapoor", "adm_id": 2},
        {"username": "suresh", "password": "demo123", "role": "adm", "name": "Suresh Venkataraman", "adm_id": 3},
    ]

    created = 0
    for u in demo_users:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            user = User(
                username=u["username"],
                password_hash=get_password_hash(u["password"]),
                role=u["role"],
                name=u["name"],
                adm_id=u["adm_id"],
            )
            db.add(user)
            created += 1

    db.commit()
    return {"message": f"Created {created} users", "total_users": db.query(User).count()}
