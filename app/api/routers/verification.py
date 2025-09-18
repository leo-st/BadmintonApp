from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from typing import List

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.core.authorize import authorize
from app.models.models import Match, User
from app.schemas.schemas import MatchResponse
from app.common.enums import MatchStatus

router = APIRouter(prefix="/verification", tags=["verification"])

@router.get("/test")
def test_endpoint():
    """Test endpoint to verify router is working"""
    return {"message": "verification router is working"}

@router.get("/pending-verification", response_model=List[MatchResponse])
def get_pending_verifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get matches that need verification by the current user"""
    authorize(current_user, db, ["matches_can_verify"])
    
    # Get all matches where the current user is a player and needs to verify
    # Use selectinload for better performance with multiple relationships
    matches = db.query(Match).options(
        selectinload(Match.player1),
        selectinload(Match.player2),
        selectinload(Match.submitted_by)
    ).filter(
        Match.status == MatchStatus.PENDING_VERIFICATION,
        (
            (Match.player1_id == current_user.id) |
            (Match.player2_id == current_user.id)
        )
    ).all()
    
    # Filter matches where user can actually verify
    verifiable_matches = []
    for match in matches:
        if match.can_user_verify(current_user.id):
            verifiable_matches.append(match)
    
    return verifiable_matches
