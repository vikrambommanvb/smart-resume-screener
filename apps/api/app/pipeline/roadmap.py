"""Roadmap generation and verified resource enrichment engine.
Ensures every resource link presented in learning milestones originates
strictly from the verified server-side catalog, never from LLM output.
"""

from __future__ import annotations

from typing import Any

from app.llm.guards import strip_model_urls
from app.pipeline.resources import ResourceItem, catalog


def enrich_roadmap_step_with_resources(
    step: dict[str, Any],
    missing_skill_ids: list[str],
    max_resources: int = 3,
) -> dict[str, Any]:
    """Binds verified catalog resources to a roadmap step by matching relevant skills,
    and strips any model-generated URLs.
    """
    text_corpus = f"{step.get('goal', '')} {step.get('milestone', '')} {' '.join(step.get('actions', []))}".lower()

    # Identify which missing skills are addressed by this step
    step_skill_ids: list[str] = []
    for sid in missing_skill_ids:
        # Check either skill ID or clean skill name in text
        if sid.replace("_", " ") in text_corpus or sid in text_corpus:
            step_skill_ids.append(sid)

    # Fallback to general missing skills if none matched specifically
    if not step_skill_ids:
        step_skill_ids = missing_skill_ids[:2]

    # Retrieve verified resources
    matched_resources: list[ResourceItem] = catalog.get_for_skills(step_skill_ids, limit_per_skill=2)
    if not matched_resources and missing_skill_ids:
        # Global fallback from any missing skill
        matched_resources = catalog.get_for_skills(missing_skill_ids, limit_per_skill=1)

    attached = matched_resources[:max_resources]

    return {
        "goal": strip_model_urls(step.get("goal", "")),
        "why_it_matters": strip_model_urls(step.get("why_it_matters", "")),
        "actions": [strip_model_urls(a) for a in step.get("actions", [])],
        "est_hours": int(step.get("est_hours", 10)),
        "milestone": strip_model_urls(step.get("milestone", "")),
        "resource_ids": [r.id for r in attached],
        "resources": [
            {
                "id": r.id,
                "title": r.title,
                "platform": r.platform,
                "url": r.url,
                "type": r.type,
                "difficulty": r.difficulty,
                "free": r.free,
                "duration_hours": r.duration_hours,
            }
            for r in attached
        ],
    }


