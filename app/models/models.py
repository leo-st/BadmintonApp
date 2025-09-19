from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship, Session
from sqlalchemy.sql import func

from app.common.enums import MatchStatus, MatchType, TournamentStatus
from app.core.database import Base

# Import Medal to ensure it's registered with SQLAlchemy
from app.models.medals import Medal
from app.models.tournament_invitations import TournamentParticipant, TournamentInvitation


class User(Base):
    __tablename__ = "User"
    __table_args__ = {"schema": "badminton"}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    role_id = Column(Integer, ForeignKey("access_control.Role.role_id"), nullable=True)

    # Relationships
    submitted_matches = relationship("Match", foreign_keys="Match.submitted_by_id", back_populates="submitted_by")
    verified_matches = relationship("Match", foreign_keys="Match.verified_by_id", back_populates="verified_by")
    player1_matches = relationship("Match", foreign_keys="Match.player1_id", back_populates="player1")
    player2_matches = relationship("Match", foreign_keys="Match.player2_id", back_populates="player2")
    player1_verified_matches = relationship("Match", foreign_keys="Match.player1_verified_by_id", back_populates="player1_verified_by")
    player2_verified_matches = relationship("Match", foreign_keys="Match.player2_verified_by_id", back_populates="player2_verified_by")
    role = relationship("Role", foreign_keys=[role_id], lazy="joined")
    medals = relationship("Medal", back_populates="user", lazy="select")
    tournament_participations = relationship("TournamentParticipant", back_populates="user", lazy="select")
    tournament_invitations_received = relationship("TournamentInvitation", foreign_keys="TournamentInvitation.user_id", back_populates="user", lazy="select")
    tournament_invitations_sent = relationship("TournamentInvitation", foreign_keys="TournamentInvitation.invited_by", back_populates="inviter", lazy="select")
    reports = relationship("Report", back_populates="created_by", lazy="select")
    report_reactions = relationship("ReportReaction", back_populates="user", lazy="select")
    report_views = relationship("ReportView", back_populates="user", lazy="select")

    @staticmethod
    def authenticate(db: Session, username: str, password: str):
        from app.core.auth import verify_password
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def has_permission(self, db: Session, permission_key: str) -> bool:
        """Check if user has a specific permission"""
        if not self.role_id:
            return False
        
        from app.models.access_control import Role, Permission, RolesPermissions
        
        permission = db.query(Permission).join(RolesPermissions).join(Role).filter(
            Role.role_id == self.role_id,
            Permission.permission_key == permission_key
        ).first()
        
        return permission is not None

    def get_permissions(self, db: Session) -> list[str]:
        """Get all permissions for the user"""
        if not self.role_id:
            return []
        
        from app.models.access_control import Role, Permission, RolesPermissions
        
        permissions = db.query(Permission.permission_key).join(RolesPermissions).join(Role).filter(
            Role.role_id == self.role_id
        ).all()
        
        return [perm[0] for perm in permissions]

    def is_admin(self, db: Session) -> bool:
        """Check if user is admin"""
        return self.has_permission(db, "admin")

    def get_medal_counts(self) -> dict[str, int]:
        """Get medal counts for the user"""
        medal_counts = {"gold": 0, "silver": 0, "bronze": 0, "wood": 0}
        
        for medal in self.medals:
            medal_counts[medal.medal_type] += 1
            
        return medal_counts

