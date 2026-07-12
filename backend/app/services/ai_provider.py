from abc import ABC, abstractmethod
from typing import Generator
from app.core.config import settings
import json
import re


class AIProvider(ABC):
    @abstractmethod
    def generate_response(self, prompt: str) -> str:
        pass
    
    @abstractmethod
    def generate_stream(self, prompt: str) -> Generator[str, None, None]:
        pass


class MockAIProvider(AIProvider):
    def generate_response(self, prompt: str) -> str:
        return self._get_mock_response(prompt)
    
    def generate_stream(self, prompt: str) -> Generator[str, None, None]:
        response = self._get_mock_response(prompt)
        for word in response.split(" "):
            yield word + " "
    
    def _get_mock_response(self, prompt: str) -> str:
        if "resume" in prompt.lower() or "review" in prompt.lower():
            return json.dumps({"ats_score": 85, "feedback": "Strong resume with clear structure. Consider adding more quantifiable achievements and a professional summary."})
        if "interview" in prompt.lower():
            questions = [
                {"question_text": "Tell me about yourself and your background.", "question_type": "behavioral"},
                {"question_text": "Why do you want to work at this company?", "question_type": "hr"},
                {"question_text": "Describe a challenging project you worked on.", "question_type": "behavioral"},
                {"question_text": "What are your greatest strengths and weaknesses?", "question_type": "hr"},
                {"question_text": "Where do you see yourself in 5 years?", "question_type": "behavioral"},
            ]
            return json.dumps(questions)
        if "coding" in prompt.lower():
            return json.dumps({"title": "Two Sum Problem", "description": "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.", "starter_code": "def two_sum(nums, target):\n    pass", "test_cases": [{"input": "[2,7,11,15], 9", "expected": "[0,1]"}]})
        if "aptitude" in prompt.lower():
            questions = [
                {"question_text": "What is 15% of 200?", "options": ["25", "30", "35", "40"], "correct_answer": "30", "explanation": "15/100 * 200 = 30"},
                {"question_text": "If a train travels 60 km in 1 hour, how far will it travel in 30 minutes?", "options": ["20 km", "30 km", "40 km", "50 km"], "correct_answer": "30 km", "explanation": "Speed = 60 km/h, Time = 0.5 h, Distance = 30 km"},
            ]
            return json.dumps(questions)
        if "linkedin" in prompt.lower():
            return json.dumps({"headline": "Passionate Software Engineer | AI & Full-Stack Development", "about": "Experienced software engineer with a passion for building intelligent systems.", "experience": [{"title": "Software Engineer", "company": "Tech Corp", "duration": "2022 - Present", "description": "Built and deployed machine learning models."}], "education": [{"school": "University", "degree": "B.Tech", "field": "Computer Science"}], "skills": ["Python", "React", "FastAPI", "Machine Learning"]})
        if "summary" in prompt.lower() or "note" in prompt.lower():
            return f"# {prompt}\n\nThis is a generated summary of the topic. The key concepts covered include fundamental principles, important definitions, and practical applications. Understanding these core ideas forms the foundation for advanced study in this area.\n\n## Key Points\n\n- Concept 1: Fundamental understanding\n- Concept 2: Practical application\n- Concept 3: Advanced implications\n\n## Conclusion\n\nMastery of this topic requires consistent practice and application of the concepts learned."
        return f"This is a mock response to: {prompt}"


class OllamaAIProvider(AIProvider):
    def __init__(self):
        import httpx
        self.client = httpx.Client(base_url=settings.OLLAMA_API_BASE)
        self.model = settings.OLLAMA_MODEL
    
    def generate_response(self, prompt: str) -> str:
        try:
            response = self.client.post("/api/generate", json={"model": self.model, "prompt": prompt, "stream": False}, timeout=60)
            data = response.json()
            return data.get("response", "")
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_stream(self, prompt: str) -> Generator[str, None, None]:
        try:
            with self.client.stream("POST", "/api/generate", json={"model": self.model, "prompt": prompt, "stream": True}, timeout=60) as response:
                for line in response.iter_lines():
                    if line:
                        data = json.loads(line)
                        token = data.get("response", "")
                        if token:
                            yield token
                        if data.get("done"):
                            break
        except Exception as e:
            yield f"Error: {str(e)}"


class GeminiAIProvider(AIProvider):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
    
    def generate_response(self, prompt: str) -> str:
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel("gemini-pro")
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_stream(self, prompt: str) -> Generator[str, None, None]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel("gemini-pro")
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Error: {str(e)}"


class OpenAIAIProvider(AIProvider):
    def __init__(self):
        from openai import OpenAI
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
    
    def generate_response(self, prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(model=self.model, messages=[{"role": "user", "content": prompt}])
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_stream(self, prompt: str) -> Generator[str, None, None]:
        try:
            stream = self.client.chat.completions.create(model=self.model, messages=[{"role": "user", "content": prompt}], stream=True)
            for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    yield delta.content
        except Exception as e:
            yield f"Error: {str(e)}"
