from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, Course, Enrollment, FacultyContent, AssignmentSubmission, Notice, Event, TimetableEntry
from app.core.security import get_current_student

router = APIRouter()

def _enrolled_course_ids(student_id: str, db: Session) -> list:
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    return [e.course_id for e in enrollments]

@router.get("/portal/dashboard")
def student_dashboard(current_user: Profile = Depends(get_current_student), db: Session = Depends(get_db)):
    course_ids = _enrolled_course_ids(current_user.id, db)
    courses = db.query(Course).filter(Course.id.in_(course_ids)).all() if course_ids else []
    total_content = db.query(FacultyContent).filter(FacultyContent.course_id.in_(course_ids)).count() if course_ids else 0
    notices = db.query(Notice).filter(Notice.target_role.in_(["all", "student"])).count()
    events = db.query(Event).count()
    return {"course_count": len(courses), "content_count": total_content, "notices_count": notices, "events_count": events, "courses": [{"id": c.id, "name": c.name, "code": c.code} for c in courses]}

@router.get("/portal/content")
def list_content(course_id: str = None, current_user: Profile = Depends(get_current_student), db: Session = Depends(get_db)):
    course_ids = _enrolled_course_ids(current_user.id, db)
    query = db.query(FacultyContent).filter(FacultyContent.course_id.in_(course_ids))
    if course_id:
        query = query.filter(FacultyContent.course_id == course_id)
    content = query.order_by(FacultyContent.created_at.desc()).all()
    return [{"id": c.id, "course_id": c.course_id, "title": c.title, "content_type": c.content_type, "description": c.description, "file_url": c.file_url, "due_date": c.due_date} for c in content]

@router.get("/portal/notices")
def list_notices(current_user: Profile = Depends(get_current_student), db: Session = Depends(get_db)):
    notices = db.query(Notice).filter(Notice.target_role.in_(["all", "student"]), Notice.is_active == True).order_by(Notice.created_at.desc()).all()
    return [{"id": n.id, "title": n.title, "content": n.content, "created_at": str(n.created_at)} for n in notices]

@router.get("/portal/events")
def list_events(current_user: Profile = Depends(get_current_student), db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.event_date.asc()).all()
    return [{"id": e.id, "title": e.title, "description": e.description, "event_date": e.event_date, "location": e.location} for e in events]

@router.get("/portal/timetable")
def list_timetable(current_user: Profile = Depends(get_current_student), db: Session = Depends(get_db)):
    course_ids = _enrolled_course_ids(current_user.id, db)
    entries = db.query(TimetableEntry).filter(TimetableEntry.course_id.in_(course_ids)).all() if course_ids else []
    return [{"id": e.id, "course_id": e.course_id, "day_of_week": e.day_of_week, "start_time": e.start_time, "end_time": e.end_time, "room": e.room} for e in entries]

@router.get("/portal/assignments")
def list_assignments(course_id: str = None, current_user: Profile = Depends(get_current_student), db: Session = Depends(get_db)):
    course_ids = _enrolled_course_ids(current_user.id, db)
    query = db.query(FacultyContent).filter(FacultyContent.course_id.in_(course_ids), FacultyContent.content_type == "assignments")
    if course_id:
        query = query.filter(FacultyContent.course_id == course_id)
    assignments = query.all()
    return [{"id": a.id, "course_id": a.course_id, "title": a.title, "description": a.description, "due_date": a.due_date} for a in assignments]

@router.post("/portal/assignments/{assignment_id}/submit")
def submit_assignment(assignment_id: str, current_user: Profile = Depends(get_current_student), db: Session = Depends(get_db)):
    existing = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == assignment_id, AssignmentSubmission.student_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already submitted")
    submission = AssignmentSubmission(assignment_id=assignment_id, student_id=current_user.id)
    import datetime
    submission.submitted_at = datetime.datetime.utcnow()
    db.add(submission)
    db.commit()
    return {"ok": True}

@router.get("/portal/grades")
def get_grades(current_user: Profile = Depends(get_current_student), db: Session = Depends(get_db)):
    submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == current_user.id, AssignmentSubmission.grade != None).all()
    return [{"id": s.id, "assignment_id": s.assignment_id, "grade": s.grade, "feedback": s.feedback, "graded_at": str(s.graded_at) if s.graded_at else None} for s in submissions]
