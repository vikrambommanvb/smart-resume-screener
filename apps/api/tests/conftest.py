from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import rate_limiter
from app.main import app


@pytest.fixture(autouse=True)
def reset_rate_limiter() -> None:
    rate_limiter.requests.clear()


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

