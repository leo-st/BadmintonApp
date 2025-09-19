from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from app.models.models import User, Tournament
from app.models.tournament_invitations import TournamentParticipant, TournamentInvitation
from app.common.enums import TournamentStatus, InvitationStatus
from app.schemas.schemas import TournamentInvitationCreate, TournamentInvitationUpdate
from fastapi import HTTPException, status

def create_tournament_invitation(
    db: Session, 
    tournament_id: int, 
    user_id: int, 
    invited_by: int
) -> TournamentInvitation:
    """Create a tournament invitation"""
    # Check if tournament exists and is in inviting status
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    
    if tournament.status != TournamentStatus.INVITING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Tournament is not in inviting status"
        )
    
    # Check if user is already invited
    existing_invitation = db.query(TournamentInvitation).filter(
        TournamentInvitation.tournament_id == tournament_id,
        TournamentInvitation.user_id == user_id
    ).first()
    
    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User already invited to this tournament"
        )
    
    # Check if user is already a participant
    existing_participant = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.user_id == user_id
    ).first()
    
    if existing_participant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User is already a participant in this tournament"
        )
    
    # Special case: If the tournament creator invites themselves, automatically add them as participant
    # Since only admins can create tournaments and invite users, we assume the inviter is the creator
    if user_id == invited_by:
        participant = TournamentParticipant(
            tournament_id=tournament_id,
            user_id=user_id,
            is_active=True
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)
        
        # Return a mock invitation object to indicate success
        mock_invitation = TournamentInvitation(
            id=0,  # Mock ID
            tournament_id=tournament_id,
            user_id=user_id,
            invited_by=invited_by,
            status=InvitationStatus.ACCEPTED.value,
            invited_at=datetime.now(timezone.utc),
            responded_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        return mock_invitation
    
    # Create invitation
    invitation = TournamentInvitation(
        tournament_id=tournament_id,
        user_id=user_id,
        invited_by=invited_by,
        status=InvitationStatus.PENDING.value,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    
    return invitation

def respond_to_invitation(
    db: Session, 
    invitation_id: int, 
    user_id: int, 
    response: str
) -> TournamentInvitation:
    """Respond to a tournament invitation"""
    invitation = db.query(TournamentInvitation).filter(
        TournamentInvitation.id == invitation_id,
        TournamentInvitation.user_id == user_id
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    
    if invitation.status != InvitationStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invitation has already been responded to"
        )
    
    # Check if tournament is still in inviting status
    tournament = db.query(Tournament).filter(Tournament.id == invitation.tournament_id).first()
    if not tournament or tournament.status != TournamentStatus.INVITING.value:
        # Delete the invitation since tournament is no longer accepting participants
        db.delete(invitation)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cannot respond to invitation for a tournament that is no longer accepting participants"
        )
    
    if invitation.expires_at and invitation.expires_at < datetime.now(timezone.utc):
        invitation.status = InvitationStatus.EXPIRED.value
        invitation.responded_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invitation has expired"
        )
    
    # Update invitation status
    invitation.status = response
    invitation.responded_at = datetime.now(timezone.utc)
    
    # If accepted, add user as participant
    if response == InvitationStatus.ACCEPTED.value:
        participant = TournamentParticipant(
            tournament_id=invitation.tournament_id,
            user_id=user_id,
            is_active=True
        )
        db.add(participant)
    
    db.commit()
    db.refresh(invitation)
    
    return invitation

def get_tournament_invitations(
    db: Session, 
    tournament_id: int
) -> List[TournamentInvitation]:
    """Get all invitations for a tournament"""
    return db.query(TournamentInvitation).filter(
        TournamentInvitation.tournament_id == tournament_id
    ).all()

def get_user_invitations(
    db: Session, 
    user_id: int
) -> List[TournamentInvitation]:
    """Get all invitations for a user"""
    invitations = db.query(TournamentInvitation).filter(
        TournamentInvitation.user_id == user_id
    ).options(
        selectinload(TournamentInvitation.tournament),
        selectinload(TournamentInvitation.inviter)
    ).all()
    
    # Manually load tournament information for each invitation
    for invitation in invitations:
        if invitation.tournament_id:
            tournament = db.query(Tournament).filter(Tournament.id == invitation.tournament_id).first()
            invitation.tournament = tournament
    
    return invitations

def get_tournament_participants(
    db: Session, 
    tournament_id: int
) -> List[TournamentParticipant]:
    """Get all participants for a tournament"""
    return db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament_id,
        TournamentParticipant.is_active == True
    ).all()

def start_tournament(
    db: Session, 
    tournament_id: int, 
    admin_user_id: int
) -> Tournament:
    """Start a tournament (change status from inviting to active)"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    
    if tournament.status != TournamentStatus.INVITING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Tournament is not in inviting status"
        )
    
    # Check if there are any participants
    participants = get_tournament_participants(db, tournament_id)
    if not participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cannot start tournament without participants"
        )
    
    # Delete all pending invitations for this tournament
    pending_invitations = db.query(TournamentInvitation).filter(
        TournamentInvitation.tournament_id == tournament_id,
        TournamentInvitation.status == "pending"
    ).all()
    
    for invitation in pending_invitations:
        db.delete(invitation)
    
    # Update tournament status
    tournament.status = TournamentStatus.ACTIVE.value
    db.commit()
    db.refresh(tournament)
    
    return tournament

def complete_tournament(
    db: Session, 
    tournament_id: int, 
    admin_user_id: int
) -> Tournament:
    """Complete a tournament (change status from active to completed)"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    
    if tournament.status != TournamentStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Tournament is not in active status"
        )
    
    # Update tournament status
    tournament.status = TournamentStatus.COMPLETED.value
    db.commit()
    db.refresh(tournament)
    
    return tournament
