
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case
from typing import Dict, Any

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.core.authorize import authorize
from app.models.models import Tournament, User, Match
from app.schemas.schemas import TournamentCreate, TournamentResponse
from app.common.enums import MatchStatus, TournamentStatus

router = APIRouter(prefix="/tournaments", tags=["tournaments"])

@router.post("", response_model=TournamentResponse)
def create_tournament(
    tournament: TournamentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    authorize(current_user, db, ["tournaments_can_create"])
    db_tournament = Tournament(**tournament.dict())
    db_tournament.status = TournamentStatus.INVITING.value  # Start in inviting status
    db.add(db_tournament)
    db.commit()
    db.refresh(db_tournament)
    return db_tournament

@router.get("", response_model=list[TournamentResponse])
def read_tournaments(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    from app.models.tournament_invitations import TournamentParticipant, TournamentInvitation
    
    # Query tournaments with participant and invitation counts
    # Use subqueries to avoid cross join issues
    query = db.query(
        Tournament,
        func.coalesce(func.count(func.distinct(TournamentParticipant.id)), 0).label('participant_count'),
        func.coalesce(func.count(func.distinct(TournamentInvitation.id)), 0).label('invitation_count')
    ).outerjoin(
        TournamentParticipant, 
        (Tournament.id == TournamentParticipant.tournament_id) & 
        (TournamentParticipant.is_active.is_(True))
    ).outerjoin(
        TournamentInvitation,
        Tournament.id == TournamentInvitation.tournament_id
    ).group_by(Tournament.id)
    
    if active_only:
        query = query.filter(Tournament.status == TournamentStatus.ACTIVE.value)

    tournaments_data = query.offset(skip).limit(limit).all()
    
    # Convert to response format
    result = []
    for tournament, participant_count, invitation_count in tournaments_data:
        tournament_dict = tournament.__dict__.copy()
        tournament_dict['participant_count'] = participant_count
        tournament_dict['invitation_count'] = invitation_count
        result.append(TournamentResponse(**tournament_dict))
    
    return result

@router.get("/public", response_model=list[TournamentResponse])
def read_public_tournaments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Public endpoint to view all tournaments (active and completed)"""
    from app.models.tournament_invitations import TournamentParticipant, TournamentInvitation
    
    # Query tournaments with participant and invitation counts
    # Use subqueries to avoid cross join issues
    tournaments = db.query(
        Tournament,
        func.coalesce(func.count(func.distinct(TournamentParticipant.id)), 0).label('participant_count'),
        func.coalesce(func.count(func.distinct(TournamentInvitation.id)), 0).label('invitation_count')
    ).outerjoin(
        TournamentParticipant, 
        (Tournament.id == TournamentParticipant.tournament_id) & 
        (TournamentParticipant.is_active.is_(True))
    ).outerjoin(
        TournamentInvitation,
        Tournament.id == TournamentInvitation.tournament_id
    ).group_by(Tournament.id).offset(skip).limit(limit).all()
    
    # Convert to response format
    result = []
    for tournament, participant_count, invitation_count in tournaments:
        tournament_dict = tournament.__dict__.copy()
        tournament_dict['participant_count'] = participant_count
        tournament_dict['invitation_count'] = invitation_count
        result.append(TournamentResponse(**tournament_dict))
    
    return result

@router.get("/{tournament_id}", response_model=TournamentResponse)
def read_tournament(tournament_id: int, db: Session = Depends(get_db)):
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament

@router.put("/{tournament_id}", response_model=TournamentResponse)
def update_tournament(
    tournament_id: int,
    tournament: TournamentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    authorize(current_user, db, ["tournaments_can_edit_all"])
    db_tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    for key, value in tournament.dict().items():
        setattr(db_tournament, key, value)
    
    db.commit()
    db.refresh(db_tournament)
    return db_tournament

@router.delete("/{tournament_id}")
def delete_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    authorize(current_user, db, ["tournaments_can_edit_all"])
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    db.delete(tournament)
    db.commit()
    return {"message": "Tournament deleted successfully"}

@router.post("/{tournament_id}/deactivate")
def deactivate_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    authorize(current_user, db, ["tournaments_can_edit_all"])
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    tournament.is_active = False
    tournament.status = TournamentStatus.COMPLETED.value
    db.commit()
    return {"message": "Tournament deactivated successfully"}

@router.post("/{tournament_id}/activate")
def activate_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Activate a tournament (admin only)"""
    authorize(current_user, db, ["tournaments_can_edit_all"])
    
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    tournament.status = TournamentStatus.ACTIVE.value
    db.commit()
    
    return {"message": "Tournament activated successfully"}

@router.get("/{tournament_id}/stats")
def get_tournament_stats(
    tournament_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get tournament statistics including player standings"""
    authorize(current_user, db, ["tournaments_can_view_all"])
    
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Get all verified matches for this tournament
    matches = db.query(Match).filter(
        Match.tournament_id == tournament_id,
        Match.status == MatchStatus.VERIFIED
    ).all()
    
    # Calculate player statistics
    player_stats = {}
    
    for match in matches:
        # Process player1
        if match.player1_id not in player_stats:
            player_stats[match.player1_id] = {
                "player_id": match.player1_id,
                "player_name": match.player1.full_name if match.player1 else f"Player {match.player1_id}",
                "matches_played": 0,
                "matches_won": 0,
                "matches_lost": 0,
                "sets_won": 0,
                "sets_lost": 0,
                "points_won": 0,
                "points_lost": 0,
                "win_percentage": 0.0
            }
        
        # Process player2
        if match.player2_id not in player_stats:
            player_stats[match.player2_id] = {
                "player_id": match.player2_id,
                "player_name": match.player2.full_name if match.player2 else f"Player {match.player2_id}",
                "matches_played": 0,
                "matches_won": 0,
                "matches_lost": 0,
                "sets_won": 0,
                "sets_lost": 0,
                "points_won": 0,
                "points_lost": 0,
                "win_percentage": 0.0
            }
        
        # Update player1 stats
        player1_stats = player_stats[match.player1_id]
        player1_stats["matches_played"] += 1
        player1_stats["points_won"] += match.player1_score
        player1_stats["points_lost"] += match.player2_score
        player1_stats["sets_won"] += 1 if match.player1_score > match.player2_score else 0
        player1_stats["sets_lost"] += 1 if match.player1_score < match.player2_score else 0
        player1_stats["matches_won"] += 1 if match.player1_score > match.player2_score else 0
        player1_stats["matches_lost"] += 1 if match.player1_score < match.player2_score else 0
        
        # Update player2 stats
        player2_stats = player_stats[match.player2_id]
        player2_stats["matches_played"] += 1
        player2_stats["points_won"] += match.player2_score
        player2_stats["points_lost"] += match.player1_score
        player2_stats["sets_won"] += 1 if match.player2_score > match.player1_score else 0
        player2_stats["sets_lost"] += 1 if match.player2_score < match.player1_score else 0
        player2_stats["matches_won"] += 1 if match.player2_score > match.player1_score else 0
        player2_stats["matches_lost"] += 1 if match.player2_score < match.player1_score else 0
    
    # Calculate win percentages
    for player_id, stats in player_stats.items():
        if stats["matches_played"] > 0:
            stats["win_percentage"] = (stats["matches_won"] / stats["matches_played"]) * 100
    
    # Sort by matches won, then by win percentage
    sorted_players = sorted(
        player_stats.values(),
        key=lambda x: (x["matches_won"], x["win_percentage"]),
        reverse=True
    )
    
    return {
        "tournament": {
            "id": tournament.id,
            "name": tournament.name,
            "is_active": tournament.is_active,
            "total_matches": len(matches)
        },
        "standings": sorted_players
    }

@router.get("/{tournament_id}/leaderboard", response_model=dict)
def get_tournament_leaderboard(
    tournament_id: int,
    db: Session = Depends(get_db)
):
    """Public endpoint to get tournament leaderboard with detailed statistics"""
    try:
        tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Get all tournament participants
        from app.models.tournament_invitations import TournamentParticipant
        participants = db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament_id,
            TournamentParticipant.is_active == True
        ).all()
        
        # Get all verified matches for this tournament
        matches = db.query(Match).filter(
            Match.tournament_id == tournament_id,
            Match.status == MatchStatus.VERIFIED
        ).all()
        
        # Initialize all participants with 0 stats
        player_stats = {}
        for participant in participants:
            user = db.query(User).filter(User.id == participant.user_id).first()
            player_stats[participant.user_id] = {
                "player_id": participant.user_id,
                "player_name": user.full_name if user else f"Player {participant.user_id}",
                "sets_won": 0,
                "sets_lost": 0,
                "sets_delta": 0,
                "points_won": 0,
                "points_lost": 0,
                "points_delta": 0,
            }
        
        # Calculate statistics from verified matches
        for match in matches:
            # Update player1 stats
            if match.player1_id in player_stats:
                player1_stats = player_stats[match.player1_id]
                player1_stats["points_won"] += match.player1_score
                player1_stats["points_lost"] += match.player2_score
                player1_stats["sets_won"] += 1 if match.player1_score > match.player2_score else 0
                player1_stats["sets_lost"] += 1 if match.player1_score < match.player2_score else 0
            
            # Update player2 stats
            if match.player2_id in player_stats:
                player2_stats = player_stats[match.player2_id]
                player2_stats["points_won"] += match.player2_score
                player2_stats["points_lost"] += match.player1_score
                player2_stats["sets_won"] += 1 if match.player2_score > match.player1_score else 0
                player2_stats["sets_lost"] += 1 if match.player2_score < match.player1_score else 0
        
        # Calculate deltas
        for player_id, stats in player_stats.items():
            stats["sets_delta"] = stats["sets_won"] - stats["sets_lost"]
            stats["points_delta"] = stats["points_won"] - stats["points_lost"]
        
        # Sort by sets won (descending), then by points delta (descending)
        leaderboard = sorted(
            player_stats.values(),
            key=lambda x: (x["sets_won"], x["points_delta"]),
            reverse=True
        )
        
        return {
            "tournament": {
                "id": tournament.id,
                "name": tournament.name,
                "is_active": tournament.is_active,
                "total_matches": len(matches)
            },
            "leaderboard": leaderboard
        }
    except Exception as e:
        logger.exception(f"Error in leaderboard: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
