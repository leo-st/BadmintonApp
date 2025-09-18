from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.core.authorize import authorize
from app.models.models import User
from app.schemas.schemas import UserMedalCounts
from app.services.medal_service import award_medals_for_tournament, get_user_medal_counts, get_tournament_medals

router = APIRouter(prefix="/medals", tags=["medals"])

@router.get("/user/{user_id}", response_model=UserMedalCounts)
def get_user_medals(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get medal counts for a specific user"""
    authorize(current_user, db, ["users_can_view_user_list"])
    return get_user_medal_counts(db, user_id)

@router.get("/me", response_model=UserMedalCounts)
def get_my_medals(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's medal counts"""
    return get_user_medal_counts(db, current_user.id)

@router.post("/tournament/{tournament_id}/award")
def award_tournament_medals(
    tournament_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Award medals for a completed tournament (admin only)"""
    authorize(current_user, db, ["tournaments_can_edit_all"])
    
    try:
        medals_awarded = award_medals_for_tournament(db, tournament_id)
        return {
            "message": "Medals awarded successfully",
            "medals_awarded": medals_awarded
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/tournament/{tournament_id}")
def get_tournament_medals(
    tournament_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all medals for a specific tournament"""
    authorize(current_user, db, ["tournaments_can_view_all"])
    return get_tournament_medals(db, tournament_id)
