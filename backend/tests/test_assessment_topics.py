import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_attempt_fullstack_and_datascience_topics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login candidate
        login_res = await ac.post("/api/v1/auth/login", data={"username": "student@meti.org", "password": "student123"})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get list of assessments
        assess_res = await ac.get("/api/v1/assessments/", headers=headers)
        assert assess_res.status_code == 200
        assessments = {a["title"]: a for a in assess_res.json()}

        # 3. Test Full-Stack Assessment Topics
        assert "Full-Stack Web Development Assessment" in assessments
        fs_id = assessments["Full-Stack Web Development Assessment"]["id"]
        fs_start_res = await ac.post(f"/api/v1/attempts/start/{fs_id}", headers=headers)
        assert fs_start_res.status_code == 201
        fs_data = fs_start_res.json()
        fs_topics = {q["topic"] for q in fs_data["questions"] if q.get("topic")}

        # Verify Full Stack topics required by user
        required_fs_topics = {"Java", "HTML", "CSS", "JavaScript", "Python", "Django", "Node.js"}
        for topic in required_fs_topics:
            assert topic in fs_topics, f"Expected topic '{topic}' in Full-Stack Web Development attempt questions, found {fs_topics}"

        # 4. Test Data Science & AI/ML Assessment Topics
        assert "Data Science & AI/ML Assessment" in assessments
        ds_id = assessments["Data Science & AI/ML Assessment"]["id"]
        ds_start_res = await ac.post(f"/api/v1/attempts/start/{ds_id}", headers=headers)
        assert ds_start_res.status_code == 201
        ds_data = ds_start_res.json()
        ds_topics = {q["topic"] for q in ds_data["questions"] if q.get("topic")}

        # Verify Data Science & AI/ML topics required by user
        required_ds_topics = {
            "Data Science", "Data Analysis", "Data Engineering",
            "AWS", "Hadoop", "Spark & Hive", "AI", "RAG",
            "Gen AI", "Prompt Engineering", "Feature Engineering", "Machine Learning"
        }
        for topic in required_ds_topics:
            assert topic in ds_topics, f"Expected topic '{topic}' in Data Science & AI/ML attempt questions, found {ds_topics}"
