from app.services.ai_service import get_ai_response
import json

def generate_ai_study_plan(subjects: list, hours_per_week: int, exam_dates: dict) -> dict:
    prompt = f"Create a study plan for subjects: {', '.join(subjects)}. Available hours per week: {hours_per_week}. Exam dates: {json.dumps(exam_dates)}. Return a JSON object with 'description' (string) and 'tasks' (array of objects with 'title', 'subject', 'priority' (high/medium/low), 'estimated_minutes'). Make valid JSON."
    response = get_ai_response(prompt)
    try:
        start = response.index("{")
        end = response.rindex("}") + 1
        return json.loads(response[start:end])
    except:
        tasks = []
        for subject in subjects:
            tasks.append({"title": f"Review {subject} basics", "subject": subject, "priority": "high", "estimated_minutes": 120})
            tasks.append({"title": f"Practice {subject} problems", "subject": subject, "priority": "medium", "estimated_minutes": 90})
        return {"description": f"AI-generated study plan covering {', '.join(subjects)} with {hours_per_week} hours/week.", "tasks": tasks}
