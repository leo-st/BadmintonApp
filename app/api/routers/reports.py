from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import (
    ReportCreate, 
    ReportUpdate, 
    ReportResponse, 
    ReportReactionCreate,
    ReportReactionResponse
)
from app.services.report_service import (
    create_report,
    get_reports,
    get_report_by_id,
    update_report,
    delete_report,
    add_reaction,
    remove_reaction,
    get_reaction_counts
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/test")
def test_reports():
    """Test endpoint for reports"""
    return {"message": "Reports endpoint is working!"}

@router.post("/create")
def create_report_simple(
    report_data: ReportCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new report - simple version"""
    from app.models.reports import Report
    from app.models.report_views import ReportView
    from datetime import datetime, timezone
    
    # Create the report
    report = Report(
        created_by_id=current_user.id,
        event_date=report_data.event_date,
        content=report_data.content
    )
    
    db.add(report)
    db.flush()  # Flush to get the report ID without committing
    
    # Automatically mark the report as seen by the creator
    view = ReportView(
        report_id=report.id,
        user_id=current_user.id,
        viewed_at=datetime.now(timezone.utc)
    )
    db.add(view)
    db.commit()  # Single commit for both operations
    db.refresh(report)
    
    return {
        "id": report.id,
        "message": "Report created successfully",
        "content": report.content
    }

@router.post("/")
def create_new_report(
    report_data: ReportCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new report"""
    from app.models.reports import Report
    from app.models.report_views import ReportView
    from datetime import datetime, timezone
    
    # Create the report
    report = Report(
        created_by_id=current_user.id,
        event_date=report_data.event_date,
        content=report_data.content
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Automatically mark the report as seen by the creator
    # Use the existing mark-seen endpoint logic
    try:
        from app.models.report_views import ReportView
        existing_view = db.query(ReportView).filter(
            ReportView.report_id == report.id,
            ReportView.user_id == current_user.id
        ).first()
        
        if not existing_view:
            view = ReportView(
                report_id=report.id,
                user_id=current_user.id,
                viewed_at=datetime.now(timezone.utc)
            )
            db.add(view)
            db.commit()
            print(f"Successfully marked report {report.id} as seen for user {current_user.id}")
        else:
            print(f"Report {report.id} already marked as seen for user {current_user.id}")
    except Exception as e:
        print(f"Error marking report as seen: {e}")
        db.rollback()
        pass
    
    return {
        "id": report.id,
        "created_by_id": report.created_by_id,
        "event_date": report.event_date.isoformat(),
        "content": report.content,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
        "message": "Report created successfully"
    }


@router.get("/")
def get_reports_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),  # Reduced default limit for better UX
    event_date_from: Optional[date] = Query(None),
    event_date_to: Optional[date] = Query(None),
    search_text: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get reports with filtering and pagination"""
    from app.models.reports import Report
    from app.models.models import User
    from sqlalchemy.orm import joinedload
    from sqlalchemy import and_, or_, desc
    
    # Build the query with proper filtering and sorting
    query = db.query(Report).options(
        joinedload(Report.created_by)
    )
    
    # Apply filters
    if search_text:
        query = query.filter(Report.content.ilike(f"%{search_text}%"))
    if event_date_from:
        query = query.filter(Report.event_date >= event_date_from)
    if event_date_to:
        query = query.filter(Report.event_date <= event_date_to)
    
    # Sort by created_at descending (newest first)
    query = query.order_by(desc(Report.created_at))
    
    # Apply pagination
    reports = query.offset(skip).limit(limit).all()
    
    # Convert to response format
    result = []
    for report in reports:
        # Get reactions for this report with user relationships
        from app.models.reports import ReportReaction
        reactions = db.query(ReportReaction).options(
            joinedload(ReportReaction.user)
        ).filter(ReportReaction.report_id == report.id).all()
        
        # Calculate reaction counts
        reaction_counts = {}
        for reaction in reactions:
            reaction_counts[reaction.emoji] = reaction_counts.get(reaction.emoji, 0) + 1
        
        # Check if current user has seen this report
        from app.models.report_views import ReportView
        has_seen = db.query(ReportView).filter(
            ReportView.report_id == report.id,
            ReportView.user_id == current_user.id
        ).first() is not None
        
        result.append({
            "id": report.id,
            "created_by_id": report.created_by_id,
            "event_date": report.event_date.isoformat(),
            "content": report.content,
            "created_at": report.created_at.isoformat(),
            "updated_at": report.updated_at.isoformat(),
            "has_seen": has_seen,
            "created_by": {
                "id": report.created_by.id,
                "username": report.created_by.username,
                "full_name": report.created_by.full_name,
                "email": report.created_by.email
            } if report.created_by else None,
            "reactions": [
                {
                    "id": reaction.id,
                    "user_id": reaction.user_id,
                    "emoji": reaction.emoji,
                    "created_at": reaction.created_at.isoformat(),
                    "user": {
                        "id": reaction.user.id,
                        "username": reaction.user.username,
                        "full_name": reaction.user.full_name,
                        "email": reaction.user.email
                    } if reaction.user else None
                } for reaction in reactions
            ],
            "reaction_counts": reaction_counts
        })
    
    return {
        "reports": result,
        "pagination": {
            "skip": skip,
            "limit": limit,
            "total": query.count(),  # Total count for pagination
            "has_more": skip + limit < query.count()
        }
    }


@router.get("/unseen-count")
def get_unseen_reports_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get count of unseen reports for current user"""
    from app.models.reports import Report
    from app.models.report_views import ReportView
    from sqlalchemy import and_
    
    # Count total reports
    total_reports = db.query(Report).count()
    
    # Count reports seen by current user
    seen_reports = db.query(ReportView).filter(
        ReportView.user_id == current_user.id
    ).count()
    
    unseen_count = total_reports - seen_reports
    
    return {
        "unseen_count": unseen_count,
        "total_reports": total_reports,
        "seen_reports": seen_reports
    }


@router.get("/{report_id}")
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific report by ID"""
    from app.models.reports import Report
    from sqlalchemy.orm import joinedload
    
    # Load report with user relationship
    report = db.query(Report).options(
        joinedload(Report.created_by)
    ).filter(Report.id == report_id).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Get reactions for this report with user relationships
    from app.models.reports import ReportReaction
    reactions = db.query(ReportReaction).options(
        joinedload(ReportReaction.user)
    ).filter(ReportReaction.report_id == report.id).all()
    
    # Calculate reaction counts
    reaction_counts = {}
    for reaction in reactions:
        reaction_counts[reaction.emoji] = reaction_counts.get(reaction.emoji, 0) + 1
    
    return {
        "id": report.id,
        "created_by_id": report.created_by_id,
        "event_date": report.event_date.isoformat(),
        "content": report.content,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
        "created_by": {
            "id": report.created_by.id,
            "username": report.created_by.username,
            "full_name": report.created_by.full_name,
            "email": report.created_by.email
        } if report.created_by else None,
        "reactions": [
            {
                "id": reaction.id,
                "user_id": reaction.user_id,
                "emoji": reaction.emoji,
                "created_at": reaction.created_at.isoformat(),
                "user": {
                    "id": reaction.user.id,
                    "username": reaction.user.username,
                    "full_name": reaction.user.full_name,
                    "email": reaction.user.email
                } if reaction.user else None
            } for reaction in reactions
        ],
        "reaction_counts": reaction_counts
    }


@router.put("/{report_id}", response_model=ReportResponse)
def update_existing_report(
    report_id: int,
    report_data: ReportUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a report (only by creator)"""
    report = update_report(db=db, report_id=report_id, report_data=report_data, user_id=current_user.id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Get reaction counts
    reaction_counts = get_reaction_counts(db=db, report_id=report.id)
    
    return {
        "id": report.id,
        "created_by_id": report.created_by_id,
        "event_date": report.event_date,
        "content": report.content,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
        "created_by": {
            "id": report.created_by.id,
            "username": report.created_by.username,
            "full_name": report.created_by.full_name,
            "email": report.created_by.email,
            "is_active": report.created_by.is_active,
            "created_at": report.created_by.created_at
        } if report.created_by else None,
        "reactions": [],
        "reaction_counts": reaction_counts
    }


@router.delete("/{report_id}")
def delete_existing_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a report (only by creator)"""
    success = delete_report(db=db, report_id=report_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    return {"message": "Report deleted successfully"}


@router.post("/{report_id}/reactions")
def add_report_reaction(
    report_id: int,
    reaction_data: ReportReactionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a reaction to a report"""
    from app.models.reports import Report, ReportReaction
    from datetime import datetime, timezone
    
    # Check if report exists
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check if user already reacted with this emoji
    existing_reaction = db.query(ReportReaction).filter(
        ReportReaction.report_id == report_id,
        ReportReaction.user_id == current_user.id,
        ReportReaction.emoji == reaction_data.emoji
    ).first()
    
    if existing_reaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already reacted with this emoji to this report"
        )
    
    # Create new reaction
    reaction = ReportReaction(
        report_id=report_id,
        user_id=current_user.id,
        emoji=reaction_data.emoji,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(reaction)
    db.commit()
    db.refresh(reaction)
    
    return {
        "id": reaction.id,
        "user_id": reaction.user_id,
        "emoji": reaction.emoji,
        "created_at": reaction.created_at.isoformat(),
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "email": current_user.email
        }
    }


@router.delete("/{report_id}/reactions/{reaction_id}")
def remove_report_reaction(
    report_id: int,
    reaction_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a reaction from a report"""
    from app.models.reports import ReportReaction
    
    # Find the reaction
    reaction = db.query(ReportReaction).filter(
        ReportReaction.id == reaction_id,
        ReportReaction.report_id == report_id,
        ReportReaction.user_id == current_user.id
    ).first()
    
    if not reaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reaction not found or not authorized to delete"
        )
    
    db.delete(reaction)
    db.commit()
    
    return {"message": "Reaction removed successfully"}


@router.post("/{report_id}/mark-seen")
def mark_report_seen(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a report as seen by the current user"""
    from app.models.reports import Report
    from app.models.report_views import ReportView
    from datetime import datetime, timezone
    
    # Check if report exists
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check if user has already seen this report
    existing_view = db.query(ReportView).filter(
        ReportView.report_id == report_id,
        ReportView.user_id == current_user.id
    ).first()
    
    if existing_view:
        return {"message": "Report already marked as seen"}
    
    # Create new view record
    view = ReportView(
        report_id=report_id,
        user_id=current_user.id,
        viewed_at=datetime.now(timezone.utc)
    )
    
    db.add(view)
    db.commit()
    db.refresh(view)
    
    return {"message": "Report marked as seen"}
