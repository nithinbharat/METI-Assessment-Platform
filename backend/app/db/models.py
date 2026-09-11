from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.db.base import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CANDIDATE = "CANDIDATE"

class QuestionType(str, enum.Enum):
    MCQ = "MCQ"
    TRUE_FALSE = "TRUE_FALSE"
    SHORT_TEXT = "SHORT_TEXT"
    CODING = "CODING"
    FILE_UPLOAD = "FILE_UPLOAD"

class AttemptStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    TIMED_OUT = "TIMED_OUT"

class EvaluationStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIDENT = "CONFIDENT"
    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.CANDIDATE, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Resume Upload Profile fields
    resume_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    resume_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parsed_skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Comma-separated or JSON list of skills

    attempts: Mapped[List["Attempt"]] = relationship("Attempt", back_populates="user", cascade="all, delete-orphan")
    adaptive_sessions: Mapped[List["AdaptiveSession"]] = relationship("AdaptiveSession", back_populates="user", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    assessments: Mapped[List["Assessment"]] = relationship("Assessment", back_populates="category")

class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    time_limit_minutes: Mapped[int] = mapped_column(Integer, default=30)
    passing_score_percentage: Mapped[float] = mapped_column(Float, default=70.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_proctored: Mapped[bool] = mapped_column(Boolean, default=False)
    tab_monitoring_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    fullscreen_required: Mapped[bool] = mapped_column(Boolean, default=False)
    webcam_monitoring_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    face_monitoring_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="assessments")
    questions: Mapped[List["Question"]] = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")
    attempts: Mapped[List["Attempt"]] = relationship("Attempt", back_populates="assessment", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assessment_id: Mapped[int] = mapped_column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(SQLEnum(QuestionType), default=QuestionType.MCQ, nullable=False)
    points: Mapped[float] = mapped_column(Float, default=1.0)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Coding Sandbox & File Upload fields
    code_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    programming_language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # python, javascript, cpp, sql
    test_cases: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # JSON test cases array

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="questions")
    options: Mapped[List["Option"]] = relationship("Option", back_populates="question", cascade="all, delete-orphan")
    answers: Mapped[List["Answer"]] = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Option(Base):
    __tablename__ = "options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    option_text: Mapped[str] = mapped_column(String(500), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)

    question: Mapped["Question"] = relationship("Question", back_populates="options")

class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_id: Mapped[int] = mapped_column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    score_obtained: Mapped[float] = mapped_column(Float, default=0.0)
    max_score: Mapped[float] = mapped_column(Float, default=0.0)
    percentage: Mapped[float] = mapped_column(Float, default=0.0)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[AttemptStatus] = mapped_column(SQLEnum(AttemptStatus), default=AttemptStatus.IN_PROGRESS, nullable=False)
    question_order: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # JSON array of randomized question IDs
    option_order: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # JSON object mapping question_id -> list of option IDs

    user: Mapped["User"] = relationship("User", back_populates="attempts")
    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="attempts")
    answers: Mapped[List["Answer"]] = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")
    security_events: Mapped[List["SecurityEvent"]] = relationship("SecurityEvent", back_populates="attempt", cascade="all, delete-orphan")

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(Integer, ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False) # TAB_SWITCH, WINDOW_BLUR, WINDOW_FOCUS, VISIBILITY_VISIBLE
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    details: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    attempt: Mapped["Attempt"] = relationship("Attempt", back_populates="security_events")

class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(Integer, ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_option_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("options.id", ondelete="SET NULL"), nullable=True)
    text_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    score_awarded: Mapped[float] = mapped_column(Float, default=0.0)

    attempt: Mapped["Attempt"] = relationship("Attempt", back_populates="answers")
    question: Mapped["Question"] = relationship("Question", back_populates="answers")
    selected_option: Mapped[Optional["Option"]] = relationship("Option")


# AI Adaptive Assessment Models
class AdaptiveSession(Base):
    __tablename__ = "adaptive_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[AttemptStatus] = mapped_column(SQLEnum(AttemptStatus), default=AttemptStatus.IN_PROGRESS, nullable=False)
    target_skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    total_questions_asked: Mapped[int] = mapped_column(Integer, default=0)
    confident_count: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship("User", back_populates="adaptive_sessions")
    questions: Mapped[List["AdaptiveQuestion"]] = relationship("AdaptiveQuestion", back_populates="session", cascade="all, delete-orphan")

class AdaptiveQuestion(Base):
    __tablename__ = "adaptive_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("adaptive_sessions.id", ondelete="CASCADE"), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50), default="Medium")
    question_type: Mapped[QuestionType] = mapped_column(SQLEnum(QuestionType), default=QuestionType.MCQ, nullable=False)
    options_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # JSON array string of option choices
    candidate_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0) # 0.0 - 1.0
    evaluation_status: Mapped[EvaluationStatus] = mapped_column(SQLEnum(EvaluationStatus), default=EvaluationStatus.PENDING, nullable=False)
    ai_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_followup: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    session: Mapped["AdaptiveSession"] = relationship("AdaptiveSession", back_populates="questions")
