from app.core.config import settings

class TestPlacement:
    def test_list_resumes(self, client, auth_headers):
        response = client.get(
            f"{settings.API_V1_STR}/placement/resumes",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_create_resume(self, client, auth_headers):
        response = client.post(
            f"{settings.API_V1_STR}/placement/resumes",
            headers=auth_headers,
            json={
                "title": "Test Resume",
                "full_name": "John Doe",
                "email": "john@test.com",
                "sections": [{"type": "education", "title": "Education", "items": ["B.Tech CSE"]}],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Resume"
        assert "id" in data
