from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict, model_validator
from app.db.models import UserRole, QuestionType, AttemptStatus

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.CANDIDATE

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# Option Schemas
class OptionBase(BaseModel):
    option_text: str

class OptionCreate(OptionBase):
    is_correct: bool = False

class OptionResponse(OptionBase):
    id: int
    is_correct: bool

    model_config = ConfigDict(from_attributes=True)

class OptionCandidateResponse(OptionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# Question Schemas
class QuestionBase(BaseModel):
    text: str
    question_type: QuestionType = QuestionType.MCQ
    points: float = 1.0
    explanation: Optional[str] = None
    code_template: Optional[str] = None
    programming_language: Optional[str] = None # python, javascript, cpp, sql
    test_cases: Optional[str] = None # JSON test cases array

class QuestionCreate(QuestionBase):
    options: List[OptionCreate] = []

class QuestionResponse(QuestionBase):
    id: int
    options: List[OptionResponse] = []

    model_config = ConfigDict(from_attributes=True)

class QuestionCandidateResponse(BaseModel):
    id: int
    text: str
    question_type: QuestionType
    points: float
    code_template: Optional[str] = None
    programming_language: Optional[str] = None
    options: List[OptionCandidateResponse] = []

    model_config = ConfigDict(from_attributes=True)

# Code Execution & File Upload Schemas
class CodeRunRequest(BaseModel):
    code: str
    language: str # python, javascript, cpp, sql
    input_data: Optional[str] = ""

class CodeRunResponse(BaseModel):
    stdout: str
    stderr: str
    execution_time_ms: float
    passed: bool
    status: str # SUCCESS, ERROR, TIMEOUT

class FileUploadResponse(BaseModel):
    filename: str
    file_path: str
    message: str

# Assessment Schemas
class AssessmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    time_limit_minutes: int = 30
    passing_score_percentage: float = 70.0
    is_active: bool = True
    is_proctored: bool = False
    tab_monitoring_enabled: bool = False
    fullscreen_required: bool = False
    webcam_monitoring_enabled: bool = False
    face_monitoring_enabled: bool = False

    @model_validator(mode="after")
    def validate_security_dependencies(self):
        if not self.webcam_monitoring_enabled:
            self.face_monitoring_enabled = False
        if self.webcam_monitoring_enabled or self.tab_monitoring_enabled or self.fullscreen_required or self.face_monitoring_enabled:
            self.is_proctored = True
        return self

class AssessmentCreate(AssessmentBase):
    category_id: Optional[int] = None

class AssessmentResponse(AssessmentBase):
    id: int
    category_id: Optional[int] = None
    category: Optional[CategoryResponse] = None
    created_at: datetime
    total_questions: int = 0

    model_config = ConfigDict(from_attributes=True)

class AssessmentDetailResponse(AssessmentResponse):
    questions: List[QuestionResponse] = []

    model_config = ConfigDict(from_attributes=True)

# Attempt & Answer Submission Schemas
class AnswerSubmit(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    text_response: Optional[str] = None
    file_path: Optional[str] = None

class AttemptSubmitRequest(BaseModel):
    answers: List[AnswerSubmit]

class AttemptStartResponse(BaseModel):
    attempt_id: int
    assessment_id: int
    assessment_title: str
    started_at: datetime
    time_limit_minutes: int
    status: AttemptStatus
    is_proctored: bool = False
    tab_monitoring_enabled: bool = False
    fullscreen_required: bool = False
    webcam_monitoring_enabled: bool = False
    face_monitoring_enabled: bool = False
    questions: List[QuestionCandidateResponse]

class AnswerResultDetail(BaseModel):
    question_id: int
    question_text: str
    selected_option_id: Optional[int] = None
    text_response: Optional[str] = None
    file_path: Optional[str] = None
    is_correct: bool
    score_awarded: float
    max_points: float
    explanation: Optional[str] = None
    correct_option_id: Optional[int] = None
    programming_language: Optional[str] = None


# Security Event Schemas
class SecurityEventCreate(BaseModel):
    event_type: str # TAB_SWITCH, WINDOW_BLUR, WINDOW_FOCUS, VISIBILITY_VISIBLE, FULLSCREEN_EXIT, NO_FACE_DETECTED, MULTIPLE_FACES_DETECTED, FACE_DETECTION_ERROR
    details: Optional[str] = None

class SecurityEventResponse(BaseModel):
    id: int
    attempt_id: int
    event_type: str
    timestamp: datetime
    details: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AttemptResultResponse(BaseModel):
    attempt_id: int
    assessment_id: int
    assessment_title: str
    score_obtained: float
    max_score: float
    percentage: float
    passed: bool
    status: AttemptStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    answers: List[AnswerResultDetail] = []
    security_events: List[SecurityEventResponse] = []
    security_events_count: int = 0
    tab_switch_count: int = 0
    window_blur_count: int = 0
    fullscreen_exit_count: int = 0
    no_face_count: int = 0
    multiple_faces_count: int = 0
    face_detection_error_count: int = 0
    integrity_status: str = "Normal" # "Normal" or "Review Recommended"

    model_config = ConfigDict(from_attributes=True)

# Analytics Schemas
class LeaderboardEntry(BaseModel):
    user_name: str
    user_email: str
    score_obtained: float
    max_score: float
    percentage: float
    passed: bool
    completed_at: datetime

class AnalyticsSummaryResponse(BaseModel):
    total_assessments: int
    total_candidates: int
    total_attempts: int
    pass_rate_percentage: float
