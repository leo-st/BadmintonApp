
class TestUserEndpoints:
    def test_get_current_user_success(self, client, test_user_data):
        """Test getting current user info."""
        # Register user
        client.post("/auth/register", json=test_user_data)

        # Login
        login_response = client.post("/auth/token", data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Get current user
        response = client.get("/users/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user_data["username"]
        assert data["email"] == test_user_data["email"]
        assert data["full_name"] == test_user_data["full_name"]

    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without authentication."""
        response = client.get("/users/me")
        assert response.status_code == 401

    def test_get_users_list(self, client, test_user_data, test_user_2_data):
        """Test getting users list."""
        # Register users
        client.post("/auth/register", json=test_user_data)
        client.post("/auth/register", json=test_user_2_data)

        # Get users list
        response = client.get("/users")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        usernames = [user["username"] for user in data]
        assert test_user_data["username"] in usernames
        assert test_user_2_data["username"] in usernames
