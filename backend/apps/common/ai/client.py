from django.conf import settings
from openai import OpenAI, RateLimitError, APIError, APIConnectionError

from .exceptions import AIRateLimitError, AIServiceError


_client = OpenAI(
    api_key=settings.GEMINI_API_KEY,
    base_url=settings.GEMINI_BASE_URL,
)

class AIService:
    """
    Wrapper around Gemini's free tier
    """
    @staticmethod
    def complete(system, user, model = None, max_tokens = 300, temperature = 0.4):
        model = model or settings.AI_MODEL_QUALITY
        try:
            resp = _client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return resp.choices[0].message.content.strip()
        except RateLimitError as e:
            raise AIRateLimitError(str(e)) from e
        except (APIError, APIConnectionError) as e:
            raise AIServiceError(str(e)) from e
