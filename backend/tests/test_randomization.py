import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_question_and_option_randomization_and_persistence():
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
        assessments = assess_res.json()
        assert len(assessments) > 0
        target_assessment_id = assessments[0]["id"]

        # 3. Start attempt - Initial question & option fetch
        start_res1 = await ac.post(f"/api/v1/attempts/start/{target_assessment_id}", headers=headers)
        assert start_res1.status_code == 201
        data1 = start_res1.json()
        q_order1 = [q["id"] for q in data1["questions"]]
        opt_order1 = {q["id"]: [o["id"] for o in q["options"]] for q in data1["questions"]}

        # 4. Re-fetch/start existing in-progress attempt (simulating page reload / reconnection)
        start_res2 = await ac.post(f"/api/v1/attempts/start/{target_assessment_id}", headers=headers)
        assert start_res2.status_code == 201
        data2 = start_res2.json()
        q_order2 = [q["id"] for q in data2["questions"]]
        opt_order2 = {q["id"]: [o["id"] for o in q["options"]] for q in data2["questions"]}

        # 5. Assert attempt ID, randomized question order, and option order remain 100% identical across reloads
        assert data1["attempt_id"] == data2["attempt_id"]
        assert q_order1 == q_order2, "Persisted question order changed upon page refresh/reload!"
        assert opt_order1 == opt_order2, "Persisted option order changed upon page refresh/reload!"
