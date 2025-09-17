from app.core.auth import authenticate_user, get_password_hash, verify_password
from app.models.models import User


class TestAuth:
    def test_password_hashing(self):
        """Test password hashing and verification."""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)

    def test_authenticate_user_success(self, db_session, test_user_data):
        """Test successful user authentication."""
        # Create a test user
        user = User(
            username=test_user_data["username"],
            email=test_user_data["email"],
            full_name=test_user_data["full_name"],
            hashed_password=get_password_hash(test_user_data["password"])
        )
        db_session.add(user)
        db_session.commit()

        # Test authentication
        authenticated_user = authenticate_user(
            db_session,
            test_user_data["username"],
            test_user_data["password"]
        )

        assert authenticated_user is not None
        assert authenticated_user.username == test_user_data["username"]

    def test_authenticate_user_wrong_password(self, db_session, test_user_data):
        """Test authentication with wrong password."""
        # Create a test user
        user = User(
            username=test_user_data["username"],
            email=test_user_data["email"],
            full_name=test_user_data["full_name"],
            hashed_password=get_password_hash(test_user_data["password"])
        )
        db_session.add(user)
        db_session.commit()

        # Test authentication with wrong password
        authenticated_user = authenticate_user(
            db_session,
            test_user_data["username"],
            "wrongpassword"
        )

        assert authenticated_user is False

    def test_authenticate_user_nonexistent(self, db_session):
        """Test authentication with nonexistent user."""
        authenticated_user = authenticate_user(
            db_session,
            "nonexistent",
            "password"
        )

        assert authenticated_user is False
