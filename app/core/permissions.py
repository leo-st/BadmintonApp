from functools import wraps
from typing import List, Union
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User
from app.core.auth import get_current_active_user


def require_permission(permission: str):
    """
    Decorator to require a specific permission for an endpoint
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user and db from kwargs
            current_user: User = kwargs.get('current_user')
            db: Session = kwargs.get('db')
            
            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check if user has the required permission
            if not current_user.has_permission(db, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_permissions(permissions: List[str], require_all: bool = True):
    """
    Decorator to require multiple permissions for an endpoint
    require_all: if True, user must have ALL permissions; if False, user needs ANY permission
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user and db from kwargs
            current_user: User = kwargs.get('current_user')
            db: Session = kwargs.get('db')
            
            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_permissions = current_user.get_permissions(db)
            
            if require_all:
                # User must have ALL permissions
                if not all(perm in user_permissions for perm in permissions):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"All permissions required: {permissions}"
                    )
            else:
                # User must have ANY permission
                if not any(perm in user_permissions for perm in permissions):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"One of these permissions required: {permissions}"
                    )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_admin(func):
    """
    Decorator to require admin role
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Get current user and db from kwargs
        current_user: User = kwargs.get('current_user')
        db: Session = kwargs.get('db')
        
        if not current_user or not db:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        if not current_user.is_admin(db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin role required"
            )
        
        return await func(*args, **kwargs)
    return wrapper


def get_user_with_permissions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get current user with permissions loaded
    """
    # Load permissions for the user
    permissions = current_user.get_permissions(db)
    # Add permissions as an attribute to the user object
    setattr(current_user, 'permissions', permissions)
    return current_user


# Permission constants for easy reference
class Permissions:
    ADMIN = "admin"
    USER = "user"
    
    # User permissions
    USERS_CAN_VIEW_USER_LIST = "users_can_view_user_list"
    USERS_CAN_CREATE_USER = "users_can_create_user"
    USERS_CAN_EDIT_OTHER_USERS = "users_can_edit_other_users"
    
    # Match permissions
    MATCHES_CAN_VIEW_ALL = "matches_can_view_all"
    MATCHES_CAN_CREATE = "matches_can_create"
    MATCHES_CAN_VERIFY = "matches_can_verify"
    MATCHES_CAN_EDIT_ALL = "matches_can_edit_all"
    
    # Tournament permissions
    TOURNAMENTS_CAN_VIEW_ALL = "tournaments_can_view_all"
    TOURNAMENTS_CAN_CREATE = "tournaments_can_create"
    TOURNAMENTS_CAN_EDIT_ALL = "tournaments_can_edit_all"
