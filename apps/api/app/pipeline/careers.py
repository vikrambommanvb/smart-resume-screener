from dataclasses import dataclass

from app.pipeline.roles import roles_manager
from app.pipeline.scoring_config import scoring_config
from app.pipeline.taxonomy import MatchedSkill, taxonomy_engine


@dataclass
class CareerAlternative:
    role_id: str
    title: str
    fit_band: str  # "Strong fit", "Good fit", "Possible fit"
    similarity_score: float
    matched_skills: list[str]
    gaps_to_close: list[str]
    summary: str


def compute_career_alternatives(
    matched_skills: dict[str, MatchedSkill],
    target_role_id: str | None = None,
    limit: int = 3,
) -> list[CareerAlternative]:
    """Computes career role alternatives based on resume skill vector similarity."""
    candidate_skills = set(matched_skills.keys())
    alternatives: list[CareerAlternative] = []

    for role in roles_manager.list_roles():
        rid = role["id"]
        if target_role_id and rid == target_role_id:
            continue

        core = set(role.get("core_skills", []))
        common = set(role.get("common_skills", []))
        all_role_skills = core | common
        if not all_role_skills:
            continue

        # Jaccard + weighted overlap similarity
        matched_core = candidate_skills & core
        matched_common = candidate_skills & common

        core_score = (len(matched_core) / len(core)) if core else 0.0
        common_score = (len(matched_common) / len(common)) if common else 0.0
        sim = 0.7 * core_score + 0.3 * common_score

        if sim >= scoring_config.CAREER_MIN_SIMILARITY:
            # Band mapping
            if sim >= 0.70:
                band = "Strong fit"
            elif sim >= 0.50:
                band = "Good fit"
            else:
                band = "Possible fit"

            gaps = [sid for sid in role.get("core_skills", []) if sid not in candidate_skills]
            matched_names = [
                taxonomy_engine.skills_by_id.get(sid, {}).get("name", sid)
                for sid in (matched_core | matched_common)
            ]
            gap_names = [
                taxonomy_engine.skills_by_id.get(sid, {}).get("name", sid)
                for sid in gaps[:4]
            ]

            alternatives.append(
                CareerAlternative(
                    role_id=rid,
                    title=role["title"],
                    fit_band=band,
                    similarity_score=round(sim, 2),
                    matched_skills=matched_names,
                    gaps_to_close=gap_names,
                    summary=role.get("summary", ""),
                )
            )

    # Sort by similarity descending
    alternatives.sort(key=lambda a: a.similarity_score, reverse=True)
    return alternatives[:limit]
