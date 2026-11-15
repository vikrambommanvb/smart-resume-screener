from collections.abc import AsyncGenerator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.analyze import router as api_v1_router
from app.core.config import settings
from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting Smart Resume Screener API service...")
    # Model loading (spaCy, sentence-transformers) will be initialized here in Phase 1/2
    yield
    logger.info("Shutting down Smart Resume Screener API service...")


app = FastAPI(
    title="Smart Resume Screener API",
    description="Deterministic and explainable resume screening service",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Allowlist
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Frame-Options"] = "DENY"
    return response


app.include_router(api_v1_router, prefix="/api")


@app.get("/health", summary="Liveness probe alias")
@app.get("/healthz", summary="Liveness probe")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/readyz", summary="Readiness probe")
async def readyz() -> dict[str, str]:
    # In Phase 1/2, verify models are loaded
    return {"status": "ready", "model": settings.GEMINI_MODEL}


@app.get("/", summary="Root status check")
async def root() -> dict[str, str]:
    return {"name": "Smart Resume Screener API", "version": "0.1.0", "status": "running"}

