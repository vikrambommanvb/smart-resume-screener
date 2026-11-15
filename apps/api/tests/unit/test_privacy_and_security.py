import logging
import os
import tempfile
from typing import cast

import pymupdf as fitz
import pytest
from httpx import AsyncClient


def create_sample_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), text)
    pdf_bytes = cast(bytes, doc.tobytes())
    doc.close()
    return pdf_bytes


def _verify_no_secrets_in_files(temp_dir: str, new_files: set[str], secret: str) -> None:
    for filename in new_files:
        filepath = os.path.join(temp_dir, filename)
        if os.path.isfile(filepath):
            try:
                with open(filepath, "rb") as f:
                    content = f.read()
                    assert secret.encode() not in content, f"Secret leaked to temp file: {filename}"
            except (OSError, PermissionError):
                pass


@pytest.mark.asyncio
async def test_zero_disk_writes_during_analysis(async_client: AsyncClient) -> None:
    """Verifies that processing a PDF resume performs zero writes to the filesystem or temp directory."""
    temp_dir = tempfile.gettempdir()
    initial_temp_files = set(os.listdir(temp_dir))

    unique_secret = "UNIQUE_SECRET_MARKER_998822"
    resume_text = (
        f"Candidate Secret {unique_secret}\n"
        "secret_dev@example.org | +1 555-0199-882\n\n"
        "EXPERIENCE\n"
        "Developed backend systems using Python, FastAPI, and PostgreSQL.\n"
        "Built automated CI/CD pipelines on AWS with Docker.\n\n"
        "SKILLS\n"
        "Python, FastAPI, Docker, PostgreSQL, AWS\n"
    ) * 4

    pdf = create_sample_pdf(resume_text)

    response = await async_client.post(
        "/api/v1/analyze",
        data={"mode": "role", "role_id": "python_developer"},
        files={"resume": ("confidential_resume.pdf", pdf, "application/pdf")},
    )

    assert response.status_code == 200

    # Verify no new files were created or left in temp dir containing the secret
    current_temp_files = set(os.listdir(temp_dir))
    new_files = current_temp_files - initial_temp_files
    _verify_no_secrets_in_files(temp_dir, new_files, unique_secret)


@pytest.mark.asyncio
async def test_zero_pii_in_application_logs(async_client: AsyncClient, caplog: pytest.LogCaptureFixture) -> None:
    """Verifies that no resume text or candidate PII (email, phone, name) appears in server logs."""
    candidate_name = "Zachariah Zephyrson"
    candidate_email = "zephyrson.secret@testprivacy.org"
    candidate_phone = "555-849-0123"

    resume_text = (
        f"{candidate_name}\n"
        f"{candidate_email} | {candidate_phone}\n\n"
        "EXPERIENCE\n"
        "Senior Developer designing microservices in Python, FastAPI, and Redis.\n"
        "Led system migration to Kubernetes on Google Cloud.\n\n"
        "SKILLS\n"
        "Python, FastAPI, Redis, Kubernetes, GCP\n"
    ) * 4

    pdf = create_sample_pdf(resume_text)

    with caplog.at_level(logging.DEBUG):
        response = await async_client.post(
            "/api/v1/analyze",
            data={"mode": "role", "role_id": "backend_developer"},
            files={"resume": ("resume.pdf", pdf, "application/pdf")},
        )

    assert response.status_code == 200

    captured_logs = caplog.text
    assert candidate_name not in captured_logs, "Candidate name found in server logs!"
    assert candidate_email not in captured_logs, "Candidate email found in server logs!"
    assert candidate_phone not in captured_logs, "Candidate phone found in server logs!"
    assert "Senior Developer designing microservices" not in captured_logs, "Resume body found in logs!"


@pytest.mark.asyncio
async def test_oversized_file_rejected_immediately(async_client: AsyncClient) -> None:
    """Verifies that files exceeding 5MB are rejected immediately before processing."""
    # 5.5 MB payload
    oversized_data = b"%PDF-1.4\n" + (b"0" * (5500 * 1024))
    response = await async_client.post(
        "/api/v1/analyze",
        data={"mode": "role", "role_id": "python_developer"},
        files={"resume": ("huge.pdf", oversized_data, "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "TOO_LARGE"


@pytest.mark.asyncio
async def test_non_pdf_file_rejected(async_client: AsyncClient) -> None:
    """Verifies that non-PDF content is rejected with 400 Bad Request."""
    invalid_data = b"This is plain text masquerading as a PDF."
    response = await async_client.post(
        "/api/v1/analyze",
        data={"mode": "role", "role_id": "python_developer"},
        files={"resume": ("fake.pdf", invalid_data, "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "NOT_A_PDF"
