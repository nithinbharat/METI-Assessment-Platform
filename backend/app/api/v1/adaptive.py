import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models import User, AdaptiveSession, AdaptiveQuestion, EvaluationStatus, AttemptStatus
from app.api.v1.auth import get_current_user
from app.services.ai_evaluator import generate_question_data, evaluate_candidate_answer

router = APIRouter(prefix="/adaptive", tags=["AI Adaptive Resume Assessment"])

class AdaptiveStartResponse(BaseModel):
    session_id: int
    started_at: datetime
    target_skills: List[str]
    current_question: Dict_AdaptiveQuestion

class Dict_AdaptiveOption(BaseModel):
    option_text: str

class Dict_AdaptiveQuestion(BaseModel):
    question_id: int
    topic: str
    question_text: str
    question_type: str = "MCQ"
    programming_language: Optional[str] = None
    code_template: Optional[str] = None
    options: List[str] = []
    is_followup: bool = False

class AdaptiveAnswerRequest(BaseModel):
    session_id: int
    question_id: int
    candidate_answer: str

class AdaptiveAnswerResponse(BaseModel):
    session_id: int
    previous_evaluation_status: EvaluationStatus
    previous_confidence_score: float
    previous_ai_feedback: str
    is_session_completed: bool
    next_question: Optional[Dict_AdaptiveQuestion] = None

class AdaptiveSessionDetailResponse(BaseModel):
    session_id: int
    status: AttemptStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    target_skills: List[str]
    total_questions_asked: int
    confident_count: int
    questions: List[dict]  # Each item includes options list for refresh persistence

