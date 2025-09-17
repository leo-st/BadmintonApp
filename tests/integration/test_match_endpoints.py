
class TestMatchEndpoints:
    def test_create_match_success(self, client, test_user_data, test_user_2_data):
        """Test successful match creation."""
        # Register two users
        client.post("/auth/register", json=test_user_data)
        client.post("/auth/register", json=test_user_2_data)

        # Login as first user
        login_response = client.post("/auth/token", data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create match
        match_data = {
            "player1_id": 1,
            "player2_id": 2,
            "player1_score": 21,
            "player2_score": 18,
            "match_type": "casual",
            "notes": "Great match!"
        }
        response = client.post("/matches", json=match_data, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["player1_score"] == 21
        assert data["player2_score"] == 18
        assert data["match_type"] == "casual"
        assert data["status"] == "pending_verification"
        assert data["submitted_by_id"] == 1

    def test_create_match_same_player(self, client, test_user_data):
        """Test match creation with same player."""
        # Register user
        client.post("/auth/register", json=test_user_data)

        # Login
        login_response = client.post("/auth/token", data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Try to create match with same player
        match_data = {
            "player1_id": 1,
            "player2_id": 1,
            "player1_score": 21,
            "player2_score": 18,
            "match_type": "casual"
        }
        response = client.post("/matches", json=match_data, headers=headers)

        assert response.status_code == 400
        assert "cannot play against themselves" in response.json()["detail"]

    def test_create_match_nonexistent_player(self, client, test_user_data):
        """Test match creation with nonexistent player."""
        # Register user
        client.post("/auth/register", json=test_user_data)

        # Login
        login_response = client.post("/auth/token", data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Try to create match with nonexistent player
        match_data = {
            "player1_id": 1,
            "player2_id": 999,
            "player1_score": 21,
            "player2_score": 18,
            "match_type": "casual"
        }
        response = client.post("/matches", json=match_data, headers=headers)

        assert response.status_code == 400
        assert "not found" in response.json()["detail"]

    def test_get_matches(self, client, test_user_data, test_user_2_data):
        """Test getting matches list."""
        # Register users and create match
        client.post("/auth/register", json=test_user_data)
        client.post("/auth/register", json=test_user_2_data)

        login_response = client.post("/auth/token", data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create match
        match_data = {
            "player1_id": 1,
            "player2_id": 2,
            "player1_score": 21,
            "player2_score": 18,
            "match_type": "casual"
        }
        client.post("/matches", json=match_data, headers=headers)

        # Get matches
        response = client.get("/matches")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["player1_score"] == 21

    def test_verify_match_success(self, client, test_user_data, test_user_2_data):
        """Test successful match verification."""
        # Register users
        client.post("/auth/register", json=test_user_data)
        client.post("/auth/register", json=test_user_2_data)

        # Login as first user and create match
        login_response = client.post("/auth/token", data={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        match_data = {
            "player1_id": 1,
            "player2_id": 2,
            "player1_score": 21,
            "player2_score": 18,
            "match_type": "casual"
        }
        match_response = client.post("/matches", json=match_data, headers=headers)
        match_id = match_response.json()["id"]

        # Login as second user and verify match
        login_response2 = client.post("/auth/token", data={
            "username": test_user_2_data["username"],
            "password": test_user_2_data["password"]
        })
        token2 = login_response2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        verification_data = {
            "verified": True,
            "notes": "Confirmed!"
        }
        response = client.post(f"/matches/{match_id}/verify", json=verification_data, headers=headers2)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "verified"
        assert data["verified_by_id"] == 2
