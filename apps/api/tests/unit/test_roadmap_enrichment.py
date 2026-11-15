"""Tests for roadmap enrichment and deterministic fallback generation.
"""

from app.pipeline.roadmap import enrich_roadmap_step_with_resources, generate_deterministic_roadmap


def test_enrich_roadmap_step_attaches_catalog_resources():
    step = {
        "goal": "Master Docker containerization and Kubernetes cluster management",
        "why_it_matters": "Essential for container deployment at scale.",
        "actions": ["Build multi-stage Dockerfile", "Deploy pods using helm charts"],
        "est_hours": 15,
        "milestone": "Phase 1: Container Orchestration",
    }
    enriched = enrich_roadmap_step_with_resources(step, missing_skill_ids=["docker", "kubernetes"])

    assert len(enriched["resources"]) > 0
    assert len(enriched["resource_ids"]) == len(enriched["resources"])
    for r in enriched["resources"]:
        assert r["url"].startswith("https://")
        assert r["platform"] != ""
        assert r["title"] != ""


def test_enrich_roadmap_step_strips_hallucinated_urls():
    step = {
        "goal": "Visit http://fake-malicious-site.com/course to learn Python",
        "why_it_matters": "Go to https://hallucinated-link.io for notes.",
        "actions": ["Read www.spurious-docs.org tutorial"],
        "est_hours": 10,
        "milestone": "Phase 1: Python Basics",
    }
    enriched = enrich_roadmap_step_with_resources(step, missing_skill_ids=["python"])

    assert "http://fake-malicious-site.com" not in enriched["goal"]
    assert "https://hallucinated-link.io" not in enriched["why_it_matters"]
    assert "www.spurious-docs.org" not in enriched["actions"][0]
    assert "[RESOURCE]" in enriched["goal"]


def test_generate_deterministic_roadmap_for_missing_skills():
    missing = [
        {"id": "docker", "name": "Docker", "category": "devops"},
        {"id": "kubernetes", "name": "Kubernetes", "category": "devops"},
        {"id": "fastapi", "name": "FastAPI", "category": "backend"},
    ]
    steps = generate_deterministic_roadmap(missing, target_role_title="Backend Developer")

    assert len(steps) >= 1
    for s in steps:
        assert s["goal"] != ""
        assert s["why_it_matters"] != ""
        assert len(s["actions"]) > 0
        assert s["est_hours"] > 0
        assert len(s["resources"]) > 0
        for r in s["resources"]:
            assert r["url"].startswith("https://")


def test_generate_deterministic_roadmap_no_missing_skills():
    steps = generate_deterministic_roadmap([], target_role_title="Senior Python Developer")
    assert len(steps) == 1
    assert "Architecture" in steps[0]["milestone"]
    assert len(steps[0]["resources"]) > 0

