---
name: fastapi-nlp-service
description: Use when working in apps/api. Covers FastAPI structure, PDF extraction with PyMuPDF, text normalisation, sectioning, skill taxonomy matching, sentence-transformer scoring, streaming responses, upload security, and Cloud Run container practices.
---

# FastAPI and NLP service patterns

## Structure
`app/main.py` (lifespan loads models once), `app/api/` (routes), `app/core/` (config, logging, security, rate limit), `app/pipeline/` (extract, normalise, section, redact, skills, score, health), `app/llm/` (client, prompts, schemas, guards), `app/data/` (taxonomy.json, roles.json, resources.json), `scripts/`, `tests/`.

## PDF handling
- Read the upload into memory with a hard cap (5 MB), verify magic bytes `%PDF-`, open with `fitz.open(stream=..., filetype="pdf")`, reject encrypted files, cap pages at 8, run extraction under a timeout in a thread pool.
- Extract with block positions and sort into reading order; detect multi-column layouts by clustering block x-origins and read column by column.
- Normalise: Unicode NFKC, bullet glyphs to `-`, de-hyphenate line breaks, collapse whitespace, strip repeated headers and footers, keep line breaks for sectioning.
- If text length is under 300 characters, treat as scanned: return `SCANNED_PDF` unless `allow_scan_fallback` was set.

## Models
- Load spaCy and the sentence-transformer once in `lifespan`. Run CPU-bound inference in a thread pool so the event loop stays free. Cache JD and role embeddings in an in-process LRU keyed by a content hash (hash only, never store text).
- Calibrate cosine similarity to a 0-1 fit with a configurable piecewise-linear map (defaults 0.30 -> 0, 0.70 -> 1). Document constants and test them.

## Streaming
- Return `StreamingResponse(media_type="text/event-stream")`. Headers: `Cache-Control: no-store`, `X-Accel-Buffering: no`. Send a comment heartbeat every 10 seconds. Do not enable GZip for this route. Isolate failures per section: emit an `error` event for that section and continue.

## Security
- Treat resume and JD text as untrusted data. Never put them in system instructions, never execute or evaluate them.
- Client IP for rate limiting comes from the rightmost trusted `X-Forwarded-For` hop; never trust the leftmost entry. State the assumption in `docs/security.md`.
- CORS: explicit origin allowlist from env, `allow_credentials=False`.
- Logs: request ID, sizes, durations, stage status, error codes. Never content.

## Container
Multi-stage build, non-root user, CPU-only PyTorch wheels (no CUDA packages), spaCy model and sentence-transformer weights baked into the image at build time, exact pins from a lockfile (`uv.lock`), `HEALTHCHECK`-compatible `/healthz` (liveness) and `/readyz` (models loaded).

