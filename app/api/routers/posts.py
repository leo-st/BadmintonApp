from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    PostCreate, PostUpdate, PostResponse,
    CommentCreate, CommentUpdate, CommentResponse,
    AttachmentCreate, AttachmentResponse,
    PostReactionCreate, CommentReactionCreate
)
from app.services.post_service import PostService

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new post"""
    post_service = PostService(db)
    return post_service.create_post(post_data, current_user.id)


@router.get("/", response_model=List[PostResponse])
def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get posts with pagination, optionally filtered by user"""
    post_service = PostService(db)
    return post_service.get_posts(skip=skip, limit=limit, user_id=user_id)


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single post by ID"""
    post_service = PostService(db)
    post = post_service.get_post(post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    return post


@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a post (only by the author)"""
    post_service = PostService(db)
    post = post_service.update_post(post_id, post_data, current_user.id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or you don't have permission to update it"
        )
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a post (only by the author)"""
    post_service = PostService(db)
    success = post_service.delete_post(post_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or you don't have permission to delete it"
        )


@router.post("/{post_id}/attachments", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
def add_attachment_to_post(
    post_id: int,
    attachment_data: AttachmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add an attachment to a post"""
    post_service = PostService(db)
    attachment = post_service.add_attachment_to_post(post_id, attachment_data, current_user.id)
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or you don't have permission to add attachments to it"
        )
    return attachment

@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an attachment (only by the author)"""
    post_service = PostService(db)
    success = post_service.delete_attachment(attachment_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found or you don't have permission to delete it"
        )


@router.post("/{post_id}/reactions", status_code=status.HTTP_201_CREATED)
def add_reaction_to_post(
    post_id: int,
    reaction_data: PostReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a reaction to a post"""
    post_service = PostService(db)
    reaction = post_service.add_reaction_to_post(post_id, reaction_data, current_user.id)
    if not reaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    return {"message": "Reaction added successfully"}


@router.delete("/{post_id}/reactions/{emoji}", status_code=status.HTTP_204_NO_CONTENT)
def remove_reaction_from_post(
    post_id: int,
    emoji: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a reaction from a post"""
    post_service = PostService(db)
    success = post_service.remove_reaction_from_post(post_id, emoji, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reaction not found"
        )


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a comment on a post"""
    post_service = PostService(db)
    comment = post_service.create_comment(post_id, comment_data, current_user.id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    return comment


@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comments for a post"""
    post_service = PostService(db)
    return post_service.get_comments(post_id, skip=skip, limit=limit)


@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a comment (only by the author)"""
    post_service = PostService(db)
    comment = post_service.update_comment(comment_id, comment_data, current_user.id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or you don't have permission to update it"
        )
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a comment (only by the author)"""
    post_service = PostService(db)
    success = post_service.delete_comment(comment_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or you don't have permission to delete it"
        )


@router.post("/comments/{comment_id}/reactions", status_code=status.HTTP_201_CREATED)
def add_reaction_to_comment(
    comment_id: int,
    reaction_data: CommentReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a reaction to a comment"""
    post_service = PostService(db)
    reaction = post_service.add_reaction_to_comment(comment_id, reaction_data, current_user.id)
    if not reaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    return {"message": "Reaction added successfully"}


@router.delete("/comments/{comment_id}/reactions/{emoji}", status_code=status.HTTP_204_NO_CONTENT)
def remove_reaction_from_comment(
    comment_id: int,
    emoji: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a reaction from a comment"""
    post_service = PostService(db)
    success = post_service.remove_reaction_from_comment(comment_id, emoji, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reaction not found"
        )
