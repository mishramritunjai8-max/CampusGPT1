from sqlalchemy.orm import Session
from app.models.models import AttendanceSubject, AttendanceRecord
import datetime

def get_attendance_stats(user_id: str, db: Session) -> dict:
    subjects = db.query(AttendanceSubject).filter(AttendanceSubject.user_id == user_id).all()
    overall_total = sum(s.total_classes for s in subjects)
    overall_attended = sum(s.attended_classes for s in subjects)
    overall_pct = round((overall_attended / overall_total * 100), 1) if overall_total > 0 else 0
    subject_stats = []
    for s in subjects:
        pct = round((s.attended_classes / s.total_classes * 100), 1) if s.total_classes > 0 else 0
        needed = 0
        if s.total_classes > 0 and pct < 75:
            target = 75
            needed = int(((target * s.total_classes / 100) - s.attended_classes) / (1 - target / 100)) + 1
        subject_stats.append({"id": s.id, "name": s.name, "code": s.code, "total_classes": s.total_classes, "attended_classes": s.attended_classes, "percentage": pct, "classes_needed_for_75": max(0, needed)})
    return {"overall_total": overall_total, "overall_attended": overall_attended, "overall_percentage": overall_pct, "subject_count": len(subjects), "subjects": subject_stats}

def get_attendance_predictions(user_id: str, target: float, db: Session) -> dict:
    subjects = db.query(AttendanceSubject).filter(AttendanceSubject.user_id == user_id).all()
    predictions = []
    for s in subjects:
        if s.total_classes > 0:
            current_pct = (s.attended_classes / s.total_classes * 100)
            if current_pct < target:
                needed = int(((target * s.total_classes / 100) - s.attended_classes) / (1 - target / 100)) + 1
                predictions.append({"subject": s.name, "current_percentage": round(current_pct, 1), "classes_needed": max(0, needed), "target": target})
    return {"target": target, "predictions": predictions}

def get_monthly_chart(user_id: str, year: int, month: int, db: Session) -> list:
    if not year:
        year = datetime.date.today().year
    if not month:
        month = datetime.date.today().month
    subjects = db.query(AttendanceSubject).filter(AttendanceSubject.user_id == user_id).all()
    result = []
    for s in subjects:
        records = db.query(AttendanceRecord).filter(AttendanceRecord.subject_id == s.id).all()
        present = sum(1 for r in records if r.status == "present")
        absent = sum(1 for r in records if r.status == "absent")
        leave = sum(1 for r in records if r.status == "leave")
        total = present + absent + leave
        result.append({"subject": s.name, "present": present, "absent": absent, "leave": leave, "total": total})
    return result

def get_weekly_chart(user_id: str, db: Session) -> list:
    today = datetime.date.today()
    start = today - datetime.timedelta(days=today.weekday())
    days = []
    for i in range(7):
        day = start + datetime.timedelta(days=i)
        subjects = db.query(AttendanceSubject).filter(AttendanceSubject.user_id == user_id).all()
        subject_ids = [s.id for s in subjects]
        records = db.query(AttendanceRecord).filter(AttendanceRecord.subject_id.in_(subject_ids), AttendanceRecord.date == day.strftime("%Y-%m-%d")).all() if subject_ids else []
        present = sum(1 for r in records if r.status == "present")
        days.append({"date": day.strftime("%Y-%m-%d"), "day": day.strftime("%A"), "present": present, "total": len(records)})
    return days

def get_calendar_data(user_id: str, year: int, month: int, db: Session) -> list:
    if not year:
        year = datetime.date.today().year
    if not month:
        month = datetime.date.today().month
    subjects = db.query(AttendanceSubject).filter(AttendanceSubject.user_id == user_id).all()
    subject_ids = [s.id for s in subjects]
    prefix = f"{year}-{month:02d}"
    records = db.query(AttendanceRecord).filter(AttendanceRecord.subject_id.in_(subject_ids), AttendanceRecord.date.like(f"{prefix}%")).all() if subject_ids else []
    calendar = {}
    for r in records:
        if r.date not in calendar:
            calendar[r.date] = {"present": 0, "absent": 0, "leave": 0, "total": 0}
        calendar[r.date][r.status] += 1
        calendar[r.date]["total"] += 1
    return [{"date": d, **stats} for d, stats in calendar.items()]

def export_attendance_csv(user_id: str, db: Session) -> str:
    subjects = db.query(AttendanceSubject).filter(AttendanceSubject.user_id == user_id).all()
    lines = ["Subject,Code,Total Classes,Attended,Percentage"]
    for s in subjects:
        pct = round((s.attended_classes / s.total_classes * 100), 1) if s.total_classes > 0 else 0
        lines.append(f"{s.name},{s.code},{s.total_classes},{s.attended_classes},{pct}")
    return "\n".join(lines)
