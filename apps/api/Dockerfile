# ==============================================================================
# Multi-Stage Dockerfile for Smart Resume Screener API
# Optimized for Google Cloud Run (zero-storage, pre-baked offline weights)
# ==============================================================================

# Stage 1: Build & Dependency Resolution
FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    SENTENCE_TRANSFORMERS_HOME=/build/models \
    HF_HOME=/build/models

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

RUN uv pip install --no-cache -r <(uv pip compile pyproject.toml --no-deps) || \
    uv pip install --no-cache .

# Pre-download spaCy English model into the virtual environment
RUN /opt/venv/bin/python -m spacy download en_core_web_sm

# Pre-bake sentence-transformers all-MiniLM-L6-v2 weights offline
RUN mkdir -p /build/models && \
    /opt/venv/bin/python -c "\
from sentence_transformers import SentenceTransformer;\
SentenceTransformer('all-MiniLM-L6-v2', cache_folder='/build/models');\
print('Successfully pre-baked all-MiniLM-L6-v2 model weights.')"

# ==============================================================================
# Stage 2: Minimal Distroless / Hardened Production Runtime
# ==============================================================================
FROM python:3.12-slim-bookworm AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    ENVIRONMENT=production \
    SENTENCE_TRANSFORMERS_HOME=/app/models \
    HF_HOME=/app/models \
    PATH="/opt/venv/bin:$PATH"

# Create non-root system group and user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

# Copy virtual environment and offline model weights from builder
COPY --from=builder --chown=appuser:appgroup /opt/venv /opt/venv
COPY --from=builder --chown=appuser:appgroup /build/models /app/models

# Copy application source code
COPY --chown=appuser:appgroup app /app/app
COPY --chown=appuser:appgroup scripts /app/scripts

# Switch to unprivileged non-root user
USER appuser:appgroup

# Healthcheck validating the FastAPI /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://localhost:' + str(os.environ.get('PORT', 8000)) + '/health')" || exit 1

EXPOSE 8000

# Start server using Uvicorn with Cloud Run dynamic port binding
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --loop uvloop
