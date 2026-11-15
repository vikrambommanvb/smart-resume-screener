import time
from collections import defaultdict

import httpx
from fastapi import HTTPException, Request, status

from app.core.config import settings
from app.core.logging import log_event


class RateLimiter:
    def __init__(self, limit: int = 6, window_seconds: int = 600) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds
        # Clean older requests
        self.requests[client_ip] = [ts for ts in self.requests[client_ip] if ts > window_start]

        if len(self.requests[client_ip]) >= self.limit:
            return False

        self.requests[client_ip].append(now)
        return True


rate_limiter = RateLimiter(limit=settings.RATE_LIMIT_PER_10MIN, window_seconds=600)


def get_client_ip(request: Request) -> str:
    """Extract client IP from the rightmost trusted hop in X-Forwarded-For, falling back to client.host."""
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        # Split hops and take the rightmost hop
        hops = [h.strip() for h in xff.split(",") if h.strip()]
        if hops:
            return hops[-1]
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


async def check_rate_limit(request: Request) -> str:
    client_ip = get_client_ip(request)
    if not rate_limiter.is_allowed(client_ip):
        log_event("rate_limit_exceeded", client_ip=client_ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMITED",
                "message": "Too many requests. Please wait a few minutes before trying again.",
            },
        )
    return client_ip


async def verify_turnstile(token: str, client_ip: str) -> bool:
    if not settings.TURNSTILE_ENABLED:
        return True
    if not token or not settings.TURNSTILE_SECRET:
        return False

    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": settings.TURNSTILE_SECRET,
                    "response": token,
                    "remoteip": client_ip,
                },
            )
            data = resp.json()
            return bool(data.get("success", False))
        except Exception:
            return False

