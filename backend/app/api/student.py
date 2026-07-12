from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, Course, Enrollment
from app.core.security import get_current_student

router = APIRouter()

@router.get("/dashboard")
def student_dashboard(current_user: Profile = Depends(get_current_student), db: Session = Depends(get_db)):
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).count()
    courses = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
    course_list = []
    for e in courses:
        course = db.query(Course).filter(Course.id == e.course_id).first()
        if course:
            course_list.append({"id": course.id, "name": course.name, "code": course.code})
    return {
        "enrollment_count": enrollments,
        "courses": course_list,
    }
