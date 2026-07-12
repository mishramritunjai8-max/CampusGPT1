from app.core.config import settings

_provider_instance = None

def get_ai_provider():
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance
    provider_name = settings.AI_PROVIDER
    if provider_name == "ollama":
        from app.services.ai_provider import OllamaAIProvider
        _provider_instance = OllamaAIProvider()
    elif provider_name == "gemini":
        from app.services.ai_provider import GeminiAIProvider
        _provider_instance = GeminiAIProvider()
    elif provider_name == "openai":
        from app.services.ai_provider import OpenAIAIProvider
        _provider_instance = OpenAIAIProvider()
    else:
        from app.services.ai_provider import MockAIProvider
        _provider_instance = MockAIProvider()
    return _provider_instance

def get_ai_response(prompt: str) -> str:
    provider = get_ai_provider()
    return provider.generate_response(prompt)

def get_ai_stream(prompt: str):
    provider = get_ai_provider()
    return provider.generate_stream(prompt)
