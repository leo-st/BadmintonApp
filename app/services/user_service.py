from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from app.models.models import User
from app.models.access_control import Role, Permission, PermissionGroup, RolesPermissions
from app.schemas.schemas import UserCreate, UserUpdate, RoleCreate, RoleUpdate
from app.core.auth import get_password_hash


def get_all_users(db: Session) -> List[Dict]:
    """Get all users with their roles and medals"""
    users = db.query(User).all()
    result = []
    
    for user in users:
        # Get role name if role exists
        role_name = None
        if user.role_id:
            from app.models.access_control import Role
            role = db.query(Role).filter(Role.role_id == user.role_id).first()
            role_name = role.role_name if role else None
        
        # Get medal counts
        medal_counts = user.get_medal_counts()
        
        # Get permissions
        permissions = user.get_permissions(db)
        
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "role_id": user.role_id,
            "role_name": role_name,
            "permissions": permissions,
            "medals": medal_counts
        })
    
    return result


def get_user_with_id(user_id: int, db: Session) -> Dict:
    """Get a specific user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    medal_counts = user.get_medal_counts()
    permissions = user.get_permissions(db)
    role_name = user.role.role_name if user.role else None
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "role_id": user.role_id,
        "role_name": role_name,
        "permissions": permissions,
        "medals": medal_counts,
        "profile_picture_url": user.profile_picture_url,
        "profile_picture_updated_at": user.profile_picture_updated_at
    }


def get_user_me(user: User, db: Session) -> Dict:
    """Get current user's profile"""
    medal_counts = user.get_medal_counts()
    permissions = user.get_permissions(db)
    role_name = user.role.role_name if user.role else None
    
    import logging
    logger = logging.getLogger("app.services.user_service")
    logger.info(f"get_user_me - user.profile_picture_url: {user.profile_picture_url}")
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "role_id": user.role_id,
        "role_name": role_name,
        "permissions": permissions,
        "medals": medal_counts,
        "profile_picture_url": user.profile_picture_url,
        "profile_picture_updated_at": user.profile_picture_updated_at
    }


def create_user(user_create: UserCreate, db: Session) -> Dict:
    """Create a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user_create.username) | (User.email == user_create.email)
    ).first()
    if existing_user:
        raise ValueError("Username or email already registered")
    
    # Create new user with default role (user role)
    hashed_password = get_password_hash(user_create.password)
    db_user = User(
        username=user_create.username,
        email=user_create.email,
        full_name=user_create.full_name,
        hashed_password=hashed_password,
        role_id=2  # Default to user role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return get_user_with_id(db_user.id, db)


def update_user_with_id(user_id: int, user_update: UserUpdate, db: Session) -> Dict:
    """Update an existing user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    # Update fields if provided
    if user_update.username is not None:
        user.username = user_update.username
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.role_id is not None:
        user.role_id = user_update.role_id
    
    db.commit()
    db.refresh(user)
    
    return get_user_with_id(user_id, db)


def delete_user_with_id(user_id: int, db: Session) -> Dict:
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


def get_all_roles(db: Session) -> List[Dict]:
    """Get all roles"""
    roles = db.query(Role).all()
    result = []
    
    for role in roles:
        # Get permissions for this role
        permissions = db.query(Permission.permission_key).join(RolesPermissions).filter(
            RolesPermissions.role_id == role.role_id
        ).all()
        
        result.append({
            "role_id": role.role_id,
            "role_name": role.role_name,
            "locked": role.locked,
            "permissions": [perm[0] for perm in permissions]
        })
    
    return result


def create_new_role(role_create: RoleCreate, db: Session) -> Dict:
    """Create a new role"""
    # Check if role name already exists
    existing_role = db.query(Role).filter(Role.role_name == role_create.role_name).first()
    if existing_role:
        raise ValueError("Role name already exists")
    
    db_role = Role(**role_create.dict())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    
    return {
        "role_id": db_role.role_id,
        "role_name": db_role.role_name,
        "locked": db_role.locked,
        "permissions": []
    }


def get_role_with_id(role_id: int, db: Session) -> Dict:
    """Get a specific role by ID"""
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise ValueError("Role not found")
    
    # Get permissions for this role
    permissions = db.query(Permission.permission_key).join(RolesPermissions).filter(
        RolesPermissions.role_id == role.role_id
    ).all()
    
    return {
        "role_id": role.role_id,
        "role_name": role.role_name,
        "locked": role.locked,
        "permissions": [perm[0] for perm in permissions]
    }


def put_role_with_id(role_id: int, role_update: RoleUpdate, db: Session) -> Dict:
    """Update an existing role"""
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise ValueError("Role not found")
    
    # Update fields if provided
    if role_update.role_name is not None:
        role.role_name = role_update.role_name
    if role_update.locked is not None:
        role.locked = role_update.locked
    
    db.commit()
    db.refresh(role)
    
    return get_role_with_id(role_id, db)


def delete_role_with_id(role_id: int, db: Session) -> Dict:
    """Delete a role"""
    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise ValueError("Role not found")
    
    # Check if role is locked
    if role.locked:
        raise ValueError("Cannot delete locked role")
    
    db.delete(role)
    db.commit()
    
    return {"message": "Role deleted successfully"}


def get_all_permissions(db: Session) -> List[Dict]:
    """Get all permissions"""
    permissions = db.query(Permission).all()
    result = []
    
    for permission in permissions:
        result.append({
            "permission_id": permission.permission_id,
            "permission_key": permission.permission_key,
            "permission_group_id": permission.permission_group_id
        })
    
    return result


def get_all_permission_groups(db: Session) -> List[Dict]:
    """Get all permission groups"""
    groups = db.query(PermissionGroup).all()
    result = []
    
    for group in groups:
        result.append({
            "permission_group_id": group.permission_group_id,
            "permission_group_name": group.permission_group_name
        })
    
    return result
