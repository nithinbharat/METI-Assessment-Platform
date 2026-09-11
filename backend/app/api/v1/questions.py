from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import Question, Option, Assessment, User
from app.schemas.schemas import QuestionCreate, QuestionResponse
from app.api.v1.auth import get_current_admin

router = APIRouter(prefix="/questions", tags=["Questions"])

@router.post("/{assessment_id}", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    assessment_id: int,
    question_in: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # Verify assessment exists
    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    new_question = Question(
        assessment_id=assessment_id,
        text=question_in.text,
        question_type=question_in.question_type,
        points=question_in.points,
        explanation=question_in.explanation
    )
    db.add(new_question)
    await db.flush()

    for opt_in in question_in.options:
        opt = Option(
            question_id=new_question.id,
            option_text=opt_in.option_text,
            is_correct=opt_in.is_correct
        )
        db.add(opt)
        
    await db.commit()
    
    # Reload question with options
    q_result = await db.execute(
        select(Question).options(selectinload(Question.options)).where(Question.id == new_question.id)
    )
    full_question = q_result.scalars().first()
    return full_question

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalars().first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    await db.delete(question)
    await db.commit()
    return None
