import json
from typing import Any

import pymupdf as fitz
import pytest
from httpx import AsyncClient


def create_test_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_textbox(fitz.Rect(50, 50, 550, 750), text)
    pdf_bytes = bytes(doc.tobytes())
    doc.close()
    return pdf_bytes


def parse_sse_events(raw_body: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    current_event: str | None = None
    current_data: str | None = None

    for line in raw_body.splitlines():
        if line.startswith("event:"):
            current_event = line.replace("event:", "").strip()
        elif line.startswith("data:"):
            current_data = line.replace("data:", "").strip()
        elif line == "":
            if current_event and current_data:
                try:
                    events.append({"event": current_event, "data": json.loads(current_data)})
                except Exception:
                    events.append({"event": current_event, "data": current_data})
            current_event = None
            current_data = None

    return events


@pytest.mark.asyncio
async def test_analyze_stream_integration_and_degraded_mode(async_client: AsyncClient) -> None:
    resume_text = (
        "Alex Rivera\n"
        "alex@example.com | (555) 123-4567 | github.com/arivera\n\n"
        "PROFESSIONAL SUMMARY\n"
        "Senior Backend Developer with 5 years building high-throughput microservices in Python.\n\n"
        "WORK EXPERIENCE\n"
        "Senior Backend Engineer | 2021 - Present\n"
        "- Architected high-performance RESTful APIs using Python, FastAPI, and PostgreSQL.\n"
        "- Containerized microservices using Docker and orchestrated automated CI/CD deployments.\n"
        "- Optimized SQL database queries reducing response latency by 45% for 500K daily users.\n\n"
        "TECHNICAL PROJECTS\n"
        "Distributed Event Broker\n"
        "- Engineered real-time streaming pipeline processing 10,000 events/sec with Docker.\n\n"
        "EDUCATION\n"
        "B.S. in Computer Science\n\n"
        "TECHNICAL SKILLS\n"
        "Python, FastAPI, Docker, PostgreSQL, SQL, Git, Linux, REST APIs"
    )
    pdf_bytes = create_test_pdf(resume_text)

    response = await async_client.post(
        "/api/v1/analyze",
        data={"mode": "role", "role_id": "python_developer"},
        files={"resume": ("resume.pdf", pdf_bytes, "application/pdf")},
    )

    # 1. Assert Status and Headers
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["Content-Type"]
    assert response.headers["Cache-Control"] == "no-store"
    assert response.headers["X-Accel-Buffering"] == "no"

    # 2. Parse SSE Event Sequence
    events = parse_sse_events(response.text)
    event_names = [e["event"] for e in events]

    assert "stage" in event_names
    assert "section" in event_names
    assert "done" in event_names

    # 3. Verify Deterministic Sections streamed cleanly
    sections_emitted = {
        e["data"]["name"]: e["data"]["data"]
        for e in events
        if e["event"] == "section" and isinstance(e["data"], dict) and "name" in e["data"]
    }

    assert "resume_profile" in sections_emitted
    assert "skills" in sections_emitted
    assert "match" in sections_emitted
    assert "health" in sections_emitted
    assert "careers" in sections_emitted
    assert "roadmap" in sections_emitted

    # Verify Roadmap in degraded mode has deterministic steps with verified catalog resources
    roadmap_data = sections_emitted["roadmap"]
    assert len(roadmap_data) >= 1
    for step in roadmap_data:
        assert "goal" in step
        assert "milestone" in step
        assert len(step["resources"]) > 0
        for res in step["resources"]:
            assert res["url"].startswith("https://")
            assert res["title"] != ""
            assert res["platform"] != ""

    # Verify Match Score
    match_data = sections_emitted["match"]
    assert 60 <= match_data["total_score"] <= 100
    assert match_data["band"] in {"solid", "strong"}
    assert "components" in match_data

    # Verify Health Score
    health_data = sections_emitted["health"]
    assert 60 <= health_data["total_score"] <= 100
    assert "subscores" in health_data

    # 4. Verify Degraded Mode Flag on Done Event
    # Since GEMINI_API_KEY is not set in this test environment, AI sections degrade gracefully
    done_event = next(e for e in events if e["event"] == "done")
    assert done_event["data"]["degraded"] is True
    assert "request_id" in done_event["data"]
    assert done_event["data"]["duration_ms"] >= 0
