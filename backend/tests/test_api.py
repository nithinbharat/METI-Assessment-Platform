# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
import httpx
# pyrefly: ignore [missing-import]
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_root_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", follow_redirects=True) as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert "/docs" in str(response.url)

@pytest.mark.asyncio
async def test_signup_and_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Signup
        signup_data = {
            "email": "testcandidate@meti.org",
            "password": "testpassword123",
            "full_name": "Test Candidate",
            "role": "CANDIDATE"
        }
        res_signup = await ac.post("/api/v1/auth/signup", json=signup_data)
        assert res_signup.status_code in (201, 400) # 400 if already created in persistent db

        # Login
        login_data = {
            "username": "testcandidate@meti.org",
            "password": "testpassword123"
        }
        res_login = await ac.post("/api/v1/auth/login", data=login_data)
        assert res_login.status_code == 200
        token_data = res_login.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
