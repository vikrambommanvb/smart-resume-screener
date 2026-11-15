import re
from dataclasses import dataclass, field

from rapidfuzz import fuzz

SECTION_SYNONYMS: dict[str, list[str]] = {
    "summary": [
        "summary", "professional summary", "profile", "career profile",
        "executive summary", "objective", "career objective", "about me",
    ],
    "experience": [
        "experience", "work experience", "professional experience",
        "employment history", "work history", "relevant experience", "employment",
    ],
    "projects": [
        "projects", "technical projects", "personal projects", "academic projects",
        "key projects", "selected projects", "project experience",
    ],
    "education": [
        "education", "academic background", "education and credentials",
        "qualifications", "academic qualifications", "degrees",
    ],
    "skills": [
        "skills", "technical skills", "skills & tools", "technologies",
        "core competencies", "technical proficiencies", "key skills", "skill set",
    ],
    "certifications": [
        "certifications", "licenses & certifications", "certificates",
        "professional certifications", "accreditations",
    ],
    "achievements": [
        "achievements", "honors & awards", "awards", "honors", "publications",
        "accomplishments", "extracurricular",
    ],
}


@dataclass
class ResumeSections:
    summary: str = ""
    experience: str = ""
    projects: str = ""
    education: str = ""
    skills: str = ""
    certifications: str = ""
    achievements: str = ""
    detected_sections: list[str] = field(default_factory=list)
    raw_sections: dict[str, str] = field(default_factory=dict)


def _classify_heading(line: str) -> str | None:
    """Determines whether a line is a resume section heading."""
    clean = line.strip().lower()
    # Strip trailing colons or underline punctuation
    clean = re.sub(r"[:\-_]+$", "", clean).strip()

    # Headings are short, typically 1 to 5 words, and don't start with a bullet
    words = clean.split()
    if not (1 <= len(words) <= 5) or len(clean) > 35:
        return None
    if clean.startswith("-") or clean.startswith("*"):
        return None

    # Compare against synonyms
    best_section: str | None = None
    best_score: float = 0.0

    for section_name, synonyms in SECTION_SYNONYMS.items():
        for syn in synonyms:
            if clean == syn:
                return section_name
            # Fuzzy ratio for minor typos or plural differences
            score = fuzz.ratio(clean, syn)
            if score > 85 and score > best_score:
                best_score = score
                best_section = section_name

    if best_score > 85:
        return best_section

    return None


def segment_resume(text: str) -> ResumeSections:
    """Segments normalized resume text into structured standard sections."""
    lines = text.splitlines()
    current_section = "summary"  # Unlabeled opening text maps to summary/header
    sections_map: dict[str, list[str]] = {
        "summary": [],
        "experience": [],
        "projects": [],
        "education": [],
        "skills": [],
        "certifications": [],
        "achievements": [],
    }
    detected_order: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        matched_section = _classify_heading(stripped)
        if matched_section:
            current_section = matched_section
            if current_section not in detected_order:
                detected_order.append(current_section)
        else:
            sections_map[current_section].append(stripped)

    # Compile result
    result = ResumeSections(
        summary="\n".join(sections_map["summary"]).strip(),
        experience="\n".join(sections_map["experience"]).strip(),
        projects="\n".join(sections_map["projects"]).strip(),
        education="\n".join(sections_map["education"]).strip(),
        skills="\n".join(sections_map["skills"]).strip(),
        certifications="\n".join(sections_map["certifications"]).strip(),
        achievements="\n".join(sections_map["achievements"]).strip(),
        detected_sections=detected_order,
        raw_sections={k: "\n".join(v).strip() for k, v in sections_map.items() if v},
    )
    return result
