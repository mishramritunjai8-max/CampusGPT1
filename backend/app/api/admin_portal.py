from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, Course, Enrollment, Department, Subject, AuditLog, Notice, Event
from app.core.security import get_current_admin
import datetime

router = APIRouter()

@router.get("/portal/analytics")
def admin_analytics(current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    students = db.query(Profile).filter(Profile.role == "student").count()
    faculty = db.query(Profile).filter(Profile.role == "faculty").count()
    admins = db.query(Profile).filter(Profile.role == "admin").count()
    departments = db.query(Department).count()
    courses = db.query(Course).count()
    subjects = db.query(Subject).count()
    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    return {"user_counts": {"students": students, "faculty": faculty, "admins": admins, "total": students + faculty + admins}, "department_count": departments, "course_count": courses, "subject_count": subjects, "recent_logs": [{"id": l.id, "user_id": l.user_id, "action": l.action, "entity_type": l.entity_type, "details": l.details, "created_at": str(l.created_at)} for l in recent_logs]}

@router.get("/portal/users")
def list_users(role: str = None, search: str = None, current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    query = db.query(Profile)
    if role:
        query = query.filter(Profile.role == role)
    if search:
        query = query.filter(Profile.full_name.ilike(f"%{search}%") | Profile.email.ilike(f"%{search}%"))
    users = query.order_by(Profile.created_at.desc()).all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role, "department": u.department, "created_at": str(u.created_at)} for u in users]

@router.put("/portal/users/{user_id}")
def update_user(user_id: str, data: dict, current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key in ["full_name", "role", "department"]:
        if key in data:
            setattr(user, key, data[key])
    log = AuditLog(user_id=current_user.id, action="update", entity_type="user", entity_id=user_id, details=f"Updated {key if 'key' in dir() else 'fields'} for user {user.email}")
    db.add(log)
    db.commit()
    return {"ok": True}

@router.delete("/portal/users/{user_id}")
def delete_user(user_id: str, current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    log = AuditLog(user_id=current_user.id, action="delete", entity_type="user", entity_id=user_id, details=f"Deleted user {user.email}")
    db.add(log)
    db.commit()
    return {"ok": True}

@router.get("/portal/departments")
def list_departments(current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    return [{"id": d.id, "name": d.name, "code": d.code, "description": d.description} for d in depts]

@router.post("/portal/departments")
def create_department(data: dict, current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    dept = Department(name=data["name"], code=data.get("code"), description=data.get("description"))
    db.add(dept)
    db.commit()
    log = AuditLog(user_id=current_user.id, action="create", entity_type="department", entity_id=dept.id, details=f"Created department {dept.name}")
    db.add(log)
    db.commit()
    return {"id": dept.id, "name": dept.name, "code": dept.code}

@router.delete("/portal/departments/{dept_id}")
def delete_department(dept_id: str, current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"ok": True}

@router.get("/portal/subjects")
def list_subjects(department_id: str = None, current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    query = db.query(Subject)
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    subjects = query.all()
    return [{"id": s.id, "department_id": s.department_id, "name": s.name, "code": s.code, "credits": s.credits} for s in subjects]

@router.post("/portal/subjects")
def create_subject(data: dict, current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    subject = Subject(department_id=data["department_id"], name=data["name"], code=data.get("code"), credits=data.get("credits"))
    db.add(subject)
    db.commit()
    return {"id": subject.id, "name": subject.name}

@router.get("/portal/courses")
def list_all_courses(current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    return [{"id": c.id, "name": c.name, "code": c.code, "faculty_id": c.faculty_id, "department": c.department, "description": c.description} for c in courses]

@router.get("/portal/logs")
def list_logs(current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(50).all()
    return [{"id": l.id, "user_id": l.user_id, "action": l.action, "entity_type": l.entity_type, "entity_id": l.entity_id, "details": l.details, "created_at": str(l.created_at)} for l in logs]

@router.get("/portal/notices")
def list_all_notices(current_user: Profile = Depends(get_current_admin), db: Session = Depends(get_db)):
    notices = db.query(Notice).order_by(Notice.created_at.desc()).all()
    return [{"id": n.id, "posted_by": n.posted_by, "title": n.title, "content": n.content, "target_role": n.target_role, "is_active": n.is_active, "created_at": str(n.created_at)} for n in notices]
