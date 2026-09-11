# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_tab_switch_and_focus_security_events():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Candidate Login
        login_res = await ac.post("/api/v1/auth/login", data={"username": "student@meti.org", "password": "student123"})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get Assessments
        assess_res = await ac.get("/api/v1/assessments/", headers=headers)
        assert assess_res.status_code == 200
        assessments = assess_res.json()
        target_id = assessments[0]["id"]

        # 3. Start Candidate Attempt
        start_res = await ac.post(f"/api/v1/attempts/start/{target_id}", headers=headers)
        assert start_res.status_code == 201
        attempt_id = start_res.json()["attempt_id"]

        # 4. Dispatch Security Event: TAB_SWITCH
        event1_res = await ac.post(
            f"/api/v1/attempts/{attempt_id}/security-event",
            headers=headers,
            json={"event_type": "TAB_SWITCH", "details": "Candidate switched browser tab"}
        )
        assert event1_res.status_code == 201
        assert event1_res.json()["event_type"] == "TAB_SWITCH"

        # 5. Dispatch Security Event: FULLSCREEN_EXIT
        event2_res = await ac.post(
            f"/api/v1/attempts/{attempt_id}/security-event",
            headers=headers,
            json={"event_type": "FULLSCREEN_EXIT", "details": "Candidate exited browser fullscreen mode"}
        )
        assert event2_res.status_code == 201

        # 6. Dispatch Security Event: VISIBILITY_VISIBLE
        event3_res = await ac.post(
            f"/api/v1/attempts/{attempt_id}/security-event",
            headers=headers,
            json={"event_type": "VISIBILITY_VISIBLE", "details": "Candidate returned to assessment"}
        )
        assert event3_res.status_code == 201

        # 7. Submit Attempt
        submit_res = await ac.post(
            f"/api/v1/attempts/{attempt_id}/submit",
            headers=headers,
            json={"answers": []}
        )
        assert submit_res.status_code == 200
        result_data = submit_res.json()

        # 8. Assert security integrity metrics
        assert result_data["security_events_count"] == 3
        assert result_data["tab_switch_count"] == 1
        assert result_data["fullscreen_exit_count"] == 1
        assert result_data["integrity_status"] == "Review Recommended"
