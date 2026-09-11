from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import Attempt, Assessment, User, AttemptStatus, UserRole
from app.schemas.schemas import AttemptResultResponse, AnalyticsSummaryResponse, LeaderboardEntry
from app.api.v1.auth import get_current_user, get_current_admin
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

class AdminCandidateAttemptSummary(BaseModel):
    attempt_id: int
    user_id: int
    user_name: str
    user_email: str
    score_obtained: float
    max_score: float
    percentage: float
    passed: bool
    status: str
    completed_at: datetime

@router.get("/my-attempts", response_model=List[AttemptResultResponse])
async def get_my_attempts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only fetch COMPLETED attempts so in-progress / default 0% entries don't dilute candidate metrics
    query = select(Attempt).options(
        selectinload(Attempt.assessment)
    ).where(
        Attempt.user_id == current_user.id,
        Attempt.status == AttemptStatus.COMPLETED
    ).order_by(Attempt.completed_at.desc())

    result = await db.execute(query)
    attempts = result.scalars().all()

    response = []
    for att in attempts:
        response.append(
            AttemptResultResponse(
                attempt_id=att.id,
                assessment_id=att.assessment_id,
                assessment_title=att.assessment.title if att.assessment else "Assessment",
                score_obtained=att.score_obtained,
                max_score=att.max_score,
                percentage=att.percentage,
                passed=att.passed,
                status=att.status,
                started_at=att.started_at,
                completed_at=att.completed_at,
                answers=[]
            )
        )
    return response

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    total_assessments = (await db.execute(select(func.count(Assessment.id)))).scalar() or 0
    total_candidates = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.CANDIDATE))).scalar() or 0
    total_attempts = (await db.execute(select(func.count(Attempt.id)).where(Attempt.status == AttemptStatus.COMPLETED))).scalar() or 0
    
    passed_attempts = (await db.execute(select(func.count(Attempt.id)).where(Attempt.status == AttemptStatus.COMPLETED, Attempt.passed == True))).scalar() or 0
    pass_rate = (passed_attempts / total_attempts * 100.0) if total_attempts > 0 else 0.0

    return AnalyticsSummaryResponse(
        total_assessments=total_assessments,
        total_candidates=total_candidates,
        total_attempts=total_attempts,
        pass_rate_percentage=round(pass_rate, 2)
    )

@router.get("/leaderboard/{assessment_id}", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    assessment_id: int,
    db: AsyncSession = Depends(get_db)
):
    query = select(Attempt).options(
        selectinload(Attempt.user)
    ).where(
        Attempt.assessment_id == assessment_id,
        Attempt.status == AttemptStatus.COMPLETED
    ).order_by(Attempt.percentage.desc(), Attempt.completed_at.asc())

    result = await db.execute(query)
    attempts = result.scalars().all()

    leaderboard = []
    for att in attempts:
        leaderboard.append(
            LeaderboardEntry(
                user_name=att.user.full_name,
                user_email=att.user.email,
                score_obtained=att.score_obtained,
                max_score=att.max_score,
                percentage=att.percentage,
                passed=att.passed,
                completed_at=att.completed_at
            )
        )
    return leaderboard

@router.get("/admin/attempts/{assessment_id}", response_model=List[AdminCandidateAttemptSummary])
async def get_admin_assessment_attempts(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = select(Attempt).options(
        selectinload(Attempt.user)
    ).where(
        Attempt.assessment_id == assessment_id,
        Attempt.status == AttemptStatus.COMPLETED
    ).order_by(Attempt.completed_at.desc())

    result = await db.execute(query)
    attempts = result.scalars().all()

    summary_list = []
    for att in attempts:
        summary_list.append(
            AdminCandidateAttemptSummary(
                attempt_id=att.id,
                user_id=att.user_id,
                user_name=att.user.full_name,
                user_email=att.user.email,
                score_obtained=att.score_obtained,
                max_score=att.max_score,
                percentage=att.percentage,
                passed=att.passed,
                status=att.status,
                completed_at=att.completed_at
            )
        )
    return summary_list
