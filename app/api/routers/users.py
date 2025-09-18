
from fastapi import APIRouter, Depends, HTTPException, status
import logging
from sqlalchemy.orm import Session

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.core.authorize import authorize
from app.models.models import User
from app.schemas.schemas import UserCreate, UserUpdate, UserResponse
from app.services.user_service import (
    get_all_users, create_user, get_user_with_id, 
    update_user_with_id, get_user_me, delete_user_with_id
)

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger("app.routers.users")


@router.get(
    "/me",
    name="Get current user",
    description="Return the authenticated user's own profile.",
    response_model=UserResponse,
)
async def home(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    authorize(user, db, ["users_can_view_user_list"])
    try:
        result = get_user_me(user=user, db=db)
        return UserResponse(**result)
    except Exception:
        logger.exception("Unexpected error in /me")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch your profile at this time."
        )


@router.get(
    "",
    name="List users",
    description="Return a list of all users.",
    response_model=list[dict],
)
def users_get(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    authorize(user, db, ["users_can_view_user_list"])
    try:
        return get_all_users(db=db)
    except Exception:
        logger.exception("Unexpected error in list users")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch users at this time."
        )


@router.post(
    "",
    name="Create user",
    description="Create a new user.",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
def users_post(
    userCreate: UserCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    authorize(user, db, ["users_can_create_user"])
    try:
        return create_user(db=db, user_create=userCreate)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception:
        logger.exception("Unexpected error in create user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create user at this time."
        )


@router.get(
    "/{user_id}",
    name="Get user by ID",
    description="Fetch a single user by their ID.",
    response_model=dict,
)
def users_get_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    authorize(user, db, ["users_can_view_user_list"])
    try:
        return get_user_with_id(user_id=user_id, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception:
        logger.exception(f"Unexpected error in get user id={user_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch user at this time."
        )


@router.put(
    "/{user_id}",
    name="Update user",
    description="Update an existing user by their ID.",
    response_model=dict,
)
def users_update(
    user_id: int,
    userUpdate: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    # Users can edit their own profile, admins can edit any user
    if user_id != user.id:
        authorize(user, db, ["users_can_edit_other_users"])
    try:
        return update_user_with_id(user_id=user_id, user_update=userUpdate, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception:
        logger.exception(f"Unexpected error in update user id={user_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update user at this time."
        )


@router.put(
    "/me",
    name="Update my profile",
    description="Update current user's own profile.",
    response_model=dict,
)
def update_my_profile(
    userUpdate: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    try:
        return update_user_with_id(user_id=user.id, user_update=userUpdate, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception:
        logger.exception(f"Unexpected error in update my profile")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update profile at this time."
        )


@router.delete(
    "/{user_id}",
    name="Delete user",
    description="Delete a user by their ID.",
    response_model=dict,
)
def users_delete(
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    authorize(user, db, ["users_can_edit_other_users"])
    try:
        return delete_user_with_id(user_id=user_id, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception:
        logger.exception(f"Unexpected error in delete user id={user_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete user at this time."
        )
