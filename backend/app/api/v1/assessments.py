import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import Assessment, Category, Question, User
from app.schemas.schemas import (
    AssessmentResponse, AssessmentCreate, AssessmentDetailResponse,
    CategoryResponse, CategoryCreate, CodeRunRequest, CodeRunResponse, FileUploadResponse
)
from app.api.v1.auth import get_current_user, get_current_admin
from app.services.code_runner import execute_code

router = APIRouter(prefix="/assessments", tags=["Assessments"])

# Categories
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category))
    return result.scalars().all()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    category = Category(**category_in.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

# Live Code Execution Sandbox Endpoint
@router.post("/run-code", response_model=CodeRunResponse)
async def run_code(
    payload: CodeRunRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Executes live candidate code in Python, JavaScript, C++, or SQL in an isolated sandbox.
    """
    result = await execute_code(
        code=payload.code,
        language=payload.language,
        input_data=payload.input_data or ""
    )
    return CodeRunResponse(
        stdout=result.get("stdout", ""),
        stderr=result.get("stderr", ""),
        execution_time_ms=result.get("execution_time_ms", 0.0),
        passed=result.get("passed", False),
        status=result.get("status", "SUCCESS")
    )

# File Attachment Upload Endpoint
@router.post("/upload-solution", response_model=FileUploadResponse)
async def upload_solution_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads solution attachments (.zip, .py, .js, .txt, .pdf) for candidate file-upload assessments.
    """
    allowed_exts = {".zip", ".py", ".js", ".cpp", ".txt", ".pdf", ".sql", ".java", ".json"}
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(allowed_exts)}"
        )
        
    upload_dir = os.path.join(os.getcwd(), "uploads", "submissions")
    os.makedirs(upload_dir, exist_ok=True)
    
    safe_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    return FileUploadResponse(
        filename=file.filename,
        file_path=safe_filename,
        message="Solution file uploaded successfully."
    )

# Assessments List & Details
@router.get("/", response_model=List[AssessmentResponse])
async def list_assessments(
    category_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Assessment).options(
        selectinload(Assessment.category),
        selectinload(Assessment.questions)
    ).where(Assessment.is_active == True)
    
    if category_id:
        query = query.where(Assessment.category_id == category_id)
        
    result = await db.execute(query)
    assessments = result.scalars().all()
    
    response = []
    for a in assessments:
        item = AssessmentResponse.model_validate(a)
        item.total_questions = len(a.questions)
        response.append(item)
        
    return response

@router.get("/{assessment_id}", response_model=AssessmentDetailResponse)
async def get_assessment(
    assessment_id: int,
    db: AsyncSession = Depends(get_db)
):
    query = select(Assessment).options(
        selectinload(Assessment.category),
        selectinload(Assessment.questions).selectinload(Question.options)
    ).where(Assessment.id == assessment_id)
    
    result = await db.execute(query)
    assessment = result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    item = AssessmentDetailResponse.model_validate(assessment)
    item.total_questions = len(assessment.questions)
    return item

@router.post("/", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    assessment_in: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    assessment = Assessment(**assessment_in.model_dump())
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    
    query = select(Assessment).options(selectinload(Assessment.category)).where(Assessment.id == assessment.id)
    res = await db.execute(query)
    full_assessment = res.scalars().first()
    
    res_item = AssessmentResponse.model_validate(full_assessment)
    res_item.total_questions = 0
    return res_item

@router.put("/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(
    assessment_id: int,
    assessment_in: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = select(Assessment).where(Assessment.id == assessment_id)
    res = await db.execute(query)
    assessment = res.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    data = assessment_in.model_dump()
    for field, val in data.items():
        setattr(assessment, field, val)

    await db.commit()
    await db.refresh(assessment)

    query = select(Assessment).options(selectinload(Assessment.category), selectinload(Assessment.questions)).where(Assessment.id == assessment.id)
    res = await db.execute(query)
    full_assessment = res.scalars().first()

    res_item = AssessmentResponse.model_validate(full_assessment)
    res_item.total_questions = len(full_assessment.questions)
    return res_item

@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = result.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    await db.delete(assessment)
    await db.commit()
    return None
