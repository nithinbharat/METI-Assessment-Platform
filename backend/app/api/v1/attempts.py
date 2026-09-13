import random
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from app.db.session import get_db
from app.db.models import Attempt, Assessment, Question, Answer, User, AttemptStatus, QuestionType, SecurityEvent
from app.schemas.schemas import (
    AttemptStartResponse, AttemptSubmitRequest, AttemptResultResponse,
    QuestionCandidateResponse, OptionCandidateResponse, AnswerResultDetail,
    SecurityEventCreate, SecurityEventResponse
)
from app.api.v1.auth import get_current_user
from app.services.grading import evaluate_attempt

router = APIRouter(prefix="/attempts", tags=["Assessment Attempts"])

@router.post("/{attempt_id}/security-event", response_model=SecurityEventResponse, status_code=status.HTTP_201_CREATED)
async def record_security_event(
    attempt_id: int,
    event_in: SecurityEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Records a tab-switch, window blur, or focus restoration security event for an active attempt.
    """
    query = select(Attempt).where(Attempt.id == attempt_id, Attempt.user_id == current_user.id)
    result = await db.execute(query)
    attempt = result.scalars().first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.status != AttemptStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Attempt is no longer active")

    sec_event = SecurityEvent(
        attempt_id=attempt.id,
        event_type=event_in.event_type,
        timestamp=datetime.now(timezone.utc),
        details=event_in.details
    )
    db.add(sec_event)
    await db.commit()
    await db.refresh(sec_event)
    return sec_event

@router.get("/{attempt_id}/result", response_model=AttemptResultResponse)
async def get_attempt_result(
    attempt_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Attempt).options(
        selectinload(Attempt.assessment),
        selectinload(Attempt.answers).selectinload(Answer.question).selectinload(Question.options),
        selectinload(Attempt.security_events)
    ).where(Attempt.id == attempt_id)

    result = await db.execute(query)
    attempt = result.scalars().first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    # Check permissions (must be the owner candidate or an admin)
    if attempt.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to view this result")

    details = []
    for ans in attempt.answers:
        q = ans.question
        correct_opt = next((opt for opt in q.options if opt.is_correct), None)
        details.append(
            AnswerResultDetail(
                question_id=q.id,
                question_text=q.text,
                selected_option_id=ans.selected_option_id,
                text_response=ans.text_response,
                file_path=ans.file_path,
                is_correct=ans.is_correct,
                score_awarded=ans.score_awarded,
                max_points=q.points,
                explanation=q.explanation,
                correct_option_id=correct_opt.id if correct_opt else None,
                programming_language=q.programming_language,
                topic=q.topic
            )
        )

    sec_events = attempt.security_events or []
    tab_switches = len([e for e in sec_events if e.event_type in ("TAB_SWITCH", "VISIBILITY_HIDDEN")])
    window_blurs = len([e for e in sec_events if e.event_type == "WINDOW_BLUR"])
    fullscreen_exits = len([e for e in sec_events if e.event_type == "FULLSCREEN_EXIT"])
    no_faces = len([e for e in sec_events if e.event_type == "NO_FACE_DETECTED"])
    multiple_faces = len([e for e in sec_events if e.event_type == "MULTIPLE_FACES_DETECTED"])
    face_errors = len([e for e in sec_events if e.event_type == "FACE_DETECTION_ERROR"])
    total_events = len(sec_events)
    integrity_status = "Review Recommended" if (tab_switches + window_blurs + fullscreen_exits + no_faces + multiple_faces) >= 2 else "Normal"

    sec_event_responses = [
        SecurityEventResponse(
            id=e.id,
            attempt_id=e.attempt_id,
            event_type=e.event_type,
            timestamp=e.timestamp,
            details=e.details
        ) for e in sec_events
    ]

    return AttemptResultResponse(
        attempt_id=attempt.id,
        assessment_id=attempt.assessment_id,
        assessment_title=attempt.assessment.title,
        score_obtained=attempt.score_obtained,
        max_score=attempt.max_score,
        percentage=attempt.percentage,
        passed=attempt.passed,
        status=attempt.status,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        answers=details,
        security_events=sec_event_responses,
        security_events_count=total_events,
        tab_switch_count=tab_switches,
        window_blur_count=window_blurs,
        fullscreen_exit_count=fullscreen_exits,
        no_face_count=no_faces,
        multiple_faces_count=multiple_faces,
        face_detection_error_count=face_errors,
        integrity_status=integrity_status
    )

@router.post("/start/{assessment_id}", response_model=AttemptStartResponse, status_code=status.HTTP_201_CREATED)
async def start_attempt(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Assessment).options(
        selectinload(Assessment.questions).selectinload(Question.options)
    ).where(Assessment.id == assessment_id)
    
    result = await db.execute(query)
    assessment = result.scalars().first()
    if not assessment or not assessment.is_active:
        raise HTTPException(status_code=404, detail="Assessment not found or inactive")

    # Check for existing in-progress attempt to support page refresh/navigation persistence
    existing_query = select(Attempt).where(
        Attempt.user_id == current_user.id,
        Attempt.assessment_id == assessment_id,
        Attempt.status == AttemptStatus.IN_PROGRESS
    )
    existing_res = await db.execute(existing_query)
    attempt = existing_res.scalars().first()

    if not attempt:
        all_questions = [q for q in assessment.questions if q.question_type != QuestionType.FILE_UPLOAD]
        
        # Check candidate's previous attempts for this assessment to avoid repeating questions
        past_attempts_res = await db.execute(
            select(Attempt).where(
                Attempt.user_id == current_user.id,
                Attempt.assessment_id == assessment_id
            ).order_by(Attempt.id.desc())
        )
        past_attempts = past_attempts_res.scalars().all()
        recently_used_ids = set()
        for prev_att in past_attempts[:3]: # check last 3 attempts
            if prev_att.question_order:
                try:
                    recently_used_ids.update(json.loads(prev_att.question_order))
                except Exception:
                    pass

        # Select all active assessment questions (or target count) to cover every required topic
        unseen_questions = [q for q in all_questions if q.id not in recently_used_ids]
        target_count = len(all_questions)

        if len(unseen_questions) >= target_count:
            selected_questions = random.sample(unseen_questions, target_count)
        else:
            seen_questions = [q for q in all_questions if q.id in recently_used_ids]
            random.shuffle(seen_questions)
            remaining_needed = target_count - len(unseen_questions)
            selected_questions = unseen_questions + seen_questions[:remaining_needed]

        random.shuffle(selected_questions)
        ordered_q_ids = [q.id for q in selected_questions]

        opt_order_dict = {}
        for q in selected_questions:
            if q.options:
                opts = list(q.options)
                random.shuffle(opts)
                opt_order_dict[str(q.id)] = [opt.id for opt in opts]

        attempt = Attempt(
            user_id=current_user.id,
            assessment_id=assessment.id,
            started_at=datetime.now(timezone.utc),
            status=AttemptStatus.IN_PROGRESS,
            question_order=json.dumps(ordered_q_ids),
            option_order=json.dumps(opt_order_dict)
        )
        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)

    # Reconstruct question order using persisted question_order array
    q_map = {q.id: q for q in assessment.questions}
    ordered_ids = json.loads(attempt.question_order) if attempt.question_order else [q.id for q in assessment.questions]
    ordered_questions = [q_map[qid] for qid in ordered_ids if qid in q_map]
    
    if not ordered_questions:
        ordered_questions = [q for q in assessment.questions if q.question_type != QuestionType.FILE_UPLOAD]

    # Reconstruct option order using persisted option_order dictionary
    opt_order_map = json.loads(attempt.option_order) if attempt.option_order else {}

    # Format candidate questions with persisted shuffled options
    candidate_questions = []
    for q in ordered_questions:
        if str(q.id) in opt_order_map:
            saved_opt_ids = opt_order_map[str(q.id)]
            o_map = {opt.id: opt for opt in q.options}
            ordered_opts = [o_map[oid] for oid in saved_opt_ids if oid in o_map]
            # Safety fallback for any unlisted options
            for opt in q.options:
                if opt.id not in saved_opt_ids:
                    ordered_opts.append(opt)
        else:
            ordered_opts = sorted(list(q.options), key=lambda o: o.id)

        candidate_options = [
            OptionCandidateResponse(id=opt.id, option_text=opt.option_text)
            for opt in ordered_opts
        ]
        candidate_questions.append(
            QuestionCandidateResponse(
                id=q.id,
                text=q.text,
                question_type=q.question_type,
                points=q.points,
                code_template=q.code_template,
                programming_language=q.programming_language,
                topic=q.topic,
                options=candidate_options
            )
        )

    return AttemptStartResponse(
        attempt_id=attempt.id,
        assessment_id=assessment.id,
        assessment_title=assessment.title,
        started_at=attempt.started_at,
        time_limit_minutes=assessment.time_limit_minutes,
        status=attempt.status,
        is_proctored=assessment.is_proctored,
        tab_monitoring_enabled=assessment.tab_monitoring_enabled,
        fullscreen_required=assessment.fullscreen_required,
        webcam_monitoring_enabled=assessment.webcam_monitoring_enabled,
        face_monitoring_enabled=assessment.face_monitoring_enabled,
        questions=candidate_questions
    )

@router.post("/{attempt_id}/submit", response_model=AttemptResultResponse)
async def submit_attempt(
    attempt_id: int,
    submission: AttemptSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Attempt).options(
        selectinload(Attempt.assessment).selectinload(Assessment.questions).selectinload(Question.options)
    ).where(Attempt.id == attempt_id, Attempt.user_id == current_user.id)

    result = await db.execute(query)
    attempt = result.scalars().first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.status != AttemptStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Attempt has already been submitted or completed")

    # Evaluate attempt
    questions = attempt.assessment.questions
    attempt = await evaluate_attempt(db, attempt, questions, submission.answers)
    await db.commit()

    return await get_attempt_result(attempt_id, db, current_user)
