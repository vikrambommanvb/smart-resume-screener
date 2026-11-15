import pytest

from app.pipeline.careers import compute_career_alternatives
from app.pipeline.health import evaluate_resume_health
from app.pipeline.redact import redact_pii
from app.pipeline.scoring import calculate_match_score
from app.pipeline.section import segment_resume
from app.pipeline.taxonomy import MatchedSkill, taxonomy_engine


@pytest.fixture
def python_resume_text() -> str:
    return (
        "Alex Rivera\n"
        "alex@example.com | (555) 123-4567 | github.com/arivera | linkedin.com/in/arivera\n\n"
        "PROFESSIONAL SUMMARY\n"
        "Experienced Backend Developer with 5 years building high-throughput microservices in Python.\n\n"
        "WORK EXPERIENCE\n"
        "Senior Backend Engineer | 2021 - Present\n"
        "- Architected high-performance RESTful APIs using Python, FastAPI, and PostgreSQL.\n"
        "- Containerized microservices using Docker and orchestrated automated CI/CD deployments.\n"
        "- Optimized SQL database queries reducing response latency by 45% for 500K daily users.\n\n"
        "Software Engineer | 2019 - 2021\n"
        "- Developed background asynchronous task workers using Redis and Celery.\n"
        "- Implemented secure user authentication with JWT and RBAC access control.\n\n"
        "TECHNICAL PROJECTS\n"
        "Distributed Event Broker\n"
        "- Engineered real-time streaming pipeline processing 10,000 events/sec with Docker.\n\n"
        "EDUCATION\n"
        "B.S. in Computer Science | University of Engineering\n\n"
        "TECHNICAL SKILLS\n"
        "Python, FastAPI, Docker, PostgreSQL, Redis, Celery, Git, SQL, Linux, REST APIs"
    )


@pytest.fixture
def data_analyst_resume_text() -> str:
    return (
        "Morgan Lee\n"
        "morgan@example.com | (555) 345-6789 | linkedin.com/in/morganlee\n\n"
        "PROFESSIONAL SUMMARY\n"
        "Data Analyst with 3 years experience creating executive dashboards and data models.\n\n"
        "WORK EXPERIENCE\n"
        "Data Analyst | 2023 - Present\n"
        "- Analyzed customer retention metrics using SQL and Microsoft Excel.\n"
        "- Designed interactive business intelligence dashboards in Tableau.\n"
        "- Formulated A/B tests to measure product conversion rate lifts.\n\n"
        "EDUCATION\n"
        "B.S. in Statistics | State University\n\n"
        "TECHNICAL SKILLS\n"
        "SQL, Tableau, Excel, Data Analysis, Statistics, KPI Tracking"
    )


@pytest.fixture
def fresher_resume_text() -> str:
    return (
        "Jordan Taylor\n"
        "jordan@example.com | (555) 888-9999 | github.com/jordant | jordantaylor.dev\n\n"
        "PROFESSIONAL SUMMARY\n"
        "Recent Computer Science graduate passionate about backend development and open source.\n\n"
        "TECHNICAL PROJECTS\n"
        "FastAPI Task Management API\n"
        "- Built full-featured REST API with Python, FastAPI, SQLite, and automated Pytest suites.\n"
        "- Containerized development environment with Docker and deployed to Cloud Run.\n"
        "- Implemented token authentication and input validation with Pydantic.\n\n"
        "EDUCATION\n"
        "B.S. in Computer Science | Class of 2026\n\n"
        "TECHNICAL SKILLS\n"
        "Python, FastAPI, Docker, Git, SQLite, Pytest, Linux, REST APIs"
    )


