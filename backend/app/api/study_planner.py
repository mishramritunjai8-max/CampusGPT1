from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Profile, StudyPlan, StudyTask, StudySession, StudyStreak
from app.core.security import get_current_user
import datetime

router = APIRouter()

@router.get("/planner/plans")
def list_plans(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    plans = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).order_by(StudyPlan.created_at.desc()).all()
    result = []
    for p in plans:
        task_count = db.query(StudyTask).filter(StudyTask.plan_id == p.id).count()
        completed_tasks = db.query(StudyTask).filter(StudyTask.plan_id == p.id, StudyTask.status == "completed").count()
        result.append({"id": p.id, "title": p.title, "semester": p.semester, "start_date": p.start_date, "end_date": p.end_date, "description": p.description, "is_ai_generated": p.is_ai_generated, "task_count": task_count, "completed_tasks": completed_tasks, "created_at": str(p.created_at), "updated_at": str(p.updated_at)})
    return result

@router.post("/planner/plans")
def create_plan(data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = StudyPlan(user_id=current_user.id, title=data["title"], semester=data.get("semester"), start_date=data.get("start_date"), end_date=data.get("end_date"), description=data.get("description"))
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"id": plan.id, "title": plan.title, "semester": plan.semester, "start_date": plan.start_date, "end_date": plan.end_date, "description": plan.description}

@router.put("/planner/plans/{plan_id}")
def update_plan(plan_id: str, data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    for key in ["title", "semester", "start_date", "end_date", "description"]:
        if key in data:
            setattr(plan, key, data[key])
    db.commit()
    return {"ok": True}

@router.delete("/planner/plans/{plan_id}")
def delete_plan(plan_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return {"ok": True}

@router.get("/planner/tasks")
def list_tasks(plan_id: str = None, status: str = None, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(StudyTask).join(StudyPlan).filter(StudyPlan.user_id == current_user.id)
    if plan_id:
        query = query.filter(StudyTask.plan_id == plan_id)
    if status:
        query = query.filter(StudyTask.status == status)
    tasks = query.order_by(StudyTask.created_at.desc()).all()
    return [{"id": t.id, "plan_id": t.plan_id, "title": t.title, "description": t.description, "subject": t.subject, "priority": t.priority, "due_date": t.due_date, "status": t.status, "estimated_minutes": t.estimated_minutes} for t in tasks]

@router.post("/planner/tasks")
def create_task(data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.id == data["plan_id"], StudyPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    task = StudyTask(plan_id=data["plan_id"], title=data["title"], description=data.get("description"), subject=data.get("subject"), priority=data.get("priority", "medium"), due_date=data.get("due_date"), estimated_minutes=data.get("estimated_minutes"))
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"id": task.id, "plan_id": task.plan_id, "title": task.title, "description": task.description, "priority": task.priority, "status": task.status}

@router.put("/planner/tasks/{task_id}")
def update_task(task_id: str, data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(StudyTask).join(StudyPlan).filter(StudyTask.id == task_id, StudyPlan.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key in ["title", "description", "subject", "priority", "due_date", "status", "estimated_minutes"]:
        if key in data:
            setattr(task, key, data[key])
    db.commit()
    return {"ok": True}

@router.delete("/planner/tasks/{task_id}")
def delete_task(task_id: str, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(StudyTask).join(StudyPlan).filter(StudyTask.id == task_id, StudyPlan.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}

@router.post("/planner/sessions")
def create_session(data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(StudyPlan).filter(StudyPlan.id == data["plan_id"], StudyPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    session = StudySession(plan_id=data["plan_id"], duration_minutes=data["duration_minutes"], notes=data.get("notes"), date=data.get("date", str(datetime.date.today())))
    db.add(session)
    streak = db.query(StudyStreak).filter(StudyStreak.user_id == current_user.id).first()
    if not streak:
        streak = StudyStreak(user_id=current_user.id)
        db.add(streak)
    today = str(datetime.date.today())
    if streak.last_study_date != today:
        from datetime import timedelta
        yesterday = str(datetime.date.today() - timedelta(days=1))
        if streak.last_study_date == yesterday:
            streak.current_streak += 1
        else:
            streak.current_streak = 1
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak
        streak.last_study_date = today
    db.commit()
    return {"ok": True}

@router.get("/planner/streak")
def get_streak(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    streak = db.query(StudyStreak).filter(StudyStreak.user_id == current_user.id).first()
    if not streak:
        return {"current_streak": 0, "longest_streak": 0, "last_study_date": None}
    return {"current_streak": streak.current_streak, "longest_streak": streak.longest_streak, "last_study_date": streak.last_study_date}

@router.get("/planner/analytics")
def get_analytics(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    total_plans = db.query(StudyPlan).filter(StudyPlan.user_id == current_user.id).count()
    total_tasks = db.query(StudyTask).join(StudyPlan).filter(StudyPlan.user_id == current_user.id).count()
    completed_tasks = db.query(StudyTask).join(StudyPlan).filter(StudyPlan.user_id == current_user.id, StudyTask.status == "completed").count()
    total_minutes = db.query(StudySession).join(StudyPlan).filter(StudyPlan.user_id == current_user.id).with_entities(db.func.sum(StudySession.duration_minutes)).scalar() or 0
    streak = db.query(StudyStreak).filter(StudyStreak.user_id == current_user.id).first()
    return {"total_plans": total_plans, "total_tasks": total_tasks, "completed_tasks": completed_tasks, "total_minutes_studied": total_minutes, "current_streak": streak.current_streak if streak else 0, "longest_streak": streak.longest_streak if streak else 0}

@router.post("/planner/ai-plan")
def generate_ai_plan(data: dict, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.study_planner import generate_ai_study_plan
    plan_data = generate_ai_study_plan(data.get("subjects", []), data.get("hours_per_week", 20), data.get("exam_dates", {}))
    plan = StudyPlan(user_id=current_user.id, title=data.get("title", "AI Generated Plan"), semester=data.get("semester"), is_ai_generated=True, description=plan_data.get("description", ""))
    db.add(plan)
    db.commit()
    for task_data in plan_data.get("tasks", []):
        task = StudyTask(plan_id=plan.id, title=task_data["title"], subject=task_data.get("subject"), priority=task_data.get("priority", "medium"), estimated_minutes=task_data.get("estimated_minutes", 60))
        db.add(task)
    db.commit()
    return {"id": plan.id, "title": plan.title, "description": plan.description, "task_count": len(plan_data.get("tasks", []))}
