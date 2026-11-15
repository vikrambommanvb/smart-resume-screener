# Render Deployment Checklist: Smart Resume Screener

This checklist provides step-by-step guidance to ensure a zero-downtime, error-free deployment of the **Smart Resume Screener** on Render.

---

## 1. Render Web Service Form Settings

| Render Form Field | Correct Setting | Explanation |
| :--- | :--- | :--- |
| **Name** | `smart-resume-screener-api` | Unique name for your backend service. |
| **Project** | *(Optional - leave blank)* | Can be grouped into a Render project if desired. |
| **Environment** | *(Optional - leave blank)* | Standard default environment. |
| **Language** | `Docker` | Render builds and runs the multi-stage Docker container. |
| **Branch** | `main` | Production branch to build from. |
| **Region** | `Singapore (Southeast Asia)` | Select your closest geographical region. |
| **Root Directory** | `apps/api` | **CRITICAL:** Must be set to `apps/api` so the Docker build context finds `pyproject.toml`, `app/`, and `scripts/`. |
| **Dockerfile Path** | `./Dockerfile` | Relative to the `apps/api` Root Directory. |
| **Compute Plan** | `Free ($0 / month, 0.1 CPU, 512 MB RAM)` | Matches your selected plan. |

---

## 2. Advanced Settings & Health Checks

Under the **Advanced** collapsible section at the bottom of the Render form:

- **Health Check Path:**
  - Set to: `/healthz`
  - *Note:* The FastAPI service exposes `/healthz` as its primary liveness probe. Render uses this path to confirm the container has successfully booted before routing live traffic.
- **Auto-Deploy:**
  - `Yes` (Trigger automatic redeployment whenever code is pushed to `main`).

---

## 3. Render Environment Variables (Copy & Paste)

In the **Environment Variables** section on Render, add these key-value pairs:

```env
ENVIRONMENT=production
ALLOWED_ORIGINS=["*"]
MAX_GLOBAL_CONCURRENT_ANALYSES=1
RATE_LIMIT_PER_10MIN=10
GEMINI_API_KEY=your_gemini_api_key_here
```

*(If you do not have a Gemini API key ready, you can leave `GEMINI_API_KEY` blank or omit it; the screener will automatically run in local deterministic mode without failing).*

---

## 4. Docker Architecture & Resource Safeguards

1. **Pre-Baked Offline Weights:**
   - The multi-stage Dockerfile downloads both `all-MiniLM-L6-v2` and `en_core_web_sm` during the Docker image build stage.
   - At runtime, models load instantly from `/app/models` with zero runtime network downloads.
2. **512 MB RAM Optimization:**
   - Setting `MAX_GLOBAL_CONCURRENT_ANALYSES=1` ensures that PyTorch in-memory embeddings processing operates strictly one request at a time, preventing Out-Of-Memory (OOM) eviction on Render's 512 MB Free tier.
3. **Dynamic Port Binding:**
   - Render automatically injects the `PORT` variable. The container's startup command (`uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`) automatically binds to Render's allocated port.
4. **Zero Disk Storage:**
   - PDF uploads stream through memory buffers and are never stored on disk. No persistent disk volume is required.

---

## 5. Frontend & Backend Connection

Once your Render Web Service completes deployment:

1. Render will assign you a live HTTPS URL (e.g., `https://smart-resume-screener-api.onrender.com`).
2. Test the API liveness probe in your browser:
   `https://smart-resume-screener-api.onrender.com/healthz`
   *(Should return `{"status":"ok"}`)*
3. When deploying your frontend (on Render Static Site, Vercel, or Netlify), set:
   `VITE_API_BASE_URL=https://smart-resume-screener-api.onrender.com`
4. Update `ALLOWED_ORIGINS` in your backend Render Environment Variables to restrict CORS to your deployed frontend URL.
