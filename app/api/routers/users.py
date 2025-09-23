
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
import logging
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import os
import uuid

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


@router.post(
    "/me/profile-picture",
    name="Upload profile picture",
    description="Upload a profile picture for the current user.",
)
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Upload a profile picture for the current user."""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Validate file size (max 5MB)
        file_content = await file.read()
        if len(file_content) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 5MB"
            )
        
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/profile_pictures"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{user.id}_{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Update user profile picture URL
        profile_picture_url = f"/uploads/profile_pictures/{unique_filename}"
        user.profile_picture_url = profile_picture_url
        user.profile_picture_updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(user)
        
        return {
            "message": "Profile picture uploaded successfully",
            "profile_picture_url": profile_picture_url
        }
        
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in upload profile picture")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to upload profile picture at this time."
        )


@router.delete(
    "/me/profile-picture",
    name="Delete profile picture",
    description="Delete the current user's profile picture.",
)
async def delete_profile_picture(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user),
):
    """Delete the current user's profile picture."""
    try:
        if not user.profile_picture_url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No profile picture found"
            )
        
        # Remove file from filesystem
        file_path = user.profile_picture_url.lstrip('/')
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Update user record
        user.profile_picture_url = None
        user.profile_picture_updated_at = None
        
        db.commit()
        db.refresh(user)
        
        return {"message": "Profile picture deleted successfully"}
        
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in delete profile picture")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete profile picture at this time."
        )


@router.get(
    "/{user_id}/statistics",
    name="Get user statistics",
    description="Get match statistics for a specific user with optional filtering.",
)
async def get_user_statistics(
    user_id: int,
    match_type: Optional[str] = Query(None, description="Filter by match type: casual, tournament, or all"),
    player_ids: Optional[str] = Query(None, description="Comma-separated list of player IDs to filter by"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get match statistics for a user with optional filtering"""
    try:
        # Check if user exists
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Parse player filter
        player_filter_ids = []
        if player_ids:
            try:
                player_filter_ids = [int(pid.strip()) for pid in player_ids.split(',') if pid.strip()]
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid player IDs format"
                )
        
        # Get statistics from matches
        from app.models.models import Match
        from sqlalchemy import and_, or_
        
        # Base query for matches involving the user
        base_query = db.query(Match).filter(
            or_(
                Match.player1_id == user_id,
                Match.player2_id == user_id
            )
        )
        
        # Apply match type filter
        if match_type == "casual":
            base_query = base_query.filter(Match.tournament_id.is_(None))
        elif match_type == "tournament":
            base_query = base_query.filter(Match.tournament_id.isnot(None))
        # "all" or None means no filter
        
        # Apply player filter
        if player_filter_ids:
            base_query = base_query.filter(
                or_(
                    and_(Match.player1_id == user_id, Match.player2_id.in_(player_filter_ids)),
                    and_(Match.player2_id == user_id, Match.player1_id.in_(player_filter_ids))
                )
            )
        
        matches = base_query.all()
        
        # Calculate statistics
        total_matches = len(matches)
        wins = 0
        losses = 0
        
        for match in matches:
            # Determine winner based on scores
            if match.player1_score > match.player2_score:
                winner_id = match.player1_id
            elif match.player2_score > match.player1_score:
                winner_id = match.player2_id
            else:
                winner_id = None  # Draw
            
            if winner_id == user_id:
                wins += 1
            elif winner_id is not None:  # Match has a winner (not a draw)
                losses += 1
        
        win_rate = (wins / total_matches * 100) if total_matches > 0 else 0
        
        return {
            "user_id": user_id,
            "username": target_user.username,
            "total_matches": total_matches,
            "wins": wins,
            "losses": losses,
            "win_rate": round(win_rate, 1),
            "filters": {
                "match_type": match_type or "all",
                "player_ids": player_filter_ids
            }
        }
        
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in get user statistics")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch statistics at this time."
        )
