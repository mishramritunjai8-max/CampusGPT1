from app.core.config import settings

class TestAuth:
    def test_login_success(self, client):
        response = client.post(
            f"{settings.API_V1_STR}/auth/local/login",
            json={"email": "student@test.com", "password": "any", "role": "student"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_me_endpoint(self, client, auth_headers):
        response = client.get(
            f"{settings.API_V1_STR}/auth/me",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "role" in data

    def test_unauthorized_access(self, client):
        response = client.get(f"{settings.API_V1_STR}/auth/me")
        assert response.status_code == 401
