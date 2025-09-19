from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = {"schema": "badminton"}

    id = Column(Integer, primary_key=True, index=True)
    created_by_id = Column(Integer, ForeignKey("badminton.User.id", ondelete="CASCADE"), nullable=False)
    event_date = Column(Date, nullable=False)  # Date when the event happened
    content = Column(Text, nullable=False)     # Free text description
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    created_by = relationship("User", back_populates="reports")
    reactions = relationship("ReportReaction", back_populates="report", cascade="all, delete-orphan")
    views = relationship("ReportView", back_populates="report", cascade="all, delete-orphan")


class ReportReaction(Base):
    __tablename__ = "report_reactions"
    __table_args__ = (
        UniqueConstraint('report_id', 'user_id', 'emoji', name='unique_user_emoji_per_report'),
        {"schema": "badminton"}
    )

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("badminton.reports.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("badminton.User.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String(10), nullable=False)  # Store emoji as string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    report = relationship("Report", back_populates="reactions")
    user = relationship("User", back_populates="report_reactions")
