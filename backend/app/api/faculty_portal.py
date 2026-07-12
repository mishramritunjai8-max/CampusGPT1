from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, Course, Enrollment, FacultyContent, AssignmentSubmission, Notice, Event, TimetableEntry, Department, Subject
from app.core.security import get_current_faculty
import os, uuid

router = APIRouter()

@router.get("/portal/dashboard")
def faculty_dashboard(current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.faculty_id == current_user.id).all()
    course_ids = [c.id for c in courses]
    total_students = db.query(Enrollment).filter(Enrollment.course_id.in_(course_ids)).count() if course_ids else 0
    total_content = db.query(FacultyContent).filter(FacultyContent.faculty_id == current_user.id).count()
    total_notices = db.query(Notice).filter(Notice.posted_by == current_user.id).count()
    total_events = db.query(Event).filter(Event.posted_by == current_user.id).count()
    recent_content = db.query(FacultyContent).filter(FacultyContent.faculty_id == current_user.id).order_by(FacultyContent.created_at.desc()).limit(5).all()
    recent_notices = db.query(Notice).filter(Notice.posted_by == current_user.id).order_by(Notice.created_at.desc()).limit(5).all()
    return {"course_count": len(courses), "total_students": total_students, "content_count": total_content, "notices_count": total_notices, "events_count": total_events, "courses": [{"id": c.id, "name": c.name, "code": c.code} for c in courses], "recent_content": [{"id": c.id, "title": c.title, "content_type": c.content_type} for c in recent_content], "recent_notices": [{"id": n.id, "title": n.title} for n in recent_notices]}

@router.get("/portal/courses")
def list_courses(current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.faculty_id == current_user.id).all()
    result = []
    for c in courses:
        student_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
        result.append({"id": c.id, "name": c.name, "code": c.code, "department": c.department, "description": c.description, "student_count": student_count})
    return result

@router.get("/portal/courses/{course_id}/students")
def course_students(course_id: str, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.faculty_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    students = []
    for e in enrollments:
        student = db.query(Profile).filter(Profile.id == e.student_id).first()
        if student:
            students.append({"id": student.id, "name": student.full_name, "email": student.email})
    return students

@router.get("/portal/content")
def list_content(course_id: str = None, content_type: str = None, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    query = db.query(FacultyContent).filter(FacultyContent.faculty_id == current_user.id)
    if course_id:
        query = query.filter(FacultyContent.course_id == course_id)
    if content_type:
        query = query.filter(FacultyContent.content_type == content_type)
    content = query.order_by(FacultyContent.created_at.desc()).all()
    return [{"id": c.id, "course_id": c.course_id, "title": c.title, "content_type": c.content_type, "description": c.description, "file_url": c.file_url, "file_type": c.file_type, "file_size": c.file_size, "due_date": c.due_date, "created_at": str(c.created_at)} for c in content]

@router.post("/portal/content")
def create_content(data: dict, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    content = FacultyContent(course_id=data["course_id"], faculty_id=current_user.id, title=data["title"], content_type=data["content_type"], description=data.get("description"), file_url=data.get("file_url"), due_date=data.get("due_date"))
    db.add(content)
    db.commit()
    return {"id": content.id, "title": content.title, "content_type": content.content_type}

@router.delete("/portal/content/{content_id}")
def delete_content(content_id: str, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    content = db.query(FacultyContent).filter(FacultyContent.id == content_id, FacultyContent.faculty_id == current_user.id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    db.delete(content)
    db.commit()
    return {"ok": True}

@router.get("/portal/submissions")
def list_submissions(course_id: str = None, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    query = db.query(AssignmentSubmission).join(FacultyContent).filter(FacultyContent.faculty_id == current_user.id)
    if course_id:
        query = query.filter(FacultyContent.course_id == course_id)
    submissions = query.order_by(AssignmentSubmission.submitted_at.desc()).all()
    return [{"id": s.id, "assignment_id": s.assignment_id, "student_id": s.student_id, "content": s.content, "file_url": s.file_url, "grade": s.grade, "feedback": s.feedback, "submitted_at": str(s.submitted_at), "graded_at": str(s.graded_at) if s.graded_at else None} for s in submissions]

@router.post("/portal/submissions/{submission_id}/grade")
def grade_submission(submission_id: str, data: dict, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    submission = db.query(AssignmentSubmission).join(FacultyContent).filter(AssignmentSubmission.id == submission_id, FacultyContent.faculty_id == current_user.id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    submission.grade = data.get("grade", submission.grade)
    submission.feedback = data.get("feedback", submission.feedback)
    import datetime
    submission.graded_at = datetime.datetime.utcnow()
    db.commit()
    return {"ok": True}

@router.get("/portal/notices")
def list_notices(current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    notices = db.query(Notice).filter(Notice.posted_by == current_user.id).order_by(Notice.created_at.desc()).all()
    return [{"id": n.id, "title": n.title, "content": n.content, "target_role": n.target_role, "is_active": n.is_active, "created_at": str(n.created_at)} for n in notices]

@router.post("/portal/notices")
def create_notice(data: dict, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    notice = Notice(posted_by=current_user.id, title=data["title"], content=data["content"], target_role=data.get("target_role", "all"), department=data.get("department"))
    db.add(notice)
    db.commit()
    return {"id": notice.id, "title": notice.title, "created_at": str(notice.created_at)}

@router.delete("/portal/notices/{notice_id}")
def delete_notice(notice_id: str, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    notice = db.query(Notice).filter(Notice.id == notice_id, Notice.posted_by == current_user.id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    db.delete(notice)
    db.commit()
    return {"ok": True}

@router.get("/portal/events")
def list_events(current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.posted_by == current_user.id).order_by(Event.event_date.desc()).all()
    return [{"id": e.id, "title": e.title, "description": e.description, "event_date": e.event_date, "location": e.location, "created_at": str(e.created_at)} for e in events]

@router.post("/portal/events")
def create_event(data: dict, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    event = Event(posted_by=current_user.id, title=data["title"], description=data.get("description"), event_date=data["event_date"], location=data.get("location"))
    db.add(event)
    db.commit()
    return {"id": event.id, "title": event.title, "event_date": event.event_date}

@router.delete("/portal/events/{event_id}")
def delete_event(event_id: str, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id, Event.posted_by == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"ok": True}

@router.get("/portal/timetable")
def list_timetable(current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    entries = db.query(TimetableEntry).filter(TimetableEntry.faculty_id == current_user.id).all()
    return [{"id": e.id, "course_id": e.course_id, "day_of_week": e.day_of_week, "start_time": e.start_time, "end_time": e.end_time, "room": e.room} for e in entries]

@router.post("/portal/timetable")
def create_timetable(data: dict, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    entry = TimetableEntry(course_id=data["course_id"], faculty_id=current_user.id, day_of_week=data["day_of_week"], start_time=data["start_time"], end_time=data["end_time"], room=data.get("room"))
    db.add(entry)
    db.commit()
    return {"id": entry.id, "day_of_week": entry.day_of_week, "start_time": entry.start_time}

@router.delete("/portal/timetable/{entry_id}")
def delete_timetable(entry_id: str, current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    entry = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id, TimetableEntry.faculty_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}
