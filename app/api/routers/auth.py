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

    # return token in body (for web/PWA) and set cookie (for native)
    response = JSONResponse(content={"message": "login successful", "access_token": access_token, "token_type": "bearer"})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",   # Keep cookie behavior for native/local
        secure=False,     # Overridden in prod by reverse proxy or settings if needed
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
    )
    return response
