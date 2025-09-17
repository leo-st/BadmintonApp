#!/usr/bin/env python3
"""
Database initialization script
Run this to create tables and add sample data
"""

from datetime import datetime, timedelta

from app.core.auth import get_password_hash
from app.core.database import SessionLocal, engine
from app.models.models import Base, Match, MatchStatus, MatchType, Tournament, User


def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if users already exist
        if db.query(User).first():
            print("Database already initialized")
            return

        # Create sample users
        users = [
            User(
                username="alice",
                email="alice@example.com",
                full_name="Alice Johnson",
                hashed_password=get_password_hash("password123")
            ),
            User(
                username="bob",
                email="bob@example.com",
                full_name="Bob Smith",
                hashed_password=get_password_hash("password123")
            ),
            User(
                username="charlie",
                email="charlie@example.com",
                full_name="Charlie Brown",
                hashed_password=get_password_hash("password123")
            ),
            User(
                username="diana",
                email="diana@example.com",
                full_name="Diana Prince",
                hashed_password=get_password_hash("password123")
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
        print("- alice (password: password123)")
        print("- bob (password: password123)")
        print("- charlie (password: password123)")
        print("- diana (password: password123)")

    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
