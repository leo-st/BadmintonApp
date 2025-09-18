from sqlalchemy import Column, Integer, String, ForeignKey, CheckConstraint, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Medal(Base):
    __tablename__ = "medals"
    __table_args__ = (
        CheckConstraint("medal_type IN ('gold', 'silver', 'bronze', 'wood')", name='check_medal_type'),
        UniqueConstraint('user_id', 'tournament_id', name='unique_user_tournament_medal'),
        {"schema": "badminton"}
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("badminton.User.id", ondelete="CASCADE"), nullable=False)
    tournament_id = Column(Integer, ForeignKey("badminton.Tournament.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)
    medal_type = Column(String(10), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="medals")
    tournament = relationship("Tournament", back_populates="medals")
