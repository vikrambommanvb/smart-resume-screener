# Deployment Guide: Smart Resume Screener

This document outlines the step-by-step production deployment procedures for **Smart Resume Screener**:
- **Backend API:** Google Cloud Run (containerised FastAPI, region `asia-south1`)
- **Frontend SPA:** Vercel (static React 19 / Vite build with strict edge security headers)

---

## 1. Backend: Google Cloud Run

### 1.1 Prerequisites
1. [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and authenticated.
2. A GCP project with billing enabled.
3. Required GCP APIs enabled:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
   ```

### 1.2 Secret Manager Setup
Store your Gemini API key securely in GCP Secret Manager:
```bash
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic"
```

Grant the Cloud Run service account access to read the secret:
```bash
PROJECT_NUM=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 1.3 Deployment Execution
Run the automated deployment script:
```bash
cd apps/api
GCP_PROJECT_ID="your-project-id" REGION="asia-south1" ./deploy.sh
```

### 1.4 Production Safeguards & Resource Bounds
The Cloud Run service is configured with:
- **Zero Disk Storage:** No persistent volume mounted; memory is ephemeral and recycled per invocation.
- **Max Instances:** Capped at `10` instances to prevent runaway compute costs.
- **Concurrency:** `80` requests per instance.
- **CPU & Memory:** `1 vCPU`, `2 GiB RAM` (sufficient for in-memory PyMuPDF extraction and embeddings computation).
- **Cold-Start Optimization:** Sentence-transformers weights (`all-MiniLM-L6-v2`) and spaCy pipeline (`en_core_web_sm`) are pre-baked into the image layer at build time, ensuring instances boot in under 2 seconds.

---

## 2. Frontend: Vercel

### 2.1 Configuration (`vercel.json`)
The frontend includes a pre-configured `vercel.json` defining strict HTTP response headers:
- `Content-Security-Policy`: Disallows untrusted scripts and restrains connect-src to Cloud Run and local dev.
- `X-Frame-Options: DENY`: Prevents clickjacking.
- `X-Content-Type-Options: nosniff`: Guards against MIME sniffing.
- `Referrer-Policy: strict-origin-when-cross-origin`: Prevents referrer leakage.

### 2.2 Environment Variables on Vercel
In the Vercel Project Dashboard (Settings > Environment Variables), configure:
- `VITE_API_BASE_URL`: The Cloud Run service URL (e.g. `https://smart-resume-screener-api-xyz-as.a.run.app`).

### 2.3 Deploy via Vercel CLI
```bash
cd apps/web
pnpm build
vercel --prod
```

### 2.4 CORS Allowlist
After deployment, update the Cloud Run API's `ALLOWED_ORIGINS` to include your production Vercel domain:
```bash
gcloud run services update smart-resume-screener-api \
  --region asia-south1 \
  --update-env-vars ALLOWED_ORIGINS="https://your-app.vercel.app"
```
