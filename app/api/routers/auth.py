from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import UserLogin
from app.core.auth import create_access_token, get_current_user
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login")
async def authenticate(
    user_login: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Verify login details and issue JWT in an HttpOnly cookie.
    """
    user = User.authenticate(db, username=user_login.username, password=user_login.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # create JWT
    expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=user.username,
        expires_delta=expires,
    )

    # Use ONLY httpOnly cookies for authentication (no token in response body)
    response = JSONResponse(content={"message": "login successful"})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax" if not settings.is_production else "none",
        secure=settings.is_production,  # Use secure only in production
        path="/",          # Ensure cookie is available for all paths
        max_age=settings.access_token_expire_minutes * 60
    )
    return response

@router.post("/logout")
async def logout(
    _user = Depends(get_current_user),  # ensure only authenticated users can log out
):
    """
    Clear the auth cookie.
    """
    response = JSONResponse(content={"message": "logout successful"})
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="lax" if not settings.is_production else "none",
        secure=settings.is_production
    )
    return response

@router.get("/debug/users")
async def debug_users(db: Session = Depends(get_db)):
    """Debug endpoint to check users in database"""
    from app.core.auth import get_password_hash
    users = db.query(User).all()
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "role_id": user.role_id,
            "hash_preview": user.hashed_password[:50] + "..." if user.hashed_password else None
        })
    
    # Also test password hashing
    test_hash = get_password_hash("password123")
    
    return {
        "users": result,
        "test_hash_preview": test_hash[:50] + "...",
        "total_users": len(result)
    }
