from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, Resume, ResumeVersion, InterviewSession, InterviewQuestion, CompanyQuestion, CodingChallenge, AptitudeQuestion, LinkedInProfile
from app.schemas.schemas import ResumeCreate, ResumeResponse, ResumeVersionResponse, InterviewSessionCreate, InterviewSessionResponse, InterviewAnswerSubmit, CodingChallengeCreate, CodingSubmitRequest, AptitudeAnswerSubmit, LinkedInGenerateRequest, LinkedInProfileResponse, PlacementDashboardResponse, CodingResultResponse
from app.core.security import get_current_user, get_current_student
from app.services.placement_service import review_resume_service, generate_interview_service, evaluate_interview_service, generate_linkedin_service, generate_coding_service, evaluate_coding_service, generate_aptitude_service

router = APIRouter()

def _get_user(current_user, db):
    return current_user

@router.get("/placement/dashboard")
def placement_dashboard(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    resume_count = db.query(Resume).filter(Resume.user_id == current_user.id).count()
    interview_count = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).count()
    coding_count = db.query(CodingChallenge).filter(CodingChallenge.user_id == current_user.id).count()
    aptitude_count = db.query(AptitudeQuestion).filter(AptitudeQuestion.user_id == current_user.id).count()
    recent_interviews = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).order_by(InterviewSession.created_at.desc()).limit(5).all()
    recent_coding = db.query(CodingChallenge).filter(CodingChallenge.user_id == current_user.id).order_by(CodingChallenge.created_at.desc()).limit(5).all()
    return {"resume_count": resume_count, "interview_count": interview_count, "coding_count": coding_count, "aptitude_count": aptitude_count, "recent_interviews": [{"id": i.id, "interview_type": i.interview_type, "company": i.company, "status": i.status, "score": i.score} for i in recent_interviews], "recent_coding": [{"id": c.id, "title": c.title, "difficulty": c.difficulty, "status": c.status} for c in recent_coding]}

@router.get("/placement/resumes")
def list_resumes(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.updated_at.desc()).all()
    result = []
    for r in resumes:
        version_count = db.query(ResumeVersion).filter(ResumeVersion.resume_id == r.id).count()
        d = ResumeResponse.model_validate(r).model_dump()
        d["version_count"] = version_count
        result.append(d)
    return result

