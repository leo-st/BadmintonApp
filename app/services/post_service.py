from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc, func, and_, or_

from app.models.posts import Post, Comment, Attachment, PostReaction, CommentReaction
from app.models.models import User
from app.schemas.schemas import (
    PostCreate, PostUpdate, PostResponse,
    CommentCreate, CommentUpdate, CommentResponse,
    AttachmentCreate, AttachmentResponse,
    PostReactionCreate, PostReactionResponse,
    CommentReactionCreate, CommentReactionResponse
)


class PostService:
    def __init__(self, db: Session):
        self.db = db

    def create_post(self, post_data: PostCreate, user_id: int) -> PostResponse:
        """Create a new post"""
        db_post = Post(
            user_id=user_id,
            content=post_data.content
        )
        self.db.add(db_post)
        self.db.commit()
        self.db.refresh(db_post)
        return self._format_post_response(db_post)

    def get_posts(self, skip: int = 0, limit: int = 20, user_id: Optional[int] = None) -> List[PostResponse]:
        """Get posts with pagination, optionally filtered by user"""
        query = self.db.query(Post).filter(Post.is_deleted == False)
        
        if user_id:
            query = query.filter(Post.user_id == user_id)
        
        # Only load essential data to avoid N+1 queries
        posts = query.options(
            joinedload(Post.user),
            joinedload(Post.attachments),
            joinedload(Post.reactions)
        ).order_by(desc(Post.created_at)).offset(skip).limit(limit).all()
        
        return [self._format_post_response(post) for post in posts]

    def get_post(self, post_id: int) -> Optional[PostResponse]:
        """Get a single post by ID"""
        post = self.db.query(Post).options(
            joinedload(Post.user),
            joinedload(Post.attachments),
            joinedload(Post.comments).joinedload(Comment.user),
            joinedload(Post.comments).joinedload(Comment.attachments),
            joinedload(Post.comments).joinedload(Comment.reactions).joinedload(CommentReaction.user),
            joinedload(Post.reactions).joinedload(PostReaction.user)
        ).filter(Post.id == post_id, Post.is_deleted == False).first()
        
        if not post:
            return None
        
        return self._format_post_response(post)

    def update_post(self, post_id: int, post_data: PostUpdate, user_id: int) -> Optional[PostResponse]:
        """Update a post (only by the author)"""
        post = self.db.query(Post).filter(
            Post.id == post_id,
            Post.user_id == user_id,
            Post.is_deleted == False
        ).first()
        
        if not post:
            return None
        
        if post_data.content is not None:
            post.content = post_data.content
        
        self.db.commit()
        self.db.refresh(post)
        return self._format_post_response(post)

    def delete_post(self, post_id: int, user_id: int) -> bool:
        """Soft delete a post (only by the author)"""
        post = self.db.query(Post).filter(
            Post.id == post_id,
            Post.user_id == user_id,
            Post.is_deleted == False
        ).first()
        
        if not post:
            return False
        
        post.is_deleted = True
        self.db.commit()
        return True

    def add_attachment_to_post(self, post_id: int, attachment_data: AttachmentCreate, user_id: int) -> Optional[AttachmentResponse]:
        """Add an attachment to a post"""
        # Verify the post exists and belongs to the user
        post = self.db.query(Post).filter(
            Post.id == post_id,
            Post.user_id == user_id,
            Post.is_deleted == False
        ).first()
        
        if not post:
            return None
        
        attachment = Attachment(
            post_id=post_id,
            file_type=attachment_data.file_type,
            file_path=attachment_data.file_path,
            file_name=attachment_data.file_name,
            file_size=attachment_data.file_size,
            mime_type=attachment_data.mime_type,
            file_metadata=attachment_data.file_metadata
        )
        
        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)
        
        return AttachmentResponse.from_orm(attachment)

    def delete_attachment(self, attachment_id: int, user_id: int) -> bool:
        """Delete an attachment (only by the author)"""
        # Find the attachment and check if user owns the post
        attachment = self.db.query(Attachment).join(Post).filter(
            Attachment.id == attachment_id,
            Post.user_id == user_id,
            Post.is_deleted == False
        ).first()
        
        if not attachment:
            return False
        
        self.db.delete(attachment)
        self.db.commit()
        return True

    def add_reaction_to_post(self, post_id: int, reaction_data: PostReactionCreate, user_id: int) -> Optional[PostReaction]:
        """Add or update a reaction to a post"""
        # Check if post exists
        post = self.db.query(Post).filter(Post.id == post_id, Post.is_deleted == False).first()
        if not post:
            return None
        
        # Check if user already reacted with this emoji
        existing_reaction = self.db.query(PostReaction).filter(
            PostReaction.post_id == post_id,
            PostReaction.user_id == user_id,
            PostReaction.emoji == reaction_data.emoji
        ).first()
        
        if existing_reaction:
            return existing_reaction
        
        # Create new reaction
        reaction = PostReaction(
            post_id=post_id,
            user_id=user_id,
            emoji=reaction_data.emoji
        )
        
        self.db.add(reaction)
        self.db.commit()
        self.db.refresh(reaction)
        return reaction

    def remove_reaction_from_post(self, post_id: int, emoji: str, user_id: int) -> bool:
        """Remove a reaction from a post"""
        reaction = self.db.query(PostReaction).filter(
            PostReaction.post_id == post_id,
            PostReaction.user_id == user_id,
            PostReaction.emoji == emoji
        ).first()
        
        if not reaction:
            return False
        
        self.db.delete(reaction)
        self.db.commit()
        return True

    def create_comment(self, post_id: int, comment_data: CommentCreate, user_id: int) -> Optional[CommentResponse]:
        """Create a comment on a post"""
        # Check if post exists
        post = self.db.query(Post).filter(Post.id == post_id, Post.is_deleted == False).first()
        if not post:
            return None
        
        comment = Comment(
            post_id=post_id,
            user_id=user_id,
            content=comment_data.content,
            parent_comment_id=comment_data.parent_comment_id
        )
        
        self.db.add(comment)
        
        # Increment comment count
        post.comment_count += 1
        
        self.db.commit()
        self.db.refresh(comment)
        
        return self._format_comment_response(comment)

    def get_comments(self, post_id: int, skip: int = 0, limit: int = 50) -> List[CommentResponse]:
        """Get comments for a post (only top-level comments)"""
        comments = self.db.query(Comment).options(
            joinedload(Comment.user),
            joinedload(Comment.attachments),
            joinedload(Comment.reactions).joinedload(CommentReaction.user),
            joinedload(Comment.replies).joinedload(Comment.user),
            joinedload(Comment.replies).joinedload(Comment.attachments),
            joinedload(Comment.replies).joinedload(Comment.reactions).joinedload(CommentReaction.user)
        ).filter(
            Comment.post_id == post_id,
            Comment.parent_comment_id.is_(None),
            Comment.is_deleted == False
        ).order_by(asc(Comment.created_at)).offset(skip).limit(limit).all()
        
        return [self._format_comment_response(comment) for comment in comments]

    def update_comment(self, comment_id: int, comment_data: CommentUpdate, user_id: int) -> Optional[CommentResponse]:
        """Update a comment (only by the author)"""
        comment = self.db.query(Comment).filter(
            Comment.id == comment_id,
            Comment.user_id == user_id,
            Comment.is_deleted == False
        ).first()
        
        if not comment:
            return None
        
        if comment_data.content is not None:
            comment.content = comment_data.content
        
        self.db.commit()
        self.db.refresh(comment)
        return self._format_comment_response(comment)

    def delete_comment(self, comment_id: int, user_id: int) -> bool:
        """Soft delete a comment (only by the author)"""
        comment = self.db.query(Comment).filter(
            Comment.id == comment_id,
            Comment.user_id == user_id,
            Comment.is_deleted == False
        ).first()
        
        if not comment:
            return False
        
        # Decrement comment count
        post = self.db.query(Post).filter(Post.id == comment.post_id).first()
        if post and post.comment_count > 0:
            post.comment_count -= 1
        
        comment.is_deleted = True
        self.db.commit()
        return True

    def add_reaction_to_comment(self, comment_id: int, reaction_data: CommentReactionCreate, user_id: int) -> Optional[CommentReaction]:
        """Add or update a reaction to a comment"""
        # Check if comment exists
        comment = self.db.query(Comment).filter(Comment.id == comment_id, Comment.is_deleted == False).first()
        if not comment:
            return None
        
        # Check if user already reacted with this emoji
        existing_reaction = self.db.query(CommentReaction).filter(
            CommentReaction.comment_id == comment_id,
            CommentReaction.user_id == user_id,
            CommentReaction.emoji == reaction_data.emoji
        ).first()
        
        if existing_reaction:
            return existing_reaction
        
        # Create new reaction
        reaction = CommentReaction(
            comment_id=comment_id,
            user_id=user_id,
            emoji=reaction_data.emoji
        )
        
        self.db.add(reaction)
        self.db.commit()
        self.db.refresh(reaction)
        return reaction

    def remove_reaction_from_comment(self, comment_id: int, emoji: str, user_id: int) -> bool:
        """Remove a reaction from a comment"""
        reaction = self.db.query(CommentReaction).filter(
            CommentReaction.comment_id == comment_id,
            CommentReaction.user_id == user_id,
            CommentReaction.emoji == emoji
        ).first()
        
        if not reaction:
            return False
        
        self.db.delete(reaction)
        self.db.commit()
        return True

    def _format_post_response(self, post: Post) -> PostResponse:
        """Format a post with all related data"""
        # Count reactions by emoji
        reaction_counts = {}
        for reaction in post.reactions:
            emoji = reaction.emoji
            reaction_counts[emoji] = reaction_counts.get(emoji, 0) + 1
        
        # Use the database comment_count for performance
        comment_count = post.comment_count
        
        # Comments are loaded separately to avoid N+1 queries
        # For now, return empty comments array - they can be loaded via get_comments endpoint
        formatted_comments = []
        
        # Format user with proper medal counts
        user_data = None
        if post.user:
            user_data = {
                "id": post.user.id,
                "username": post.user.username,
                "email": post.user.email,
                "full_name": post.user.full_name,
                "is_active": post.user.is_active,
                "created_at": post.user.created_at,
                "role_id": post.user.role_id,
                "permissions": getattr(post.user, 'permissions', None),
                "medals": post.user.get_medal_counts() if hasattr(post.user, 'get_medal_counts') else {"gold": 0, "silver": 0, "bronze": 0, "wood": 0}
            }

        # Format reactions with proper user data
        formatted_reactions = []
        for react in post.reactions:
            reaction_user_data = None
            if react.user:
                reaction_user_data = {
                    "id": react.user.id,
                    "username": react.user.username,
                    "email": react.user.email,
                    "full_name": react.user.full_name,
                    "is_active": react.user.is_active,
                    "created_at": react.user.created_at,
                    "role_id": react.user.role_id,
                    "permissions": getattr(react.user, 'permissions', None),
                    "medals": react.user.get_medal_counts() if hasattr(react.user, 'get_medal_counts') else {"gold": 0, "silver": 0, "bronze": 0, "wood": 0}
                }
            
            formatted_reactions.append({
                "id": react.id,
                "user_id": react.user_id,
                "emoji": react.emoji,
                "created_at": react.created_at,
                "user": reaction_user_data
            })

        return PostResponse(
            id=post.id,
            user_id=post.user_id,
            content=post.content,
            created_at=post.created_at,
            updated_at=post.updated_at,
            is_deleted=post.is_deleted,
            user=user_data,
            attachments=[AttachmentResponse.from_orm(att) for att in post.attachments],
            comments=formatted_comments,
            reactions=formatted_reactions,
            reaction_counts=reaction_counts,
            comment_count=comment_count
        )

    def _format_comment_response(self, comment: Comment) -> CommentResponse:
        """Format a comment with all related data"""
        # Count reactions by emoji
        reaction_counts = {}
        for reaction in comment.reactions:
            emoji = reaction.emoji
            reaction_counts[emoji] = reaction_counts.get(emoji, 0) + 1
        
        # Format replies
        formatted_replies = []
        for reply in comment.replies:
            if not reply.is_deleted:
                formatted_replies.append(self._format_comment_response(reply))
        
        # Format user with proper medal counts
        user_data = None
        if comment.user:
            user_data = {
                "id": comment.user.id,
                "username": comment.user.username,
                "email": comment.user.email,
                "full_name": comment.user.full_name,
                "is_active": comment.user.is_active,
                "created_at": comment.user.created_at,
                "role_id": comment.user.role_id,
                "permissions": getattr(comment.user, 'permissions', None),
                "medals": comment.user.get_medal_counts() if hasattr(comment.user, 'get_medal_counts') else {"gold": 0, "silver": 0, "bronze": 0, "wood": 0}
            }

        return CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            user_id=comment.user_id,
            content=comment.content,
            parent_comment_id=comment.parent_comment_id,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            is_deleted=comment.is_deleted,
            user=user_data,
            attachments=[AttachmentResponse.from_orm(att) for att in comment.attachments],
            reactions=[CommentReactionResponse.from_orm(react) for react in comment.reactions],
            reaction_counts=reaction_counts,
            replies=formatted_replies
        )
