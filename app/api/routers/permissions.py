from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.core.authorize import authorize
from app.models.models import User
from app.services.user_service import get_all_permissions, get_all_permission_groups

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get(
    "/",
    name="List permissions",
    description="Return a list of all permissions.",
    response_model=List[dict],
)
def get_permissions(
    db: Session = Depends(get_db),
    auth: User = Depends(get_current_active_user),
):
    authorize(auth, db, ["users_can_view_user_list"])
    try:
        return get_all_permissions(db=db)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch permissions at this time.",
        )


@router.get(
    "/groups",
    name="List permission groups",
    description="Return a list of all permission groups.",
    response_model=List[dict],
)
def get_permission_groups(
    db: Session = Depends(get_db),
    auth: User = Depends(get_current_active_user),
):
    authorize(auth, db, ["users_can_view_user_list"])
    try:
        return get_all_permission_groups(db=db)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch permission groups at this time.",
        )