def generate_deterministic_roadmap(
    missing_skills: list[dict[str, Any]],
    target_role_title: str,
) -> list[dict[str, Any]]:
    """Generates an actionable 3-phase learning roadmap deterministically from missing skills.
    Used when Gemini is offline, degraded, or for instantaneous preview.
    """
    if not missing_skills:
        # Candidate has all required skills! Build an advanced specialization roadmap
        res = catalog.get_for_skills(["system_design", "clean_code", "cloud_computing"], limit_per_skill=1)
        return [
            {
                "goal": f"Deepen architectural and system design leadership for {target_role_title}",
                "why_it_matters": "All core job requirements are satisfied; the next level of impact comes from scalable system architecture and production patterns.",
                "actions": [
                    "Study end-to-end distributed systems trade-offs and latency optimization.",
                    "Lead architecture reviews focusing on failure domain isolation and observability.",
                    "Document technical specifications for high-throughput service components.",
                ],
                "est_hours": 20,
                "milestone": "Phase 1: Architecture & Reliability Mastery",
                "resource_ids": [r.id for r in res],
                "resources": [
                    {
                        "id": r.id,
                        "title": r.title,
                        "platform": r.platform,
                        "url": r.url,
                        "type": r.type,
                        "difficulty": r.difficulty,
                        "free": r.free,
                        "duration_hours": r.duration_hours,
                    }
                    for r in res
                ],
            }
        ]

    # Partition missing skills into up to 3 progressive phases
    skill_items = list(missing_skills)
    total_missing = len(skill_items)

    chunk_size = max(1, (total_missing + 2) // 3)
    p1_skills = skill_items[:chunk_size]
    p2_skills = skill_items[chunk_size : chunk_size * 2]
    p3_skills = skill_items[chunk_size * 2 :]

    steps: list[dict[str, Any]] = []

    # Phase 1: Core Fundamentals
    p1_names = [s["name"] for s in p1_skills]
    p1_ids = [s["id"] for s in p1_skills]
    p1_res = catalog.get_for_skills(p1_ids, limit_per_skill=2)[:3]
    steps.append({
        "goal": f"Master fundamental essentials: {', '.join(p1_names)}",
        "why_it_matters": f"These core competencies form the prerequisite foundation for the {target_role_title} role.",
        "actions": [
            f"Complete introductory documentation and guided tutorials for {p1_names[0]}.",
            f"Build a standalone working prototype or script implementing {p1_names[-1]}.",
            "Review official documentation for key patterns, idiomatic conventions, and error handling.",
        ],
        "est_hours": 15 * len(p1_skills),
        "milestone": "Phase 1: Essential Foundations",
        "resource_ids": [r.id for r in p1_res],
        "resources": [
            {
                "id": r.id,
                "title": r.title,
                "platform": r.platform,
                "url": r.url,
                "type": r.type,
                "difficulty": r.difficulty,
                "free": r.free,
                "duration_hours": r.duration_hours,
            }
            for r in p1_res
        ],
    })

    # Phase 2: Technical Depth & Applied Practice
    if p2_skills:
        p2_names = [s["name"] for s in p2_skills]
        p2_ids = [s["id"] for s in p2_skills]
        p2_res = catalog.get_for_skills(p2_ids, limit_per_skill=2)[:3]
        steps.append({
            "goal": f"Develop applied technical proficiency: {', '.join(p2_names)}",
            "why_it_matters": "Demonstrates hands-on engineering capability beyond syntax in realistic project scenarios.",
            "actions": [
                f"Integrate {p2_names[0]} into an end-to-end repository with automated unit tests.",
                f"Implement real-world constraints such as validation, logging, or caching with {p2_names[-1]}.",
                "Write clear project documentation describing technical design decisions and trade-offs.",
            ],
            "est_hours": 18 * len(p2_skills),
            "milestone": "Phase 2: Applied Competencies",
            "resource_ids": [r.id for r in p2_res],
            "resources": [
                {
                    "id": r.id,
                    "title": r.title,
                    "platform": r.platform,
                    "url": r.url,
                    "type": r.type,
                    "difficulty": r.difficulty,
                    "free": r.free,
                    "duration_hours": r.duration_hours,
                }
                for r in p2_res
            ],
        })

    # Phase 3: Integration & Portfolio Evidence
    if p3_skills:
        p3_names = [s["name"] for s in p3_skills]
        p3_ids = [s["id"] for s in p3_skills]
        p3_res = catalog.get_for_skills(p3_ids, limit_per_skill=2)[:3]
        steps.append({
            "goal": f"Build production-grade project integrating: {', '.join(p3_names)}",
            "why_it_matters": "Provides verifiable proof of alignment that can be showcased on your resume and discussed in technical interviews.",
            "actions": [
                f"Combine all acquired skills into a unified portfolio application targeting {target_role_title} responsibilities.",
                "Deploy the application to a live cloud environment with CI/CD and monitoring.",
                "Add quantified impact metrics and concise bullet points to your resume under the Projects section.",
            ],
            "est_hours": 20 * len(p3_skills),
            "milestone": "Phase 3: Production Integration & Resume Proof",
            "resource_ids": [r.id for r in p3_res],
            "resources": [
                {
                    "id": r.id,
                    "title": r.title,
                    "platform": r.platform,
                    "url": r.url,
                    "type": r.type,
                    "difficulty": r.difficulty,
                    "free": r.free,
                    "duration_hours": r.duration_hours,
                }
                for r in p3_res
            ],
        })

    return steps

