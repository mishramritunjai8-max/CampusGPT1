from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, QuizSession, QuizQuestion
from app.schemas.schemas import QuizGenerateRequest, QuizSubmitRequest, QuizSessionResponse, QuizResultResponse, LeaderboardEntry
from app.core.security import get_current_user

router = APIRouter()

@router.post("/quiz/generate")
def generate_quiz(data: QuizGenerateRequest, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.quiz_generator import generate_quiz_questions
    session = QuizSession(user_id=current_user.id, title=data.title, topic=data.topic, difficulty=data.difficulty, question_count=data.question_count or 5, negative_marking=data.negative_marking or 0, time_limit_minutes=data.time_limit_minutes)
    db.add(session)
    db.commit()
    questions_data = generate_quiz_questions(data.topic, data.difficulty, data.question_count or 5)
    for q in questions_data:
        question = QuizQuestion(session_id=session.id, question_text=q["question_text"], options=q.get("options"), correct_answer=q.get("correct_answer"), marks=q.get("marks", 1.0))
        db.add(question)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "title": session.title, "topic": session.topic, "difficulty": session.difficulty, "question_count": len(questions_data), "time_limit_minutes": session.time_limit_minutes, "negative_marking": session.negative_marking}

@router.get("/quiz")
def list_quiz_sessions(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(QuizSession).filter(QuizSession.user_id == current_user.id).order_by(QuizSession.created_at.desc()).all()
    return [{"id": s.id, "title": s.title, "topic": s.topic, "difficulty": s.difficulty, "status": s.status, "score": s.score, "total_questions": s.total_questions, "correct_answers": s.correct_answers, "created_at": str(s.created_at)} for s in sessions]

@router.get("/quiz/{session_id}")
def get_quiz(session_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.id == session_id, QuizSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = db.query(QuizQuestion).filter(QuizQuestion.session_id == session_id).all()
    return {"id": session.id, "title": session.title, "topic": session.topic, "difficulty": session.difficulty, "status": session.status, "score": session.score, "total_questions": session.total_questions, "correct_answers": session.correct_answers, "negative_marking": session.negative_marking, "time_limit_minutes": session.time_limit_minutes, "questions": [{"id": q.id, "question_text": q.question_text, "options": q.options, "user_answer": q.user_answer, "is_correct": q.is_correct, "marks": q.marks} for q in questions]}

@router.post("/quiz/submit/{session_id}")
def submit_quiz(session_id: str, data: QuizSubmitRequest, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(QuizSession).filter(QuizSession.id == session_id, QuizSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Quiz not found")
    from app.services.quiz_evaluator import evaluate_quiz
    result = evaluate_quiz(session_id, data.answers, db)
    return result

@router.get("/quiz/leaderboard/{session_id}")
def get_leaderboard(session_id: str, db: Session = Depends(get_db)):
    sessions = db.query(QuizSession).filter(QuizSession.id == session_id, QuizSession.status == "completed").order_by(QuizSession.score.desc()).limit(20).all()
    return [{"user_id": s.user_id, "score": s.score, "correct_answers": s.correct_answers, "total_questions": s.total_questions} for s in sessions]
