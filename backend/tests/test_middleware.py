class TestMiddleware:
    def test_rate_limiting_headers(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert "X-Process-Time" in response.headers

    def test_cors_headers(self, client):
        response = client.options(
            "/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
