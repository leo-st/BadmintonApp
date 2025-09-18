
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Optional

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.core.authorize import authorize
from app.models.models import Match, User
from app.schemas.schemas import MatchCreate, MatchResponse, MatchVerification
from app.common.enums import MatchStatus, MatchType

router = APIRouter(prefix="/matches", tags=["matches"])

@router.post("", response_model=MatchResponse)
def create_match(
    match: MatchCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    authorize(current_user, db, ["matches_can_create"])
    # Verify both players exist
    player1 = db.query(User).filter(User.id == match.player1_id).first()
    player2 = db.query(User).filter(User.id == match.player2_id).first()

    if not player1 or not player2:
        raise HTTPException(status_code=400, detail="One or both players not found")

    if player1.id == player2.id:
        raise HTTPException(status_code=400, detail="Player cannot play against themselves")

    # Create match
    db_match = Match(
        **match.dict(),
        submitted_by_id=current_user.id
    )
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

@router.get("", response_model=list[MatchResponse])
def read_matches(
    skip: int = 0,
    limit: int = 100,
    match_type: Optional[str] = Query(None, description="Filter by match type: casual or tournament"),
    status: Optional[str] = Query(None, description="Filter by status: pending_verification, verified, or rejected"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    authorize(current_user, db, ["matches_can_view_all"])
    query = db.query(Match)

    # Only filter if match_type is provided and not empty
    if match_type and match_type != "":
        try:
            # Convert string to enum for proper filtering
            match_type_enum = MatchType(match_type.lower())
            query = query.filter(Match.match_type == match_type_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid match_type: {match_type}. Valid values: casual, tournament")
    
    # Only filter if status is provided and not empty
    if status and status != "":
        try:
            # Convert string to enum for proper filtering
            status_enum = MatchStatus(status.lower())
            query = query.filter(Match.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}. Valid values: pending_verification, verified, rejected")

    matches = query.offset(skip).limit(limit).all()
    return matches

@router.get("/{match_id}", response_model=MatchResponse)
def read_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@router.post("/{match_id}/verify", response_model=MatchResponse)
def verify_match(
    match_id: int,
    verification: MatchVerification,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    authorize(current_user, db, ["matches_can_verify"])
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Check if user can verify this match
    if not match.can_user_verify(current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You cannot verify this match"
        )

    # Verify the match
    if not match.verify_by_user(current_user.id, verification.verified):
        raise HTTPException(
            status_code=400,
            detail="Failed to verify match"
        )

    if verification.notes:
        match.notes = verification.notes

    db.commit()
    db.refresh(match)
    return match

@router.get("/{match_id}/verification-status", response_model=dict)
def get_verification_status(
    match_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get verification status and requirements for a match"""
    authorize(current_user, db, ["matches_can_view_all"])
    
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    requirements = match.get_verification_requirements()
    
    return {
        "match_id": match.id,
        "player1_verified": match.player1_verified,
        "player2_verified": match.player2_verified,
        "player1_needs_verification": requirements["player1_needs_verification"],
        "player2_needs_verification": requirements["player2_needs_verification"],
        "submitted_by_player": requirements["submitted_by_player"],
        "is_fully_verified": match.is_fully_verified(),
        "can_current_user_verify": match.can_user_verify(current_user.id)
    }