class Match(Base):
    __tablename__ = "Match"
    __table_args__ = {"schema": "badminton"}

    id = Column(Integer, primary_key=True, index=True)
    player1_id = Column(Integer, ForeignKey("badminton.User.id"), nullable=False)
    player2_id = Column(Integer, ForeignKey("badminton.User.id"), nullable=False)
    player1_score = Column(Integer, nullable=False)
    player2_score = Column(Integer, nullable=False)
    match_type = Column(Enum(MatchType), nullable=False)
    status = Column(Enum(MatchStatus), default=MatchStatus.PENDING_VERIFICATION)
    submitted_by_id = Column(Integer, ForeignKey("badminton.User.id"), nullable=False)
    verified_by_id = Column(Integer, ForeignKey("badminton.User.id"), nullable=True)
    tournament_id = Column(Integer, ForeignKey("badminton.Tournament.id"), nullable=True)
    notes = Column(Text, nullable=True)
    match_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Player verification fields
    player1_verified = Column(Boolean, default=False, nullable=False)
    player2_verified = Column(Boolean, default=False, nullable=False)
    player1_verified_by_id = Column(Integer, ForeignKey("badminton.User.id"), nullable=True)
    player2_verified_by_id = Column(Integer, ForeignKey("badminton.User.id"), nullable=True)

    # Relationships
    player1 = relationship("User", foreign_keys=[player1_id], back_populates="player1_matches")
    player2 = relationship("User", foreign_keys=[player2_id], back_populates="player2_matches")
    submitted_by = relationship("User", foreign_keys=[submitted_by_id], back_populates="submitted_matches")
    verified_by = relationship("User", foreign_keys=[verified_by_id], back_populates="verified_matches")
    player1_verified_by = relationship("User", foreign_keys=[player1_verified_by_id], back_populates="player1_verified_matches")
    player2_verified_by = relationship("User", foreign_keys=[player2_verified_by_id], back_populates="player2_verified_matches")
    tournament = relationship("Tournament", back_populates="matches")

    def get_verification_requirements(self) -> dict:
        """Get who needs to verify this match based on who submitted it"""
        requirements = {
            "player1_needs_verification": True,
            "player2_needs_verification": True,
            "submitted_by_player": False
        }
        
        # If submitted by player1, only player2 needs to verify
        if self.submitted_by_id == self.player1_id:
            requirements["player1_needs_verification"] = False
            requirements["submitted_by_player"] = True
        # If submitted by player2, only player1 needs to verify  
        elif self.submitted_by_id == self.player2_id:
            requirements["player2_needs_verification"] = False
            requirements["submitted_by_player"] = True
        # If submitted by someone else, both players need to verify
        else:
            requirements["submitted_by_player"] = False
            
        return requirements

    def is_fully_verified(self) -> bool:
        """Check if match is fully verified by all required players"""
        requirements = self.get_verification_requirements()
        
        if requirements["player1_needs_verification"] and not self.player1_verified:
            return False
        if requirements["player2_needs_verification"] and not self.player2_verified:
            return False
            
        return True

    def can_user_verify(self, user_id: int) -> bool:
        """Check if a user can verify this match"""
        requirements = self.get_verification_requirements()
        
        # Player1 can verify if they need to and haven't already
        if user_id == self.player1_id and requirements["player1_needs_verification"] and not self.player1_verified:
            return True
        # Player2 can verify if they need to and haven't already    
        if user_id == self.player2_id and requirements["player2_needs_verification"] and not self.player2_verified:
            return True
            
        return False

    def verify_by_user(self, user_id: int, verified: bool = True) -> bool:
        """Verify match by a specific user"""
        if not self.can_user_verify(user_id):
            return False
            
        if user_id == self.player1_id:
            self.player1_verified = verified
            self.player1_verified_by_id = user_id if verified else None
        elif user_id == self.player2_id:
            self.player2_verified = verified
            self.player2_verified_by_id = user_id if verified else None
            
        # Update overall match status
        if self.is_fully_verified():
            self.status = MatchStatus.VERIFIED
            self.verified_at = func.now()
        else:
            self.status = MatchStatus.PENDING_VERIFICATION
            
        return True

class Tournament(Base):
    __tablename__ = "Tournament"
    __table_args__ = {"schema": "badminton"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    status = Column(String(20), nullable=False, default=TournamentStatus.DRAFT.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    matches = relationship("Match", back_populates="tournament")
    medals = relationship("Medal", back_populates="tournament", lazy="select")
    participants = relationship("TournamentParticipant", back_populates="tournament", lazy="select")
    invitations = relationship("TournamentInvitation", back_populates="tournament", lazy="select")