@router.post("/start", response_model=AdaptiveStartResponse, status_code=status.HTTP_201_CREATED)
async def start_adaptive_session(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Retrieve user's parsed skills from resume
    skills = []
    if current_user.parsed_skills:
        try:
            skills = json.loads(current_user.parsed_skills)
        except Exception:
            skills = [s.strip() for s in current_user.parsed_skills.split(",") if s.strip()]

    if not skills:
        skills = ["Python", "FastAPI", "Software Engineering"]

    # Create Adaptive Session
    session = AdaptiveSession(
        user_id=current_user.id,
        started_at=datetime.now(timezone.utc),
        status=AttemptStatus.IN_PROGRESS,
        target_skills=json.dumps(skills),
        total_questions_asked=0,
        confident_count=0
    )
    db.add(session)
    await db.flush()

    # Fetch all question texts candidate has seen in past adaptive sessions to avoid repetition
    past_qs_res = await db.execute(
        select(AdaptiveQuestion.question_text).join(AdaptiveSession).where(
            AdaptiveSession.user_id == current_user.id
        )
    )
    seen_texts = set(past_qs_res.scalars().all())

    # Generate 1st question for 1st topic avoiding seen questions
    first_topic = skills[0]
    q_data = generate_question_data(first_topic, is_followup=False, seen_texts=seen_texts, allow_coding=True)

    from app.db.models import QuestionType
    q_type_str = q_data.get("question_type", "MCQ")
    q_type_enum = QuestionType.CODING if q_type_str == "CODING" else QuestionType.MCQ

    q_record = AdaptiveQuestion(
        session_id=session.id,
        question_text=q_data["text"],
        topic=first_topic,
        difficulty="Medium",
        question_type=q_type_enum,
        programming_language=q_data.get("programming_language"),
        code_template=q_data.get("code_template"),
        options_json=json.dumps(q_data.get("options", [])),
        evaluation_status=EvaluationStatus.PENDING,
        is_followup=False
    )
    db.add(q_record)
    session.total_questions_asked = 1
    await db.commit()

    return AdaptiveStartResponse(
        session_id=session.id,
        started_at=session.started_at,
        target_skills=skills,
        current_question=Dict_AdaptiveQuestion(
            question_id=q_record.id,
            topic=q_record.topic,
            question_text=q_record.question_text,
            question_type=q_record.question_type.value if hasattr(q_record.question_type, "value") else str(q_record.question_type),
            programming_language=q_record.programming_language,
            code_template=q_record.code_template,
            options=json.loads(q_record.options_json) if q_record.options_json else [],
            is_followup=q_record.is_followup
        )
    )

@router.post("/answer", response_model=AdaptiveAnswerResponse)
async def submit_adaptive_answer(
    req: AdaptiveAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch session & question
    q_res = await db.execute(
        select(AdaptiveQuestion).options(selectinload(AdaptiveQuestion.session)).where(
            AdaptiveQuestion.id == req.question_id,
            AdaptiveQuestion.session_id == req.session_id
        )
    )
    question = q_res.scalars().first()
    if not question or not question.session or question.session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Adaptive question or session not found")

    session = question.session
    if session.status != AttemptStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Session is already completed")

    # Evaluate answer using the stored question metadata
    skills = json.loads(session.target_skills) if session.target_skills else ["Python"]
    current_topic = question.topic
    
    stored_options = json.loads(question.options_json) if question.options_json else []
    q_type_str = question.question_type.value if hasattr(question.question_type, "value") else str(question.question_type)
    
    q_data = {
        "text": question.question_text,
        "question_type": q_type_str,
        "programming_language": question.programming_language,
        "code_template": question.code_template,
        "options": stored_options,
        "correct_idx": 0,
        "keywords": [w.lower() for w in question.question_text.split() if len(w) > 3]
    }

    eval_status, confidence_score, feedback = evaluate_candidate_answer(
        current_topic, q_data, req.candidate_answer
    )

    question.candidate_answer = req.candidate_answer
    question.confidence_score = confidence_score
    question.evaluation_status = eval_status
    question.ai_feedback = feedback

    if eval_status == EvaluationStatus.CONFIDENT:
        session.confident_count += 1

    await db.flush()

    # Determine Next Question & Branching Logic
    next_question_dict = None
    is_completed = False

    # Max questions limit check (e.g., 6 questions per session)
    if session.total_questions_asked >= 6:
        is_completed = True
        session.status = AttemptStatus.COMPLETED
        session.completed_at = datetime.now(timezone.utc)
    else:
        if eval_status == EvaluationStatus.CONFIDENT:
            # High confidence -> Advance to NEXT resume topic
            curr_index = skills.index(current_topic) if current_topic in skills else -1
            next_index = (curr_index + 1) % len(skills)
            next_topic = skills[next_index]
            next_is_followup = False
        else:
            # Low confidence -> Stay on SAME topic & generate a SIMILAR follow-up question
            next_topic = current_topic
            next_is_followup = True

        past_qs_res = await db.execute(
            select(AdaptiveQuestion.question_text).join(AdaptiveSession).where(
                AdaptiveSession.user_id == current_user.id
            )
        )
        seen_texts = set(past_qs_res.scalars().all())

        from app.db.models import QuestionType
        next_q_data = generate_question_data(next_topic, is_followup=next_is_followup, seen_texts=seen_texts, allow_coding=True)
        next_q_type_str = next_q_data.get("question_type", "MCQ")
        next_q_type_enum = QuestionType.CODING if next_q_type_str == "CODING" else QuestionType.MCQ

        new_q_record = AdaptiveQuestion(
            session_id=session.id,
            question_text=next_q_data["text"],
            topic=next_topic,
            difficulty="Easy" if next_is_followup else "Medium",
            question_type=next_q_type_enum,
            programming_language=next_q_data.get("programming_language"),
            code_template=next_q_data.get("code_template"),
            options_json=json.dumps(next_q_data.get("options", [])),
            evaluation_status=EvaluationStatus.PENDING,
            is_followup=next_is_followup
        )
        db.add(new_q_record)
        session.total_questions_asked += 1
        await db.flush()

        next_question_dict = Dict_AdaptiveQuestion(
            question_id=new_q_record.id,
            topic=new_q_record.topic,
            question_text=new_q_record.question_text,
            question_type=new_q_record.question_type.value if hasattr(new_q_record.question_type, "value") else str(new_q_record.question_type),
            programming_language=new_q_record.programming_language,
            code_template=new_q_record.code_template,
            options=json.loads(new_q_record.options_json) if new_q_record.options_json else [],
            is_followup=new_q_record.is_followup
        )

    await db.commit()

    return AdaptiveAnswerResponse(
        session_id=session.id,
        previous_evaluation_status=eval_status,
        previous_confidence_score=confidence_score,
        previous_ai_feedback=feedback,
        is_session_completed=is_completed,
        next_question=next_question_dict
    )

@router.get("/session/{session_id}", response_model=AdaptiveSessionDetailResponse)
async def get_adaptive_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(AdaptiveSession).options(
        selectinload(AdaptiveSession.questions)
    ).where(AdaptiveSession.id == session_id, AdaptiveSession.user_id == current_user.id)

    res = await db.execute(query)
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Adaptive session not found")

    skills = json.loads(session.target_skills) if session.target_skills else []

    q_list = []
    for q in session.questions:
        # Parse options_json so frontend can restore options on page refresh
        options = []
        if q.options_json:
            try:
                options = json.loads(q.options_json)
            except Exception:
                options = []
        q_list.append({
            "question_id": q.id,
            "topic": q.topic,
            "question_text": q.question_text,
            "question_type": q.question_type.value if hasattr(q.question_type, "value") else str(q.question_type),
            "programming_language": q.programming_language,
            "code_template": q.code_template,
            "options": options,
            "candidate_answer": q.candidate_answer,
            "confidence_score": q.confidence_score,
            "evaluation_status": q.evaluation_status,
            "ai_feedback": q.ai_feedback,
            "is_followup": q.is_followup
        })

    return AdaptiveSessionDetailResponse(
        session_id=session.id,
        status=session.status,
        started_at=session.started_at,
        completed_at=session.completed_at,
        target_skills=skills,
        total_questions_asked=session.total_questions_asked,
        confident_count=session.confident_count,
        questions=q_list
    )
