from app.services.ai_service import get_ai_response
import json

def generate_quiz_questions(topic: str, difficulty: str, count: int) -> list:
    prompt = f"Generate {count} {difficulty} difficulty quiz questions about {topic}. Return a JSON array with objects containing 'question_text' (string), 'options' (array of 4 strings for multiple choice), 'correct_answer' (the correct option string), and 'marks' (float, default 1.0). Make sure the JSON is valid."
    response = get_ai_response(prompt)
    try:
        start = response.index("[")
        end = response.rindex("]") + 1
        questions = json.loads(response[start:end])
        return questions[:count]
    except:
        questions = []
        for i in range(count):
            questions.append({
                "question_text": f"Question {i+1} about {topic}?",
                "options": [f"Option A for Q{i+1}", f"Option B for Q{i+1}", f"Option C for Q{i+1}", f"Option D for Q{i+1}"],
                "correct_answer": f"Option A for Q{i+1}",
                "marks": 1.0
            })
        return questions
