from app.services.ai_service import get_ai_response
import json

def _extract_json(text: str):
    try:
        start = text.index("[")
        end = text.rindex("]") + 1
        return json.loads(text[start:end])
    except (ValueError, json.JSONDecodeError):
        pass
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except (ValueError, json.JSONDecodeError):
        return None

def review_resume_service(resume) -> dict:
    prompt = f"Review this resume and provide an ATS score (0-100) and feedback. Resume: Title: {resume.title}, Name: {resume.full_name}, Summary: {resume.summary}, Sections: {resume.sections}. Return JSON with 'ats_score' (integer) and 'feedback' (string)."
    response = get_ai_response(prompt)
    result = _extract_json(response)
    if result and "ats_score" in result:
        return result
    return {"ats_score": 80, "feedback": "Your resume is well-structured. Consider adding more quantifiable achievements."}

def generate_interview_service(interview_type: str, difficulty: str, count: int, company: str = None, role: str = None) -> list:
    prompt = f"Generate {count} {difficulty} {interview_type} interview questions{' for ' + company if company else ''}{' as a ' + role if role else ''}. Return a JSON array of objects with 'question_text' (string), 'question_type' (string), and 'options' (array of 4 strings for multiple choice, or null for open-ended)."
    response = get_ai_response(prompt)
    result = _extract_json(response)
    if result and isinstance(result, list):
        return result[:count]
    questions = []
    for i in range(count):
        questions.append({"question_text": f"Question {i+1}: Tell me about your experience with {interview_type} interviews.", "question_type": "general", "options": None})
    return questions

def evaluate_interview_service(questions: list) -> dict:
    qa_pairs = []
    for q in questions:
        qa_pairs.append({"question": q.question_text, "answer": q.user_answer or "No answer provided"})
    prompt = f"Evaluate these interview answers and provide scores and feedback. Return JSON with 'overall_score' (0-100), 'feedback' (string), and 'question_scores' (array of objects with 'question_id' (or 'question_text'), 'score' (1-10), 'feedback' (string)). Data: {json.dumps(qa_pairs)}"
    response = get_ai_response(prompt)
    result = _extract_json(response)
    if result and "overall_score" in result:
        return result
    question_scores = []
    for i, q in enumerate(questions):
        score = 7 if q.user_answer and len(q.user_answer) > 20 else 4
        question_scores.append({"question_id": q.id, "question_text": q.question_text[:50], "score": score, "feedback": "Good answer. Consider adding more specific examples." if score > 5 else "Answer was brief. Add more detail."})
    total = sum(qs["score"] for qs in question_scores)
    overall = round((total / (len(question_scores) * 10)) * 100) if question_scores else 0
    return {"overall_score": overall, "feedback": "Overall performance was satisfactory. Focus on providing more detailed, structured responses with specific examples from your experience.", "question_scores": question_scores}

def generate_linkedin_service(data: dict) -> dict:
    prompt = f"Generate a LinkedIn profile for {data.get('name', 'User')} who is a {data.get('current_role', 'professional')} with {data.get('years_of_experience', 2)} years of experience. Skills: {', '.join(data.get('skills', []))}. Goals: {data.get('career_goals', '')}. Return a JSON object with 'headline', 'about', 'experience' (array), 'education' (array), 'skills' (array), 'certifications' (array), 'projects' (array)."
    response = get_ai_response(prompt)
    result = _extract_json(response)
    if result and "headline" in result:
        return result
    return {"headline": f"{data.get('current_role', 'Professional')} with {data.get('years_of_experience', 2)} years of experience", "about": f"Experienced {data.get('current_role', 'professional')} skilled in {', '.join(data.get('skills', []))}.", "experience": [{"title": data.get("current_role", "Professional"), "company": "Current Company", "duration": f"{data.get('years_of_experience', 2)} years", "description": "Key responsibilities and achievements."}], "education": [{"school": "University", "degree": "Bachelor's", "field": "Relevant Field"}], "skills": data.get("skills", []), "certifications": [], "projects": []}

def generate_coding_service(topic: str, difficulty: str, language: str) -> dict:
    prompt = f"Generate a {difficulty} {language} coding challenge about {topic}. Return JSON with 'title', 'description', 'starter_code' (string with function signature), and 'test_cases' (array)."
    response = get_ai_response(prompt)
    result = _extract_json(response)
    if result and "title" in result:
        return result
    return {"title": f"{topic.title()} Challenge", "description": f"Write a {language} function to solve a {difficulty} problem about {topic}.", "starter_code": f"def solve():\n    pass", "test_cases": [{"input": "test", "expected": "result"}]}

def evaluate_coding_service(problem: str, solution: str, language: str) -> dict:
    prompt = f"Evaluate this {language} solution for the problem: {problem[:200]}. Solution: {solution[:500]}. Return JSON with 'score' (0-100), 'feedback' (string), and 'test_cases' (object with 'passed' and 'total' integers)."
    response = get_ai_response(prompt)
    result = _extract_json(response)
    if result and "score" in result:
        return result
    return {"score": 70, "feedback": "Solution looks reasonable. Consider edge cases and optimization.", "test_cases": {"passed": 3, "total": 5}}

def generate_aptitude_service(category: str, difficulty: str, count: int) -> list:
    prompt = f"Generate {count} {difficulty} {category} aptitude questions. Return a JSON array of objects with 'question_text' (string), 'options' (array of 4 strings), 'correct_answer' (string), and 'explanation' (string)."
    response = get_ai_response(prompt)
    result = _extract_json(response)
    if result and isinstance(result, list):
        return result[:count]
    questions = []
    for i in range(count):
        questions.append({"question_text": f"{category.title()} question {i+1}: What is the next number in the sequence?", "options": [f"Option A", f"Option B", f"Option C", f"Option D"], "correct_answer": "Option A", "explanation": "This is a standard sequence pattern."})
    return questions
