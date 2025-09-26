from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import date, datetime, timezone
from app.models.reports import Report, ReportReaction
from app.models.models import User
from app.schemas.schemas import ReportCreate, ReportUpdate, ReportReactionCreate
from fastapi import HTTPException, status


def create_report(db: Session, report_data: ReportCreate, user_id: int) -> Report:
    """Create a new report"""
    report = Report(
        created_by_id=user_id,
        event_date=report_data.event_date,
        content=report_data.content
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Load the created_by relationship
    report = db.query(Report).options(joinedload(Report.created_by)).filter(Report.id == report.id).first()
    return report


def get_reports(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    event_date_from: Optional[date] = None,
    event_date_to: Optional[date] = None,
    search_text: Optional[str] = None
) -> List[Report]:
    """Get reports with filtering and pagination"""
    query = db.query(Report).options(
        joinedload(Report.created_by),
        joinedload(Report.reactions).joinedload(ReportReaction.user)
    )
    
    # Apply filters
    if event_date_from:
        query = query.filter(Report.event_date >= event_date_from)
    if event_date_to:
        query = query.filter(Report.event_date <= event_date_to)
    if search_text:
        # Join with User table for name search
        query = query.join(User, Report.created_by_id == User.id).filter(
            or_(
                Report.content.ilike(f"%{search_text}%"),
                User.full_name.ilike(f"%{search_text}%")
            )
        )
    
    # Order by event date (most recent first), then by created_at
    query = query.order_by(Report.event_date.desc(), Report.created_at.desc())
    
    return query.offset(skip).limit(limit).all()


def get_report_by_id(db: Session, report_id: int) -> Optional[Report]:
    """Get a report by ID"""
    return db.query(Report).options(
        joinedload(Report.created_by),
        joinedload(Report.reactions).joinedload(ReportReaction.user)
    ).filter(Report.id == report_id).first()


def update_report(db: Session, report_id: int, report_data: ReportUpdate, user_id: int) -> Optional[Report]:
    """Update a report (only by creator)"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        return None
    
    if report.created_by_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own reports"
        )
    
    if report_data.event_date is not None:
        report.event_date = report_data.event_date
    if report_data.content is not None:
        report.content = report_data.content
    
    report.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    
    # Load the created_by relationship before returning
    report = db.query(Report).options(joinedload(Report.created_by)).filter(Report.id == report.id).first()
    return report


def delete_report(db: Session, report_id: int, user_id: int) -> bool:
    """Delete a report (only by creator)"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        return False
    
    if report.created_by_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reports"
        )
    
    db.delete(report)
    db.commit()
    return True


def add_reaction(db: Session, report_id: int, reaction_data: ReportReactionCreate, user_id: int) -> ReportReaction:
    """Add a reaction to a report"""
    # Check if report exists
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check if user already reacted with this emoji
    existing_reaction = db.query(ReportReaction).filter(
        and_(
            ReportReaction.report_id == report_id,
            ReportReaction.user_id == user_id,
            ReportReaction.emoji == reaction_data.emoji
        )
    ).first()
    
    if existing_reaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reacted with this emoji"
        )
    
    reaction = ReportReaction(
        report_id=report_id,
        user_id=user_id,
        emoji=reaction_data.emoji
    )
    db.add(reaction)
    db.commit()
    db.refresh(reaction)
    return reaction


def remove_reaction(db: Session, report_id: int, emoji: str, user_id: int) -> bool:
    """Remove a reaction from a report"""
    reaction = db.query(ReportReaction).filter(
        and_(
            ReportReaction.report_id == report_id,
            ReportReaction.user_id == user_id,
            ReportReaction.emoji == emoji
        )
    ).first()
    
    if not reaction:
        return False
    
    db.delete(reaction)
    db.commit()
    return True


def get_reaction_counts(db: Session, report_id: int) -> dict:
    """Get reaction counts for a report"""
    counts = db.query(
        ReportReaction.emoji,
        func.count(ReportReaction.id).label('count')
    ).filter(
        ReportReaction.report_id == report_id
    ).group_by(ReportReaction.emoji).all()
    
    return {emoji: count for emoji, count in counts}
