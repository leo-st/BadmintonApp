
class TestAuthEndpoints:
    def test_register_user_success(self, client, test_user_data):
        """Test successful user registration."""
        response = client.post("/auth/register", json=test_user_data)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user_data["username"]
        assert data["email"] == test_user_data["email"]
        assert data["full_name"] == test_user_data["full_name"]
        assert "id" in data
        assert "created_at" in data

    def test_register_user_duplicate_username(self, client, test_user_data):
        """Test registration with duplicate username."""
        # Register first user
        client.post("/auth/register", json=test_user_data)

        # Try to register with same username
        duplicate_data = test_user_data.copy()
        duplicate_data["email"] = "different@example.com"
        response = client.post("/auth/register", json=duplicate_data)

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_register_user_duplicate_email(self, client, test_user_data):
        """Test registration with duplicate email."""
        # Register first user
        client.post("/auth/register", json=test_user_data)

        # Try to register with same email
        duplicate_data = test_user_data.copy()
        duplicate_data["username"] = "differentuser"
        response = client.post("/auth/register", json=duplicate_data)

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_login_success(self, client, test_user_data):
        """Test successful login."""
        # Register user first
        client.post("/auth/register", json=test_user_data)

        # Login
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
        response = client.post("/auth/token", data=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, test_user_data):
        """Test login with wrong password."""
        # Register user first
        client.post("/auth/register", json=test_user_data)

        # Login with wrong password
        login_data = {
            "username": test_user_data["username"],
            "password": "wrongpassword"
        }
        response = client.post("/auth/token", data=login_data)

        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user."""
        login_data = {
            "username": "nonexistent",
            "password": "password"
        }
        response = client.post("/auth/token", data=login_data)

        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]
