import re
from collections import Counter
from dataclasses import dataclass, field

from app.pipeline.redact import RedactionResult
from app.pipeline.scoring_config import scoring_config
from app.pipeline.section import ResumeSections

ACTION_VERBS = {
    "accelerated", "achieved", "administered", "architected", "automated",
    "built", "championed", "collaborated", "compiled", "composed", "configured",
    "constructed", "coordinated", "created", "decreased", "delivered",
    "deployed", "designed", "developed", "devised", "directed", "documented",
    "eliminated", "enabled", "engineered", "established", "evaluated",
    "executed", "expanded", "expedited", "fabricated", "facilitated",
    "formulated", "generated", "guided", "implemented", "improved",
    "increased", "initiated", "innovated", "installed", "instituted",
    "integrated", "introduced", "launched", "led", "managed", "maximized",
    "migrated", "minimized", "modernized", "negotiated", "optimized",
    "orchestrated", "organized", "overhauled", "pioneered", "planned",
    "produced", "programmed", "published", "redesigned", "reduced",
    "refactored", "resolved", "restructured", "revamped", "scaled",
    "spearheaded", "standardized", "streamlined", "strengthened",
    "supervised", "surpassed", "trained", "transformed", "unified", "upgraded",
}

WEAK_PHRASES = [
    "responsible for", "assisted with", "helped to", "worked on", "handled",
    "duties included", "in charge of", "tasked with", "participated in",
]

CLICHES = [
    "hard worker", "go-getter", "team player", "detail-oriented", "synergy",
    "self-starter", "dynamic professional", "think outside the box",
    "fast learner", "results-driven",
]


@dataclass
class HealthFinding:
    category: str
    severity: str  # "fix", "consider", "ok"
    message: str
    location: str | None = None


@dataclass
class HealthSubscore:
    name: str
    score: float
    max_score: float
    percentage: float
    findings: list[HealthFinding] = field(default_factory=list)


@dataclass
class ResumeHealthResult:
    total_score: int
    content_strength: HealthSubscore
    structure_sections: HealthSubscore
    ats_friendliness: HealthSubscore
    readability_concision: HealthSubscore
    consistency: HealthSubscore
    contact_links: HealthSubscore
    all_findings: list[HealthFinding] = field(default_factory=list)


