"""Scoring configuration and calibration constants.
Documented in docs/scoring.md.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class ScoringConfig:
    # Component weights summing to 100.0
    WEIGHT_SKILLS: float = 40.0
    WEIGHT_RESPONSIBILITIES: float = 25.0
    WEIGHT_EXPERIENCE: float = 15.0
    WEIGHT_PROJECTS: float = 15.0
    WEIGHT_EDUCATION: float = 5.0

    # Skill matching credits
    CREDIT_MATCHED_EVIDENCE: float = 1.0
    CREDIT_LISTED_ONLY: float = 0.6
    CREDIT_IMPLIED_ADJACENT: float = 0.5
    CREDIT_MISSING: float = 0.0

    # Ratio when preferred skills exist
    REQUIRED_SKILLS_WEIGHT: float = 0.8
    PREFERRED_SKILLS_WEIGHT: float = 0.2

    # Piecewise-linear cosine similarity calibration
    # Values <= SIMILARITY_FLOOR map to 0.0
    # Values >= SIMILARITY_CEIL map to 1.0
    # Values between floor and ceil scale linearly
    SIMILARITY_FLOOR: float = 0.30
    SIMILARITY_CEIL: float = 0.70

    # Experience alignment thresholds (years)
    JUNIOR_MAX_YEARS: float = 1.0
    FULL_FRESHER_PROJECT_POINTS: float = 15.0

    # Project and evidence bonus
    PROJECT_SEMANTIC_MAX: float = 10.0
    PROJECT_EVIDENCE_BONUS_MAX: float = 5.0

    # Education and certification caps
    EDU_DEGREE_MAX: float = 3.0
    EDU_CERT_MAX: float = 2.0

    # Match score bands
    BAND_WEAK: tuple[int, int] = (0, 39)
    BAND_PARTIAL: tuple[int, int] = (40, 59)
    BAND_SOLID: tuple[int, int] = (60, 79)
    BAND_STRONG: tuple[int, int] = (80, 100)

    # Resume Health subscore weights summing to 100.0
    HEALTH_CONTENT_STRENGTH: float = 30.0
    HEALTH_STRUCTURE_SECTIONS: float = 20.0
    HEALTH_ATS_FRIENDLINESS: float = 20.0
    HEALTH_READABILITY: float = 15.0
    HEALTH_CONSISTENCY: float = 10.0
    HEALTH_CONTACT_LINKS: float = 5.0

    # Careers matching threshold
    CAREER_MIN_SIMILARITY: float = 0.35


scoring_config = ScoringConfig()
