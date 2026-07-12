from app.services.ai_service import get_ai_response, get_ai_stream
from typing import Generator

NOTE_TYPE_PROMPTS = {
    "summary": "Create a detailed summary of the topic '{topic}' in subject '{subject}'. Include key concepts, important definitions, and a brief conclusion.",
    "flashcards": "Create 10 flashcards for the topic '{topic}' in {subject}. Format each as Q: question A: answer on separate lines.",
    "mindmap": "Create a mind map structure for '{topic}' in {subject}. List main branches and sub-branches in a hierarchical format using indentation.",
    "studyguide": "Create a comprehensive study guide for '{topic}' in {subject}. Organize by sections with explanations, examples, and practice questions.",
    "keypoints": "List the 10 most important key points about '{topic}' in {subject}. Each point should be concise and clearly stated.",
    "qa": "Generate 10 practice questions with detailed answers for '{topic}' in {subject}. Format as Q: and A: on separate lines.",
    "cheatsheet": "Create a quick reference cheat sheet for '{topic}' in {subject}. Include formulas, syntax, and quick tips in a compact format.",
    "formula": "List all important formulas and equations for '{topic}' in {subject}. Include the name of each formula, the formula itself, and what each variable represents.",
    "language": "Create language learning content for '{topic}' in {subject}. Include vocabulary words, phrases, grammar rules, and example sentences.",
}

def generate_note_content(note_type: str, topic: str, subject: str, additional_context: str = None) -> str:
    prompt_template = NOTE_TYPE_PROMPTS.get(note_type, NOTE_TYPE_PROMPTS["summary"])
    prompt = prompt_template.format(topic=topic, subject=subject)
    if additional_context:
        prompt += f"\n\nAdditional context: {additional_context}"
    return get_ai_response(prompt)

def generate_note_content_stream(note_type: str, topic: str, subject: str, additional_context: str = None) -> Generator[str, None, None]:
    prompt_template = NOTE_TYPE_PROMPTS.get(note_type, NOTE_TYPE_PROMPTS["summary"])
    prompt = prompt_template.format(topic=topic, subject=subject)
    if additional_context:
        prompt += f"\n\nAdditional context: {additional_context}"
    return get_ai_stream(prompt)
