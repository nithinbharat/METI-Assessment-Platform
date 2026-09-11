# pyrefly: ignore [missing-import]
import pytest
from app.services.resume_parser import extract_skills_from_text
from app.services.ai_evaluator import generate_question_data, evaluate_candidate_answer, EvaluationStatus

def test_resume_skill_parsing():
    sample_resume = """
    Jane Doe - Senior Full-Stack Engineer
    Skills: Python, FastAPI, Next.js, React, PostgreSQL, Docker, AWS.
    Experience: Developed scalable web APIs and microservices.
    """
    skills = extract_skills_from_text(sample_resume)
    assert "Python" in skills
    assert "FastAPI" in skills
    assert "Next.js" in skills
    assert "Docker" in skills

def test_ai_evaluator_high_confidence():
    q_data = generate_question_data("Python", is_followup=False)
    correct_answer = q_data["options"][q_data["correct_idx"]]
    
    status, score, feedback = evaluate_candidate_answer("Python", q_data, correct_answer)
    assert status == EvaluationStatus.CONFIDENT
    assert score >= 0.70
    assert "High Confidence" in feedback

def test_ai_evaluator_low_confidence():
    q_data = generate_question_data("Python", is_followup=False)
    wrong_answer = q_data["options"][(q_data["correct_idx"] + 1) % len(q_data["options"])]
    
    status, score, feedback = evaluate_candidate_answer("Python", q_data, wrong_answer)
    assert status == EvaluationStatus.NEEDS_CLARIFICATION
    assert score < 0.70
    assert "Needs Clarification" in feedback