def evaluate_resume_health(
    sections: ResumeSections,
    full_text: str,
    redaction: RedactionResult,
    page_count: int = 1,
    is_scanned: bool = False,
) -> ResumeHealthResult:
    """Evaluates 100-point independent resume health with actionable findings."""
    all_findings: list[HealthFinding] = []

    # 1. Content Strength (30 pts)
    content_pts = 30.0
    content_findings: list[HealthFinding] = []

    bullet_lines = [
        line.strip().lstrip("-*•▪ ")
        for line in f"{sections.experience}\n{sections.projects}".splitlines()
        if len(line.strip()) > 5
    ]

    if bullet_lines:
        # Check action verb openers
        action_verb_count = 0
        first_words: list[str] = []
        for b in bullet_lines:
            words = b.split()
            if words:
                first_word = words[0].lower().rstrip(":,.-")
                first_words.append(first_word)
                if first_word in ACTION_VERBS:
                    action_verb_count += 1

        action_verb_ratio = action_verb_count / len(bullet_lines)
        if action_verb_ratio < 0.5:
            deduction = (0.5 - action_verb_ratio) * 10.0
            content_pts -= deduction
            content_findings.append(HealthFinding(
                category="Content Strength",
                severity="fix",
                message=f"Only {int(action_verb_ratio * 100)}% of bullets begin with strong action verbs. Start bullets with decisive verbs like 'Engineered', 'Optimized', or 'Launched'.",
            ))

        # Repeated openers check
        word_counts = Counter(first_words)
        for w, c in word_counts.items():
            if c >= 3 and w in ACTION_VERBS:
                content_pts -= 2.0
                content_findings.append(HealthFinding(
                    category="Content Strength",
                    severity="consider",
                    message=f"The verb '{w}' begins {c} different bullets. Vary your vocabulary with synonyms like 'spearheaded' or 'architected'.",
                    location=f"Multiple bullets starting with '{w}'",
                ))

        # Quantified results ratio (>30% target)
        quantified_count = sum(1 for b in bullet_lines if re.search(r"\b\d+(?:\.\d+)?%?|\b[KMB]\b", b))
        quant_ratio = quantified_count / len(bullet_lines)
        if quant_ratio < 0.3:
            content_pts -= 6.0
            content_findings.append(HealthFinding(
                category="Content Strength",
                severity="fix",
                message=f"Only {int(quant_ratio * 100)}% of bullets contain quantified metrics. Add measurable outcomes (e.g. 'reduced latency by 35%', 'supporting 10K+ daily users').",
            ))

        # Bullet length (8-28 words)
        awkward_lengths = [b for b in bullet_lines if len(b.split()) < 6 or len(b.split()) > 35]
        if len(awkward_lengths) > len(bullet_lines) * 0.3:
            content_pts -= 3.0
            content_findings.append(HealthFinding(
                category="Content Strength",
                severity="consider",
                message="Several bullets are either too brief (<6 words) or run on (>35 words). Aim for 8 to 28 words per bullet.",
            ))

        # Weak phrases check
        lower_content = f"{sections.experience}\n{sections.projects}".lower()
        for wp in WEAK_PHRASES:
            if wp in lower_content:
                content_pts -= 2.0
                content_findings.append(HealthFinding(
                    category="Content Strength",
                    severity="fix",
                    message=f"Replace passive phrasing '{wp}' with the specific technical contribution you delivered.",
                    location=f"'{wp}'",
                ))
    else:
        content_pts = 10.0
        content_findings.append(HealthFinding(
            category="Content Strength",
            severity="fix",
            message="No bulleted experience or project points detected. Format your achievements as concise bullet points.",
        ))

    content_pts = max(0.0, min(scoring_config.HEALTH_CONTENT_STRENGTH, content_pts))

    # 2. Structure & Sections (20 pts)
    struct_pts = 20.0
    struct_findings: list[HealthFinding] = []

    core_sections = {"experience", "education", "skills"}
    detected = set(sections.detected_sections)
    missing_sections = core_sections - detected
    for ms in missing_sections:
        struct_pts -= 4.0
        struct_findings.append(HealthFinding(
            category="Structure & Sections",
            severity="fix",
            message=f"Missing standard '{ms.capitalize()}' section heading. ATS systems look specifically for this header.",
        ))

    # Page count check
    if page_count > 2:
        struct_pts -= 5.0
        struct_findings.append(HealthFinding(
            category="Structure & Sections",
            severity="fix",
            message=f"Resume is {page_count} pages long. Aim for 1 page for early-career profiles and at most 2 pages.",
        ))

    struct_pts = max(0.0, min(scoring_config.HEALTH_STRUCTURE_SECTIONS, struct_pts))

    # 3. ATS Friendliness (20 pts)
    ats_pts = 20.0
    ats_findings: list[HealthFinding] = []

    if is_scanned:
        ats_pts = 0.0
        ats_findings.append(HealthFinding(
            category="ATS Friendliness",
            severity="fix",
            message="Document is an image scan without selectable text. Re-export your resume directly as a PDF from Google Docs or Word.",
        ))
    else:
        # Check for weird replacement characters or nested table symbols
        if "\ufffd" in full_text:
            ats_pts -= 4.0
            ats_findings.append(HealthFinding(
                category="ATS Friendliness",
                severity="fix",
                message="Document contains corrupted font glyphs or non-standard characters.",
            ))

    ats_pts = max(0.0, min(scoring_config.HEALTH_ATS_FRIENDLINESS, ats_pts))

    # 4. Readability & Concision (15 pts)
    read_pts = 15.0
    read_findings: list[HealthFinding] = []

    # Cliche detection
    lower_full = full_text.lower()
    for cl in CLICHES:
        if cl in lower_full:
            read_pts -= 2.0
            read_findings.append(HealthFinding(
                category="Readability & Concision",
                severity="consider",
                message=f"Remove generic buzzword '{cl}'. Demonstrate this quality through concrete project achievements instead.",
                location=f"'{cl}'",
            ))

    # Dense wall of text check
    paragraphs = [p for p in full_text.split("\n\n") if len(p.split()) > 70 and not p.strip().startswith("-")]
    if paragraphs:
        read_pts -= 3.0
        read_findings.append(HealthFinding(
            category="Readability & Concision",
            severity="fix",
            message="Detected dense paragraph blocks over 70 words. Break long text into scannable 1-2 sentence bullets.",
        ))

    read_pts = max(0.0, min(scoring_config.HEALTH_READABILITY, read_pts))

    # 5. Consistency (10 pts)
    consist_pts = 10.0
    consist_findings: list[HealthFinding] = []

    # Bullet ending punctuation check (all period vs all no period)
    if bullet_lines:
        period_count = sum(1 for b in bullet_lines if b.endswith("."))
        if 0 < period_count < len(bullet_lines):
            consist_pts -= 3.0
            consist_findings.append(HealthFinding(
                category="Consistency",
                severity="consider",
                message="Inconsistent punctuation at the end of bullets. Choose either all periods or no periods consistently.",
            ))

    consist_pts = max(0.0, min(scoring_config.HEALTH_CONSISTENCY, consist_pts))

    # 6. Contact & Links (5 pts)
    contact_pts = 5.0
    contact_findings: list[HealthFinding] = []

    if not redaction.has_email:
        contact_pts -= 2.0
        contact_findings.append(HealthFinding(
            category="Contact & Links",
            severity="fix",
            message="No professional email address found in the contact section.",
        ))
    if not redaction.has_phone:
        contact_pts -= 1.0
        contact_findings.append(HealthFinding(
            category="Contact & Links",
            severity="consider",
            message="No contact phone number detected.",
        ))
    if not (redaction.has_linkedin or redaction.has_github or redaction.has_portfolio):
        contact_pts -= 1.5
        contact_findings.append(HealthFinding(
            category="Contact & Links",
            severity="consider",
            message="Add links to your professional profiles (GitHub, LinkedIn, or personal portfolio).",
        ))

    contact_pts = max(0.0, min(scoring_config.HEALTH_CONTACT_LINKS, contact_pts))

    # Combine all
    total_health = int(round(content_pts + struct_pts + ats_pts + read_pts + consist_pts + contact_pts))
    all_findings.extend(content_findings + struct_findings + ats_findings + read_findings + consist_findings + contact_findings)

    return ResumeHealthResult(
        total_score=total_health,
        content_strength=HealthSubscore(
            name="Content Strength",
            score=round(content_pts, 1),
            max_score=scoring_config.HEALTH_CONTENT_STRENGTH,
            percentage=round((content_pts / scoring_config.HEALTH_CONTENT_STRENGTH) * 100.0, 1),
            findings=content_findings,
        ),
        structure_sections=HealthSubscore(
            name="Structure & Sections",
            score=round(struct_pts, 1),
            max_score=scoring_config.HEALTH_STRUCTURE_SECTIONS,
            percentage=round((struct_pts / scoring_config.HEALTH_STRUCTURE_SECTIONS) * 100.0, 1),
            findings=struct_findings,
        ),
        ats_friendliness=HealthSubscore(
            name="ATS Friendliness",
            score=round(ats_pts, 1),
            max_score=scoring_config.HEALTH_ATS_FRIENDLINESS,
            percentage=round((ats_pts / scoring_config.HEALTH_ATS_FRIENDLINESS) * 100.0, 1),
            findings=ats_findings,
        ),
        readability_concision=HealthSubscore(
            name="Readability & Concision",
            score=round(read_pts, 1),
            max_score=scoring_config.HEALTH_READABILITY,
            percentage=round((read_pts / scoring_config.HEALTH_READABILITY) * 100.0, 1),
            findings=read_findings,
        ),
        consistency=HealthSubscore(
            name="Consistency",
            score=round(consist_pts, 1),
            max_score=scoring_config.HEALTH_CONSISTENCY,
            percentage=round((consist_pts / scoring_config.HEALTH_CONSISTENCY) * 100.0, 1),
            findings=consist_findings,
        ),
        contact_links=HealthSubscore(
            name="Contact & Links",
            score=round(contact_pts, 1),
            max_score=scoring_config.HEALTH_CONTACT_LINKS,
            percentage=round((contact_pts / scoring_config.HEALTH_CONTACT_LINKS) * 100.0, 1),
            findings=contact_findings,
        ),
        all_findings=all_findings,
    )
