from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Role(Base):
    __tablename__ = "Role"
    # Removed schema for Railway compatibility

    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(Text, nullable=False, default="Neuer Benutzertyp")
    locked = Column(Boolean, nullable=False, default=True)

    # Relationships - Note: User relationship is defined in models.py
    role_permissions = relationship("RolesPermissions", back_populates="role", lazy="joined")
    permissions = relationship("Permission", secondary="RolesPermissions", lazy="joined", overlaps="role_permissions")


class PermissionGroup(Base):
    __tablename__ = "PermissionGroup"
    # Removed schema for Railway compatibility

    permission_group_id = Column(Integer, primary_key=True, index=True)
    permission_group_name = Column(Text, nullable=False, unique=True, default="permission_group_x")

    # Relationships
    permissions = relationship("Permission", back_populates="permission_group")


class Permission(Base):
    __tablename__ = "Permission"
    # Removed schema for Railway compatibility

    permission_id = Column(Integer, primary_key=True, index=True)
    permission_key = Column(Text, nullable=False, unique=True, default="can_do_x")
    permission_group_id = Column(Integer, ForeignKey("PermissionGroup.permission_group_id"), nullable=True)

    # Relationships
    permission_group = relationship("PermissionGroup", back_populates="permissions")
    role_permissions = relationship("RolesPermissions", back_populates="permission", overlaps="permissions")


# AccessControlUser removed - using User from models.py to avoid duplicate table definition


class RolesPermissions(Base):
    __tablename__ = "RolesPermissions"
    # Removed schema for Railway compatibility

    role_id = Column(Integer, ForeignKey("Role.role_id"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("Permission.permission_id"), primary_key=True)

    # Relationships
    role = relationship("Role", back_populates="role_permissions", overlaps="permissions")
    permission = relationship("Permission", back_populates="role_permissions", overlaps="permissions")
