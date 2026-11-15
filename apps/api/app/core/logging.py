import logging
import sys
from typing import Any


class SafeFormatter(logging.Formatter):
    """Logs metadata only (request ID, durations, status codes). Never logs prompt or text payloads."""

    def format(self, record: logging.LogRecord) -> str:
        # Prevent leaking raw text or arguments into logs
        message = super().format(record)
        return message


def setup_logging(level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("smart_resume_screener")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )
        logger.addHandler(handler)

    return logger


logger = setup_logging()


def log_event(event_name: str, **kwargs: Any) -> None:
    """Safe structured metadata logger."""
    safe_data: dict[str, Any] = {}
    forbidden_keys = {"resume", "jd", "job_description", "text", "prompt", "content"}
    for k, v in kwargs.items():
        if k.lower() in forbidden_keys:
            continue
        safe_data[k] = v

    meta_str = " ".join(f"{k}={v}" for k, v in safe_data.items())
    logger.info("%s %s", event_name, meta_str)

