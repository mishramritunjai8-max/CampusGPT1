from sqlalchemy.orm import Session
from app.models.models import QuizSession, QuizQuestion

def evaluate_quiz(session_id: str, answers: list, db: Session) -> dict:
    session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
    if not session:
        return {"error": "Session not found"}
    score = 0.0
    total = 0
    correct = 0
    for ans in answers:
        qid = ans.get("question_id") if isinstance(ans, dict) else ans.get("id")
        uans = ans.get("user_answer") if isinstance(ans, dict) else ans.get("answer")
        question = db.query(QuizQuestion).filter(QuizQuestion.id == qid).first()
        if question:
            question.user_answer = uans
            is_right = question.correct_answer and question.correct_answer.strip().lower() == (uans or "").strip().lower()
            question.is_correct = "true" if is_right else "false"
            if is_right:
                score += (question.marks or 1.0)
                correct += 1
            elif session.negative_marking and session.negative_marking > 0:
                score -= session.negative_marking
            total += 1
    session.score = max(0, score)
    session.total_questions = total
    session.correct_answers = correct
    session.status = "completed"
    import datetime
    session.completed_at = datetime.datetime.utcnow()
    db.commit()
    total_possible = sum((q.marks or 1.0) for q in db.query(QuizQuestion).filter(QuizQuestion.session_id == session_id).all())
    accuracy = round((score / total_possible * 100), 1) if total_possible > 0 else 0
    return {"score": session.score, "total_questions": total, "correct_answers": correct, "wrong_answers": total - correct, "accuracy": accuracy, "negative_marking_applied": session.negative_marking > 0}
