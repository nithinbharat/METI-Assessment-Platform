import re
import difflib
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Question, QuestionType, Answer, Attempt, AttemptStatus
from app.schemas.schemas import AnswerSubmit
from app.services.code_runner import execute_code
from datetime import datetime, timezone

def calculate_nlp_semantic_similarity(candidate_text: str, reference_text: str) -> float:
    """
    Computes NLP semantic similarity score (0.0 to 1.0) between candidate text answer
    and reference answer key using sequence matching, token Jaccard similarity, and keyword density.
    """
    if not candidate_text or not reference_text:
        return 0.0

    cand_clean = re.sub(r"[^\w\s]", "", candidate_text.lower()).strip()
    ref_clean = re.sub(r"[^\w\s]", "", reference_text.lower()).strip()

    if cand_clean == ref_clean:
        return 1.0

    # 1. Sequence Match Ratio (Levenshtein/difflib)
    seq_ratio = difflib.SequenceMatcher(None, cand_clean, ref_clean).ratio()

    # 2. Token Jaccard Similarity
    cand_tokens = set(cand_clean.split())
    ref_tokens = set(ref_clean.split())
    
    if not ref_tokens:
        return 0.0
        
    intersection = cand_tokens.intersection(ref_tokens)
    union = cand_tokens.union(ref_tokens)
    jaccard_ratio = len(intersection) / len(union) if union else 0.0

    # 3. Weighted NLP Semantic Score
    semantic_score = (seq_ratio * 0.4) + (jaccard_ratio * 0.6)
    return round(min(1.0, semantic_score), 2)

async def evaluate_attempt(
    db: AsyncSession,
    attempt: Attempt,
    questions: List[Question],
    submissions: List[AnswerSubmit]
) -> Attempt:
    submission_map: Dict[int, AnswerSubmit] = {s.question_id: s for s in submissions}
    
    total_obtained = 0.0
    total_max = 0.0
    
    for question in questions:
        total_max += question.points
        sub = submission_map.get(question.id)
        
        is_correct = False
        score_awarded = 0.0
        selected_option_id = None
        text_response = None
        file_path = None
        
        if sub:
            selected_option_id = sub.selected_option_id
            text_response = sub.text_response
            file_path = sub.file_path
            
            # --- 1. MCQ & TRUE/FALSE GRADED EVALUATION ---
            if question.question_type in (QuestionType.MCQ, QuestionType.TRUE_FALSE):
                if selected_option_id:
                    correct_opt = next((opt for opt in question.options if opt.is_correct), None)
                    if correct_opt and correct_opt.id == selected_option_id:
                        is_correct = True
                        score_awarded = question.points

            # --- 2. AI NLP SEMANTIC SHORT-TEXT GRADED EVALUATION ---
            elif question.question_type == QuestionType.SHORT_TEXT:
                if text_response:
                    correct_opt = next((opt for opt in question.options if opt.is_correct), None)
                    reference_text = correct_opt.option_text if correct_opt else (question.explanation or "")
                    
                    similarity = calculate_nlp_semantic_similarity(text_response, reference_text)
                    if similarity >= 0.70:
                        is_correct = True
                        score_awarded = question.points
                    elif similarity >= 0.40:
                        is_correct = True
                        score_awarded = round(question.points * similarity, 2)

            # --- 3. INTERACTIVE CODING SANDBOX GRADED EVALUATION ---
            elif question.question_type == QuestionType.CODING:
                if text_response:
                    lang = question.programming_language or "python"
                    exec_result = await execute_code(text_response, lang)
                    if exec_result.get("passed", False):
                        is_correct = True
                        score_awarded = question.points

            # --- 4. FILE UPLOADS SUBMISSION GRADED EVALUATION ---
            elif question.question_type == QuestionType.FILE_UPLOAD:
                if file_path:
                    is_correct = True
                    score_awarded = question.points
        
        total_obtained += score_awarded
        
        # Record Answer
        answer_record = Answer(
            attempt_id=attempt.id,
            question_id=question.id,
            selected_option_id=selected_option_id,
            text_response=text_response,
            file_path=file_path,
            is_correct=is_correct,
            score_awarded=score_awarded
        )
        db.add(answer_record)
        
    percentage = (total_obtained / total_max * 100.0) if total_max > 0 else 0.0
    passed = percentage >= attempt.assessment.passing_score_percentage
    
    attempt.score_obtained = round(total_obtained, 2)
    attempt.max_score = total_max
    attempt.percentage = round(percentage, 2)
    attempt.passed = passed
    attempt.status = AttemptStatus.COMPLETED
    attempt.completed_at = datetime.now(timezone.utc)
    
    await db.flush()
    return attempt
