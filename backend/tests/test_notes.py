from app.core.config import settings

class TestNotes:
    def test_list_notes(self, client, auth_headers):
        response = client.get(
            f"{settings.API_V1_STR}/notes",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_generate_note(self, client, auth_headers):
        response = client.post(
            f"{settings.API_V1_STR}/notes/generate",
            headers=auth_headers,
            json={
                "note_type": "summary",
                "topic": "Python Basics",
                "subject": "Computer Science",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data

    def test_get_note_types(self, client):
        response = client.get(f"{settings.API_V1_STR}/notes/types")
        assert response.status_code == 200
        assert len(response.json()) > 0
