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


@pytest.mark.asyncio
async def test_analyze_invalid_mode(async_client: AsyncClient) -> None:
    pdf = create_sample_pdf("Valid resume text for testing purposes." * 10)
    response = await async_client.post(
        "/api/v1/analyze",
        data={"mode": "unknown_mode"},
        files={"resume": ("resume.pdf", pdf, "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_MODE"


@pytest.mark.asyncio
async def test_analyze_custom_jd_too_short(async_client: AsyncClient) -> None:
    pdf = create_sample_pdf("Valid resume text for testing purposes." * 10)
    response = await async_client.post(
        "/api/v1/analyze",
        data={"mode": "custom_jd", "job_description": "Too short JD"},
        files={"resume": ("resume.pdf", pdf, "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "JD_TOO_SHORT"


@pytest.mark.asyncio
async def test_analyze_invalid_role(async_client: AsyncClient) -> None:
    pdf = create_sample_pdf("Valid resume text for testing purposes." * 10)
    response = await async_client.post(
        "/api/v1/analyze",
        data={"mode": "role", "role_id": "nonexistent_role_xyz"},
        files={"resume": ("resume.pdf", pdf, "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "INVALID_ROLE"


@pytest.mark.asyncio
async def test_analyze_successful_validation(async_client: AsyncClient) -> None:
    resume_text = (
        "Jane Doe\n"
        "jane@example.com | (555) 987-6543 | github.com/janedoe\n\n"
        "PROFESSIONAL EXPERIENCE\n"
        "- Developed backend microservices using Python, FastAPI, and PostgreSQL.\n"
        "- Deployed applications on AWS using Docker and GitHub Actions CI/CD.\n\n"
        "TECHNICAL SKILLS\n"
        "Python, FastAPI, Docker, PostgreSQL, Git, SQL, AWS\n"
    ) * 3
    pdf = create_sample_pdf(resume_text)

    response = await async_client.post(
        "/api/v1/analyze",
        data={"mode": "role", "role_id": "python_developer"},
        files={"resume": ("resume.pdf", pdf, "application/pdf")},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["Content-Type"]

    # Verify stream emitted valid profile and skills events
    lines = response.text.splitlines()
    assert any("event: stage" in line for line in lines)
    assert any("event: section" in line for line in lines)
    assert any("event: done" in line for line in lines)
    assert "python" in response.text
    assert "fastapi" in response.text
    assert "has_email" in response.text


@pytest.mark.asyncio
async def test_list_roles(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/v1/roles")
    assert response.status_code == 200
    roles = response.json()
    assert len(roles) >= 14
    role_ids = {r["id"] for r in roles}
    assert "python_developer" in role_ids
    assert "data_analyst" in role_ids
    assert "ui_ux_designer" in role_ids
