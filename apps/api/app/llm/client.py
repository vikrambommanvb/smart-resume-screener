import asyncio
from typing import Any, TypeVar

from pydantic import BaseModel

from app.core.config import settings
from app.core.logging import log_event, logger

try:
    from google import genai
    from google.genai import types
    _HAS_GENAI = True
except ImportError:
    _HAS_GENAI = False

T = TypeVar("T", bound=BaseModel)

_concurrency_semaphore = asyncio.Semaphore(settings.MAX_GLOBAL_CONCURRENT_ANALYSES)


class GeminiService:
    def __init__(self) -> None:
        self.api_key = settings.GEMINI_API_KEY
        self.primary_model = settings.GEMINI_MODEL
        self.fallback_models: list[str] = settings.GEMINI_MODEL_FALLBACKS
        self._client: Any | None = None

    def _get_client(self) -> Any | None:
        if not self._client and _HAS_GENAI and self.api_key:
            try:
                self._client = genai.Client(api_key=self.api_key)
            except Exception as exc:
                logger.warning("Could not initialize google-genai Client: %s", exc)
                self._client = None
        return self._client

    async def generate_structured(
        self,
        system_instruction: str,
        user_prompt: str,
        response_schema: type[T],
        temperature: float = 0.2,
        max_output_tokens: int = 2500,
        timeout_seconds: float = 25.0,
    ) -> T | None:
        """Async structured generation with model fallbacks and retry for transient errors."""
        client = self._get_client()
        if client is None:
            log_event("gemini_skipped_no_client_or_key")
            return None

        models_to_try = [self.primary_model] + [m for m in self.fallback_models if m != self.primary_model]

        async with _concurrency_semaphore:
            for model_id in models_to_try:
                for attempt in range(2):
                    try:
                        config = types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            response_mime_type="application/json",
                            response_schema=response_schema,
                            temperature=temperature,
                            max_output_tokens=max_output_tokens,
                        )

                        call = client.aio.models.generate_content(
                            model=model_id,
                            contents=user_prompt,
                            config=config,
                        )
                        response = await asyncio.wait_for(call, timeout=timeout_seconds)

                        if response and response.parsed is not None:
                            log_event("gemini_call_success", model=model_id, attempt=attempt)
                            return response.parsed  # type: ignore[no-any-return]

                    except TimeoutError:
                        logger.warning("Gemini model %s timed out after %ss (attempt %s)", model_id, timeout_seconds, attempt)
                    except Exception as exc:
                        err_str = str(exc)
                        logger.warning("Gemini error on model %s (attempt %s): %s", model_id, attempt, err_str)
                        # Check if rate-limited or transient
                        if "429" in err_str or "503" in err_str:
                            await asyncio.sleep(1.0 + attempt * 1.5)
                        else:
                            break  # Fatal model or schema error, try next fallback model

        log_event("gemini_all_fallbacks_failed")
        return None


gemini_service = GeminiService()
