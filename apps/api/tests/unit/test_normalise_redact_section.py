from app.pipeline.normalise import normalise_text
from app.pipeline.redact import redact_pii
from app.pipeline.section import segment_resume


def test_normalise_bullets_and_dehyphenation() -> None:
    raw = (
        "• Led the imple-\n"
        "mentation of distributed microservices.\n"
        "▪ Designed fault-tolerant architecture with 99.9% avail-\n"
        "ability."
    )
    norm = normalise_text(raw)
    assert "- Led the implementation of distributed microservices." in norm
    assert "- Designed fault-tolerant architecture with 99.9% availability." in norm


def test_normalise_unicode_ligatures() -> None:
    # Test ligature 'ﬁ' (U+FB01) normalises to 'fi'
    raw = "Conﬁgured dynamic trafﬁc routing."
    norm = normalise_text(raw)
    assert "Configured dynamic traffic routing." == norm


def test_redact_pii_and_flags() -> None:
    raw = (
        "Jane Doe\n"
        "jane.doe@example.com | (555) 123-4567 | 123 Main Street, Seattle, WA\n"
        "linkedin.com/in/janedoe | github.com/janedoe | janedoe.dev\n\n"
        "Professional Summary\n"
        "Experienced software developer building cloud applications."
    )
    res = redact_pii(raw)
    assert res.has_email is True
    assert res.has_phone is True
    assert res.has_linkedin is True
    assert res.has_github is True
    assert res.has_portfolio is True
    assert "[EMAIL]" in res.redacted_text
    assert "jane.doe@example.com" not in res.redacted_text
    assert "[PHONE]" in res.redacted_text
    assert "(555) 123-4567" not in res.redacted_text
    assert "[LOCATION]" in res.redacted_text


def test_segment_resume_headings() -> None:
    text = (
        "PROFESSIONAL SUMMARY\n"
        "Senior backend developer with 6 years experience in Python and FastAPI.\n\n"
        "WORK EXPERIENCE\n"
        "- Engineered microservices using Docker and PostgreSQL.\n\n"
        "TECHNICAL PROJECTS\n"
        "- Built open-source data pipeline using Apache Kafka.\n\n"
        "EDUCATION\n"
        "B.S. in Computer Science\n\n"
        "TECHNICAL SKILLS\n"
        "Python, Docker, SQL, PostgreSQL, Git"
    )
    sections = segment_resume(text)
    assert "summary" in sections.detected_sections
    assert "experience" in sections.detected_sections
    assert "projects" in sections.detected_sections
    assert "education" in sections.detected_sections
    assert "skills" in sections.detected_sections
    assert "FastAPI" in sections.summary
    assert "PostgreSQL" in sections.experience
    assert "Kafka" in sections.projects

