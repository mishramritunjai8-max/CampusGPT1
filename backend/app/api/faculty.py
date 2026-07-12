from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, Course, Enrollment
from app.core.security import get_current_faculty

router = APIRouter()

@router.get("/dashboard")
def faculty_dashboard(current_user: Profile = Depends(get_current_faculty), db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.faculty_id == current_user.id).all()
    total_students = 0
    for c in courses:
        total_students += db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
    return {
        "course_count": len(courses),
        "total_students": total_students,
        "courses": [{"id": c.id, "name": c.name, "code": c.code, "department": c.department} for c in courses],
    }
