# ==============================================================================
# Multi-Stage Dockerfile for Smart Resume Screener API
# Optimized for Google Cloud Run (zero-storage, pre-baked offline weights)
# ==============================================================================

# Stage 1: Build & Dependency Resolution
FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast, reliable package resolution
COPY --from=ghcr.io/astral-sh/uv:0.5.1 /uv /bin/uv

# Copy project manifests
COPY pyproject.toml .

# Create virtual environment and install production dependencies
RUN uv venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN uv pip compile pyproject.toml -o requirements.txt && \
    uv pip install --no-cache -r requirements.txt

# ==============================================================================
# Stage 2: Minimal Distroless / Hardened Production Runtime
# ==============================================================================
FROM python:3.12-slim-bookworm AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    ENVIRONMENT=production \
    USE_LIGHTWEIGHT_EMBEDDINGS=1 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    TORCH_NUM_THREADS=1 \
    PATH="/opt/venv/bin:$PATH"

# Create non-root system group and user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

# Copy virtual environment from builder
COPY --from=builder --chown=appuser:appgroup /opt/venv /opt/venv

# Copy application source code
COPY --chown=appuser:appgroup app /app/app
COPY --chown=appuser:appgroup scripts /app/scripts

# Switch to unprivileged non-root user
USER appuser:appgroup

# Healthcheck validating the FastAPI /healthz endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://localhost:' + str(os.environ.get('PORT', 8000)) + '/healthz')" || exit 1

EXPOSE 8000

# Start server using Uvicorn with Cloud Run dynamic port binding
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --loop uvloop
