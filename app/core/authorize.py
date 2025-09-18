from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.models import User


def authorize(user: User, db: Session, required_permissions: list[str]) -> None:
    """
    Authorize user to perform action based on required permissions.
    User must have ALL required permissions.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Get user's permissions using the existing method
    user_permissions = user.get_permissions(db)

    if not all(perm in user_permissions for perm in required_permissions):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have the necessary permissions"
        )