@router.post("/placement/resumes")
def create_resume(data: ResumeCreate, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = Resume(user_id=current_user.id, title=data.title, full_name=data.full_name, email=data.email, phone=data.phone, linkedin=data.linkedin, portfolio=data.portfolio, address=data.address, summary=data.summary, sections=data.sections or [])
    db.add(resume)
    db.commit()
    db.refresh(resume)
    version = ResumeVersion(resume_id=resume.id, version_number=1, title=resume.title, sections=resume.sections)
    db.add(version)
    db.commit()
    return ResumeResponse.model_validate(resume)

@router.get("/placement/resumes/{resume_id}")
def get_resume(resume_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeResponse.model_validate(resume)

@router.put("/placement/resumes/{resume_id}")
def update_resume(resume_id: str, data: ResumeCreate, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        if key == "sections":
            setattr(resume, key, val or [])
        elif val is not None:
            setattr(resume, key, val)
    version_count = db.query(ResumeVersion).filter(ResumeVersion.resume_id == resume.id).count()
    version = ResumeVersion(resume_id=resume.id, version_number=version_count + 1, title=resume.title, sections=resume.sections, ats_score=resume.ats_score)
    db.add(version)
    db.commit()
    return ResumeResponse.model_validate(resume)

@router.delete("/placement/resumes/{resume_id}")
def delete_resume(resume_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(resume)
    db.commit()
    return {"ok": True}

@router.post("/placement/resumes/{resume_id}/review")
def review_resume(resume_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    result = review_resume_service(resume)
    resume.ats_score = result.get("ats_score", 0)
    resume.ats_feedback = result.get("feedback", "")
    db.commit()
    return result

@router.get("/placement/resumes/{resume_id}/versions")
def list_resume_versions(resume_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    versions = db.query(ResumeVersion).filter(ResumeVersion.resume_id == resume_id).order_by(ResumeVersion.version_number.desc()).all()
    return [ResumeVersionResponse.model_validate(v) for v in versions]

@router.post("/placement/linkedin/generate")
def generate_linkedin(data: LinkedInGenerateRequest, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(LinkedInProfile).filter(LinkedInProfile.user_id == current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
    profile_data = generate_linkedin_service(data.model_dump())
    profile = LinkedInProfile(user_id=current_user.id, headline=profile_data.get("headline"), about=profile_data.get("about"), experience=profile_data.get("experience", []), education=profile_data.get("education", []), skills=profile_data.get("skills", []), certifications=profile_data.get("certifications", []), projects=profile_data.get("projects", []))
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return LinkedInProfileResponse.model_validate(profile)

@router.get("/placement/linkedin")
def get_linkedin(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(LinkedInProfile).filter(LinkedInProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="LinkedIn profile not found")
    return LinkedInProfileResponse.model_validate(profile)

@router.post("/placement/interviews/generate")
def generate_interview(data: InterviewSessionCreate, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    import datetime
    session = InterviewSession(user_id=current_user.id, interview_type=data.interview_type, company=data.company, role=data.role, difficulty=data.difficulty, question_count=data.question_count or 5, started_at=datetime.datetime.utcnow())
    db.add(session)
    db.commit()
    questions_data = generate_interview_service(data.interview_type, data.difficulty, data.question_count or 5, data.company, data.role)
    for q in questions_data:
        question = InterviewQuestion(session_id=session.id, question_text=q["question_text"], question_type=q.get("question_type", "general"), options=q.get("options"), correct_answer=q.get("correct_answer"))
        db.add(question)
    db.commit()
    db.refresh(session)
    questions = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session.id).all()
    return {"id": session.id, "interview_type": session.interview_type, "company": session.company, "role": session.role, "difficulty": session.difficulty, "status": session.status, "question_count": len(questions), "questions": [{"id": q.id, "question_text": q.question_text, "question_type": q.question_type, "options": q.options} for q in questions]}

@router.get("/placement/interviews")
def list_interviews(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).order_by(InterviewSession.created_at.desc()).all()
    result = []
    for s in sessions:
        q_count = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == s.id).count()
        result.append({"id": s.id, "interview_type": s.interview_type, "company": s.company, "role": s.role, "difficulty": s.difficulty, "status": s.status, "score": s.score, "feedback": s.feedback, "question_count": q_count, "started_at": str(s.started_at), "completed_at": str(s.completed_at) if s.completed_at else None})
    return result

@router.get("/placement/interviews/{session_id}")
def get_interview(session_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview not found")
    questions = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session_id).all()
    return {"id": session.id, "interview_type": session.interview_type, "company": session.company, "role": session.role, "difficulty": session.difficulty, "status": session.status, "score": session.score, "feedback": session.feedback, "question_count": len(questions), "started_at": str(session.started_at), "completed_at": str(session.completed_at) if session.completed_at else None, "questions": [{"id": q.id, "question_text": q.question_text, "question_type": q.question_type, "options": q.options, "user_answer": q.user_answer, "score": q.score, "feedback": q.feedback} for q in questions]}

@router.post("/placement/interviews/{session_id}/answer")
def submit_answer(session_id: str, data: InterviewAnswerSubmit, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    question = db.query(InterviewQuestion).join(InterviewSession).filter(InterviewQuestion.id == data.question_id, InterviewQuestion.session_id == session_id, InterviewSession.user_id == current_user.id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.user_answer = data.answer
    db.commit()
    return {"ok": True}

@router.post("/placement/interviews/{session_id}/evaluate")
def evaluate_interview(session_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id, InterviewSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview not found")
    questions = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session_id).all()
    result = evaluate_interview_service(questions)
    session.score = result.get("overall_score", 0)
    session.feedback = result.get("feedback", "")
    session.status = "completed"
    import datetime
    session.completed_at = datetime.datetime.utcnow()
    for q in questions:
        qs = result.get("question_scores", [])
        for rqs in qs:
            if rqs.get("question_id") == q.id or rqs.get("question_text", "").startswith(q.question_text[:50]):
                q.score = rqs.get("score")
                q.feedback = rqs.get("feedback")
    db.commit()
    return result

@router.get("/placement/company-questions")
def list_company_questions(company: str = None, db: Session = Depends(get_db)):
    query = db.query(CompanyQuestion)
    if company:
        query = query.filter(CompanyQuestion.company == company)
    questions = query.order_by(CompanyQuestion.created_at.desc()).all()
    return [{"id": q.id, "company": q.company, "role": q.role, "question_text": q.question_text, "question_type": q.question_type, "answer": q.answer, "source": q.source, "created_at": str(q.created_at)} for q in questions]

@router.post("/placement/company-questions")
def create_company_question(data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    q = CompanyQuestion(company=data["company"], role=data.get("role"), question_text=data["question_text"], question_type=data.get("question_type", "technical"), answer=data.get("answer"))
    db.add(q)
    db.commit()
    return {"id": q.id, "company": q.company, "question_text": q.question_text}

@router.delete("/placement/company-questions/{question_id}")
def delete_company_question(question_id: str, db: Session = Depends(get_db)):
    q = db.query(CompanyQuestion).filter(CompanyQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"ok": True}

@router.get("/placement/company-questions/companies")
def list_companies(db: Session = Depends(get_db)):
    results = db.query(CompanyQuestion.company).distinct().all()
    return [r[0] for r in results if r[0]]

@router.get("/placement/coding")
def list_coding(topic: str = None, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(CodingChallenge).filter(CodingChallenge.user_id == current_user.id)
    if topic:
        query = query.filter(CodingChallenge.topic == topic)
    challenges = query.order_by(CodingChallenge.created_at.desc()).all()
    return [{"id": c.id, "title": c.title, "description": c.description, "difficulty": c.difficulty, "topic": c.topic, "starter_code": c.starter_code, "language": c.language, "status": c.status, "score": c.score, "feedback": c.feedback, "created_at": str(c.created_at)} for c in challenges]

@router.post("/placement/coding/generate")
def generate_coding(data: CodingChallengeCreate, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    result = generate_coding_service(data.topic or "algorithms", data.difficulty, data.language or "python")
    challenge = CodingChallenge(user_id=current_user.id, title=result.get("title", "Coding Challenge"), description=result.get("description", ""), difficulty=data.difficulty, topic=data.topic, starter_code=result.get("starter_code", ""), language=data.language or "python")
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return {"id": challenge.id, "title": challenge.title, "description": challenge.description, "difficulty": challenge.difficulty, "topic": challenge.topic, "starter_code": challenge.starter_code, "language": challenge.language, "status": challenge.status}

@router.get("/placement/coding/{challenge_id}")
def get_coding(challenge_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    challenge = db.query(CodingChallenge).filter(CodingChallenge.id == challenge_id, CodingChallenge.user_id == current_user.id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return {"id": challenge.id, "title": challenge.title, "description": challenge.description, "difficulty": challenge.difficulty, "topic": challenge.topic, "starter_code": challenge.starter_code, "language": challenge.language, "status": challenge.status, "score": challenge.score, "feedback": challenge.feedback, "created_at": str(challenge.created_at)}

@router.post("/placement/coding/{challenge_id}/submit")
def submit_coding(challenge_id: str, data: CodingSubmitRequest, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    challenge = db.query(CodingChallenge).filter(CodingChallenge.id == challenge_id, CodingChallenge.user_id == current_user.id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    result = evaluate_coding_service(challenge.description, data.solution, data.language)
    challenge.score = result.get("score", 0)
    challenge.feedback = result.get("feedback", "")
    challenge.status = "completed"
    db.commit()
    return {"score": challenge.score, "feedback": challenge.feedback, "test_cases": result.get("test_cases", {"passed": 0, "total": 0})}

@router.get("/placement/aptitude")
def list_aptitude(category: str = None, difficulty: str = None, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(AptitudeQuestion).filter(AptitudeQuestion.user_id == current_user.id)
    if category:
        query = query.filter(AptitudeQuestion.category == category)
    if difficulty:
        query = query.filter(AptitudeQuestion.difficulty == difficulty)
    questions = query.order_by(AptitudeQuestion.created_at.desc()).all()
    return [{"id": q.id, "category": q.category, "question_text": q.question_text, "options": q.options, "correct_answer": q.correct_answer, "explanation": q.explanation, "difficulty": q.difficulty, "user_answer": q.user_answer, "is_correct": q.is_correct} for q in questions]

@router.post("/placement/aptitude/generate")
def generate_aptitude(category: str = "quantitative", difficulty: str = "medium", count: int = 10, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    questions_data = generate_aptitude_service(category, difficulty, count)
    created = []
    for qd in questions_data:
        q = AptitudeQuestion(user_id=current_user.id, category=category, question_text=qd["question_text"], options=qd.get("options", []), correct_answer=qd.get("correct_answer"), explanation=qd.get("explanation"), difficulty=difficulty)
        db.add(q)
        db.commit()
        created.append({"id": q.id, "category": q.category, "question_text": q.question_text, "options": q.options, "difficulty": q.difficulty})
    return created

@router.post("/placement/aptitude/submit")
def submit_aptitude(data: AptitudeAnswerSubmit, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    question = db.query(AptitudeQuestion).filter(AptitudeQuestion.id == data.question_id, AptitudeQuestion.user_id == current_user.id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.user_answer = data.answer
    question.time_taken = data.time_taken
    is_correct = question.correct_answer and question.correct_answer.lower() == data.answer.lower() if data.answer else False
    question.is_correct = "true" if is_correct else "false"
    db.commit()
    return {"correct": is_correct, "correct_answer": question.correct_answer, "explanation": question.explanation}