def test_scoring_determinism(python_resume_text: str) -> None:
    redaction = redact_pii(python_resume_text)
    sections = segment_resume(redaction.redacted_text)
    skills = taxonomy_engine.extract_skills_from_text(redaction.redacted_text)

    req_skills = ["python", "fastapi", "docker", "postgresql", "sql", "git"]
    resps = [
        "Design scalable RESTful APIs in Python.",
        "Manage containerized microservices with Docker.",
        "Optimize complex SQL queries and relational schemas in PostgreSQL."
    ]

    # Run 5 times and assert results are 100% identical
    results = [
        calculate_match_score(
            resume_sections=sections,
            full_resume_text=redaction.redacted_text,
            matched_skills=skills,
            required_skills=req_skills,
            responsibilities=resps,
            required_years=3.0,
        )
        for _ in range(5)
    ]

    first_score = results[0].total_score
    first_breakdown = {k: v.points for k, v in results[0].components.items()}

    for res in results[1:]:
        assert res.total_score == first_score
        assert {k: v.points for k, v in res.components.items()} == first_breakdown
        assert len(res.biggest_movers) == len(results[0].biggest_movers)


def test_scoring_monotonicity(python_resume_text: str) -> None:
    """Adding a missing required skill never lowers the score."""
    redaction = redact_pii(python_resume_text)
    sections = segment_resume(redaction.redacted_text)
    skills = taxonomy_engine.extract_skills_from_text(redaction.redacted_text)

    req_skills = ["python", "fastapi", "docker", "kubernetes", "aws"]
    resps = ["Build cloud backend microservices."]

    base_result = calculate_match_score(
        resume_sections=sections,
        full_resume_text=redaction.redacted_text,
        matched_skills=skills,
        required_skills=req_skills,
        responsibilities=resps,
        required_years=4.0,
    )

    # Now add 'kubernetes' with evidence to candidate skills
    enhanced_skills = dict(skills)
    enhanced_skills["kubernetes"] = MatchedSkill(
        id="kubernetes",
        name="Kubernetes",
        category="devops",
        evidence_quote="Managed multi-cluster Kubernetes deployments.",
        section="experience",
    )

    enhanced_result = calculate_match_score(
        resume_sections=sections,
        full_resume_text=redaction.redacted_text,
        matched_skills=enhanced_skills,
        required_skills=req_skills,
        responsibilities=resps,
        required_years=4.0,
    )

    assert enhanced_result.total_score >= base_result.total_score
    assert (
        enhanced_result.components["skills"].points
        >= base_result.components["skills"].points
    )


def test_relevance_ordering(python_resume_text: str, data_analyst_resume_text: str) -> None:
    """A relevant Python developer resume outscores an irrelevant Data Analyst resume for a Python JD."""
    req_skills = ["python", "fastapi", "docker", "postgresql", "rest_api"]
    resps = [
        "Architect backend services in Python and FastAPI.",
        "Deploy Docker container workloads.",
        "Maintain PostgreSQL database schema and queries."
    ]

    # Python Developer
    redact_py = redact_pii(python_resume_text)
    res_py = calculate_match_score(
        resume_sections=segment_resume(redact_py.redacted_text),
        full_resume_text=redact_py.redacted_text,
        matched_skills=taxonomy_engine.extract_skills_from_text(redact_py.redacted_text),
        required_skills=req_skills,
        responsibilities=resps,
        required_years=3.0,
    )

    # Data Analyst
    redact_da = redact_pii(data_analyst_resume_text)
    res_da = calculate_match_score(
        resume_sections=segment_resume(redact_da.redacted_text),
        full_resume_text=redact_da.redacted_text,
        matched_skills=taxonomy_engine.extract_skills_from_text(redact_da.redacted_text),
        required_skills=req_skills,
        responsibilities=resps,
        required_years=3.0,
    )

    assert res_py.total_score > res_da.total_score
    assert res_py.band in {"solid", "strong"}
    assert res_da.band in {"weak", "partial"}


def test_fresher_renormalisation_and_protection(fresher_resume_text: str) -> None:
    """A fresher applying to a junior role (0-1 yr req) with projects is awarded full experience points."""
    redaction = redact_pii(fresher_resume_text)
    sections = segment_resume(redaction.redacted_text)
    skills = taxonomy_engine.extract_skills_from_text(redaction.redacted_text)

    req_skills = ["python", "fastapi", "docker", "git"]
    resps = ["Build lightweight backend microservices with FastAPI."]

    result = calculate_match_score(
        resume_sections=sections,
        full_resume_text=redaction.redacted_text,
        matched_skills=skills,
        required_skills=req_skills,
        responsibilities=resps,
        required_years=1.0,  # Junior role
        is_fresher=True,
    )

    # Fresher must receive full 15 points for experience component based on hands-on project work
    assert result.fresher_protected is True
    assert result.components["experience"].points == 15.0


