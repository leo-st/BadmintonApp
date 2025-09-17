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

from app.common.enums import MatchStatus, MatchType
from app.core.database import Base


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

    # Relationships
    submitted_matches = relationship("Match", foreign_keys="Match.submitted_by_id", back_populates="submitted_by")
    verified_matches = relationship("Match", foreign_keys="Match.verified_by_id", back_populates="verified_by")
    player1_matches = relationship("Match", foreign_keys="Match.player1_id", back_populates="player1")
    player2_matches = relationship("Match", foreign_keys="Match.player2_id", back_populates="player2")

    @staticmethod
    def authenticate(db: Session, username: str, password: str):
        from app.core.auth import verify_password
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

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

    # Relationships
    player1 = relationship("User", foreign_keys=[player1_id], back_populates="player1_matches")
    player2 = relationship("User", foreign_keys=[player2_id], back_populates="player2_matches")
    submitted_by = relationship("User", foreign_keys=[submitted_by_id], back_populates="submitted_matches")
    verified_by = relationship("User", foreign_keys=[verified_by_id], back_populates="verified_matches")
    tournament = relationship("Tournament", back_populates="matches")

class Tournament(Base):
    __tablename__ = "Tournament"
    __table_args__ = {"schema": "badminton"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    matches = relationship("Match", back_populates="tournament")
