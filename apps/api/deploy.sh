#!/usr/bin/env bash
# ==============================================================================
# Smart Resume Screener: Cloud Run Deployment Script
# Region default: asia-south1 (configurable via REGION)
# ==============================================================================

set -euo pipefail

# Configuration parameters with secure defaults
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"
REGION="${REGION:-asia-south1}"
SERVICE_NAME="smart-resume-screener-api"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

if [ -z "${PROJECT_ID}" ]; then
  echo "Error: GCP_PROJECT_ID is not set and no active gcloud project found."
  echo "Usage: GCP_PROJECT_ID=my-project-id ./deploy.sh"
  exit 1
fi

echo "=========================================================="
echo "Deploying ${SERVICE_NAME} to Google Cloud Run"
echo "Project: ${PROJECT_ID}"
echo "Region:  ${REGION}"
echo "=========================================================="

# 1. Build and push production container image using Cloud Build
echo "Building container image using Cloud Build..."
gcloud builds submit --tag "${IMAGE_TAG}" .

# 2. Deploy container to Cloud Run with strict resource and security bounds
echo "Deploying to Cloud Run with hardened constraints..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_TAG}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --concurrency 80 \
  --cpu 1 \
  --memory 2Gi \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 60s \
  --set-env-vars "ENVIRONMENT=production,LOG_LEVEL=INFO,PORT=8000" \
  --update-secrets "GEMINI_API_KEY=gemini-api-key:latest"

# 3. Retrieve service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${REGION}" --format 'value(status.url)')

echo "=========================================================="
echo "Deployment Complete!"
echo "Service URL: ${SERVICE_URL}"
echo "Healthcheck: curl ${SERVICE_URL}/health"
echo "=========================================================="