def test_resume_health_evaluation(python_resume_text: str) -> None:
    redaction = redact_pii(python_resume_text)
    sections = segment_resume(redaction.redacted_text)

    health = evaluate_resume_health(
        sections=sections,
        full_text=redaction.redacted_text,
        redaction=redaction,
        page_count=1,
        is_scanned=False,
    )

    assert 70 <= health.total_score <= 100
    assert health.ats_friendliness.score == 20.0
    assert health.structure_sections.score >= 16.0
    assert health.contact_links.score == 5.0


def test_career_alternatives_computation(python_resume_text: str) -> None:
    redaction = redact_pii(python_resume_text)
    skills = taxonomy_engine.extract_skills_from_text(redaction.redacted_text)

    # Exclude target role python_developer
    alternatives = compute_career_alternatives(skills, target_role_id="python_developer", limit=3)
    assert len(alternatives) > 0

    role_ids = [a.role_id for a in alternatives]
    assert "python_developer" not in role_ids
    # Should include related backend or fullstack roles
    assert any(rid in {"backend_developer", "full_stack_developer", "devops_engineer"} for rid in role_ids)
    assert all(a.fit_band in {"Strong fit", "Good fit", "Possible fit"} for a in alternatives)


def test_strip_repeated_headers_footers() -> None:
    from app.pipeline.normalise import strip_repeated_headers_footers
    pages = [
        "Confidential Resume - Alex Rivera\nPage 1 of 3\nSkills and Experience",
        "Confidential Resume - Alex Rivera\nPage 2 of 3\nMore Experience",
        "Confidential Resume - Alex Rivera\nPage 3 of 3\nProjects",
    ]
    cleaned = strip_repeated_headers_footers(pages)
    assert len(cleaned) == 3
    # The repeated header line should be removed from all pages
    for p in cleaned:
        assert "confidential resume - alex rivera" not in p.lower()


def test_scoring_without_responsibilities_renormalisation(python_resume_text: str) -> None:
    """When a JD lacks responsibilities, remaining weights are proportionally renormalised."""
    redaction = redact_pii(python_resume_text)
    sections = segment_resume(redaction.redacted_text)
    skills = taxonomy_engine.extract_skills_from_text(redaction.redacted_text)

    result = calculate_match_score(
        resume_sections=sections,
        full_resume_text=redaction.redacted_text,
        matched_skills=skills,
        required_skills=["python", "fastapi", "docker"],
        preferred_skills=["redis", "postgresql"],
        responsibilities=None,  # No responsibilities in posting
        required_years=2.0,
    )

    assert result.components["responsibilities"].is_renormalized is True
    assert result.components["responsibilities"].points == 0.0
    # Skills max points should scale up from 40 to ~53.3
    assert result.components["skills"].max_points > 40.0
    assert 0 <= result.total_score <= 100


def test_health_weak_phrases_and_cliches() -> None:
    text = (
        "Jane Doe\n"
        "PROFESSIONAL SUMMARY\n"
        "Dynamic professional, self-starter and hard worker looking for opportunities.\n\n"
        "EXPERIENCE\n"
        "- Responsible for managing database backups.\n"
        "- Worked on front-end bug fixes.\n"
        "- Assisted with automated testing.\n"
    )
    redaction = redact_pii(text)
    sections = segment_resume(redaction.redacted_text)
    health = evaluate_resume_health(sections, redaction.redacted_text, redaction)

    finding_messages = [f.message for f in health.all_findings]
    assert any("Replace passive phrasing" in m for m in finding_messages)
    assert any("Remove generic buzzword" in m for m in finding_messages)

