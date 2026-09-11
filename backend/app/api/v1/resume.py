import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import User
from app.api.v1.auth import get_current_user
from app.services.resume_parser import extract_text_from_file, extract_skills_from_text
from pydantic import BaseModel

router = APIRouter(prefix="/resume", tags=["Resume Profile"])

class ResumeProfileResponse(BaseModel):
    resume_filename: Optional[str] = None
    parsed_skills: List[str] = []
    resume_text_snippet: Optional[str] = None

@router.post("/upload", response_model=ResumeProfileResponse)
async def upload_resume(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    extracted_text = ""
    filename = "resume_text_input.txt"

    if file:
        filename = file.filename or "resume.pdf"
        file_content = await file.read()
        extracted_text = extract_text_from_file(file_content, filename)
    elif raw_text:
        extracted_text = raw_text.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a PDF/TXT resume file or enter resume text."
        )

    if not extracted_text or len(extracted_text) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract readable text from resume."
        )

    # Extract skills
    skills = extract_skills_from_text(extracted_text)

    # Save to user profile
    current_user.resume_filename = filename
    current_user.resume_text = extracted_text
    current_user.parsed_skills = json.dumps(skills)

    await db.commit()
    await db.refresh(current_user)

    return ResumeProfileResponse(
        resume_filename=current_user.resume_filename,
        parsed_skills=skills,
        resume_text_snippet=extracted_text[:300] + "..." if len(extracted_text) > 300 else extracted_text
    )

@router.get("/my-resume", response_model=ResumeProfileResponse)
async def get_my_resume(
    current_user: User = Depends(get_current_user)
):
    skills = []
    if current_user.parsed_skills:
        try:
            skills = json.loads(current_user.parsed_skills)
        except Exception:
            skills = [s.strip() for s in current_user.parsed_skills.split(",") if s.strip()]

    snippet = ""
    if current_user.resume_text:
        snippet = current_user.resume_text[:300] + "..." if len(current_user.resume_text) > 300 else current_user.resume_text

    return ResumeProfileResponse(
        resume_filename=current_user.resume_filename,
        parsed_skills=skills,
        resume_text_snippet=snippet
    )
