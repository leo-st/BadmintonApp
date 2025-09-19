from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.core.authorize import authorize
from app.models.models import User, Tournament
from app.schemas.schemas import (
    TournamentInvitationCreate, 
    TournamentInvitationResponse, 
    TournamentInvitationUpdate,
    TournamentParticipantResponse
)
from app.services.tournament_invitation_service import (
    create_tournament_invitation,
    respond_to_invitation,
    get_tournament_invitations,
    get_user_invitations,
    get_tournament_participants,
    start_tournament,
    complete_tournament
)

router = APIRouter(prefix="/tournament-invitations", tags=["tournament-invitations"])

@router.post("/tournament/{tournament_id}/invite/{user_id}", response_model=TournamentInvitationResponse)
def invite_user_to_tournament(
    tournament_id: int,
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Invite a user to a tournament (admin only)"""
    authorize(current_user, db, ["tournaments_can_edit_all"])
    
    invitation = create_tournament_invitation(
        db=db,
        tournament_id=tournament_id,
        user_id=user_id,
        invited_by=current_user.id
    )
    
    return invitation

@router.post("/{invitation_id}/respond", response_model=TournamentInvitationResponse)
def respond_to_tournament_invitation(
    invitation_id: int,
    response: TournamentInvitationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Respond to a tournament invitation"""
    invitation = respond_to_invitation(
        db=db,
        invitation_id=invitation_id,
        user_id=current_user.id,
        response=response.status
    )
    
    return invitation

@router.get("/tournament/{tournament_id}", response_model=List[TournamentInvitationResponse])
def get_tournament_invitations_list(
    tournament_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all invitations for a tournament (admin only)"""
    authorize(current_user, db, ["tournaments_can_view_all"])
    
    invitations = get_tournament_invitations(db=db, tournament_id=tournament_id)
    return invitations

@router.get("/my-invitations")
def get_my_invitations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's tournament invitations"""
    invitations = get_user_invitations(db=db, user_id=current_user.id)
    
    # Manually construct response with tournament data
    result = []
    for invitation in invitations:
        tournament = db.query(Tournament).filter(Tournament.id == invitation.tournament_id).first()
        
        invitation_data = {
            "id": invitation.id,
            "tournament_id": invitation.tournament_id,
            "user_id": invitation.user_id,
            "invited_by": invitation.invited_by,
            "status": invitation.status,
            "invited_at": invitation.invited_at,
            "responded_at": invitation.responded_at,
            "expires_at": invitation.expires_at,
            "tournament": {
                "id": tournament.id,
                "name": tournament.name,
                "description": tournament.description,
                "is_active": tournament.is_active,
                "status": tournament.status,
                "created_at": tournament.created_at
            } if tournament else None,
            "user": {
                "id": invitation.user.id,
                "username": invitation.user.username,
                "full_name": invitation.user.full_name,
                "email": invitation.user.email
            } if invitation.user else None,
            "inviter": {
                "id": invitation.inviter.id,
                "username": invitation.inviter.username,
                "full_name": invitation.inviter.full_name,
                "email": invitation.inviter.email
            } if invitation.inviter else None
        }
        result.append(invitation_data)
    
    return result

@router.get("/tournament/{tournament_id}/participants", response_model=List[TournamentParticipantResponse])
def get_tournament_participants_list(
    tournament_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all participants for a tournament"""
    participants = get_tournament_participants(db=db, tournament_id=tournament_id)
    return participants

@router.post("/tournament/{tournament_id}/start")
def start_tournament_endpoint(
    tournament_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a tournament (admin only)"""
    authorize(current_user, db, ["tournaments_can_edit_all"])
    
    tournament = start_tournament(
        db=db,
        tournament_id=tournament_id,
        admin_user_id=current_user.id
    )
    
    return {"message": "Tournament started successfully", "tournament_id": tournament.id}

@router.post("/tournament/{tournament_id}/complete")
def complete_tournament_endpoint(
    tournament_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Complete a tournament (admin only)"""
    authorize(current_user, db, ["tournaments_can_edit_all"])
    
    tournament = complete_tournament(
        db=db,
        tournament_id=tournament_id,
        admin_user_id=current_user.id
    )
    
    return {"message": "Tournament completed successfully", "tournament_id": tournament.id}
