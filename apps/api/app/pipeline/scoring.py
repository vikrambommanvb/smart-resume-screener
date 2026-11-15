import re
from dataclasses import dataclass

import numpy as np

from app.pipeline.embeddings import embeddings_service
from app.pipeline.scoring_config import scoring_config
from app.pipeline.section import ResumeSections
from app.pipeline.taxonomy import MatchedSkill, taxonomy_engine


@dataclass
class ComponentBreakdown:
    name: str
    points: float
    max_points: float
    percentage: float
    explanation: str
    is_renormalized: bool = False


@dataclass
class BiggestMover:
    skill_id: str
    skill_name: str
    category: str
    potential_points: float


@dataclass
class MatchScoreResult:
    total_score: int
    band: str
    confidence: str
    confidence_note: str | None
    components: dict[str, ComponentBreakdown]
    biggest_movers: list[BiggestMover]
    raw_points_sum: float
    fresher_protected: bool = False


def parse_years_of_experience(text: str) -> float:
    """Extracts candidate years of experience from employment dates and explicit mentions."""
    # Look for explicit mentions first (e.g. "6 years of experience", "4+ yrs")
    explicit_pattern = re.compile(r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience", re.IGNORECASE)
    match = explicit_pattern.search(text)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass

    # Look for year ranges like 2018 - 2024, 2021-Present, 2019 – Present
    year_ranges = re.findall(
        r"\b(20\d{2}|19\d{2})\s*(?:-|–|to)\s*(20\d{2}|present|current)\b",
        text,
        re.IGNORECASE,
    )
    total_years = 0.0
    current_year = 2026.0

    for start_str, end_str in year_ranges:
        try:
            start_yr = float(start_str)
            end_yr = current_year if end_str.lower() in {"present", "current"} else float(end_str)
            span = max(0.0, end_yr - start_yr)
            total_years = max(total_years, span)  # Take max tenure or non-overlapping span
        except ValueError:
            continue

    return total_years


def calculate_match_score(
    resume_sections: ResumeSections,
    full_resume_text: str,
    matched_skills: dict[str, MatchedSkill],
    required_skills: list[str],
    preferred_skills: list[str] | None = None,
    responsibilities: list[str] | None = None,
    required_years: float | None = None,
    is_fresher: bool = False,
) -> MatchScoreResult:
    """Calculates deterministic explainable match score (0-100) adhering strictly to section 5.3."""
    pref_skills = preferred_skills or []
    resps = responsibilities or []

    # 1. Skills Component (Max 40.0 pts)
    req_credits: list[float] = []
    for sid in required_skills:
        if sid in matched_skills:
            ms = matched_skills[sid]
            if ms.evidence_quote and not ms.is_implied:
                req_credits.append(scoring_config.CREDIT_MATCHED_EVIDENCE)
            elif ms.is_implied:
                req_credits.append(ms.weight or scoring_config.CREDIT_IMPLIED_ADJACENT)
            else:
                req_credits.append(scoring_config.CREDIT_LISTED_ONLY)
        else:
            req_credits.append(scoring_config.CREDIT_MISSING)

    req_coverage = float(np.mean(req_credits)) if req_credits else 1.0

    pref_credits: list[float] = []
    if pref_skills:
        for sid in pref_skills:
            if sid in matched_skills:
                pref_credits.append(scoring_config.CREDIT_MATCHED_EVIDENCE)
            else:
                pref_credits.append(scoring_config.CREDIT_MISSING)
        pref_coverage = float(np.mean(pref_credits)) if pref_credits else 0.0
        combined_coverage = (
            scoring_config.REQUIRED_SKILLS_WEIGHT * req_coverage
            + scoring_config.PREFERRED_SKILLS_WEIGHT * pref_coverage
        )
    else:
        combined_coverage = req_coverage

    skills_points = combined_coverage * scoring_config.WEIGHT_SKILLS

    # 2. Responsibilities Semantic Fit (Max 25.0 pts)
    resp_points = 0.0
    calibrated_sims: list[float] = []
    if resps:
        # Extract resume bullet sentences across experience and projects
        bullet_lines = [
            line.strip().lstrip("-*•▪ ")
            for line in f"{resume_sections.experience}\n{resume_sections.projects}".splitlines()
            if len(line.strip()) > 20
        ]
        if bullet_lines:
            bullet_vecs = embeddings_service.encode(bullet_lines)
            resp_vecs = embeddings_service.encode(resps)

            for r_vec in resp_vecs:
                # Max cosine similarity across resume bullets
                sims = [embeddings_service.cosine_similarity(r_vec, b_vec) for b_vec in bullet_vecs]
                max_sim = max(sims) if sims else 0.0
                calibrated = embeddings_service.calibrate_similarity(
                    max_sim,
                    floor=scoring_config.SIMILARITY_FLOOR,
                    ceil=scoring_config.SIMILARITY_CEIL,
                )
                calibrated_sims.append(calibrated)

            resp_score_ratio = float(np.mean(calibrated_sims)) if calibrated_sims else 0.0
            resp_points = resp_score_ratio * scoring_config.WEIGHT_RESPONSIBILITIES
        else:
            # Fallback if no bullet points found
            resp_points = 0.0
    else:
        # Responsibilities not specified in JD -> will be renormalised
        pass

    # 3. Experience Level (Max 15.0 pts)
    candidate_years = parse_years_of_experience(full_resume_text)
    exp_points = 0.0
    fresher_protected = False

    if required_years is not None and required_years > 0.0:
        if required_years <= scoring_config.JUNIOR_MAX_YEARS:
            # Fresher protection rule: if JD asks <= 1 year, award full points for projects/internship
            if len(resume_sections.projects.strip()) > 50 or is_fresher or candidate_years >= 0.5:
                exp_points = scoring_config.FULL_FRESHER_PROJECT_POINTS
                fresher_protected = True
            else:
                exp_points = min(15.0, (candidate_years / required_years) * 15.0)
        else:
            if candidate_years >= required_years:
                exp_points = 15.0
            else:
                exp_points = min(15.0, (candidate_years / required_years) * 15.0)
    else:
        # If no explicit years required, check if candidate has any documented experience or projects
        if candidate_years >= 1.0 or len(resume_sections.experience.strip()) > 100:
            exp_points = 15.0
        elif len(resume_sections.projects.strip()) > 100:
            exp_points = 15.0
            fresher_protected = True
        else:
            exp_points = 10.0

    # 4. Project & Evidence Relevance (Max 15.0 pts)
    proj_points = 0.0
    project_text = f"{resume_sections.projects}\n{resume_sections.experience}"
    if len(project_text.strip()) > 50:
        # Demonstrating skills in projects vs merely listing them
        evidence_count = sum(1 for s in matched_skills.values() if s.evidence_quote and not s.is_implied)
        evidence_bonus = min(5.0, (evidence_count / max(1, len(required_skills))) * 5.0)

        # Domain semantic alignment (10 pts)
        if resps:
            proj_sim = embeddings_service.cosine_similarity(
                embeddings_service.get_embedding_cached(project_text[:500]),
                embeddings_service.get_embedding_cached("\n".join(resps[:4])),
            )
            calibrated_proj = embeddings_service.calibrate_similarity(proj_sim, 0.25, 0.65)
            semantic_pts = calibrated_proj * 10.0
        else:
            semantic_pts = 7.5

        proj_points = min(15.0, semantic_pts + evidence_bonus)
    else:
        proj_points = 0.0

    # 5. Education & Certifications (Max 5.0 pts)
    edu_points = 0.0
    edu_text = f"{resume_sections.education}\n{full_resume_text}".lower()

    # Degree level (up to 3.0 pts)
    if any(deg in edu_text for deg in ["ph.d", "phd", "doctorate"]):
        edu_points += 3.0
    elif any(deg in edu_text for deg in ["master", "m.s", "m.sc", "m.tech", "mba"]):
        edu_points += 2.5
    elif any(deg in edu_text for deg in ["bachelor", "b.s", "b.sc", "b.tech", "b.e", "degree"]):
        edu_points += 2.0
    else:
        edu_points += 1.0

    # Certifications bonus (up to 2.0 pts)
    cert_text = f"{resume_sections.certifications}\n{full_resume_text}".lower()
    if any(c in cert_text for c in ["certified", "certification", "aws certified", "pmp", "comptia"]):
        edu_points += 2.0
    elif len(resume_sections.certifications.strip()) > 10:
        edu_points += 1.0

    edu_points = min(5.0, edu_points)

    # 6. Renormalisation check
    active_components = {
        "skills": (skills_points, scoring_config.WEIGHT_SKILLS, "Skill requirements coverage"),
        "responsibilities": (resp_points, scoring_config.WEIGHT_RESPONSIBILITIES, "Semantic fit against job responsibilities"),
        "experience": (exp_points, scoring_config.WEIGHT_EXPERIENCE, "Seniority and experience alignment"),
        "projects": (proj_points, scoring_config.WEIGHT_PROJECTS, "Project relevance and evidence depth"),
        "education": (edu_points, scoring_config.WEIGHT_EDUCATION, "Degree level and verified certifications"),
    }

    # If responsibilities were omitted from JD, redistribute its weight
    has_resps = bool(resps)
    if not has_resps:
        sum_active_max = sum(w for k, (_, w, _) in active_components.items() if k != "responsibilities")
        scale = 100.0 / sum_active_max
    else:
        scale = 1.0

    components_dict: dict[str, ComponentBreakdown] = {}
    total_raw = 0.0

    for key, (pts, max_pts, expl) in active_components.items():
        if key == "responsibilities" and not has_resps:
            components_dict[key] = ComponentBreakdown(
                name="Responsibilities Fit",
                points=0.0,
                max_points=0.0,
                percentage=0.0,
                explanation="No detailed responsibilities in posting; weight was redistributed proportionally.",
                is_renormalized=True,
            )
            continue

        scaled_max = max_pts * scale
        scaled_pts = min(scaled_max, pts * scale)
        total_raw += scaled_pts

        pct = (scaled_pts / scaled_max) * 100.0 if scaled_max > 0 else 0.0
        components_dict[key] = ComponentBreakdown(
            name=key.capitalize(),
            points=round(scaled_pts, 1),
            max_points=round(scaled_max, 1),
            percentage=round(pct, 1),
            explanation=expl,
            is_renormalized=(scale != 1.0),
        )

    # Final score rounded once
    total_score = int(round(min(100.0, max(0.0, total_raw))))

    # Band assignment
    if total_score >= 80:
        band = "strong"
    elif total_score >= 60:
        band = "solid"
    elif total_score >= 40:
        band = "partial"
    else:
        band = "weak"

    # Confidence calculation
    conf_notes: list[str] = []
    if len(full_resume_text) < 1200:
        conf_notes.append("Resume contains fewer than 1,200 characters.")
    if len(required_skills) < 5:
        conf_notes.append("Job description contains fewer than 5 explicit technical requirements.")

    if not conf_notes:
        confidence = "high"
        confidence_note = None
    elif len(conf_notes) == 1:
        confidence = "medium"
        confidence_note = conf_notes[0]
    else:
        confidence = "low"
        confidence_note = " ".join(conf_notes)

    # 7. Counterfactual Biggest Movers (Top 3)
    biggest_movers: list[BiggestMover] = []
    missing_required = [sid for sid in required_skills if sid not in matched_skills]

    for missing_sid in missing_required:
        # Deterministically compute score delta if this missing skill were matched with evidence
        hypothetical_credits = list(req_credits)
        idx = required_skills.index(missing_sid)
        hypothetical_credits[idx] = scoring_config.CREDIT_MATCHED_EVIDENCE
        new_coverage = float(np.mean(hypothetical_credits))
        if pref_skills:
            new_combined = (
                scoring_config.REQUIRED_SKILLS_WEIGHT * new_coverage
                + scoring_config.PREFERRED_SKILLS_WEIGHT * pref_coverage
            )
        else:
            new_combined = new_coverage

        new_skill_pts = new_combined * scoring_config.WEIGHT_SKILLS * scale
        delta_points = max(0.0, new_skill_pts - (skills_points * scale))

        skill_def = taxonomy_engine.skills_by_id.get(missing_sid, {})
        biggest_movers.append(
            BiggestMover(
                skill_id=missing_sid,
                skill_name=skill_def.get("name", missing_sid),
                category=skill_def.get("category", "skills"),
                potential_points=round(delta_points, 1),
            )
        )

    # Sort biggest movers by potential gain descending
    biggest_movers.sort(key=lambda m: m.potential_points, reverse=True)
    top_movers = biggest_movers[:3]

    return MatchScoreResult(
        total_score=total_score,
        band=band,
        confidence=confidence,
        confidence_note=confidence_note,
        components=components_dict,
        biggest_movers=top_movers,
        raw_points_sum=round(total_raw, 2),
        fresher_protected=fresher_protected,
    )
