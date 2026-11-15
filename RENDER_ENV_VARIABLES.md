# Render Deployment Environment Variables: Smart Resume Screener

This document provides the complete, repository-verified environment variable specification for deploying the **Smart Resume Screener** API backend to **Render** using Docker.

---

## 1. Complete Environment Variable Specification

| Variable Name | Classification | Default Value | Production Value / Example | Requires Secret? | Source in Codebase | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Optional | `development` | `production` | No | `apps/api/app/core/config.py:11` | Configures the runtime environment mode and sets production logging/security filters. |
| `PORT` | Render-provided | `8000` | *Set dynamically by Render* (e.g. `10000`) | No | `apps/api/Dockerfile:83`, `config.py:12` | Port on which the Uvicorn web server listens. Render automatically injects this. |
| `HOST` | Optional | `0.0.0.0` | `0.0.0.0` | No | `apps/api/app/core/config.py:13` | Network binding interface. Must remain `0.0.0.0` to receive external traffic. |
| `LOG_LEVEL` | Optional | `INFO` | `INFO` | No | `apps/api/app/core/config.py:14` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `ALLOWED_ORIGINS` | Required | `["*"]` | `["*"]` or `["https://your-frontend.onrender.com"]` | No | `apps/api/app/core/config.py:20-28` | CORS allowlist JSON array. Permits web browsers to make requests to this backend. |
| `GEMINI_API_KEY` | Conditionally Required | `""` | `<your-google-ai-studio-api-key>` | Yes | `apps/api/app/core/config.py:16`, `apps/api/app/llm/client.py:23` | Google Gemini API key for personalized bullet rewrites, learning guidance, and interview prep. If omitted, app operates in graceful degraded mode. |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | `gemini-2.5-flash` | No | `apps/api/app/core/config.py:17`, `apps/api/app/llm/client.py:24` | Primary generative AI model ID. |
| `GEMINI_MODEL_FALLBACKS` | Optional | `["gemini-3.5-flash", "gemini-3.8-flash"]` | `["gemini-3.5-flash", "gemini-3.8-flash"]` | No | `apps/api/app/core/config.py:18`, `apps/api/app/llm/client.py:25` | Fallback models tried sequentially if primary model is throttled or times out. |
| `RATE_LIMIT_PER_10MIN` | Optional | `6` | `10` | No | `apps/api/app/core/config.py:30`, `apps/api/app/core/security.py:30` | Sliding window rate limit per client IP every 10 minutes to prevent abuse. |
| `MAX_GLOBAL_CONCURRENT_ANALYSES` | Optional | `4` | `1` (on 512MB RAM) or `2` | No | `apps/api/app/core/config.py:31`, `apps/api/app/llm/client.py:18` | Global semaphore controlling simultaneous embedding & analysis workloads. |
| `TURNSTILE_ENABLED` | Optional | `false` | `false` | No | `apps/api/app/core/config.py:33`, `apps/api/app/core/security.py:61` | Bot protection flag. Keep `false` unless Cloudflare Turnstile verification is configured on frontend. |
| `TURNSTILE_SECRET` | Conditionally Required | `""` | *Empty if disabled* | Yes | `apps/api/app/core/config.py:34`, `apps/api/app/core/security.py:63` | Cloudflare Turnstile secret key. Required only when `TURNSTILE_ENABLED=true`. |

---

## 2. Classification Breakdown

### 2.1 Required (Deployment Blockers)
- **`ALLOWED_ORIGINS`**: While defaulting to local addresses in development, production browsers require either `["*"]` or your specific deployed frontend origin URL (e.g. `["https://smart-resume-screener.vercel.app"]` or `["https://your-frontend.onrender.com"]`). Without this, the web app will display CORS network errors.

### 2.2 Conditionally Required
- **`GEMINI_API_KEY`**: 
  - **With API Key:** Provides full generative bullet rewrites, personalized career roadmaps, and interview question defenses.
  - **Without API Key:** The system does **not** crash; it automatically enters graceful degraded mode, serving deterministic heuristic recommendations while completing full resume parsing and math scoring.
  - **How to obtain:** Generate a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
- **`TURNSTILE_SECRET`**:
  - Required only if `TURNSTILE_ENABLED` is explicitly set to `true`. Otherwise leave blank.

### 2.3 Optional (Pre-configured Defaults)
- `ENVIRONMENT`: Set to `production`.
- `LOG_LEVEL`: Set to `INFO`.
- `GEMINI_MODEL`: Set to `gemini-2.5-flash`.
- `RATE_LIMIT_PER_10MIN`: Set to `10`.
- `MAX_GLOBAL_CONCURRENT_ANALYSES`: Set to `1` on Render Free tier (512MB RAM) to prevent memory spikes.
- `TURNSTILE_ENABLED`: Set to `false`.

### 2.4 Render-Provided (Do NOT Configure Manually)
- **`PORT`**: Render automatically allocates and assigns this environment variable (e.g., `10000`). The Dockerfile CMD executes:
  `exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --loop uvloop`

### 2.5 Variables That Must NOT Be Added
- `DATABASE_URL` / `POSTGRES_URL`: Not used. Smart Resume Screener operates on a strict zero-retention, in-memory ephemeral architecture.
- `REDIS_URL`: Not used. In-memory concurrency and rate limiting.
- `PINECONE_API_KEY` / `VECTOR_DB_URL`: Not used. The sentence-transformer model (`all-MiniLM-L6-v2`) runs locally within the Docker container.
- `OPENAI_API_KEY`: Not used. The application uses Google's `google-genai` SDK exclusively.
- `VITE_*` variables: These belong strictly to the frontend build and must not be configured on the Python API service.

---

## 3. External Services & AI Integration Audit

- **AI Providers:** Only Google Gemini via the official `google-genai` SDK (`apps/api/app/llm/client.py`).
- **Local Embedding Models:** Sentence-Transformers (`all-MiniLM-L6-v2`) and spaCy (`en_core_web_sm`). Both are pre-downloaded and baked into `/app/models` inside the Docker image during the build phase (`apps/api/Dockerfile:36-44`).
- **Databases:** None. Ephemeral memory only.
- **File Storage:** No persistent disk storage or S3/GCS buckets. Uploaded PDFs stream directly into Python `io.BytesIO` volatile memory and are garbage-collected upon response completion.
