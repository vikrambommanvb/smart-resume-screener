import json
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "INFO"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_MODEL_FALLBACKS: list[str] = ["gemini-3.5-flash", "gemini-3.8-flash"]

    ALLOWED_ORIGINS: list[str] = [
        "*",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    RATE_LIMIT_PER_10MIN: int = 6
    MAX_GLOBAL_CONCURRENT_ANALYSES: int = 4

    TURNSTILE_ENABLED: bool = False
    TURNSTILE_SECRET: str = ""

    USE_LIGHTWEIGHT_EMBEDDINGS: bool = True

    @field_validator("ALLOWED_ORIGINS", "GEMINI_MODEL_FALLBACKS", mode="before")
    @classmethod
    def parse_json_list(cls, v: Any) -> Any:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [item.strip() for item in v.split(",") if item.strip()]
        return v


settings = Settings()

