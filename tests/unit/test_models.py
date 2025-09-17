import pytest
from datetime import datetime
from app.models.models import User, Match, Tournament
from app.common.enums import MatchType, MatchStatus

class TestModels:
    def test_user_creation(self, test_user_data):
        """Test user model creation."""
        user = User(
            username=test_user_data["username"],
            email=test_user_data["email"],
            full_name=test_user_data["full_name"],
            hashed_password="hashed_password",
            is_active=True
        )
        
        assert user.username == test_user_data["username"]
        assert user.email == test_user_data["email"]
        assert user.full_name == test_user_data["full_name"]
        assert user.is_active is True
    
    def test_match_creation(self, test_user_data, test_user_2_data):
        """Test match model creation."""
        match = Match(
            player1_id=1,
            player2_id=2,
            player1_score=21,
            player2_score=18,
            match_type=MatchType.CASUAL,
            status=MatchStatus.PENDING_VERIFICATION,
            submitted_by_id=1
        )
        
        assert match.player1_score == 21
        assert match.player2_score == 18
        assert match.match_type == MatchType.CASUAL
        assert match.status == MatchStatus.PENDING_VERIFICATION
    
    def test_tournament_creation(self):
        """Test tournament model creation."""
        tournament = Tournament(
            name="Test Tournament",
            description="A test tournament",
            start_date=datetime.now(),
            end_date=datetime.now(),
            is_active=True
        )
        
        assert tournament.name == "Test Tournament"
        assert tournament.description == "A test tournament"
        assert tournament.is_active is True
