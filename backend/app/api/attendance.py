from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, AttendanceSubject, AttendanceRecord
from app.core.security import get_current_user
from app.services.attendance_service import get_attendance_stats, get_attendance_predictions, get_monthly_chart, get_weekly_chart, get_calendar_data, export_attendance_csv

router = APIRouter()

@router.get("/attendance/subjects")
def list_subjects(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    subjects = db.query(AttendanceSubject).filter(AttendanceSubject.user_id == current_user.id).all()
    return [{"id": s.id, "name": s.name, "code": s.code, "total_classes": s.total_classes, "attended_classes": s.attended_classes} for s in subjects]

@router.post("/attendance/subjects")
def create_subject(data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    subject = AttendanceSubject(user_id=current_user.id, name=data["name"], code=data.get("code", ""), total_classes=data.get("total_classes", 0), attended_classes=data.get("attended_classes", 0))
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return {"id": subject.id, "name": subject.name, "code": subject.code, "total_classes": subject.total_classes, "attended_classes": subject.attended_classes}

@router.put("/attendance/subjects/{subject_id}")
def update_subject(subject_id: str, data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    subject = db.query(AttendanceSubject).filter(AttendanceSubject.id == subject_id, AttendanceSubject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    for key in ["name", "code", "total_classes", "attended_classes"]:
        if key in data:
            setattr(subject, key, data[key])
    db.commit()
    return {"ok": True}

@router.delete("/attendance/subjects/{subject_id}")
def delete_subject(subject_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    subject = db.query(AttendanceSubject).filter(AttendanceSubject.id == subject_id, AttendanceSubject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return {"ok": True}

@router.get("/attendance/records")
def list_records(subject_id: str = None, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(AttendanceRecord).join(AttendanceSubject).filter(AttendanceSubject.user_id == current_user.id)
    if subject_id:
        query = query.filter(AttendanceRecord.subject_id == subject_id)
    records = query.order_by(AttendanceRecord.created_at.desc()).all()
    return [{"id": r.id, "subject_id": r.subject_id, "date": r.date, "status": r.status} for r in records]

@router.post("/attendance/records")
def create_record(data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    subject = db.query(AttendanceSubject).filter(AttendanceSubject.id == data["subject_id"], AttendanceSubject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    record = AttendanceRecord(subject_id=data["subject_id"], date=data["date"], status=data["status"])
    db.add(record)
    if data["status"] == "present":
        subject.attended_classes += 1
    subject.total_classes += 1
    db.commit()
    return {"ok": True}

@router.get("/attendance/stats")
def attendance_stats(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_attendance_stats(current_user.id, db)

@router.get("/attendance/predictions")
def attendance_predictions(target: float = 75.0, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_attendance_predictions(current_user.id, target, db)

@router.get("/attendance/charts/monthly")
def monthly_chart(year: int = None, month: int = None, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_monthly_chart(current_user.id, year, month, db)

@router.get("/attendance/charts/weekly")
def weekly_chart(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_weekly_chart(current_user.id, db)

@router.get("/attendance/calendar")
def calendar_data(year: int = None, month: int = None, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_calendar_data(current_user.id, year, month, db)

@router.get("/attendance/export")
def export_csv(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    csv_data = export_attendance_csv(current_user.id, db)
    from fastapi.responses import Response
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=attendance.csv"})
