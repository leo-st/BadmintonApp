from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.common.enums import InvitationStatus

class TournamentParticipant(Base):
    __tablename__ = "tournament_participants"
    __table_args__ = (
        UniqueConstraint('tournament_id', 'user_id', name='unique_tournament_participant'),
        
    )

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("Tournament.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    tournament = relationship("Tournament", back_populates="participants")
    user = relationship("User", back_populates="tournament_participations")

class TournamentInvitation(Base):
    __tablename__ = "tournament_invitations"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'accepted', 'declined', 'expired')", name='check_invitation_status'),
        UniqueConstraint('tournament_id', 'user_id', name='unique_tournament_invitation'),
        
    )

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("Tournament.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    invited_by = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, default=InvitationStatus.PENDING.value)
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    responded_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Will be set in application logic

    # Relationships
    tournament = relationship("Tournament", back_populates="invitations")
    user = relationship("User", foreign_keys=[user_id], back_populates="tournament_invitations_received")
    inviter = relationship("User", foreign_keys=[invited_by], back_populates="tournament_invitations_sent")