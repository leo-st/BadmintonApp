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
    __table_args__ = {"schema": "access_control"}

    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(Text, nullable=False, default="Neuer Benutzertyp")
    locked = Column(Boolean, nullable=False, default=True)

    # Relationships
    users = relationship("AccessControlUser", back_populates="role")
    role_permissions = relationship("RolesPermissions", back_populates="role", lazy="joined")
    permissions = relationship("Permission", secondary="access_control.RolesPermissions", lazy="joined", overlaps="role_permissions")


class PermissionGroup(Base):
    __tablename__ = "PermissionGroup"
    __table_args__ = {"schema": "access_control"}

    permission_group_id = Column(Integer, primary_key=True, index=True)
    permission_group_name = Column(Text, nullable=False, unique=True, default="permission_group_x")

    # Relationships
    permissions = relationship("Permission", back_populates="permission_group")


class Permission(Base):
    __tablename__ = "Permission"
    __table_args__ = {"schema": "access_control"}

    permission_id = Column(Integer, primary_key=True, index=True)
    permission_key = Column(Text, nullable=False, unique=True, default="can_do_x")
    permission_group_id = Column(Integer, ForeignKey("access_control.PermissionGroup.permission_group_id"), nullable=True)

    # Relationships
    permission_group = relationship("PermissionGroup", back_populates="permissions")
    role_permissions = relationship("RolesPermissions", back_populates="permission", overlaps="permissions")


class AccessControlUser(Base):
    __tablename__ = "User"
    __table_args__ = {"schema": "access_control"}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), nullable=False)
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    enabled = Column(Boolean, nullable=False)
    welcome_message = Column(Text, nullable=True)
    language = Column(String(255), nullable=False, default="DE")
    pw_hash = Column(String(255), nullable=False)
    pw_reset_required = Column(Boolean, nullable=False, default=True)
    role_id = Column(Integer, ForeignKey("access_control.Role.role_id"), nullable=True)

    # Relationships
    role = relationship("Role", back_populates="users")


class RolesPermissions(Base):
    __tablename__ = "RolesPermissions"
    __table_args__ = {"schema": "access_control"}

    role_id = Column(Integer, ForeignKey("access_control.Role.role_id"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("access_control.Permission.permission_id"), primary_key=True)

    # Relationships
    role = relationship("Role", back_populates="role_permissions", overlaps="permissions")
    permission = relationship("Permission", back_populates="role_permissions", overlaps="permissions")
