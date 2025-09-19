#!/usr/bin/env python3
"""
Database initialization script
Run this to create tables and add sample data
"""

from datetime import datetime, timedelta

from app.core.auth import get_password_hash
from app.core.database import SessionLocal, engine
from app.models.models import Base, Match, MatchStatus, MatchType, Tournament, User
from app.models.access_control import Role, Permission, PermissionGroup, RolesPermissions
from app.models.medals import Medal
from app.models.tournament_invitations import TournamentParticipant, TournamentInvitation


def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if users already exist
        if db.query(User).first():
            print("Database already initialized")
            return

        # Create access control data first
        print("Creating access control system...")
        
        # Create roles
        admin_role = Role(role_id=1, role_name="admin", locked=True)
        user_role = Role(role_id=2, role_name="user", locked=True)
        db.add(admin_role)
        db.add(user_role)
        db.commit()

        # Create permission group
        permission_group = PermissionGroup(permission_group_id=1, permission_group_name="badminton_app")
        db.add(permission_group)
        db.commit()

        # Create permissions
        permissions = [
            Permission(permission_id=1, permission_key="admin", permission_group_id=1),
            Permission(permission_id=2, permission_key="users_can_view_user_list", permission_group_id=1),
            Permission(permission_id=3, permission_key="users_can_create_user", permission_group_id=1),
            Permission(permission_id=4, permission_key="users_can_edit_other_users", permission_group_id=1),
            Permission(permission_id=5, permission_key="matches_can_view_all", permission_group_id=1),
            Permission(permission_id=6, permission_key="matches_can_create", permission_group_id=1),
            Permission(permission_id=7, permission_key="matches_can_verify", permission_group_id=1),
            Permission(permission_id=8, permission_key="matches_can_edit_all", permission_group_id=1),
            Permission(permission_id=9, permission_key="tournaments_can_view_all", permission_group_id=1),
            Permission(permission_id=10, permission_key="tournaments_can_create", permission_group_id=1),
            Permission(permission_id=11, permission_key="tournaments_can_edit_all", permission_group_id=1),
            Permission(permission_id=12, permission_key="user", permission_group_id=1),
        ]
        
        for permission in permissions:
            db.add(permission)
        db.commit()

        # Assign permissions to roles
        # Admin gets all permissions
        for permission in permissions:
            role_permission = RolesPermissions(role_id=1, permission_id=permission.permission_id)
            db.add(role_permission)
        
        # User gets basic permissions
        user_permissions = [2, 5, 6, 7, 9, 12]  # Basic permissions for regular users (added matches_can_verify)
        for perm_id in user_permissions:
            role_permission = RolesPermissions(role_id=2, permission_id=perm_id)
            db.add(role_permission)
        
        db.commit()
        print("Access control system created!")

        # Create sample users
        users = [
            User(
                username="alice",
                email="alice@example.com",
                full_name="Alice Johnson",
                hashed_password=get_password_hash("password123"),
                role_id=1  # Admin
            ),
            User(
                username="bob",
                email="bob@example.com",
                full_name="Bob Smith",
                hashed_password=get_password_hash("password123"),
                role_id=2  # User
            ),
            User(
                username="charlie",
                email="charlie@example.com",
                full_name="Charlie Brown",
                hashed_password=get_password_hash("password123"),
                role_id=2  # User
            ),
            User(
                username="diana",
                email="diana@example.com",
                full_name="Diana Prince",
                hashed_password=get_password_hash("password123"),
                role_id=2  # User
            )
        ]

        for user in users:
            db.add(user)

        db.commit()

        # Create sample tournament
        tournament = Tournament(
            name="Spring Championship 2024",
            description="Annual spring badminton tournament",
            start_date=datetime.now() + timedelta(days=7),
            end_date=datetime.now() + timedelta(days=14)
        )
        db.add(tournament)
        db.commit()

        # Create sample matches
        alice = db.query(User).filter(User.username == "alice").first()
        bob = db.query(User).filter(User.username == "bob").first()
        charlie = db.query(User).filter(User.username == "charlie").first()
        diana = db.query(User).filter(User.username == "diana").first()

        matches = [
            Match(
                player1_id=alice.id,
                player2_id=bob.id,
                player1_score=21,
                player2_score=18,
                match_type=MatchType.CASUAL,
                status=MatchStatus.VERIFIED,
                submitted_by_id=alice.id,
                verified_by_id=bob.id,
                notes="Great match!",
                verified_at=datetime.now()
            ),
            Match(
                player1_id=charlie.id,
                player2_id=diana.id,
                player1_score=19,
                player2_score=21,
                match_type=MatchType.CASUAL,
                status=MatchStatus.PENDING_VERIFICATION,
                submitted_by_id=charlie.id,
                notes="Waiting for verification"
            ),
            Match(
                player1_id=alice.id,
                player2_id=diana.id,
                player1_score=21,
                player2_score=15,
                match_type=MatchType.TOURNAMENT,
                status=MatchStatus.VERIFIED,
                submitted_by_id=alice.id,
                verified_by_id=diana.id,
                tournament_id=tournament.id,
                verified_at=datetime.now()
            )
        ]

        for match in matches:
            db.add(match)

        db.commit()
        print("Database initialized with sample data!")
        print("Sample users created:")
        print("- alice (password: password123) - ADMIN")
        print("- bob (password: password123) - USER")
        print("- charlie (password: password123) - USER")
        print("- diana (password: password123) - USER")

    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
