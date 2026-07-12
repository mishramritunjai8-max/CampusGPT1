from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile
from app.core.security import get_current_admin

router = APIRouter()

@router.get("/dashboard")
def admin_dashboard(current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    students = db.query(Profile).filter(Profile.role == "student").count()
    faculty = db.query(Profile).filter(Profile.role == "faculty").count()
    admins = db.query(Profile).filter(Profile.role == "admin").count()
    return {
        "total_students": students,
        "total_faculty": faculty,
        "total_admins": admins,
        "total_users": students + faculty + admins,
    }
